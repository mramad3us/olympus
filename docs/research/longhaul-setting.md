# LONGHAUL's setting: what OLYMPUS inherits

Research note, 2026-11-05. Slice: the world LONGHAUL built (powers, politics, Mars, the Jovian moons, the Belt, Earth, stations, calendar, names, ship classes, military service). Sources read in full: `longhaul/docs/WORLD.md`, `longhaul/docs/SHIPS.md`, `longhaul/README.md`, `longhaul/CLAUDE.md`. Code read for its content: `js/sim/factions.js`, `politics.js`, `service.js`, `military.js` (header), `careers.js`, `names.js`, `stations.js`, `worlds.js`, `bodyfacts.js`, `ephemeris.js`, `ship-classes.js`, `forces.js` (header and constants), `conflict.js` (zone kinds and candidates), `ground.js`, `market.js`/`goods.js` (data), `dialogue.js` (voices), `entities.js` (station names), `core/clock.js`, `core/rng.js`, `ui/app.js` (license picker), `ui/gl/town3d.js` (world styles), `ui/library.js` (lore text). Also read: the user's own messages in the LONGHAUL session transcripts (`~/.claude/projects/-Users-deaumas-lab-vibe-claudecode-longhaul/*.jsonl`, 188 messages, 2026-10-18 to 2026-11-01) and the LONGHAUL agent memory (`.../memory/*.md`), so decisions can be attributed to the user with dates.

All paths below are relative to `/Users/deaumas/lab/vibe/claudecode/longhaul/` unless stated. LONGHAUL is at v1.12.21 on branch `overhaul` (commit 5c991df, 2026-10-31). It is read-only for us.

Provenance tags used throughout:

- **[U date]**: the user's own explicit decision, quoted or closely paraphrased from their messages. These carry over to OLYMPUS as the user's tastes.
- **[C]**: borrowed from *The Expanse* canon (books/TV). Only items I am confident about are tagged [C]. "[C?]" means probably canon, worth checking.
- **[L]**: LONGHAUL's own content, written by the agent during development and shipped without objection. It is the established setting, but the user never asked for it specifically, so OLYMPUS may revise it with the user's consent.

---

## 0. The short version: what OLYMPUS must stay consistent with

1. **Epoch.** LONGHAUL's clock starts **2351-03-22 08:00 UTC** (`js/core/clock.js:9`), with a Gregorian Earth calendar and no Martian calendar. The Expanse canon opens around 2350. OLYMPUS can sit in 2351 or a little later, and needs to add a Mars sol clock of **24.6597 h** (§1).
2. **Three powers, never at peace.** UN (Earth and Luna), MCR (Mars) and OPA (the Belt and the outer moons), plus independents and four pirate clans. Earth and Mars are never friends: their relation is capped at −25 and they swing between cold war, crisis and short hot wars, using proxies [U 2026-10-22] (§3–5).
3. **Mars has the best kit and the smallest fleet.** Martian yards build TL3 civilian and TL4 military hulls: the best in the system and the dearest to keep [U 2026-10-19]. The MCRN has 12 warships plus 3 Olympus-class battleships against the UNN's 56 older hulls. The two navies are equal in total strength, not in numbers [U 2026-10-20] (§12, §13).
4. **Mars is terraformed, a little.** Air is breathable on the low ground, there is a young northern sea and a lake in Hellas, and the cities are still domed [U 2026-10-25]. The exact air composition is the agent's own choice [L], and it has a CO₂ problem OLYMPUS has to settle (§7.2, §20).
5. **Europa** has OPA ground control and ice miners' towns, but it lies in **Martian-held Jovian space** contested by the UN, with real Belter influence. That is exactly where LONGHAUL's simulation generates **Ceres Free Belt insurgencies against Mars**, and the Hungry Dark pirate clan lairs there. A Martian peacekeeping deployment to Europa fits the existing world closely (§8).
6. **LONGHAUL has no Marines.** Boarding is done by ship crew (Security and Deckhand roles), and stations can't be boarded yet ("a marine operation: not yet", `js/sim/boarding.js:100`). Marine ranks, units, bases and dropships are all new content for OLYMPUS and must be invented in the setting's register (§14).
7. **The only Martian station is Phobos Naval Yard.** The MCR's other footholds are the Mars ground (6 equatorial airspaces, each with a spaceport) and Callisto, the "MCRN's Jovian base", under Martian ground control (§7, §8).
8. **Ship names and people names** come from culture-specific generators. Martian names are earnest, frontier and terraforming-minded ("Daughter of Hellas", "Plant Trees Anyway"). MCRN hulls carry the `MCRN` prefix and one-word Martian place, founder, war-hero or weapon names (§16).
9. **Units and tone.** Hard science fiction: no magic, no lasers [U 2026-10-19], light-lag-limited knowledge [U 2026-10-20], realistic sizes [U 2026-10-20], box-shaped practical hulls [U 2026-10-20], and no hull rated for atmosphere except carried shuttles [U 2026-10-25].

---

## 1. Epoch, calendar, time

- `js/core/clock.js:9`: `createClock(start = { year: 2351, month: 3, day: 22, hour: 8, minute: 0 })`. The only time base is an integer `clock.minute` (game minutes since the start). The calendar is derived through `Date.UTC`, so it is a plain Gregorian **UTC** calendar. Display formats are `YYYY.MM.DD` and `HH:MM` (`formatDate`, `formatTime`). Durations show as "45 min", "3h 20m" or "2d 4h" (`formatDuration`).
- `js/core/constants.js`: `DAY_MIN = 1440`, `MIN_S = 60` (the sim step is one minute), time warp `SPEED_MIN_PER_SEC = [0, 1, 60, 1440]`. `YEAR_MIN = 365 × DAY_MIN` (`js/sim/careers.js:61`).
- **There is no Martian calendar or sol clock.** Mars turns once in `rotH: 24.623` h (sidereal, `js/sim/ephemeris.js:36`). `worlds.js solarDayH(body)` (`js/sim/worlds.js:349`) gives the solar day from the turn and the year: **24.6598 h for Mars** (24 h 39 min 35 s). The Mars year is 687.2 Earth days (Kepler, from a = 1.524 AU), which is **668.6 sols**.
- The planets ride **circular, coplanar orbits** with arbitrary starting angles (`initAngle`: Mars 4.5 rad, Earth 0, Jupiter 2.1). They are not true 2351 ephemerides. If OLYMPUS reuses `ephemeris.js`, Mars–Jupiter distances on a given date will match LONGHAUL.
- Implication for OLYMPUS: the user wants "full days (Mars sols, not 24h)". Keep the UTC date as the system-wide time (it is what the powers and the news use), and add a local **sol clock** for Mars, a sol number since some epoch, plus Martian time of day. Use `solarDayH` for every world, because Europa's "day" is its 3.55-day orbit (tidally locked). For the user: should OLYMPUS start in 2351, the LONGHAUL year, or later? (Open question.)

---

## 2. Physical system data (ephemeris and body facts)

`js/sim/ephemeris.js:29-66` holds the bodies and `js/sim/bodyfacts.js` the reference facts (NASA/JPL fact-sheet values, rounded).

| Body | a | Radius km | GM km³/s² | Turn | Air (surface kPa, scale km, interface km) | Surface g |
|---|---|---|---|---|---|---|
| Earth | 1.0 AU | 6,371 | 398,600 | 23.934 h | 101.3, 8.5, 120 | 1.00 G |
| Luna | 384,400 km | 1,737.4 | 4,904.9 | locked (27.32 d) | none | 0.166 G |
| **Mars** | **1.524 AU** | **3,390** | **42,828** | **24.623 h** | **52, 19, 160 (terraformed)** | **0.380 G (3.727 m/s²)** |
| Phobos | 9,377 km | 11.1 | 0.000711 | locked (0.319 d = 7.66 h) | none | 0.0006 G |
| Deimos | 23,460 km | 6.2 | 9.8e-5 | locked (1.263 d) | none | ~0.0003 G |
| Jupiter | 5.203 AU | 69,911 | 126,686,534 | 9.925 h | giant (1 bar at R), 27, 1,000 | — |
| Io | 421,800 km | 1,821.6 | 5,959.9 | 1.769 d | trace SO₂ | 0.183 G |
| **Europa** | **671,100 km** | **1,560.8** | **3,202.7** | **locked 3.551 d** | **trace O₂** | **0.134 G (1.315 m/s²)** |
| Ganymede | 1,070,400 km | 2,634.1 | 9,887.8 | 7.155 d | trace O₂ | 0.145 G |
| Callisto | 1,882,700 km | 2,410.3 | 7,179.3 | 16.69 d | trace CO₂ | 0.126 G |
| Saturn | 9.537 AU | 58,232 | 37,931,187 | 10.656 h | giant | — |
| Titan | 1,221,870 km | 2,574.7 | 8,978.1 | 15.95 d | 146.7, 40, 600 | 0.138 G |
| Ceres | 2.77 AU | 470 | 62.63 | 9.074 h | none | 0.029 G |
| Vesta / Pallas / Hygiea / Juno / Interamnia | 2.36 / 2.77 / 3.14 / 2.67 / 3.06 AU | 263 / 256 / 217 / 123 / 166 | | 5.3 / 7.8 / 13.8 / 7.2 / 8.7 h | none | |

Other bodies present: Mercury, Venus, Uranus, Neptune, and Saturn's Mimas, Enceladus, Tethys, Dione, Rhea and Iapetus. Eros is not a body in the ephemeris; it appears only as a name.

**Worlds** (`js/sim/worlds.js`): planets and moons at least 1,000 km across. Each holds a **planetary space** out to where its pull falls to 0.01 G (`WELL_G`), within half its Hill sphere and at least 1.5 radii. That is Earth 63,754 km, **Mars 20,898 km**, Luna 7,072, Ganymede 10,041, Titan 9,568 and Jupiter 1.14 million. Inside it are high orbit, a **parking orbit** at 0.92 of the edge (Mars 19,226 km), the **stationary orbit** (Mars 20,428 km from its centre, Earth 42,164 km; none for the tidally locked moons) and low orbit (20 km over the air or ground up to a third of a radius). README: "a planet or a big moon holds a space of its own… where the nav computer flies planetary flight."

**Light lag** (`docs/WORLD.md` §Light lag): 8.3 min per AU, 1 light-second ≈ 0.002 AU. Sensors are live out to about 15 million km (0.1 AU, 50 light-seconds). Everything else is a *report* with an age. The user asked for this [U 2026-10-20]: "we shouldn't be able to know the exact positions of ships that are beyond 1 light second or 1 light minute away… create a fog of war like situation beyond, with historical data that is updated at long rates."

**Travel times from Mars** (my calculation, for scale: a straight brachistochrone, at rest at both ends, ignoring the planets' motion and reaction mass). LONGHAUL's route options are EXPRESS 3G, STANDARD 1G and BELTER 0.3G brachistochrones, ECONOMY (0.3G then coast) and BALLISTIC (Lambert), plus combat 5/7/10G (`docs/FLIGHT.md` §Targets).

| Leg | Distance | 0.1 G | 0.3 G | 1 G | One-way light time |
|---|---|---|---|---|---|
| Mars–Earth, closest | 0.524 AU | 6.5 d | 3.8 d | 2.1 d | 4.4 min |
| Mars–Earth, farthest | 2.524 AU | 14.4 d | 8.3 d | 4.5 d | 21 min |
| Mars–Ceres, closest/farthest | 1.25 / 4.29 AU | 10.1 / 18.7 d | 5.8 / 10.8 d | 3.2 / 5.9 d | 10–36 min |
| **Mars–Jupiter (Europa), closest** | **3.68 AU** | **17.3 d** | **10.0 d** | **5.5 d** | **31 min** |
| **Mars–Jupiter, farthest** | **6.73 AU** | **23.4 d** | **13.5 d** | **7.4 d** | **56 min** |
| Mars–Saturn, closest | 8.0 AU | 25.6 d | 14.8 d | 8.1 d | 67 min |

A troop transport to Europa is therefore one to two weeks under sustained thrust, or months on a coasting profile: "space being big and travel taking a long time" holds. Crews at more than 1.5 G need juice (§15).

---

## 3. The powers (`js/sim/factions.js:25-31`)

| Id | Name | Desc (verbatim, in-game) | Navy | Police | Colour |
|---|---|---|---|---|---|
| `UN` | United Nations | "Earth and Luna: thirty billion people, the oldest navy in the system and most of its money. UN ships are many, sound, and a generation old." | UNN | UN Security | `#4A90D9` |
| `MCR` | Martian Congressional Republic | "Mars: a frontier world under a terraforming project that will take centuries, and the best warships ever built. MCRN crews are drilled hard and fly TL4 hulls." | MCRN | Martian Security | `#C1553B` |
| `OPA` | Outer Planets Alliance | "Belter unions, cells and militias holding the stations of the Belt. Refit hulls, jury-rigged kit, and crews who can fix anything with a wrench." | OPA | Star Helix Security | `#E2A355` |
| `independent` | Independent | "Corporations, private captains and stations that answer to no flag, for as long as nobody makes them." | — | — | `#8A8A6A` |
| `pirate` | Pirates | "Raiders working the lanes where nobody's writ runs. Their demand is often a bluff…" | — | — | `#C05AA0` |

Tech levels by power (`docs/WORLD.md` table, civil / police / navy): UN 2/3/3 (most of its fleet is TL2, with TL3 Everest frigates and Leviathan battleships), MCR 3/3/4, OPA 1/2/2 (in practice TL1 refits), independents 2, pirates 1 (2 for their best). `POWERS = ['UN','MCR','OPA']` hold territory. The player's own ordnance draws in `#4FD1C5` ("player").

Provenance: UN, MCR/MCRN, OPA, Star Helix Security and a Belt-dominated OPA are [C]. "Earth thirty billion" is [C]. Tech tiers are [U 2026-10-19]: "There should also be tech levels of ships (belters won't be using high tech ships like mars)". Also [U 2026-10-19]: "Mars has the best ships but they are the most expensive to upgrade, require the most parts. High tech in general degrades slower but is more expensive to repair… Earthers use middle of the range tech, even though they use some high tech ships, they mostly use older tech. belters use refurbished ships and many jury rigged systems, which are cheap to repair but break easily." And: "a junker belter ship cannot win a fight against a martian top of the line military frigate."

---

## 4. Sub-factions (`js/sim/factions.js:62-114`)

The coalition model is the user's: [U 2026-10-22] "each major faction should be composed of sub factions who act for the general interest of their top faction, but should have their own agendas, with internal (mostly covert and cold war) warring and in-fighting. The independents are the exception on this, with no unified top-faction that carries the sub-factions, each sub-faction is... independent." Every name below is [L] unless marked.

Influence is each sub-faction's starting share of its power's politics (they sum to 1). `fleet` is the share of the power's hulls of a category that fly under that sub-faction; the rest are private.

| Id | Power | Name (short) | Agenda | Influence | Fleet | Desc (verbatim) |
|---|---|---|---|---|---|---|
| `unn-fleet` | UN | UNN Fleet Command (UNN) | hawk | 0.30 | military 1 | "The admirals of the oldest navy in the system: a big fleet, a long memory, and a budget to defend every year." |
| `un-intel` | UN | Earth Intelligence Directorate (EID) | covert | 0.15 | — | "Earth's spies: wiretaps on Mars, money for anyone who makes Mars's life hard, and files on half the Assembly." |
| `un-assembly` | UN | Assembly Peace Caucus (APC) | dove | 0.30 | — | "The delegates who remember what the last war cost: thirty billion voters and a fleet that is getting old." |
| `un-corp` | UN | Luna-Kepler Consolidated (LKC) | profit | 0.25 | civilian 0.35 | "The biggest shipping and mining combine on Earth. It wants the lanes open, and pays quiet men when they are not." |
| `un-security` | UN | UN Security (UNS) | police | — | authority 1 | "The UN's police in space: cutters on every station beat of Earth's." |
| **`mcrn-fleet`** | **MCR** | **MCRN Admiralty (MCRN)** | **hawk** | **0.35** | **military 1** | "Mars's navy: the best ships ever built, crewed by the best-drilled crews, and very sure of both." |
| **`mcr-intel`** | **MCR** | **Martian Naval Intelligence (MNI)** | **covert** | **0.15** | — | "Small, sharp and patient. MNI watches Earth, the Belt and the Congress with the same eyes." |
| **`mcr-congress`** | **MCR** | **Congressional Unity Caucus (CUC)** | **dove** | **0.30** | — | "Terraforming first: every hull the navy builds is a century more under the domes." |
| **`mcr-corp`** | **MCR** | **Hecate Arms & Drive (HAD)** | **profit** | **0.20** | **civilian 0.30** | "Mars's drive-maker and arms yard. A war is a contract; a cold war is a longer one." |
| **`mcr-security`** | **MCR** | **Martian Security (MSS)** | **police** | — | **authority 1** | "The Republic's police cutters: precise, polite, and armed better than most navies." |
| `opa-tycho` | OPA | Tycho Council (TYCHO) | moderate | 0.35 | military 0.7 | "The builders: a seat at the table with the inners, a navy of refits, and patience." |
| `opa-ceres` | OPA | Ceres Free Belt (CFB) | militant | 0.30 | military 0.3 | "The cells that never stopped fighting: bombings on inner stations, and ships that answer to nobody at Tycho." |
| `opa-unions` | OPA | Belt Unions (UNIONS) | labor | 0.35 | civilian 0.4 | "Dockers, miners and ice haulers: they can shut a port with a vote, and do." |
| `opa-starhelix` | OPA | Star Helix Security (SH) [C] | police | — | authority 1 | "The Belt's police contractor, keeping the peace on the OPA's stations for a fee." |
| `ind-ganymede` | — | Ganymede Agricultural Concord (GAC) | trade | — | civilian 0.2 | "The breadbasket of the outer planets, and neutral as long as both navies need to eat." |
| `ind-vesta` | — | Vesta Miners' Cooperative (VMC) | trade | — | civilian 0.15 | "The prospectors and ore haulers round Vesta, owned by the people who dig." |
| `ind-traders` | — | Free Traders' Guild (FTG) | trade | — | civilian 0.4 | "Independent captains who share rates, news and lawyers, and nothing else." |
| `ind-water` | — | Pur'n'Kleen Water (PNK) [C] | trade | — | civilian 0.15 | "Ice from the rings to anyone who pays: the oldest water company in the Belt." |
| `ind-merc` | — | Brannock Security Services (BSS) | mercenary | — | irregular 1 | "A mercenary company with refit warships and no questions: convoy guards for some, deniable raiders for whoever pays most." |
| `clan-rust` | pirate | Rust Queens (RUST) | plunder | — | irregular 1 | lairs Hygiea, Vesta, Ceres. "The oldest clan in the Belt: salvage, protection, and a long memory for debts." |
| `clan-dark` | pirate | **Hungry Dark (DARK)** | plunder | — | irregular 1 | **lairs Jupiter, Callisto, Europa.** "Raiders of the gulf beyond the Belt, who run cold and leave nothing behind." |
| `clan-knives` | pirate | Knife Season (KNIVES) | plunder | — | irregular 1 | lairs Pallas, Juno, Hygiea. "Young, loud and fast: they hit the Belt lanes and boast about it on open channels." |
| `clan-ghost` | pirate | Ghost Belt (GHOST) | plunder | — | irregular 1 | lairs Saturn, Titan, Uranus. "Nobody has seen their faces. Ships go quiet in the outer dark and are found weeks later, stripped." |

Pirate clans count as independents but are outlaws to everyone: their ships keep the faction `pirate` and carry the clan as `sub` [U 2026-10-22 decision recorded in the v0.17.0 summary: "pirates are independent clans"].

The Martian sub-factions are OLYMPUS's internal politics. The CUC's line ("every hull the navy builds is a century more under the domes") sets the navy's budget against terraforming. That is a natural backdrop for a marine's world: barracks gossip, budget news, and MNI covert work against rivals inside the Republic. There is no Marine Corps sub-faction. Marines would sit under the MCRN Admiralty unless OLYMPUS adds one.

---

## 5. Politics: relations, phases, in-fighting, proxies (`js/sim/politics.js`)

**Relations** run from −100 (open war) to +100 (alliance), one per pair of powers. Phases are read with 3 points of hysteresis (`BANDS`, `politics.js:68`): allied ≥ 55, friendly ≥ 20, neutral, **cold war ≤ −20**, **crisis ≤ −45**, and **war**, which is declared and ended by events. Constants (`politics.js:68-84`):

| Constant | Value |
|---|---|
| Baseline `BASE` | MCR–UN **−32**, OPA–UN −10, MCR–OPA −15 |
| Ceiling | MCR–UN **−25** ("Earth and Mars are never friends") |
| Pressure drift (arms race) per day | MCR–UN 0.0018, OPA–UN and MCR–OPA 0.0012 |
| Pressure relief per day | 0.8% of itself |
| Crisis spiral per day | +0.012 (except in the cooling after a ceasefire) |
| Hawk weight | +0.005 × lean per day |
| Incident | +0.03 pressure each (warships lost in a standoff, a proxy's money traced, a spy caught) |
| Daily relation update | 4% back toward baseline, minus 1.8 × pressure, plus a random walk (σ 2) |
| War | declared past **−72** (`WAR_AT`), 30–60% a day, more with hawks in charge |
| Exhaustion in war | +0.014 a day plus losses. Past 0.4 a ceasefire becomes likely, which sets the relation to −50 and pressure to 0 |
| Agenda lean `LEAN` | hawk +1, militant +1, profit +0.3, covert +0.2, labor −0.2, moderate −0.6, dove −1 |

Measured behaviour (`docs/WORLD.md`; tests/service.test.mjs and wars.test.mjs): over two years **Earth–Mars spends about 40% in cold war, 45% in crisis and 15% at war, with three or four wars**. Over five years with the fights feeding back, **Mars–OPA spends about half its days in crisis, with a short war every year or two**, driven by insurgency losses, which count as Mars–OPA incidents. Earth–OPA stays mostly cold.

User source [U 2026-10-22]: "a sensible and well thought-out conflict simulation with UN and Mars never being friendly, but oscillating between a state of cold war, to all out conflict and using independent factions in proxy wars."

**In-fighting.** Each pair of sub-factions inside a power has a rivalry, `min(1, 0.15 + |lean a − lean b| × 0.3)`. A feud breaks out with probability 2% × rivalry a day. `FEUDS` (`politics.js:287`) are leak, budget fight, arrests, press smear, and sabotage at a yard (the hull on the slips is delayed 2–6 days). The winner takes a few points of influence. 60% of feuds reach the news, and half leave a covert job for a licensed captain. Headline templates: "Leaked files embarrass the {B}; the {A} denies any part in it." / "Budget fight: the {A} wins the vote against the {B}." / "Arrests: {A} officers detain staff of the {B} on espionage charges." / 'An "accident" at a {P} yard: the {B}'s new hulls are delayed. Nobody is charged.'

**Proxies.** In a cold war or crisis, a proxy war starts with probability 1% + 4% × pressure a day per pair. The payer is likelier to be the side whose covert and militant sub-factions have more say. The proxy is BSS, a pirate clan, or CFB cells against an inner power. It lasts 15–45 days, and its money is traced at 3% a day (an incident). Headline: "Investigators trace the money behind the {sub}'s raids to {backer}. {backer} denies everything."

**News** leaves from the capital (`CAPITAL = { UN: 'Earth', MCR: 'Mars', OPA: 'Ceres' }`) and travels at light speed. On Mars, OLYMPUS gets Martian political news instantly and Earth's news 4–21 minutes late.

**Hot zones** (`js/sim/conflict.js:71`, `ZONE_KINDS`):

| Kind | Label | Desc |
|---|---|---|
| standoff | NAVAL STANDOFF | "Two navies watching each other. Patrols search everyone." |
| blockade | BLOCKADE | "A navy is stopping traffic. Inspections at the cordon; smugglers pay well." |
| skirmish | SKIRMISH | "Warships are shooting." |
| front | WAR FRONT | "Two navies at war, fighting for the space round a body: squadrons on both sides, control points, wrecks." Control points are named ALPHA, BRAVO, CHARLIE |
| proxy | PROXY WAR | "Deniable raiders, paid by one power, hitting another's shipping." |
| pirates | PIRATE ACTIVITY | "Raiders working the lanes. Bounties posted; escorts in demand." |
| insurgency | INSURGENCY | "Belter militants against an inner power. Information is worth money." News: "Bombings and sabotage on {body}: {Ceres Free Belt} cells against {power}." |

Zones are generated daily from the influence field (`zoneCandidates`, `conflict.js:193`), with a chance of 20% + 50% × mean tension:

- contested bodies give standoffs in a cold war; standoffs, blockades or skirmishes in a crisis; skirmishes or blockades in a war;
- low control (level under 0.6) in the Belt or beyond gives pirates;
- **an inner power's space with OPA influence over 0.2 gives an insurgency by `opa-ceres`**.

Every war has a **front** at the body both powers reach furthest: Ganymede, or Mars itself when Earth is close. It has radius 0.04–0.07 AU and intensity 0.85, and draws 40% of each navy. At most 8 flashpoints exist at once (10 with fronts and raiding grounds). Zones last 5–30 days. Away from the player, losses are rolled as outcomes: Lanchester's linear law, at most 4 wrecks per 8 days (10 at a front). The insurgency rule: with the inner navy on station, 4 hours in 10 the cells cost it a hull ("a mine, a bomb aboard"). Otherwise it disables a ship suspected of running for them, or bombs a passing ship.

---

## 6. Spheres of influence (`js/sim/factions.js:151-224`)

Each source has strength s at its body and a Gaussian falloff of radius r (AU). The OPA also has a ring source at 2.75 ± 0.5 AU with s 0.5. Sources combine as 1 − Π(1 − cᵢ). Control needs at least 0.25 (`CONTROL_MIN`). Space is contested if the rival has at least 0.2 and at least 60% of the leader's influence. It is lawless under 0.15.

Sources: UN at Earth 1.0/0.45, Venus 0.5/0.15, Mercury 0.35/0.1, Ganymede 0.4/0.08. **MCR at Mars 1.0/0.35, Pallas 0.35/0.1, Ganymede 0.45/0.08, Callisto 0.4/0.08.** OPA at the ring 0.5, Ceres 0.9/0.15, Pallas 0.6/0.1, Hygiea 0.5/0.1, Juno 0.7/0.1, Vesta 0.35/0.1, Europa 0.3/0.1, Titan 0.6/0.3, Uranus 0.4/1.2, Neptune 0.4/1.5.

**Computed control at game start** (my run of `controlAt` at minute 0 through Node, which works because the modules are pure ES modules):

| Body | Holder | Level | Rival | UN / MCR / OPA influence |
|---|---|---|---|---|
| Mars, Phobos, Deimos | MCR | 1.00 | — | 0 / 1.00 / 0 |
| Earth, Luna | UN | 1.00 | — | 1.00 / 0 / 0 |
| Ceres | OPA | 0.95 | — | 0 / 0 / 0.95 |
| Pallas | OPA | 0.80 | — | 0 / 0.35 / 0.80 (Martian interest in its refineries) |
| Juno (Tycho) | OPA | 0.85 | — | |
| Hygiea / Vesta / Interamnia | OPA | 0.64 / 0.53 / 0.34 | — | |
| Io | MCR | 0.66 | — | 0.39 / 0.66 / 0.30 |
| **Europa** | **MCR** | **0.66** | **UN (contested)** | **0.40 / 0.66 / 0.30** |
| **Ganymede** | **MCR** | **0.66** | **UN (contested)** | **0.40 / 0.66 / 0.30** |
| **Callisto** | **MCR** | **0.66** | — | 0.39 / 0.66 / 0.29 |
| Titan / Saturn | OPA | 0.60 | — | |
| Uranus / Neptune | OPA | 0.40 | — | |

The Jovian moons move with Jupiter, so this picture is stable: **Mars holds Jovian space, Earth contests it at Europa and Ganymede, and Belter influence there (0.30) is over the 0.2 insurgency threshold.** `docs/WORLD.md` says the same in words: "Ganymede is contested between Earth and Mars; Pallas between Mars and the Belt; the gulf beyond the Belt is lawless."

---

## 7. Mars in detail

### 7.1 Physical (`bodyfacts.js:42-44`, `ephemeris.js:36-39`)

Mass 6.417e23 kg, density 3,934 kg/m³, axial tilt 25.2°, eccentricity 0.094 (the sim flies a circle), inclination 1.8°, 0.380 G. Temperature mean −25 °C, range −100 to +28 °C. No global magnetic field ("crustal remnants in the south: the domes keep out the radiation the thin air lets through"). Albedo 0.2. Two moons.

### 7.2 Terraforming state

The user's instruction [U 2026-10-25]: "keep in mind Mars has been terraformed as well (a little) which makes its atmosphere breathable and its terrain a bit different from current real life measurments." Canon Mars is domed and underground, with a terraforming project measured in centuries, so this is a **deliberate divergence from canon**. The implementation's details are [L] (v1.6.0, 2026-10-25):

- Library text, verbatim (`bodyfacts.js:44`): "Two centuries into its terraforming. Mars has a sky now: half an Earth's air, nitrogen and oxygen, that a walker can breathe in the lowlands and the Mariner Valley if not in a hurry. A shallow young sea fills the northern plains, Hellas holds a lake, the polar caps have shrunk, and lichen and hardy grass grow where the water has come. The cities are still domed against the cold, the radiation and the storms, and the work will take centuries more. Olympus Mons still stands 22 km over the datum."
- Air (`bodyfacts.js:43`): **N₂ 58% · O₂ 32% · CO₂ 8% · Ar 2%**. Text: "breathable on the low ground (oxygen at 16.6 kPa, as on an Earth mountain at 2,500 m), thin and cold; dust storms still".
- Sim atmosphere (`ephemeris.js:36`): surface 52 kPa at the mean radius (datum), scale height 19 km, entry interface 160 km, giving ρ₀ = 0.73 kg/m³.
- Ship's library summary (`ui/library.js:400`): "Mars was terraformed, a little: its air is thin, but breathable on the low ground, and it has a young sea in the north."
- Visuals: the telescope draws Mars with a pale limb `[196,178,190]`, a northern sea, lakes, vegetation and smaller caps (`ui/scope-sky.js:83`). The town style has ground `[0.33,0.15,0.07]`, dust 0.45, and town 'domes': "Mars's domes over their districts, tubes between them, industry outside" (`ui/gl/town3d.js:17, 47`). The shuttle camera's entry plasma is orange.
- Market: Mars **wants water at 200 t/day and volatiles at 80 t/day for its terraforming** (`market.js:102`). Volatiles are "air to breathe, fertiliser, and a terraformed planet's sky" (`goods.js`).

The pressure and partial pressures implied by LONGHAUL's numbers (my calculation, P = 52 kPa × e^(−h/19 km)):

| Place (elevation) | P kPa | O₂ kPa | CO₂ kPa |
|---|---|---|---|
| Hellas floor (−7 km) | 75 | 24.1 | **6.0** |
| Northern sea level (≈ −4.5 km) | 66 | 21.1 | **5.3** |
| Mariner Valley floor (−5 km) | 68 | 21.6 | **5.4** |
| Datum | 52 | 16.6 | **4.2** |
| Tharsis plateau (+8 km) | 34 | 10.9 | 2.7 |
| Olympus Mons summit (+21.9 km) | 16 | 5.3 | 1.3 |

**Realism flag:** CO₂ at 4–6 kPa is about 4–6% sea-level equivalent. Exposure limits are around 0.5% for long-term work and about 4% as immediately dangerous, and 5–6% causes headache, dyspnea and confusion within minutes to hours. As written, the "breathable" lowlands are the most hypercapnic places on Mars. OLYMPUS models air in detail, so it has to settle this: either lower the CO₂ share (e.g. under 0.5%, with the remainder as N₂; still "a little" terraformed) or keep it and treat Martian air as breathable only through a CO₂-scrubbing mask. The user said "breathable", so the composition numbers, which were the agent's own, are the thing to change. (Open question.)

### 7.3 People, cities, ground

- `SETTLEMENTS.Mars` (`worlds.js:104`): **about 4 billion people** ("domed cities on the high ground and the Mariner Valley, farms in the lowlands, the young northern sea"). Four billion matches the commonly cited canon figure.
- **Airspaces**: 6 equatorial arcs of 60° each, eastward from the prime meridian (`AIRSPACE_NAMES`, `worlds.js:253`): **Meridiani (0–60°E), Syrtis (60–120°), Elysium (120–180°), Amazonis (180–240°), Tharsis (240–300°), Mariner Valley (300–360°)**. The order follows real Martian east longitudes. Each has a controller named "{name} **Planetary Traffic**" (`CONTROLLER_WORD`) and a spaceport, "{name} Spaceport", placed at 35–65% across its arc. The authority is MCR. "Earth has eleven, Mars six" (README). Airspaces exist only in the equatorial plane cut, because the game is 2D. Landing clearance is refused to a ship the power wants (wanted 2 or higher), one flying an enemy's flag, or anyone with standing under −20.
- **Ground services** (`ground.js:47`): Mars has a **full hospital** (it mends brain damage, which the autodoc never does, for 2,500 MCR), courses in **piloting, engineering and security** at "**the Mariner Valley institutes**", and a spaceport hiring hall of 5 people a day at quality +9.
- **Mars as home** (`careers.js:93-111`): 24% of all crew are Martian-born (weights Earth 30, Mars 24, Belt 30, Luna 7, Jovian 6, Saturnian 3). Leave on one's home world is +20 morale, against +15 on any world's ground and +8 at a station.
- **Shuttle entry** at Mars (`docs/FLIGHT.md`): a pinnace comes in at 3.06 km/s, the entry takes about 38 minutes, and a whole run takes 7.7–8.8 hours.
- **Town picture** (`town3d.js`): Mars towns are domes over districts, tubes between them, industry outside, with a road of 3 km and about 110 outlying buildings, lit by night.
- **Procedural ground sites** (`worlds.js:324-346`): kinds are camp, mine, outpost, research station, settlement, crash site, relay mast, depot. Names are two syllables, from `['Ash','Bel','Cor','Dun','Ery','Fal','Gar','Hol','Ira','Kes','Lor','Mar','Nor','Ost','Pel','Quin','Ros','Sal','Tor','Ula','Ven','Wyl']` and `['ford','gate','holm','mere','point','reach','ridge','rock','stead','vale','wick','field','crag','hollow']`. They come from a seeded hash and are meant for future ground missions.

The user's vision for worlds [U 2026-10-25] reads directly onto OLYMPUS: "My idea is that planets and big bodies will become large playgrounds by themselves later, with military actions possible, bounties for on ground targets, information gathering, air support etc. As well as eventually also landing at ground side docking places… my goal here is to make this exclusion zone the boundary where planets start to feel like the biggest thing around and start feeling like 'worlds'." Also [U 2026-10-25]: "make ground feel realistic but don't expand any resources simulating actual life there, just nice looking stuff and animations, and reasons to go there." (OLYMPUS goes further, by design, but that was the stated budget then.)

**Martian place names available** (`names.js:232`, `MARS_PLACE`, 148 entries): real geography (Tharsis, Hellas, Arsia, Valles, Olympus, Noctis, Elysium, Pavonis, Ascraeus, Argyre, Utopia, Acidalia, Arcadia, Amazonis, Chryse, Isidis, Syrtis, Hesperia, Cimmeria, Sirenum, Meridiani, Xanthe, Kasei, Jezero, Gusev, Gale, Holden, Eberswalde, Huygens, Schiaparelli, Korolev, Candor, Ophir, Melas, Coprates, Cydonia, Stickney…), historic missions (Viking, Sojourner, Opportunity, Curiosity, Perseverance, Ingenuity, Zhurong, Tianwen), SF authors (Bradbury, Burroughs, Lowell, Sagan), the canon cities **Londres Nova** [C] and **Innis Shallow** [C?], and [L] settlements: **Mars Station, Ochre Basin, Dustfall, Redwater, Highrim, Low Hellas, Ironvale, Coldspring, Firstlight, Kasei Deep, Twin Domes, Canal Town**. These are the natural names for OLYMPUS's Martian cities, bases and districts. "Mariner Valley" as a place is [C]: Alex Kamal is from there.

### 7.4 Phobos, Deimos and Phobos Naval Yard

- Phobos (`bodyfacts.js:45-47`): 27 × 22 × 18 km rubble moon, density 1,876, "spiralling slowly in toward Mars, its orbit faster than Mars turns: it rises in the west. **The MCRN's yard is dug into it.**" Its orbit is 9,377 km from Mars' centre, every 7.66 h.
- Deimos (`bodyfacts.js:48-50`): 15 × 12 × 11 km, "smooth regolith over a captured rock, hardly more than a mountain in orbit". **No station.** Only the "Deimos lighter" civilian class carries its name.
- **Phobos Naval Yard** (`entities.js:79`, `stations.js:195-205, 253-256`, `docs/DOCKING.md`). This is the MCR's only station.
  - Name "Phobos Naval Yard", faction MCR, mass 1,900,000 t, kind 'Naval yard', `military: true`, site 'surface' (on Phobos at its radius, tidally locked), phase 3.0.
  - Size 3.6 km. Approach gate 60 km up, anchorage 40 km. Phobos is too small to orbit, so its 300 holding slots ride Phobos' own orbit round Mars, and the planet's speed tier applies ("Mars' well being the danger there").
  - **Population 60,000.** Care 'full' (a hospital, so neural surgery is possible).
  - Services: fuel, repair, yard, arms. **No market, no hiring hall, no shore leave.** The market is closed to passing traders (`open: false`): it makes munitions at 2.5 t/day and wants metals 40, parts 5, electronics 3, food 10 and water 15 t/day.
  - Defence: TL4, 24 PDC, 8 torpedo silos, magazine 24 HE + 24 nuclear, 4 railguns, armor 6, 30,000 hp.
  - Layout (station frame: x up from the rock, y along its motion, metres): ground works −60..0 × −1,800..1,800 (1,200 high); three yard sheds, 140 m tall and 600 m long, at y −1,500..−900, −400..200 and 700..1,300; a command block (tag 'control', 50 m tall) at y −200..200; two gantry towers, A at y −650 and B at y 1,550, each 200 m tall with 2 levels, giving 8 S/M arms; and two **naval cradles**, N1 (y 450, 260 m long) and N2 (y −1,660, 260 m), for L hulls. That is 10 berths.
  - Library note (`entities.js:65`): "The MCRN's naval yard on Phobos, under Mars. Martian warships are built and overhauled here, and strangers are watched."
  - Voice: Martian controllers are "clipped" (`dialogue.js:28`): "Phobos Control. Your transponder is logged. State your purpose." / "Phobos Control. Identify and state intentions."
  - Phobos is the start port for an MCRN-licensed captain (`game.js:89` `HOME_PORT`; `ui/app.js:198`: "Martian Navy contractor. Start at Phobos. Unlocks the Tharsis.").
- A named default entity, the **MCRN Scirocco** [C name], an Olympus-class battleship, sits on rails round Mars at 0.001 AU (about 150,000 km) with a 6-day period (`entities.js:85`).
- The Phobos placement of the naval yard is [L]. In canon Mars has naval shipyards at Callisto [C?], which LONGHAUL keeps as the "MCRN's Jovian base" (§8).

### 7.5 Martian culture as written (all [L], in a canon-compatible register)

- **Ship naming** (`names.js` header): "Mars is earnest, frontier and terraforming ('Second Spring', 'Daughter of Hellas')". Adjectives (`MARS_ADJ`, 72): Red, Rust, Ochre, Russet, Copper, Iron, Dusty, Thawing, Patient, Frontier, Stubborn, Earnest, Sober, Diligent, Steadfast, Upright, Dutiful, Domed, Terraced, Irrigated, Seeded, Sown, Greening, Pressurized, Sealed, Buried, Tunneled, Thrifty, Frugal, Careful, Measured, Precise, Resolute, Unhurried, Hardy, Weathered, Windswept, Tharsian, Arcadian, Noachian… Nouns (`MARS_NOUN`, 103): Harvest, Spring, Rain, Seed, Furrow, Dome, Thaw, Lichen, Canal, Aquifer, Frontier, Labor, Duty, Covenant, Breath, Atmosphere, Pioneer, Homestead, Terrace, Moss, Greenhouse, Reservoir, Icecap, Dust Devil, Sandstorm, Olivine, Basalt, Regolith, Hematite, Steward, Engineer, Surveyor, Generation, Century, Inheritance, Charter, Commons, Patience, Endurance, Perseverance, Tolerance, Standard, Blueprint, Forge, Foundry, Shipyard, Keel, Rivet, Pressure Seal, Airlock, Ration, Bread, **Water Right**, Firstborn, Rainmaker, Cloudseed, Ice Mine, Mirror, Sunlamp, Windbreak.
- **Martian sayings** (`MARS_PHRASE`, `names.js:269`): "One Day Rain, Someday Oceans, Open Sky, Under Glass, For the Children, Patience Pays, Hard Work, Duty First, Built to Last, Measure Twice, Within Tolerance, To Specification, Inspected and Passed, Sixty Years Yet, Not in Our Lifetime, Plant Trees Anyway, Breathe Easy Someday, Mind the Seals, Dust in Everything, The Long Work, Third Generation, Water Rights, Air Rights, Rain on Mars". These make good barracks graffiti, unit mottos, mess-hall posters and NPC sayings. Some ("Someday Oceans", "Breathe Easy Someday") read as though Mars isn't yet breathable. They fit a Mars that is terraformed only "a little" and still far from finished, but builders should keep the tone ("we are not there yet").
- **Kin names**: "Daughter of Hellas", "Bread of Arcadia", "Child of Second Spring", "Daughter of the Long Rain" (`MARS_KIN`, `MARS_HOPE_ADJ/NOUN`).
- **Voices**: a Martian controller is clipped and logs everything. The MCRN hail: '"MCRN vessel. We have your ident. State your intent and keep your distance."' (`dialogue.js:127`). A command ship: '"{name}, MCRN forward command. Go ahead, {rank}."'.
- **Liner lines** (`LINES.MCR`): Valles Express, Tharsis Line, Hellas Passenger, Ares Transit, Elysium Line, Phobos Packet, Olympus Lines.
- **Martian given names** (`careers.js:97`, used for crew born on Mars): Bobbie [C nod: Bobbie Draper], Ares, Solveig, Tariq, Ilse, Cyrus, Noor, Anders, Dara, Lucan, Vesna, Kai, Mira, Orin, Thea, Rook, Calla, Desmond, Hollis, Juno, Kestrel, Lars, Maren, Nils, Petra, Quinn, Reza, Signe, Teodor, Una, Vidar, Wren, Yusuf, Zora, Bram, Elin. The register is Nordic, Persian and Anglo frontier.
- **Martian "founder" surnames** (`MARS_FOUNDER`, `names.js:610`, 83): Xuesen, Barkeith, Gelan, Dewalt, Okonjo, Halloran, Abernathy, Dzhamilov, Ostrovsky, Achterberg, Mbatha, Quintero, Kessler, Arkwright, Brennan, Castellanos, Delacorte, Ekwueme, Falconer, Gaskell, Hakimian, Imbert, Jovanovich, Laszlo, Nakashima, Oyelaran, Pradhan, Qiao, Rostova, Sandoval, Takeda, Umarov, Valcourt, Wexley, Yamazaki, Zharkov, Ashgrove, Brightwater, Coldwell, Dunmore, Everhart, Fairbank, Greenhalgh, Holbrook, Ironside, Jessup, Kingsley, Lockhart, Marlow, Northcott, Oakhurst, Pennington, Redfield, Stonebridge, Thorne, Underhill, Vance, Whitcombe, Yardley, Bello, Chukwu, Danso, Eze, Fofana, Gakuru, Hamid, Idowu, Jalloh, Kamara, Lungu, plus rocket pioneers (Tsiolkova, Varga, Szilard, Oberth, Zubrin, Von Braun, Tsander, Kondratyuk, Esnault, Goddard, Valier, Noordung, Ley). Implied lore: Mars's founding families, whose names the MCRN gives its ships.
- **MCRN war names** (`MARS_WAR`, 66): Greek and Roman military figures and terms (Leonidas, Themistocles, Scipio, Cincinnatus, Belisarius, Hannibal, Achilles, Penthesilea, Bellona, Nike, Mars Ultor, Phalanx, Centurion, Praetorian, Legionary, Triarius, Strategos, Polemarch, Navarch, Trierarch, Tribune, Legate, Decurion, Aquilifer, Signifer, Testudo, Boudica, Vercingetorix, Spartacus, Zenobia, **Donnager** [C]). Winds (`MARS_WIND`, 44: Scirocco, Mistral, Khamsin, Simoom, Harmattan, Haboob…, Dust Storm). Weapons (`MARS_WEAPON`, 57: Gladius, Pilum, Sarissa, Ballista, Onager, Halberd, Claymore, Tachi, Naginata, Kukri, Khopesh, Culverin, Carronade, Hussar, Dragoon, Cuirassier, Grenadier, Fusilier, Ranger…). Lawgivers (`MARS_LAWGIVER`, 25: Hammurabi, Solon, Lycurgus, Cyrus, Justinian…). Martial nouns (`MARTIAL`, 48: Hammer, Lance, Spear, Shield, Bastion, Bulwark, Rampart, Citadel, Anvil, Talon, Sentinel, Warden, Vanguard, Gauntlet, Aegis, Spearhead…). This vocabulary carries straight over to OLYMPUS for unit names, operation names, base names, callsigns and rifle nicknames.
- The Mars-built civilian classes are named after Martian places and myth: Arsia skiff, Phobos courier, Deimos lighter, Ares freighter, Tharsis bulk carrier, Valles Express liner, Pallas ore processor.

### 7.6 Martian Security (MSS)

The MCR's police, sub-faction `mcr-security`, "precise, polite, and armed better than most navies". Their cutter class is `mcr-cutter` (§12). Hull prefix **MSS** (e.g. "MSS Defender 74", "MSS Iron Shield", "MSS Noctis Watch"). Police beats run 3 cutters per station of the power; with Phobos the only MCR station, that is 3 MSS cutters on rails round Mars (`forces.js` `POLICE_PER_STATION = 3`). "A licensed captain flying one of its own navy's hulls under its banner is never stopped by that power's security, short of a warrant."

---

## 8. The Jovian moons, Europa first

**Europa** (`bodyfacts.js:57-59`, `worlds.js:93, 107, 254, 260`, `ground.js:51`, `market.js`, `town3d.js:52`):

- "A shell of cracked ice over an ocean with twice Earth's water. Its ice is mined for reaction mass and drinking water across the Jovian moons." Temperature 50–125 K (mean 102 K). O₂ trace (a tenth of a micropascal). Induced magnetic field ("a salt ocean under the ice"). **Deep inside Jupiter's radiation belts**: the Jupiter fact sheet says its belts "kill an unshielded crew in hours near Io". Europa is next out from Io and also badly irradiated; the game doesn't quantify Europa's dose.
- Settlement: "**a few million**: ice miners' towns on and under the shell, selling water to the Jovian moons".
- **Ground control: OPA.** Three airspaces, **Conamara, Pwyll, Thera**, with controllers "{name} **Ice Control**" and spaceports "Conamara Spaceport" and so on.
- Ground services: clinic only (no neural surgery), engineering course at "the ice miners' school", hall of 2 at quality +1. Home-world category is "Jovian".
- Market `world:Europa`: faction OPA, depth 1.2, makes water 150 and volatiles 5 t/day, wants food 20, parts 3, medical 0.3, consumer 4.
- Town style 'rigs': pale ground `[0.5,0.48,0.45]`, a few buildings, radius 1.5 km.
- Politics: the space round Europa is **MCR-held (0.66) and contested by the UN (0.40)**, with OPA influence 0.30, over the insurgency threshold. The Hungry Dark clan lairs at Jupiter, Callisto and Europa. Pirate zones need control under 0.6, so at 0.66 they arise only when Martian control is weaker; proxies and insurgencies can still appear.
- **Consistency reading for OLYMPUS:** a Martian peacekeeping mission on Europa is a Martian security presence on a Belter-governed ice moon inside Mars's Jovian sphere, with Earth contesting it, Ceres Free Belt cells active, Hungry Dark raiders in the gulf and Pur'n'Kleen water interests. It fits without changing anything. Who the peace is kept *between* (CFB cells against Martian or UN corporate interests? OPA ice-town authorities against cells? a UN–MCR standoff?) is the user's call.

**Ganymede** (`bodyfacts.js:60-62`, `worlds.js:105`, `stations.js:262-266`): "The largest moon in the system, bigger than Mercury. Its domes and mirrors grow the outer planets' food: the breadbasket of the Jovian system" [C]. About 100 million people, "claimed by Earth and Mars and owned by neither". **Ground control: independent** (the Ganymede Agricultural Concord's "Agricultural Authority"). Airspaces Galileo, Uruk, Osiris, Memphis, Nicholson. Ganymede Station is an independent "Transfer station" at 10,000 km (17.5 h orbit): 3.3 km, 21 berths, population 210,000, care clinic, every service including a yard, 10 PDC (TL2) and 2 silos. It is a traffic yard for independent hulls. Ganymede is the likeliest war **front** between Earth and Mars (the body both reach furthest), echoing the canon Ganymede incident [C].

**Callisto** (`bodyfacts.js:63-65`, `worlds.js:92, 106, 256, 260`, `ground.js:50`): "The most cratered surface known, old and dark, outside the worst of Jupiter's radiation: the safe moon to build on." **A few million: "the MCRN's Jovian base and the dome towns round it".** **Ground control: MCR**, with the controller word "**Naval Air Control**" over airspaces Valhalla, Asgard, Adlinda and Heimdall. Ground services: clinic, a security course at "**the MCRN base's range**", hall of 2 at +3. Market `world:Callisto`: MCR, makes water 50 and volatiles 10, wants food 15, parts 4, electronics 1, munitions 1. Town style 'base' with red second glow. This is canon-consistent (Martian shipyards at Callisto [C?]) and the obvious staging base for Martian marines in the Jovian theatre.

**Io**: "The most volcanic place known… Deep in Jupiter's radiation belts: a few corporate labs, nobody's home." Unsettled, with no ground control.

**Saturn and Titan**: Titan has "a few hundred thousand: Belter research stations and hydrocarbon camps by the seas, under air thicker than Earth's". OPA ground control ("Flight Service"), airspaces Xanadu, Shangri-La, Belet, Adiri, Senkyo, stilt towns. Rhea is "a cargo depot on the way in to Titan". The Ghost Belt clan works Saturn, Titan and Uranus.

---

## 9. The Belt and its stations

The OPA holds the Belt (the 2.75 ± 0.5 AU ring) and its stations. Belters are the *Beltalowda*, and Lang Belta words appear in names and speech [C]. Their hulls are TL1 refits.

Stations (`stations.js:226-260`, `entities.js:58-79`, `docs/DOCKING.md` table):

| Station | Faction | Site | Pop. | Size / berths / gate | Care | Services | Defence (TL, PDC, silos, magazine, rail, armor, hp) | Library note |
|---|---|---|---|---|---|---|---|---|
| Ceres Station | OPA | surface (Ceres, 470 km, 9.07 h day; the port moves at 90 m/s) | **1,800,000** | 4.4 km / 26 (4 gantry towers, 2 cradles) / 100 km | full | fuel, market, repair, yard, arms, hiring, leave | 2, 16, 4, HE 24, 0, 4, 24k | "The Belt's biggest port: a spun-up rock at the heart of the asteroid belt, with docks, ice markets and the OPA's loudest voice." The OPA's capital for news; civilian start port |
| Pallas Station | OPA | surface (Pallas) | 240,000 | 3 km / 10 / 60 km | clinic | as Ceres, no yard | 1, 8, 2, HE 10 | "Refinery station on Pallas, smelting metals from Belt ore." |
| Vesta Depot | independent | surface (Vesta) | 30,000 | 1.6 km / 7 / 50 km | clinic | as Pallas | 2, 6, 0 | "Mining depot… Rough, cheap and independent." Trades narcotics |
| Hygiea Ring | OPA | orbit 2,000 km (65 h), 900 m spin ring | 45,000 | 1 km / 10 / 50 km | clinic | as Pallas | 1, 6, 2, HE 8 | "A ring station on Hygiea, far out in the Belt: a quiet place to resupply." |
| Tycho Station [C] | OPA | orbit 1,500 km round **Juno** (75 h) [L placement] | 130,000 | 4.2 km / 19 / 80 km | full | everything | 2, 12, 4, HE 16 + nuke 4 | "Tycho Manufacturing's construction platform, where the Belt builds its biggest ships." OPA start port |
| Luna Shipyards | UN | orbit 6,000 km round Luna (11.6 h) | 300,000 | 5.2 km truss / 22 (2 naval cradles) / 100 km | full | everything | 3, 30, 8, HE 40 + nuke 16, rail 2, armor 5, 40k | "Earth's orbital yards above the Moon: home port of the UNN." UN start port |
| Phobos Naval Yard | MCR | surface (Phobos) | 60,000 | 3.6 km / 10 / 60 km | full | fuel, repair, yard, arms | 4, 24, 8, HE 24 + nuke 24, rail 4, armor 6, 30k | see §7.4 |
| Ganymede Station | independent | orbit 10,000 km round Ganymede | 210,000 | 3.3 km / 21 / 80 km | clinic | everything | 2, 10, 2, HE 10 | "Ganymede's agricultural hub, the breadbasket of the outer planets." |

The user's direction on stations [U 2026-10-20]: "stations should be sized realistically (only build space stations and asteroid-side stations), make sure asteroids have realistic surface areas". Every port has a 300-slot holding pattern on a free orbit and berths that are leased. Traffic control clears approaches, and loitering uncleared within a hub's range is illegal [U 2026-10-20]: "it would be illegal to loiter within a certain range without asking first, make sure hailing is necessary to approach legally".

Population: 3,000 traffic ships in a new game (`DEFAULT_TRAFFIC`), with the sim scaling to 200,000 [U]. Navies, police and pirates are on rails (§13).

---

## 10. Earth and Luna

- Earth: "Thirty billion people, oceans over 71% of it, and the UN's capital. The only world in the system where a human can stand outside unprotected." Ground: "every coast a city, every city a spaceport". It has 11 airspaces (Gulf of Guinea, East African, Indian Ocean, Sunda, Melanesian, Central Pacific, Polynesian, Galápagos, Andean, Amazonian, Mid-Atlantic) with "Air Traffic Control". Full hospital, all four courses at "the UN academies", hall 6 at +10. Its market makes electronics, pharmaceuticals, medical supplies, consumer goods and delicacies.
- Luna: "about 1 billion: warrens under the maria, the UN Navy's yards, the mass drivers that throw cargo off it". Three airspaces (Tranquillity, Far Side, Imbrium), "Lunar Control", full hospital, courses "the yards' schools", bermed habitats.
- Mercury: "Its solar collectors feed the UN grid". Venus is unsettled and "nobody's ground". The user [U 2026-10-25]: "I wanted to stick to expanse colonized worlds for planetary authorities, for Venus, maybe we get low orbit station or something? Not yet though… not sure Venus without terraforming would make sense." So Venus's cloud-top station is a future idea, not built.
- The UN's voice: the controller "reads back idents". The navy hail: '"{name}, UN Navy. Go ahead, and keep your hands off your weapons board."'

---

## 11. Tech levels, sizes and build (`js/sim/ship-classes.js:70-115`, `docs/SHIPS.md`)

| | TL1 Jury-rigged | TL2 Commercial | TL3 Naval | TL4 Advanced naval (Mars navy) |
|---|---|---|---|---|
| Sensors × | 0.7 | 1.0 | 1.3 | 1.6 |
| Own signature × | 1.2 | 1.0 | 0.8 | 0.55 |
| Armor bonus | +0 | +0 | +0.5 | +1 |
| Fire control × | 0.8 | 1.0 | 1.15 | 1.3 |
| Jinking G × | 0.8 | 1.0 | 1.1 | 1.2 |
| Turns from torpedoes | no | yes | yes | yes |
| Wear × | 1.5 | 1 | 0.75 | 0.55 |
| Time between faults × | 0.5 | 1 | 1.6 | 2.4 |
| Spares per repair × | 0.5 | 1 | 1.6 | 2.4 |
| Hands-on repair time × | 0.7 | 1 | 1.25 | 1.5 |
| A jury-rig holds | 48–120 h | 12–36 h | 8–24 h | 4–12 h |
| Yard labour and parts price × | 0.6 | 1 | 1.6 | 2.5 |
| Condition when found | 62–85% | 88–100% | 92–100% | 95–100% |

The same philosophy suits a Martian marine's personal kit: TL4 Martian rifles, suits and armour are excellent and rarely fail, but they cost the most to repair and want proper parts, while Belter kit breaks but is fixed with a wrench.

Sizes: S small craft 60 hp (cold radar signature about 120,000 km); M medium 120; L large 300; XL capital 800 (about 1.5 million km). Reactor blast if containment goes: S 300 DP over a 400 m e-fold, up to XL 2,500 DP over 3,000 m. Build multiplier on structure: military × 1.5 (compartmentalized, spall-lined), authority × 1.2, civilian and irregular × 1. Target radius is 15% of length.

Builders: `MCR` "Martian yards" (MARS), `UN` "Earth & Luna yards" (EARTH), `independent` (IND, Ganymede), `Belt` "Belt refit". The library's yard text: "Mars builds few ships and builds them to naval standards: TL3 and TL4 hulls that hardly show on radar, rarely break, and cost a fortune to keep."

---

## 12. Ship classes (`js/sim/ship-classes.js:140-465`, `docs/SHIPS.md`)

All 40 classes from a Node dump of `CLASSES`. Columns: kind · class · yard · TL · size · length · mass · crew range (usual) · cruise/max G · armor · PDC · tubes (HE/nuke) · rail · brig. Hull L × W × H and collars are in `docs/SHIPS.md:117-163`.

**Martian classes, in full:**

| Kind | Class (id) | TL | Size, length, mass | Crew (std) | G cruise/max | Arms | Hull m (collars) | Carried craft | Yard pitch |
|---|---|---|---|---|---|---|---|---|---|
| Prospector | Arsia survey skiff (`arsia`) | 3 | S 30 m 300 t | 2–3 (2) | 1/5 | — | 30×11×9 (S port) | gig | "Martian survey skiff with naval-grade sensors and a quiet hull. It rarely breaks; when it does, the parts are dear. Unarmed." |
| Courier | Phobos express courier (`phobos`) | 3 | S 42 m 620 t | 2–3 (2), 4 berths | 1.5/8 | — | 42×8×7 (S nose, S port) | gig | "The fastest civilian hull in the system and priced like it." |
| Cargo shuttle | Deimos lighter (`deimos`) | 3 | S 34 m 850 t, 320 t hold | 2–3 (2), 6 berths | 1/4 | — | 34×14×8 (M port, L stbd) | gig | "A Martian orbital lighter: less hold, more drive, very little maintenance." Not atmosphere-rated (it lost `atmo` in v1.11.0) |
| Light freighter | Ares fast freighter (`ares`) | 3 | M 60 m 3,300 t, 18 t hold | 3–6 (4), 8 berths | 1.2/9 | armor 1 | 60×16×13 (M nose, M port) | pinnace | "naval sensors, a quiet hull, machinery that lasts… costs a fortune to keep in spares." |
| Bulk freighter | Tharsis bulk carrier (`tharsis-bulk`) | 3 | L 230 m 38,000 t, 28,000 t hold | 6–12 (8) | 0.4/1.5 | armor 1 | 230×39×39 | lander + pinnace | "a smaller crew, a faster drive, a smaller hold." |
| Liner | Valles Express liner (`valles-liner`) | 3 | L 330 m 110,000 t, 1,200 berths | 40–70 (52) | 0.7/2 | 2 anti-debris PDC (passenger law) | 330×53×50 | lander + 3 pinnaces | "fewer berths, a faster passage" |
| Mining ship | Pallas ore processor (`pallas-refiner`) | 3 | L 200 m 52,000 t | 8–14 (11) | 0.3/1.2 | 2 ore mass drivers | 200×60×40 | pinnace | "two ore mass drivers and a smelter." |
| Patrol cutter | **Martian Security cutter** (`mcr-cutter`) | 3 | M 55 m 1,800 t, 6 berths (its brig) | 6–10 (8) | 1/9 | armor 1.5, 4 PDC, 2 tubes (6/0) | 55×13×11 (M nose, S port) | pinnace | "Martian police cutter, built to navy standards." Strength 281 |
| **Corvette** | **Tharsis-class corvette** (`mcrn-corvette`) | **4** | **M 46 m 2,800 t** | **6–12 (9)** | **1/12** | armor 2, **6 PDC, 2 tubes (6 HE / 6 nuke)**, brig 6 | **46×10×8 (M nose, M port)** | **pinnace** | "Martian fast-attack corvette: six TL4 PDCs, a 12G drive and a stealthy hull." Strength 1,361. Playable with the MCR license |
| **Frigate** | **Hellas-class frigate** (`mcrn-frigate`) | **4** | **M 120 m 12,000 t** | **20–40 (26)** | **1/10** | armor 3, **12 PDC, 4 tubes (12/12), 1 keel railgun**, brig 12 | **120×19×17 (M nose, M port, M stbd)** | **pinnace** | "The best frigate in the system: twelve TL4 PDCs, a keel railgun and a hull that hardly shows on radar." Strength 4,993 |
| Destroyer | Valles-class destroyer (`mcrn-destroyer`) | 4 | L 220 m 40,000 t | 60–120 (80) | 1/8 | armor 3.5, 18 PDC, 6 tubes (16/20), 2 rail, brig 24 | 220×31×26 (M nose, M port, M stbd) | 2 pinnaces | "Martian destroyer with two railguns." Strength 16,669 |
| Battleship | **Olympus-class battleship** (`mcrn-battleship`) | 4 | XL 480 m 250,000 t | 200–400 (280) | 0.5/5 | armor 4.5, 40 PDC, 12 tubes (40/80), 3 rail, brig 60 | 480×72×62 (5 collars incl. L port) | 4 pinnaces + 2 landers | "The flagship class of the Martian Navy." Strength 110,162. Also the MCR command ship (FOB) |

Note that LONGHAUL's flagship class is the *Olympus*-class, which shares a name with the new game. The Martian warship class names (Tharsis, Hellas, Valles, Olympus) are [L]. Canon MCRN ship *names* are used as names only: Donnager, Scirocco [C].

**Other navies** (for OLYMPUS's ship-combat and boarding opponents):

- UN (TL2 unless noted): Harrier-class corvette (`unn-corvette`, 50 m, 2,900 t, crew 6–12 std 10, 1/9 G, 4 PDC, 2 tubes 6/4, "The UNN's numerous, thirty-year-old patrol corvette"); Danube-class frigate (125 m, 12,500 t, 20–40 std 32, 1/7 G, 8 PDC, 4 tubes 12/8, 1 rail, "The backbone of the UN Navy, a generation old"); **Everest-class frigate** (TL3, 120 m, 12,000 t, std 30, 1/9 G, 10 PDC, 4 tubes 12/12, 1 rail, "Earth's modern frigate: few in number, the equal of anything but Mars"); Atlas-class destroyer (230 m, 42,000 t, std 90, 1/6 G, 14 PDC, 6 tubes, 1 rail, "refitted twice and due for a third"); Leviathan-class battleship (TL3, 500 m, 260,000 t, std 320, 0.5/4 G, 32 PDC, 12 tubes 40/60, 2 rail, "Earth spends on its capital ships what it saves on everything else"). Patrol cutter (UN, 55 m, 3 PDC). The UNN's canon battleship *Agatha King* [C] is a default entity, a Leviathan-class orbiting Earth.
- OPA (TL1): Refit corvette (ex-UNN Harrier, rebuilt at Tycho); Refit frigate (ex-UNN Danube, "The OPA's pride"); Converted-freighter gunship (90 m, crew 15–30, the OPA command ship). The *Guy Molinari* [C?] is a default entity. Militia cutter (Star Helix's cheapest).
- Pirates: torch raider (35 m), armed runner (stolen Hermes), pirate gunship (70 m), stolen corvette (ex-UNN Harrier).
- Civilian Earth, Belt and independent classes: Rockhopper, Kestrel, Dart, Hermes, Mule, Ascension, Tramp, Armed light freighter (Ganymede-built, the default start ship), Meridian, Ore scow, Bulk freighter, Ice hauler (1.4 km, Belt; the default Pur'n'Kleen *Weeping Somnambulist* [C] is a "Canterbury-class ice hauler" [C]), Aquarius water carrier, Belt tanker, Reaction-mass tanker, Colony transport, Passenger liner, Mining barge, Mining tender.

**How the tiers fight** (`docs/SHIPS.md:181-195`, 30 bouts): Belt refit frigate against a Martian frigate, the Martian wins 30–0. Earth TL2 frigate against a Martian frigate, 30–0. Everest against Hellas, 20 Hellas wins, 2 both destroyed, 5 undecided, 3 Everest wins. Earth corvette against Martian corvette, 29–0 with 1 undecided.

**Carried craft (the only atmosphere-rated hulls)** (`ship-classes.js:447-465`). These are all generic independent TL2 designs, with no Martian or military variant:

| Craft | Length / mass | Crew / seats / cargo | G cruise/max | L/D | Entry |
|---|---|---|---|---|---|
| Gig | 10 m / 14 t | pilot + 3 seats / 0.6 t | 1/4 | 1.1 | belly, ceramic tiles, skids |
| **Pinnace** | **18 m / 45 t** | **1–2 crew, 12 seats / 4 t** | **1/4** | **1.3** | belly, ceramic tiles, skids |
| Cargo lander | 26 m / 140 t | 1–2 crew, 2 seats / 60 t | 0.8/3 | 0.9 | belly, ceramic tiles, skids |

`BAYS` (`ship-classes.js:474`): small hulls carry a gig; cutters, corvettes, light freighters and frigates a pinnace; destroyers 2 pinnaces; battleships 4 pinnaces and 2 landers; liners a lander and 3–4 pinnaces. Entry is "flown as physics" (Sutton–Graves heat; tiles take 1.1 MW/m², an ablative ring 2.5). At Mars a pinnace enters at 3.06 km/s.

The user's rules [U 2026-10-20, 2026-10-25, and v1.11.0]: "only a limited number of ships being rated for atmospheric entry"; "no large hulls could enter atmo, even corvettes; every hull that can't must carry a shuttle"; shuttles are "their way to interract with surface worlds since they shouldn't be rated for atmo". **For OLYMPUS dropships:** the pinnace (12 seats, which is a marine section) is the established atmospheric craft carried by corvettes and frigates. A Martian military dropship should be a TL4 relative of the pinnace (same lifting-body, belly-tile, skid design), or a new carried class, and not an atmosphere-rated corvette.

Hull shapes [U 2026-10-20]: "make sure the shapes make sense and are practical and hard scifi not fantasy (meaning mostly box-like shapes meant for efficiency and not aerodynamism)". A torch ship is "a tower whose decks are floors under thrust" (`docs/SHIPS.md:109`). Interiors are deck stacks, 7 tiles wide for small craft and 9 for the rest. Warships carry a brig on a deck of its own.

---

## 13. Order of battle and the yards (`js/sim/forces.js:77-111`)

| Force | Strength | Home |
|---|---|---|
| Police | 3 cutters per station of a power with police | beat orbits 0.002–0.012 AU round the station's body |
| UNN | **56 hulls** | Luna Shipyards |
| **MCRN** | **12 hulls** (kinds drawn from corvette, corvette, frigate, frigate, destroyer) | **Phobos Naval Yard** |
| OPA | 8 hulls | Tycho and Ceres |
| Command ships | UN 3 Leviathans, **MCR 3 Olympus**, OPA 2 converted gunships | their yards until a fight calls one |
| Pirates | about 24 at large, plus 5 per pirate zone | lying up cold 0.004–0.03 AU from Belt and outer bodies under 0.45 control |
| Proxy raiders | 4 per proxy war | at its raiding ground |

The user's call [U 2026-10-20]: "UN has significantly more warships than mars (in such a way that mars and UN have total similar forces, Mars with much fewer much better quality ships)". Mean class strength is UN ≈ 1,200 and MCR ≈ 5,900, so 56 × 1,200 ≈ 12 × 5,900.

Commitment to a zone by share of navy: standoff 15/15%, blockade 25/8%, skirmish 25/25%, front 40/40%, insurgency 10% of the inner power, proxy 8%. A squadron sails once 60% can go together, on a 1 G filed course. Build times (`BUILD_DAYS`): cutter 3 days, corvette 4, gunship 6, frigate 8, destroyer 14, battleship 30, all ±20% and 40% faster at war. Yard slots: UN 4, MCR 2, OPA 2.

**Command ships as FOBs**: the user decided command ships, not new stations, serve as forward command [U 2026-10-22, v0.17.0 decision list]. A command ship sits on a post 0.4 × the zone radius behind the zone's anchor and is charted as "MCR FOB · {name}". Command ships in the user's own play have been *MCRN Holden* and *MCRN Nike*.

**Scale caveat for OLYMPUS:** 12 MCRN warships plus 3 battleships come to roughly 1,200 navy crew afloat by `crewStd`, for a Mars of 4 billion. That is LONGHAUL's simulation budget of hulls *in commission and deployable*, not a full order of battle. A Marine Corps for OLYMPUS will need thousands of personnel, bases on Mars and Callisto and so on. Either treat LONGHAUL's 12 as the deployable fleet, or grow the numbers with the user's agreement. (Open question.)

---

## 14. Military service, ranks and missions (`js/sim/service.js`, `js/sim/military.js`, `docs/WORLD.md` §Military service)

The **license** model is the user's [U 2026-10-22]: "add military licenses to the player, allowing to use military ships from the factions, use of mil grade stuff is illegal without a corresponding license, only one license to one faction can be held at a time. Holding a license and a military ship will make the player an independent military contractor for the faction and will come with a steep modification of the relations with other factions… (mirror inter-faction relationships and add personal offset with a factor of 1/10…): basically, we carry the flag of the faction we fly a ship for… Civ ships from factions won't normally be considered targets in conflicts."

- `relation(X) = relation(our power, X) + our standing with X / 10` (`service.js:139`). Bands: ours (own patrols wave us through from rank 1), friend ≥ 40 (`FRIEND_AT`, their navies help), hostile ≤ −35 (`HOSTILE_AT`, warned off and refused docking), enemy ≤ −60 (`ENEMY_AT`, engaged on sight, station guns fire).
- License: requires standing ≥ 10 and a clean record. It is revoked for a severity-2 crime against its own people or being WANTED, and cannot be reapplied for for 30 days (half the reputation is lost). Navy hulls and nuclear torpedoes need it.
- **Reputation** (per power, separate from standing): +1 a day in service; per enemy hull destroyed `KILL_REP` cutter 10, raider 5, corvette 15, gunship 20, frigate 30, destroyer 60, battleship 150 (command ship ×1.5, pirates about a third); a military mission 25–60; reporting aboard a command ship 5. Failures cost half the reward, crimes against one's own side 25 per severity point, a blown covert job 20.
- **Rank ladder** (`RANK_REP = [0, 40, 120, 300, 600, 1000, 1600]`; `service.js:61-65`):

| Rank | Rep | UNN | **MCRN** | OPA |
|---|---|---|---|---|
| 0 | 0 | Ensign | **Ensign** | Volunteer |
| 1 | 40 | Lieutenant (j.g.) | **Lieutenant** | Hand |
| 2 | 120 | Lieutenant | **Lieutenant Commander** | Bosmang |
| 3 | 300 | Lieutenant Commander | **Commander** | Kapteng |
| 4 | 600 | Commander | **Captain** | Fleet Kapteng |
| 5 | 1,000 | Captain | **Commodore** | Kommodore |
| 6 | 1,600 | Commodore | **Rear Admiral** | Admiral |

  The MCRN line is a *naval officer* ladder, with no "(j.g.)". Rank gives +15% military pay a step and opens missions: hold the point and covert jobs at 1, strikes at 2, nukes issued at 3, and own patrols waving you through at 1. The user's words [U 2026-10-22]: "we acrue reputation with the faction (separate from relations) and a rank that increases with time in service (baseline tick up, slow but steady), but also with each ship we destroy and each military mission we complete."
- **Call-ups**: a fight of our power with a command ship within 2.5 AU orders us to report, and the order travels at light speed. Alongside, supplies cost a tenth (`COMMAND_PRICE 0.1`) [U 2026-10-22: "all military supplies, fuel and other supplies should cost us 1/10th"].
- **Military missions** (`military.js`): INTELLIGENCE (sensor locks inside 300,000 km on 2–3 enemy warships, held 10–20 minutes each; at an insurgency, find the cells' dark militia hulls; 5,000–12,000), HOLD THE POINT (rank 1; stay within 75,000 km of a control point for 4–8 h against waves; 10,000–25,000), STRIKE (HVT) (rank 2; 12,000–30,000), COVERT (rank 1; for a sub-faction against a rival inside one's own power, keep a lock without being identified; 6,000–14,000). They are issued in the name of a sub-faction and reported at any port of the power. [U 2026-10-22]: "the mission logs should be only military level missions, like HVT destruction or intelligence gathering, or defense of a point of control".

**What does not exist in LONGHAUL:**

- Marines, enlisted military ranks, infantry, ground combat, power armour, base life, drills, dropships.
- The closest things: the ship crew's department ranks (`careers.js:74-82`). Arms (guns and security) runs **Rating → Able Rating → Leading Hand → Petty Officer → Chief Petty Officer**. Helm runs Cadet Pilot → Third Mate → Second Mate → First Mate → Master Pilot. Engine room: Wiper → Engine Hand → Third Engineer → Second Engineer → Chief Engineer. Medical: Orderly → Medic → Senior Medic → Ship's Doctor → Chief Surgeon. Science: Technician → … → Chief Scientist. Galley: Mess Hand → … → Chief Steward. Deck: Deckhand → Able Spacer → Leading Spacer → Bosun's Mate → Bosun. These are merchant and naval ratings for a ship's company, not marine ranks.
- Boarding (`boarding.js`): parties of crew muster, cross by collar (2 min) or EVA (2 km at 2 m/s), breach (EVA 10 min, collar 6 min) and fight minute by minute. Resistance by category is military 100% fighting at quality 0.75, authority 85% at 0.6, irregular 90% at 0.55, civilian 30% at 0.3. Boarding a station "is a marine operation: not yet".
- Canon reference [C]: the MCRN fields Marines (Bobbie Draper, a Gunnery Sergeant, serves in Martian Marine power armour on Ganymede). OLYMPUS's Marine ranks, unit names and insignia are new content. They should sit beside the MCRN officer ladder above, so that naval officers aboard ship are Ensign through Rear Admiral, and use Martian vocabulary (§7.5) for unit names. (Open question for the user: the Corps' name, its rank set, and how far to follow real US/UK Marine practice or canon.)

---

## 15. Law, contraband, arms (`js/sim/law.js`, `docs/WORLD.md` §Law)

- Per power: standing (−100 to 100) and a wanted level, **CLEAN / SUSPECT / WANTED / HOSTILE** (`WANTED_LABEL`). Severity: fired on 1, disabled 2, destroyed 3, +1 if the victim is military or police; 10 standing per severity point. Wanted levels fade one step per 10 quiet days. Unpaid fines turn into SUSPECT after 7 days.
- **Munitions** ("Small arms, PDC rounds, warheads' components", base 21,000 MCR/t, restricted) are legal aboard outside Earth's and Mars's space, and there only with that power's license (`munitionsLegal`, `law.js:227`). Nuclear warheads are illegal in UN and MCR space without that power's license. Narcotics are contraband everywhere a power's law runs (only Vesta Depot and Ganymede trade them).
- For OLYMPUS this means Mars is a strict, weapons-controlled society. Civilians in MCR space don't carry munitions unlicensed, and a marine's weapons are state property.

**Physiology hooks that touch the setting** (`crew.js:11`, `docs/SHIPBOARD.md` §People; details are another slice's): G thresholds are micro-G under 0.01 G, comfortable 0.3, standard 1.0, strain over 1.5, injury unsecured over 2.5, crushing at 8. Juice [C] in a secure seat over 1.5 G: the standard dose makes 3 G feel like 1 G and leaves a hangover of up to 3 days (×0.85 work). A high dose over 6 G (4.5× protection) means a stroke risk and a crash of 6–10 days at ×0.6. [U 2026-10-19]: "juice consumes way too much medicine on high burns, there should be a steep cost in terms of aftereffects, but the dosage shouldn't be that high." Hospitals at Ceres, Tycho, Luna and **Phobos** handle brain injuries. Clinics at Pallas, Vesta, Hygiea, Ganymede and command-ship sick bays do the rest.

---

## 16. Naming generators (`js/sim/names.js`, 1,255 lines; `careers.js`; `crew.js`)

**Ships.** A name is a weighted pattern filled from word lists chosen by **culture** (UN, MCR, OPA, IND), **trade** (prospector, courier, shuttle, freighter, hauler, tanker, liner, barge: each `KIND` has `adjK`, `nounK`, `phraseK`), **sub-faction** (corporate codes LKC, HAD, GAC and BSS on about 40% of a corporation's big hulls; Pur'n'Kleen's whimsical "Pur'n'Kleen {whimAdj} {whimNoun}" on 60% of its haulers, after the *Weeping Somnambulist*; flavour sets for Ganymede farms, the Vesta co-op, the Belt unions, Tycho's machinists and the CFB's slogans; each pirate clan its own legend) and **service**. Navies are prefixed `NAVY_PREFIX = { UN: 'UNN', MCR: 'MCRN' }`. OPA warships carry bare Belter names. Police carry UNS, MSS, SH or "Patrol" plus a virtue and often a number. Intelligence hulls (EID, MNI) fly under plain civilian names. Pirates never announce themselves.

- Civilian pools hold 0.7–1.5 million effective names each (`nameEntropy()`). A runtime-only **registry** (a WeakMap keyed by state, never saved) makes repeats impossible. On a clash the generator rerolls ten times, then numbers the name in its own style: "Ceres Dawn II", "UNN Ravi (FFG-214)", "SH Vigilant 31". Hull codes: PC corvette, FFG frigate, DDG destroyer, BB battleship, PG gunship, WPC cutter, PR raider. A wreck keeps its name plus " (wreck)".
- MCRN patterns (`names.js:877`): light hulls `[8 marsPlace] [6 founder] [5 wind] [6 weapon] [6 war] [26 marsPlace martial] [16 given founder] [3 lawgiver] [14 martial of marsPlace]`; capital hulls `[12 war] [8 marsPlace] [26 martial of marsPlace] [6 lawgiver] [8 founder] [5 wind] [16 marsPlace martial] [10 given founder]`. Navies use only one-word Martian places.
- **Sample output** (my run): MCRN light: *MCRN Walter Valcourt, MCRN Defiance of Firstlight, MCRN Herald of Deuteronilus, MCRN Mangala, MCRN Navarch, MCRN Zubrin, MCRN Halloran*. MCRN capital: *MCRN Bellona, MCRN Vanguard of Amenthes, MCRN Sargon, MCRN Herald of Erebus*. MSS: *MSS Defender 74, MSS Iron Shield, MSS Rectitude 43, MSS Unblinking Lookout, MSS Noctis Watch*. Martian freighters: *Sweet Light of Hesperia, Canyon Endurance, Tolerance Consignment, HAD Bargain Rover of Ochre Basin*. UNN: *UNN Heart of Damascus, UNN Elcano, UNN Kalahari*. OPA navy: *Kopeng Torch, Unpaid Rockfall, Johansson's Hailstorm, Low Ceres Toll*. Hungry Dark: *Famished Hyena, Hungry Maw, Lurking Throat*.
- The user [U 2026-10-22]: "we should massively improve ship name generation, currently ships are all named the same, I want entropy in such a way that almost no two ships are ever going to be named the same." [U 2026-10-24]: "Ship names should display 'MCRN' or 'UNN' before the name we chose if we are flying a navy ship legally."
- Lang Belta, used with care (`names.js:296-308`) [C vocabulary]. Adjectives: Sabaka, Mali, Gut, Xidawang, Beltalowda, Kopeng, Nating. Nouns: Kopeng, Beratna, Sésata, Pampa, Bosmang, Beltalowda, Inyalowda, Xidawang, Imalowda, Nating, Taki, Sabaka. Kin: Beratna, Sésata, Kopeng, Bosmang, Mali. Phrases: Beratna Pampa, Mi Imalowda, Ke Rock Tu, Taki Beratna, Nating Kaka, Oye Inyalowda… "The crude words live only in the fixed phrases, where they land as jokes and not as accidents."
- UNN people names (`UN_PERSON`, 171) include canon UNN ships [C]: Agatha King, Seung Un, Thomas Prince, Ravi, Okimbo. OPA heroes (`OPA_HERO`): Guy Molinari, Connaught, Behemoth Ghost, Lady Kali, Dawn Bringer, Free Belt, Tycho's Answer, Ceres Remembers. "Behemoth" is [C]; the rest are [C?] or [L].

**People.** There are two separate systems.

1. `names.js` `GIVEN` (344) × `FAMILY` (387), "one melting pot for the whole system: Belters, Martians and Earthers all descend from everywhere", about 133k combinations, plus titles (`TITLE`: Captain, Old, Auntie, Doc, Skipper, Chief…; `TITLE_FULL`). These are used inside ship names.
2. Crew (`careers.js:93-107` given names **by home**: Earth 40, Mars 36, Belt 36, Luna 30, Jovian 30, Saturnian 30; Belt names include canon nods: Naomi, Camina, Diogo, Anton). Surnames come from `crew.js:49` `SURNAMES`, a mixed pool of about 120 drawn without repeats. The captain's name is the player's own.

For OLYMPUS NPCs: draw given names by home world (careers lists, which need widening), and surnames from `FAMILY` plus, for Martians, `MARS_FOUNDER` as an old-family flavour. Use `GIVEN`/`FAMILY` as the system-wide melting pot. Keep a registry so permanent NPCs never share a full name.

---

## 17. People's lives, careers, money (`careers.js`, `docs/SHIPBOARD.md` §Careers, `ground.js`)

- Age by role at sign-on: Captain 32–52, Pilot 23–50, Engineer 24–52, Medic 26–54, Scientist 25–52, Gunner 21–45, Security 21–46, Mechanic 21–48, Cook 19–50, Deckhand 18–38. Past 50, piloting and security drift down 0.3 a year (×2 past 65). Natural death follows a Gompertz hazard, **0.00005 · e^(0.095·age) per year** (1 in 1,700 at 30, 1 in 75 at 60, 1 in 26 at 70), checked daily. Retirement age is drawn from 58–70. A birthday is +4 morale.
- Promotion wants XP `[0,150,450,1100,2400]` (an hour of real work is a point) and department skill `[0,40,55,70,82]`. When due, the captain promotes (+12 morale); passed over for 30 days, morale sinks to −10.
- Wages a month (**MCR**): `[150, 210, 290, 400, 560]` by rank, × role (pilot and engineer 1.2, medic 1.15, scientist 1.1, cook 0.85, deckhand 0.8), paid every 30 days. Owed back pay weighs up to −20 morale. Cabin fever runs from 21 days without leave (−0.4 a day to −15). Leave: station +8, world +15, home +20, an errand ashore +6. Someone under 15 morale for 7 days quits. Records keep the last 12 entries; the memorial and alumni lists keep 40.
- **The currency is written "MCR"** everywhere (prices, wages, fines: "1,800 MCR", "60 MCR a head"). It is never defined, and it collides with the faction id MCR (Martian Congressional Republic). Scale: a hand's month is 150–560 MCR, ice 260/t, leave 60/head, an academy course 400, neural surgery 2,500, an HE torpedo 1,800, a nuke 6,000, a PDC round 0.05. (Open question: does OLYMPUS keep "MCR" as a system-wide credit, or does Mars have its own money?)
- The user's direction for depth [U 2026-10-25]: "add more depth to crew (rank, experience, progression, death, age, retirement etc)… take your time." For NPCs with lives [U 2026-10-20]: "there should be consistent crew numbers for each ship type… we don't magically know how many crew they have use the same logic you do for other ship info with manifests etc."

**Economy** (`goods.js`, `market.js`): 14 goods with base MCR/t: water ice 260, volatiles 650, ore 160, refined metals 1,300, PGM 19,000, food 950, delicacies 7,500 ("Real coffee, fresh fruit, wine, meat that walked: grown under domes or on Earth"), medical 14,000, pharmaceuticals 32,000 ("anti-radiation, bone-density, the expensive kind"), machine parts 5,200, electronics 17,000, consumer goods 3,200, munitions 21,000, narcotics 42,000. 15 markets. Mars (depth 4) makes electronics 3, parts 6, munitions 2 and pharma 0.3 t/day, and wants water 200, volatiles 80, food 40, PGM 0.5, delicacies 2 and consumer goods 10. Prices run base × (stock/target)^−1.1, clamped to 0.35–3.2. Shocks ("strikes, blights and booms") come at 3% per market per day. This background economy can drive mess-hall food quality, ration shortages and so on in OLYMPUS without being rendered.

---

## 18. Canon versus invention ledger (summary)

| Item | Status |
|---|---|
| UN / MCR / MCRN / OPA, Star Helix, Tycho Station, Ceres Station, Earth 30 billion, Ganymede breadbasket and Earth–Mars clash there, Callisto as a Martian base [C?], Pur'n'Kleen and *Weeping Somnambulist*, Canterbury, Lang Belta vocabulary, juice, PDCs, torpedoes, railguns, *Agatha King*, *Thomas Prince*, *Seung Un*, *Okimbo*, *Ravi*, *Donnager*, *Scirocco*, *Behemoth*, Londres Nova, Mariner Valley, Bobbie/Naomi/Camina/Diogo name nods | [C] |
| Earth–Mars never friends, oscillating cold war, crisis and war, with proxies | [U 2026-10-22] (canon-compatible) |
| Sub-faction coalitions; independents with no top | [U 2026-10-22]. All names (EID, APC, LKC, MNI, CUC, HAD, Tycho Council, CFB, Belt Unions, GAC, VMC, FTG, BSS, the four clans) are [L], except Star Helix and Pur'n'Kleen [C] |
| TL tiers; Mars best and dearest; Earth middling and old; Belt jury-rigged | [U 2026-10-19] |
| UNN many weaker hulls, MCRN few better, equal total strength | [U 2026-10-20] |
| Mars terraformed a little, breathable air | [U 2026-10-25] (diverges from canon). Composition, 52 kPa, the sea, the Hellas lake and lichen are [L] |
| Settled worlds limited to "expanse colonized" ones; Venus unsettled | [U 2026-10-25] |
| Light-lag fog of war, thousands of background ships | [U 2026-10-20] |
| Military license, contractor, flag, 1/10 personal offset, call-ups, supplies at 1/10, military-only missions, reputation and rank | [U 2026-10-22] |
| Command ships as FOBs | [U 2026-10-22] decision |
| MCRN prefix on a legally flown navy hull | [U 2026-10-24] |
| Near-unique ship names | [U 2026-10-22] |
| No hull atmosphere-rated, shuttles for every hull | [U 2026-10-20 / 2026-10-25] |
| Phobos Naval Yard on Phobos; Tycho round Juno; station populations; class names (Tharsis, Hellas, Valles, Olympus, Harrier, Danube, Everest, Atlas, Leviathan); OPA ranks Bosmang, Kapteng…; MCRN rank ladder; calendar start 2351-03-22; currency "MCR" | [L] |

---

## 19. Gaps and inconsistencies OLYMPUS has to resolve

1. **Mars CO₂** (§7.2): 4.2 kPa at datum and 5–6 kPa in the lowlands is hypercapnic, which contradicts "breathable". It needs a decision before OLYMPUS models air.
2. **No sol clock** (§1). OLYMPUS needs one alongside the UTC date.
3. **No Marines** anywhere (§14). The Corps, ranks, insignia, bases, unit structure and dropships are all new.
4. **Fleet scale** (§13): 12 MCRN hulls is a sim budget, not a credible personnel base for a Marine career game.
5. **One Martian station**: there is no orbital barracks, no Deimos base and no surface base data. All Martian ground installations are new content and should take names from `MARS_PLACE`, the six airspaces, and the Mariner Valley institutes and Callisto MCRN base already mentioned.
6. **Currency "MCR"** is ambiguous with the faction.
7. **Planet positions are not real ephemerides**: fine for a game, but launch windows to Europa are the game's own.
8. **Europa's radiation** isn't quantified in LONGHAUL. Only Io's ("kills an unshielded crew in a day") and Jupiter's ("in hours near Io") are. OLYMPUS's health model will need a dose rate for the Europa surface (real-world estimates are of the order of several Sv a day unshielded, so peacekeepers live under ice or shielding).
9. **Europa ground control is OPA but the space is Martian.** Who exactly Martian peacekeepers answer to on the ground is undefined.
10. Martian sayings ("Breathe Easy Someday", "Someday Oceans") fit a less-terraformed Mars than the body facts describe. Keep both by reading the terraforming as "a little, still in progress".

---

## 20. Reuse assessment (setting and content modules)

Every LONGHAUL sim module is a pure ES module with no DOM and no dependencies. I imported `factions.js`, `ephemeris.js`, `ship-classes.js` and `names.js` straight into Node to produce the tables above, so the data can be lifted with little effort. A copy-in should keep each module's header style ("every module opens with a header block explaining the model in prose", `CLAUDE.md`).

| Module | Verdict | Why |
|---|---|---|
| `js/core/rng.js` (67 lines) | **reuse as-is** | mulberry32 `seedRandom`, plus `seedOf`/`nextOf` side streams (the careers' own stream). Every sim randomness goes through it, which makes tests deterministic. Fits OLYMPUS's test and promotion workflow |
| `js/core/constants.js` | reuse as-is | AU_M, GM_SUN, G0, DAY_MIN, units in names |
| `js/core/clock.js` | **adapt** | Keep the minute counter and UTC calendar (start 2351-03-22). Add a sol clock for Mars (24.6597 h) and local time per world through `solarDayH` |
| `js/sim/ephemeris.js` (180) | **reuse as-is** | Bodies, radii, GM, turns, atmospheres. Analytic, cached, cheap. Needed for travel times, telescope views and tactical maps at the solar scale, and keeps positions identical to LONGHAUL. Only Mars' atmo composition is elsewhere |
| `js/sim/bodyfacts.js` (111) | **reuse as-is** (fix Mars CO₂ if the user agrees) | Pure reference data and library text, already in the setting's voice |
| `js/sim/factions.js` (231) | **reuse as-is** | FACTIONS, SUBFACTIONS, colours, influence field and `controlAt`. OLYMPUS's strategic layer (who holds the space where a deployment goes) can run on it unchanged. Possibly add Marine and Army formations as non-political sub-units |
| `js/sim/politics.js` (373) | **adapt** | The relations, pressure, exhaustion, feud and proxy model is cheap (daily, a few numbers) and is exactly the "background world" the user wants, generating news and drivers for deployments. Swap `intel.relay` (light-lag news) for OLYMPUS's news bus, or port `intel.js`'s relay too |
| `js/sim/conflict.js` (606) | **adapt the zone logic, skip the director** | `ZONE_KINDS` and `zoneCandidates`/`frontCandidate`/the insurgency rule are what make a Europa insurgency appear. The encounter director and agent spawning are ship-captain specific. Ground and boarding "zones" for OLYMPUS would hang off the same zone records |
| `js/sim/forces.js` (781) | reference only | Navy berthing, yards, command ships and the wake window are tied to ship agents on rails. Keep the numbers (NAVY_STRENGTH, BUILD_DAYS, COMMAND_SHIPS) as setting data. If OLYMPUS fights ships in space, it may revisit this |
| `js/sim/service.js` (378) | reference only, plus data | The contractor and flag mechanic doesn't fit an enlisted marine. Reuse the `RANKS.MCR` naval officer ladder as data for NPC naval officers, and the `effectiveRelation` idea for how others see a Martian in uniform |
| `js/sim/military.js` (416) | reference only | Mission structure (issued by a sub-faction, rank-gated, reported at a port, pay × rank factor) is a good template for OLYMPUS's orders. The content (sensor locks, holding a point in space) is ship-scale |
| `js/sim/careers.js` (365) | **adapt** | Ages, Gompertz deaths, homes and home names, XP plus skill promotion, wages and back pay, cabin fever, leave, records, memorial, retirement are all directly useful for permanent NPCs and the player's own career. Replace the department ranks with Marine and Navy enlisted ranks, and add home-world name lists for more homes |
| `js/sim/names.js` (1,255) | **reuse as-is for ships, adapt for people and places** | High-entropy, culture-aware, registry-unique. Martian vocabulary is ready for unit names, operations and callsigns. Add a `personName(culture, home)` and a Martian place generator on the same pattern machinery |
| `js/sim/ship-classes.js` (616) | **reuse data, adapt** | TECH, SIZES, BUILD and the 40 classes are the canonical hulls for ship combat and boarding (crew complements, brigs, collars, carried craft). Add a Martian TL4 military dropship (pinnace family) and troop berths on Tharsis and Hellas |
| `js/sim/hulls.js`, `ship-layout.js` | reference (another slice) | Box-module hulls and deck programs; top-down interiors may adapt the deck stacks |
| `js/sim/stations.js` (739) | reference / data | Station specs (population, defence, services, berths) are setting data. The 3D station-frame layouts and berth geometry are for docking flight; useful for a tactical top-down picture of Phobos Naval Yard, not for walkable interiors |
| `js/sim/worlds.js` (425) | **adapt (data and pure helpers)** | SETTLEMENTS, GROUND_CONTROL, AIRSPACE_NAMES, CONTROLLER_WORD, `atmosphere()`, `solarDayH`, `proceduralSite`. Drop `worldsTick`/`airDrag` (our-ship flight) |
| `js/sim/ground.js` (148) | reference | Academies, hospitals and halls by world. Reuse the facts (Mars: Mariner Valley institutes; Callisto: the MCRN base's range) |
| `js/sim/goods.js`, `market.js` | adapt (optional) | A closed background economy at four ticks a day. Useful for ration and supply realism and news shocks; not essential for 1.0 |
| `js/sim/dialogue.js` | reference | Voice register per faction (Martian clipped, UN reads back idents, Belter Lang Belta) |
| `js/sim/law.js` | reference | Wanted levels and contraband rules (munitions restricted in MCR space) |
| `ui/gl/town3d.js` STYLES, `ui/scope-sky.js` | reference | Mars palette (ground `[0.33,0.15,0.07]` ≈ `#542612`, dust 0.45, domes and tubes) for the pixel-art direction and the telescope look |

---

## 21. Recommendations to keep OLYMPUS consistent

- Start OLYMPUS in the same world state. Load or port `factions.js`, `politics.js` and `ephemeris.js` so the news a marine hears ("Budget fight: the MCRN Admiralty wins the vote against the Congressional Unity Caucus") comes from the same model the user knows from LONGHAUL.
- Put the Europa deployment inside a **zone record of kind `insurgency` (CFB against MCR) or `standoff` (MCR against UN)** at Europa, so its intensity, its end and its incidents follow the same politics.
- Use Callisto ("the MCRN's Jovian base", Naval Air Control, "the MCRN base's range") as the Jovian staging base. On Mars, set the Marine depot near an existing airspace and spaceport, e.g. Mariner Valley or Tharsis, using the established institutes.
- Give Marines a TL4 kit philosophy mirroring the ships: excellent, reliable, expensive to repair, needing proper parts.
- Name everything Martian from `MARS_PLACE`, `MARS_FOUNDER`, `MARS_WAR`, `MARS_WEAPON`, `MARS_WIND`, `MARTIAL` and `MARS_PHRASE`. Prefix MCRN hulls, and keep MSS as the police.
- Keep the user's hard-SF rules: no lasers; travel takes days to weeks; light lag limits information; no atmosphere-rated hulls except carried craft; realistic sizes; box hulls; G-load physiology with juice and its after-effects.
