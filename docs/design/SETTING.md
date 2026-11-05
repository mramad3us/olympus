# SETTING: the world of 2351, for a Martian marine

Written 2026-11-05 from [DESIGN.md](../DESIGN.md) (the hub, which wins on any conflict) and the research notes `longhaul-setting.md`, `longhaul-physics.md`, `longhaul-combat.md`, `longhaul-shipboard.md` and `tradecraft-design-1.md`. Numbers marked "computed" come from scratch scripts that import LONGHAUL's pure modules read-only (`js/sim/ephemeris.js`, `js/sim/worlds.js`, `js/core/constants.js`, and for the contract patch `js/sim/planetary.js`, `js/sim/lambert.js` and `js/sim/stations.js`); none of those projects was modified. Revised 2026-11-05 by the contract patch, which applies the five critics' findings for this section (1.4 lists what it settles).

## 0. Summary

OLYMPUS plays in LONGHAUL's solar system, nine months after LONGHAUL's own opening. The world's state at new game is LONGHAUL's start state (2351-03-22 08:00 UTC) rolled forward as outcomes to **Monday, Sol 590 of Mars Year 211 (5 Patience), 12:40 Melas time, which is 2351-12-19 02:20 UTC**. On that day Mars and Jupiter are 5.73 AU apart and closing, near their 30-year median of 5.48 AU: a troopship takes **7.4 days at 1 G or 13.5 days at 0.3 G** to the Jovian moons (the Alert Battalion flies out at 1 G, section 6.5), and a message takes **48 minutes**.

Mars is LONGHAUL's terraformed Mars with the hub's honest air: 66 kPa and a sea-level breath on the floor of the Mariner Valley, a 2,000 m breath at the datum, the death zone on Olympus. The Martian Congressional Republic is earnest, precise, short of hulls and proud of them. Its **MCRN Marine Corps** is a 53,000-strong volunteer force of shipboard detachments, boarding teams and expeditionary infantry that trains at 1 G to fight Earthers. The player's battalion, 2nd Battalion 4th Marines, lives at **Marine Corps Base Melas** on the canyon floor, 18 km from the open-air town of **Redwater**, and holds the Corps' Alert Battalion watch when the game opens.

The Jovian theatre is Martian space contested by Earth. Europa's three million people live in nine towns 200 to 2,900 m under ice that takes 5.4 Sv a day at the surface. Since the **Jovian Accord** (signed at Conamara on 2351-09-03), a Martian Stabilisation Force guards the water and power works, under the civil authority of the OPA's Ice Control, between the miners' unions, corporate security, Ceres Free Belt cells and a watching UN observer mission. The force is 980 short of its 2,400 cap when the game opens: 2/4, at its deployed strength of 980, is the battalion that fills it.

This section gives the facts, the names, the lore and the data. TIME turns the calendar into clocks, PLACES turns the places into maps, PEOPLE and CAREER turn the Corps into people and careers.

---

## 1. Conventions, sources and canon

### 1.1 Provenance tags

- **[U date]**: the user's own decision (dated, from the research notes' attributions).
- **[D]**: settled in DESIGN.md (the hub, 2026-11-05).
- **[L]**: LONGHAUL's content, shipped there without objection; kept.
- **[C]**: an Expanse canon term kept, flagged (section 1.2).
- **(my call)**: decided here; holds until the user overrides it.

### 1.2 The canon ledger

The user's rule for this section: avoid canon characters, units and ship names, and flag any canon term kept.

| Kept [C] | Why |
|---|---|
| UN, UNN, MCR, MCRN, OPA, Belters, Lang Belta vocabulary, Star Helix Security, Tycho Station, Ceres Station, Pur'n'Kleen Water, juice, PDCs, the Epstein drive, Ganymede as the outer planets' breadbasket, Martian marines as such | LONGHAUL's world uses them [L]; the hub inherits LONGHAUL [D] |
| Londres Nova (as the Republic's capital) | in LONGHAUL's `MARS_PLACE`; a place, not a character |
| "Mariner Valley" | LONGHAUL's airspace name and the English for Valles Marineris |

| Not used (my call) | Instead |
|---|---|
| Every canon character, their full names and their distinctive surnames for tier 1 and 2 people | the blocklist in section 12.6 |
| Canon ships (Donnager, Scirocco, Rocinante, Canterbury, Agatha King, Behemoth...) | LONGHAUL's generator minus its canon entries (12.6). LONGHAUL's default entities *MCRN Scirocco*, *Agatha King* and *Weeping Somnambulist* are not spawned in OLYMPUS |
| Canon units, canon powered armour names, canon events (Eros, the protomolecule, the canon Ganymede incident) | this world's own history (5.1); this world has no protomolecule, as LONGHAUL has none |
| "Innis Shallow" (canon-ish) | not used |
| LONGHAUL's Martian given name "Bobbie" and Belter "Camina", "Sadavir", "Naomi", "Diogo" | dropped from the pools (canon nods) |

The real-world US Marine Corps lends its rank model [D], its MOS numbering where an equivalent exists (5.6, following CAREER's working list), its general orders (adapted, 5.8) and its customs. Those are public military practice, not canon.

### 1.3 What this section owns, and its data

SETTING owns world facts and lore, the Corps' organisation, ranks and insignia, the MOS list, uniforms and customs, places' lore (not their maps), factions' faces, the Europa situation, names pools, the calendar's definitions and the start date. Everything here is plain data in **`src/data/setting/`** (TECH §1.3, correction 11: TECH owns the layout, and many domains and the UI read these tables), one module per table, each a frozen literal with no logic beyond tiny pure helpers (TECH §2), each opening with a prose header:

```
setting/calendar.js     constants and month/week names (TIME does the arithmetic)
setting/world.js        the prologue's fixtures, the Europa timeline, public figures
setting/mars.js         air table, climate, places lore, homes
setting/corps.js        ranks, insignia, MOS, units, bases, uniforms, customs, slang, awards
setting/hulls.js        troop berths for LONGHAUL's MCRN classes (a column beside TECH's src/data/hulls.js), the transport, the landers
setting/jovian.js       Callisto, Europa's towns, radiation table, the ice's creep constants, the Accord's clauses
setting/theatres.js     the special-operations theatres, spin gravity where LONGHAUL spins things
setting/faces.js        faction faces
setting/news.js         outlets, voices, templates
setting/prices.js       the price list
setting/names.js        name pools by culture, patterns, nicknames, callsigns, blocklist
```

Units are carried in field names (`altitudeM`, `pressureKPa`, `doseSvPerDay`, `depthM`, `populationN`, `priceMcr`).

### 1.4 Names, numbers and doctrine settled for the other sections (the contract patch)

SETTING owns names and doctrine; the disagreements ROADMAP §3.4 left open are settled here, before any deck template, town template, golden hash or fixture carries a working name into a save (a `template@1` is forever). The owners rename their templates and ids to these in their next change; ids follow the settled names (`coprates`, `simoom`, `haboob`, `fob-pwyll` and the like; PLACES chooses the form). All my calls, which the user may overrule.

| Working name or value | Where | Settled | Here |
|---|---|---|---|
| "Noctis class" troop transport | PLACES §5.2 | the **Coprates-class assault transport**; the player's first ride is **MCRN *Testudo* (AP-33)**. SETTING adopts PLACES's hull (260 m, 68,000 t, 1,056 troop racks, crew 90) | 6.3 |
| D-16 drop ship | PLACES §5.5 | the **Simoom-class assault lander** ("the brick", 44 couches) | 6.4 |
| L-60 heavy lander | PLACES §5.5 | the **Haboob-class heavy lander** (PLACES's design, named here) | 6.4 |
| the transport's cruise of 0.38 G; TIME's default voyage of 0.38 G | PLACES §5.2, TIME §12.5 and §20 question 5 | MCRN doctrine: the Alert Battalion and every urgent or wartime movement **out at 1 G**; the homeward leg after a low-g tour **at 0.3 G**; routine rotations at Mars-normal 0.38 G | 6.5 |
| "FOB Conamara" | PLACES §7.5 | **FOB Pwyll**, 2/4's base beside the Pwyll spaceport, in the **Pwyll** airspace (2/4's sector: Pwyll Deep, the Tyre Works, Manannán). Conamara holds MSF-E's headquarters, **Camp Halloran**, and 1/7 | 7.4, 7.7 |
| "Conamara Shaft", "Thera Gallery", "Pwyll Berm" | PLACES §7.2 to §7.4 | these are town *kinds*, not towns: a shaft district (in 2/4's sector, the head of Pwyll Deep's main shaft), a gallery district (Thera Lens), a berm camp (a rig). Their instances take the names of 7.4 | 7.4 |
| "MCRN Base Callisto" | PLACES §6 | **Camp Lofn**, the Corps' camp (the Transit, the Spin, the Flats); the Navy's base and Jovian Command are **Naval Station Valhalla**, 12 km off; the dome town at the end of the tunnel is **Valhalla Town** | 7.2 |
| the start date: LONGHAUL's epoch, 2351-03-22 | CAREER §5.1 | **Monday, Sol 590 of MY 211, 12:40 Melas time, 2351-12-19 02:20 UTC** | 3.7 |
| the close-combat programme: "MCMAP" and SETTING's "Corps Close Combat Program" | SKILLS §6.6, CAREER §9.2, PEOPLE, ROADMAP | the **Marine Corps Martial Arts Programme (MCMAP)**; belt keys spelt `grey` | 5.5 |
| boot: "twelve weeks" against 13 | SETTING §5.4, SKILLS §6.6, CAREER §4.2 | **13 weeks** at Argyre | 5.4 |
| the light vac suit: a counter-pressure skin against a gas-pressurised suit | SETTING §5.7, BODY §19 | a **soft pressure suit at 34 kPa O₂** under a clip-on hard shell; BODY §19 holds its numbers and its one donning table | 5.7 |
| the frigate's marine detachment: 13 against 15 | SETTING §6.2, PLACES §5.3 | **15**: a gunnery sergeant, a squad of 13, a corpsman; about 800 afloat | 6.2 |
| the credit's worth and the prices: US$12 and 170 MCR against US$14.5 and 145; two price lists | SETTING §11, CAREER §12.1, §12.2, §12.7 | CAREER's scale (**1 MCR ≈ US$14.5, a Private 145 MCR**) and **one price list**, SETTING's | 11 |
| the levy: 12% against "air and water levy 1%" | SETTING §4.10, CAREER §12.4 | one name, **the terraforming levy**: 12% for civilians, 1% for service members | 4.10 |
| the arms makers and HAD's works (Dustfall, Ophir, "Hellas") | SETTING §4.10, WEAPONS §3.1, SKILLS §10.2 | **WEAPONS §3.1's makers**; HAD's small arms at **Ophir Chasma**, its drives and suits at Dustfall | 4.10 |
| Ceres Station's spin, asked for and not given | PLACES §8, CAREER §4.3, §10.2, §11.3 | **0.30 G at the rim of 450 m drums** (ω 0.0809 rad/s), 0.301 G with Ceres' pull | 8.1 |
| the Commandant's name against the squad examples' Okonjo | SETTING §7.7, CAREER §5.3, PEOPLE §14.4, §18 | the Commandant is **General Halima Strand**; public figures' family names are kept off tier 1–2 | 7.7, 12.6 |
| the towns' air: "Ice standard" against Belter town standard | SETTING §7.3, PLACES §3.2, §7.1 | **PLACES's Belter town standard** (55 kPa) | 7.3 |

---

## 2. The world in 2351

### 2.1 The powers at the start

The world is LONGHAUL's [D]: three powers that never make peace, the independents and four pirate clans.

- **UN** (Earth and Luna, thirty billion people): many older TL2 hulls (56 warships plus 3 Leviathan battleships), the oldest navy and most of the money. Sub-factions: UNN Fleet Command, the Earth Intelligence Directorate (EID), the Assembly Peace Caucus, Luna-Kepler Consolidated (LKC), UN Security.
- **MCR** (Mars, four billion): the best hulls in the system and the fewest, TL4 naval and TL3 civil [U 2026-10-19]; 12 warships and 3 Olympus-class battleships, equal in total strength to the UNN [U 2026-10-20]. Sub-factions: the MCRN Admiralty (hawk, influence 0.35), Martian Naval Intelligence (MNI, covert, 0.15), the Congressional Unity Caucus (CUC, dove, 0.30, "Terraforming first: every hull the navy builds is a century more under the domes"), Hecate Arms & Drive (HAD, profit, 0.20), Martian Security (MSS, police). The Corps sits under the Admiralty and has no sub-faction of its own (my call, as LONGHAUL).
- **OPA** (the Belt and the outer moons): Tycho Council, the Ceres Free Belt (CFB), the Belt Unions, Star Helix Security [C].
- **Independents**: the Ganymede Agricultural Concord, the Vesta Miners' Cooperative, the Free Traders' Guild, Pur'n'Kleen [C], Brannock Security Services (BSS, mercenaries).
- **Pirate clans**: Rust Queens, Hungry Dark (lairs at Jupiter, Callisto, Europa), Knife Season, Ghost Belt.

Relations follow LONGHAUL's `politics.js`: Earth and Mars are capped at −25 ("Earth and Mars are never friends") and swing between cold war, crisis and short wars, using proxies [U 2026-10-22]. Measured in LONGHAUL over two years: about 40% of days in cold war, 45% in crisis, 15% at war.

Control at start (LONGHAUL's `controlAt`, unchanged by the prologue because the Jovian moons move with Jupiter): Mars 1.00 MCR; Europa and Ganymede MCR 0.66, contested by the UN at 0.40, with OPA influence 0.30, over LONGHAUL's insurgency threshold of 0.2; Callisto MCR 0.66, uncontested.

### 2.2 The hard-SF rules (inherited)

No lasers and nothing that glows [U 2026-10-19]: kinetic and nuclear weapons only. Knowledge travels at light speed and anything beyond a ship's sensors is a report with an age [U 2026-10-20]. Hulls are practical boxes [U 2026-10-20], sized realistically, and **no hull is rated for atmosphere except carried craft** [U 2026-10-25]. Juice lets a strapped-in body take hard burns, and charges a hangover for it [C, U 2026-10-19]. Medicine is good (autodocs, neural surgery at full hospitals) but not magic. There is no strong AI: ships and suits have computers, people decide.

Corrections to LONGHAUL's library text for OLYMPUS (my call, following the hub's air):

- Mars' air is N₂ 65.4, O₂ 32, Ar 2, CO₂ 0.6 % [D], not LONGHAUL's 8% CO₂.
- "The domes keep out the radiation" becomes "the domes keep in the pressure and the warmth": at 52 kPa the air column is 1,395 g/cm², thicker than Earth's 1,033, so radiation is no longer why Martians live under glass (section 4.3).

### 2.3 The prologue: from LONGHAUL's epoch to the start

The new game rolls LONGHAUL's world from its epoch (2351-03-22 08:00 UTC) to the start (2351-12-19 02:20 UTC), **271.76 days**, as outcomes: politics daily, zones and forces hourly, news relayed and archived (TECH runs it; LONGHAUL simulates a year of this in seconds). The roll is seeded per career, so each world's 2351 differs, with three constraints (my call):

1. MCR–UN relation is held above −70 (no war before the start; crises allowed).
2. Two zones are pinned at Europa from 2351-06-01: an `insurgency` (CFB against MCR) and a `standoff` (UN against MCR). They stay until the Accord ends.
3. The authored Europa timeline (7.7) is injected as fixed incidents and headlines on their dates, so every career's archive tells the same Europa story inside a different system year.

The archive is the recruit's last nine months of news: what they read at Argyre and Camp Ius (section 10).

### 2.4 Distances and transit times at the start (computed)

LONGHAUL's ephemeris, analytic constant-G brachistochrones `t = 2√(d/a)` against the moving target (Jupiter's moons ride with Jupiter), with LONGHAUL's measured flight overhead of +8% (flip, departure, terminal approach) applied in the "flown" column. Light time 499.0 s per AU.

| Moment (UTC) | Mars–Jupiter | Light time | 1 G (analytic / flown) | 0.3 G (analytic / flown) | Peak speed at 1 G |
|---|---|---|---|---|---|
| Start, 2351-12-19 02:20 | 5.734 AU | 47.7 min | 6.86 / **7.41 d** | 12.52 / **13.52 d** | 2,907 km/s |
| +7 sols, 2351-12-26 | 5.658 AU | 47.1 min | 6.80 / 7.35 d | 12.44 / 13.44 d | 2,882 km/s |
| +12 sols, 2351-12-31 (default departure) | 5.603 AU | 46.6 min | 6.77 / **7.32 d** | 12.40 / **13.39 d** | 2,870 km/s |
| +21 sols, 2352-01-09 | 5.502 AU | 45.8 min | 6.71 / 7.25 d | 12.26 / 13.24 d | 2,845 km/s |

For scale (computed): over 2351 the distance rises from 6.41 AU at LONGHAUL's epoch to its maximum, 6.73 AU, at the end of June, then falls to 5.73 AU at the start; it reaches its minimum, 3.68 AU, in early August 2352. The 30-year median is 5.48 AU. The start therefore sits on an ordinary, closing distance.

Other light times at the start: Mars–Earth 2.319 AU, **19.3 min**; Mars–Ceres 2.800 AU, 23.3 min. Between the Jovian moons: Callisto to Europa 1.21–2.55 million km, **6.2–9.0 h at 1 G**, 11.3–16.4 h at 0.3 G (computed over 20 days from the start).

Why late 2351 (my call): LONGHAUL's own epoch has Mars–Jupiter at 6.41 AU and growing for three months; a December start puts the first deployment on a median, closing geometry, gives the world nine months of real news history, and the UTC new year falls on the departure day.

---

## 3. The calendar and the start date

TIME owns the clock maths and the display (`marsLocal`, the timeslip, formatting). SETTING owns the definitions below. Where TIME's draft defaults differ, these replace them (noted).

### 3.1 Time bases

- **UTC** is the system's time: powers, the Navy, ships, Phobos, Callisto, Europa's towns, orders, pay, the news [D]. TT − UTC is frozen at 69.184 s (TIME's call, kept).
- **Mars Sol Date** (Allison & McEwen 2000, the Mars24 algorithm): MSD 0 began at the Airy-0 meridian on 1873-12-29, a Monday on Earth. Measured: MSD at LONGHAUL's epoch is 169,639.237. MTC is Coordinated Mars Time, the mean solar time at Airy-0.
- **Local civil time on Mars** is the mean solar time of a site's own meridian, in Earth-length hours with the 39 m 35 s timeslip (KSR's convention) centred on mean midnight (TIME 2.4). Base Melas and Redwater keep **Melas time** at 287.2°E (TIME's `lonMs` 70,822,917; this section places the base there, 3.6). The Republic has no time zones: towns name their meridian ("Melas time", "Londres time") and the Navy uses UTC (my call, matching TIME).

### 3.2 Seasons

- LONGHAUL flies Mars on a circle, so the solar longitude Ls advances uniformly: `Ls(ms) = (LS_EPOCH_DEG + 360 × ms / MARS_YEAR_MS) mod 360`, with `MARS_YEAR_MS = 59,373,085,632` (LONGHAUL's 687.1885-day period).
- **`LS_EPOCH_DEG = 174.0`** (my call, replacing TIME's draft 163.2). This is the real *mean* Ls at the epoch (the fictitious mean sun of Allison & McEwen, computed 173.96). LONGHAUL's Mars angle at the epoch (257.8°) is within 2° of real Mars' mean heliocentric longitude (259.1°, computed), so anchoring to the mean makes `Ls = λ_LONGHAUL − 83.9°`, close to the real relation (λ − Ls ≈ 85°). The planet on the system map and the season agree, and year boundaries track the real Mars Year count on average. Real Ls at the epoch is 163.2°, about 10.8° off because of the eccentricity LONGHAUL leaves out.
- Seasons are equal (167.2 sols each) because the orbit is circular. **Bent for play** (my call): the dust season keeps its real place in the year (Ls 180–330, southern spring and summer), although on a circle there is no perihelion to drive it. Real Mars' dust storms are its signature weather and the calendar should carry them.

### 3.3 The Mars Year and the sol of the year

- **Mars Years** follow the Clancy et al. (2000) count, MY 1 beginning 1955-04-11. The epoch lies in **MY 211**.
- A year begins at the instant `Ls = 0` (northern spring equinox). **Sol 1 of MY n is the Airy-0 sol (integer MSD) that contains that instant**, and that sol number is Sol 1 everywhere on Mars: a site's local sol index (TIME's `solIndex`) is compared against the same year boundaries (my call, replacing TIME's "first local sol after the instant", so a date means the same sol number planet-wide).
- Year lengths fall out of the ephemeris: 668 or 669 sols (668.80 on average), no leap rule to keep.

| Mars Year | Sol 1 (MSD) | Ls 0 instant (UTC) | Length (sols) |
|---|---|---|---|
| 211 | 169,315 | 2350-04-24 04:37 | 669 |
| 212 | 169,984 | 2352-03-11 09:08 | 669 |
| 213 | 170,653 | 2354-01-27 13:40 | 669 |
| 214 | 171,322 | 2355-12-15 18:11 | 669 |
| 215 | 171,991 | 2357-11-01 22:43 | 668 |
| 216 | 172,659 | 2359-09-20 03:14 | 669 |

The Corps and the Navy date by **Mars Year and sol of year** ("Sol 590, MY 211"), as militaries use ordinal dates; DESIGN's display "Sol 214 · 06:12" is this sol (VIEWS shows "Sol 590 · MY 211").

### 3.4 Months and weeks

Civilians, letters, posters and the news use the Republic's **civil calendar** (flavour, my call): 24 months of 28 sols, except months 6, 12 and 18 (27 sols) and month 24 (27 or 28, whatever ends the year). The structure follows Gangale's Darian calendar; the names are the Republic's own, adopted at the Charter in MY 125 and taken from the northern farm year, because the young sea, the farms and the first open-air towns are northern. Each quarter of six months is one season to within a sol.

| # | Month | First sol | Season (north / south) | Ls as it begins |
|---|---|---|---|---|
| 1 | Thaw | 1 | spring / autumn | 0 |
| 2 | Runoff | 29 | | 15 |
| 3 | Furrow | 57 | | 30 |
| 4 | Seedfall | 85 | | 45 |
| 5 | Sprout | 113 | | 60 |
| 6 | Rain | 141 | (27 sols) | 75 |
| 7 | Greening | 168 | summer / winter | 90 |
| 8 | Bloom | 196 | | 105 |
| 9 | Longlight | 224 | | 120 |
| 10 | Ripening | 252 | | 135 |
| 11 | Harvest | 280 | | 150 |
| 12 | Gleaning | 308 | (27 sols) | 165 |
| 13 | Threshing | 335 | autumn / spring; dust season opens | 180 |
| 14 | Dustrise | 363 | | 195 |
| 15 | Gale | 391 | | 210 |
| 16 | Frostfall | 419 | | 225 |
| 17 | Lamplight | 447 | | 240 |
| 18 | Mending | 475 | (27 sols) | 255 |
| 19 | Icecap | 502 | winter / summer | 270 |
| 20 | Deepcold | 530 | | 284 |
| 21 | Hearth | 558 | | 300 |
| 22 | Patience | 586 | | 315 |
| 23 | Reckoning | 614 | dust season closes | 330 |
| 24 | Vigil | 642 | (27 or 28 sols) | 345 |

Civil date format: "5 Patience 211". Abbreviations are the first three letters (all distinct).

**The week** is seven sols, Monday to Sunday (Martians kept Earth's names), counted continuously from MSD 0, which was a Monday: `weekday = solIndex mod 7`, 0 = Monday. That is TIME's default `WEEK_OFFSET = 0`, kept. Weeks do not align with months. PEOPLE's training week runs Monday to Friday with Saturday and Sunday the rest sols.

### 3.5 Holidays and observances

| Day | Sol | What | On base |
|---|---|---|---|
| New Year, 1 Thaw | 1 | the equinox; families plant seedlings | liberty; the Commandant's message read at formation |
| Rain Day, 1 Rain | 141 | the first recorded rain on Mars (MY 171, the Chryse coast) | half sol |
| Charter Day, 9 Longlight | 232 | the Congressional Charter (MY 125) | parade in dress oxbloods; liberty |
| **Corps Birthday, 19 Bloom** | **214** | the Corps raised (Sol 214, MY 126) | the cake cut with a sword; the oldest and youngest marine present; the Birthday Ball (section 5.8) |
| Levy Day, 1 Reckoning | 614 | the terraforming levy falls due | none |
| Muster of the Lost, 1 Vigil | 642 | the Corps' memorial roll call (5.8) | formation at the Grove; no liberty until noon |
| UTC holidays | | Earth-descended families keep Earth's festivals by UTC date (the UTC Christmas and New Year fall in the first two weeks of the game) | chaplains hold services; no change to the training schedule |

### 3.6 Time away from Mars

Every place off Mars keeps UTC [D]. TIME's table (2.6) of shifts and skies is used as written. Names for Europa's three shifts, as the towns say them (my call): **first shift** 06:00–14:00 "the morning", **swing** 14:00–22:00, **graveyard** 22:00–06:00 "the dark".

### 3.7 The start date

| Field | Value |
|---|---|
| Local sol index (Melas) | 169,904 |
| Martian date | Monday, **Sol 590, MY 211**; civil **5 Patience 211** |
| Arrival time | **12:40 Melas time** (CAREER's arrival after the noon meal) |
| UTC | **2351-12-19 02:20** (TIME's MSD constant decides the seconds) |
| Days since LONGHAUL's epoch | 271.76 |
| Season | Ls 316.4°: late southern summer at Melas, the tail of the dust season |
| Daylight at Melas (10.4°S) | 12.77 h; sunrise 05:37, sunset 18:23 civil; noon sun 83° up, a few degrees south of the zenith |
| Next New Year (MY 212, Sol 1, a Thursday) | 2352-03-09 18:27 UTC at Melas midnight: during the first deployment, about 81 days in |
| Next Corps Birthday (MY 212 Sol 214, a Sunday) | 2352-10-14 UTC |

CAREER's working default (LONGHAUL's epoch) is replaced by this date.

### 3.8 Data and test vectors

```js
// setting/calendar.js (constants only; TIME's time.js does the arithmetic)
export const LS_EPOCH_DEG = 174.0;
export const MARS_YEAR_MS = 59_373_085_632;
export const MY_AT_EPOCH = 211;
export const MY_SOL1_MSD = { 211: 169315 };     // later years: floor(MSD at each Ls-0 instant)
export const MONTHS = ['Thaw','Runoff','Furrow','Seedfall','Sprout','Rain','Greening','Bloom',
  'Longlight','Ripening','Harvest','Gleaning','Threshing','Dustrise','Gale','Frostfall',
  'Lamplight','Mending','Icecap','Deepcold','Hearth','Patience','Reckoning','Vigil'];
export const MONTH_SOLS = [28,28,28,28,28,27, 28,28,28,28,28,27, 28,28,28,28,28,27, 28,28,28,28,28,null];
export const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const WEEK_OFFSET = 0;                     // MSD 0 was a Monday
export const START = { solIndex: 169904, civil: '12:40', site: 'melas' };
export const SITES = { melas: { latDeg: -10.4, lonEDeg: 287.2, altitudeM: -4500 } };
```

Tests print and check (tolerance ±1 min on UTC, exact on sols): MSD at the epoch 169,639.237; Melas civil time at the epoch 00:31 (TIME measured 00:30:38 with its constant; the seconds follow TIME's MSD constant); the epoch's sol is a Wednesday (the Martian week; the UTC day is a Thursday), Sol 326 MY 211, 19 Gleaning, Ls 174.0; Sol 1 of MY 212 is MSD 169,984; MY 211–216 lengths 669, 669, 669, 669, 668, 669; the start is solIndex 169,904, Monday, Sol 590, 5 Patience, Ls 316.4, 2351-12-19 02:20 UTC; Melas daylight at Ls 316.4 is 12.77 h with sunrise 05:37; at Ls 90 it is 11.65 h (06:10–17:50), at Ls 270 13.01 h (05:30–18:30).

---

## 4. Mars for a marine

### 4.1 The planet

- **Gravity** 0.380 G (3.727 m/s²) [D]. A marine's 30 kg pack weighs what 11 kg does on Earth; a dropped magazine takes 0.73 s to fall 1 m (0.45 s on Earth).
- **The sol** is 24 h 39 m 35.244 s [D]. The timeslip is the dead of night, and the Corps' guard reliefs avoid it (PEOPLE).
- **The sky**: at 52–66 kPa the air scatters as Earth's does, so a clear morning sky is blue, paler than Earth's, with a pink-ochre band of dust at the horizon; dusty afternoons turn it salmon; sunsets have a blue glow round the sun (forward scattering by fine dust, as on real Mars). The sun is 0.35° across (two thirds of Earth's sun) and gives 590 W/m² at the top of the air.
- **Phobos** (0.2° across, a third of the Moon from Earth) rises in the west, crosses the sky in about 4¼ h and rises again 11 h later. The Naval Yard's lights show on its night side as a short bright scratch the valley calls "the Yard". **Deimos** is a bright slow star that takes about 2.7 sols to cross from east to west. Earth is an evening or morning star, blue-white. Jupiter is a bright cream point.

### 4.2 The air by altitude

`P = 52 kPa × e^(−h / 19 km)`, O₂ 32%, CO₂ 0.6% [D]; molar mass 29.6 g/mol; boiling point from Clausius–Clapeyron; the Earth altitude with the same O₂ partial pressure from the US standard atmosphere. Altitudes are game values (my call, near MOLA where known).

| Place | Altitude | Pressure | O₂ | CO₂ (sea-level ppm equivalent) | O₂ as on Earth at | Water boils at | Air density at −20 °C | Column |
|---|---|---|---|---|---|---|---|---|
| Low Hellas, the lake shore | −7.0 km | 75.2 kPa | 24.1 kPa | 0.45 kPa (4,450 ppm) | below sea level (−1.1 km) | 92 °C | 1.06 kg/m³ | 2,017 g/cm² |
| Coprates floor, Canal Town | −5.2 km | 68.4 | 21.9 | 0.41 (4,050) | sea level | 89 °C | 0.96 | 1,834 |
| Mariner Valley floor [D] | −5.0 km | 67.7 | 21.6 | 0.41 (4,010) | sea level | 89 °C | 0.95 | 1,815 |
| **Base Melas**; the northern sea's level | **−4.5 km** | **65.9** | **21.1** | 0.40 (3,900) | 100 m | **88 °C** | 0.93 | 1,768 |
| Redwater, on its fan | −4.3 km | 65.2 | 20.9 | 0.39 (3,860) | 100 m | 88 °C | 0.92 | 1,750 |
| Chryse coast, Ochre Basin | −3.8 km | 63.5 | 20.3 | 0.38 (3,760) | 400 m | 87 °C | 0.89 | 1,704 |
| Datum [D] | 0 | 52.0 | 16.6 | 0.31 (3,080) | 2,000 m | 82 °C | 0.73 | 1,395 |
| Highrim, the Melas south rim | +3.6 km | 43.0 | 13.8 | 0.26 (2,550) | 3,500 m | 77 °C | 0.61 | 1,154 |
| Sinai Planum, the high range | +4.0 km | 42.1 | 13.5 | 0.25 (2,500) | 3,700 m | 77 °C | 0.59 | 1,130 |
| Londres Nova, Syria Planum | +6.5 km | 36.9 | 11.8 | 0.22 (2,190) | 4,700 m | 73 °C | 0.52 | 991 |
| Tharsis domes [D] | +10 km | 30.7 | 9.8 | 0.18 (1,820) | 6,000 m | 69 °C | 0.43 | 824 |
| Pavonis Mons summit | +14.0 km | 24.9 | 8.0 | 0.15 | 7,500 m | 64 °C | 0.35 | 668 |
| Arsia Mons summit | +17.8 km | 20.4 | 6.5 | 0.12 | 8,900 m (Everest's summit has 6.6 kPa O₂) | 59 °C | 0.29 | 547 |
| Olympus Mons summit | +21.9 km | 16.4 | 5.3 | 0.10 | 10,300 m by dry O₂ (above 11,000 m by inspired O₂: unconscious in under a minute without a mask) | 54 °C | 0.23 | 440 |

The "as on Earth" column matches dry O₂ partial pressure; the body reads inspired O₂ (water vapour at 37 °C taken off), which puts each row higher (datum about 2,400 m, highlands 4,300 m, Tharsis 6,700 m): DESIGN's table and BODY §11.1 give those. LONGHAUL's body facts say 22 km for Olympus; this table and DESIGN use the commonly quoted 21.9 km. Martians speak of the air by its breath, not its pressure: "valley air" (below −3 km, breathe as you like), "datum air" (work slower), "rim air" (masks for hard work), "dome air" (masks outside, always). CO₂ at 3,900 ppm-equivalent on the valley floor is stuffy; BODY owns what it does to an unacclimatised body.

Inside: domes and buildings keep their own air (usually the outside air, filtered, warmed and, on the high ground, pressurised to 60–70 kPa); ships keep theirs (PLACES).

### 4.3 Radiation on Mars

Mars has no global magnetic field, but the terraformed air shields the ground: the valley floor sits under 1,770 g/cm², 70% more than Earth's sea level. Galactic cosmic rays reach the surface about as they reach Earth's poles at sea level (no geomagnetic cutoff), so the surface dose is near Earth's: about **1–1.5 mSv a year** from cosmic rays and rock together, against 2.4 mSv for an average Earther with radon (my estimate, from the air column; real present-day Mars at 0.7 kPa takes about 0.64 mSv a day, MSL RAD, Hassler et al. 2014). Solar particle storms do not reach the ground. Radiation becomes a soldier's problem only above the air: on Phobos (dug in), aboard ship (interplanetary cosmic rays about 1.8 mSv a day unshielded, MSL's cruise measurement), and in Jupiter's belts (7.3). BODY owns the dose model; these are the environment's numbers.

### 4.4 Climate, weather and dust

Mean surface temperature −25 °C [D]; the valley floors are the warmest places on Mars (the thickest air, sheltered by 8 km walls). Melas floor climate (game values, my call; equatorial lowland days to +15 °C and nights to −30 °C as the hub says):

| Ls band (south's season at Melas) | Day high | Night low | Wind | Sky |
|---|---|---|---|---|
| 0–90 (autumn) | +4 to +10 °C | −26 to −32 °C | the Fall at night (below) | mostly clear; frost on the fans at dawn |
| 90–180 (winter) | −2 to +5 °C | −32 to −40 °C | calm days | clearest of the year; thin water-ice haze over the walls at dawn |
| 180–270 (spring, dust season opens) | +6 to +13 °C | −24 to −30 °C | afternoon gusts to 15 m/s | dust devils; local storms |
| 270–360 (summer; the start, Ls 316) | +10 to +15 °C | −20 to −26 °C | gusty afternoons | dust devils most afternoons; local and regional storms to Ls 330 |

- **The Fall**: at night cold air drains off the plateaus and down the walls: a katabatic wind of 5–12 m/s along the floor from about 22:00 to dawn, strongest at the wall foot. At 0.93 kg/m³ a 12 m/s wind pushes as hard as 10.5 m/s on Earth. By day the wind turns upslope, gentle.
- **Dust storms** (my call, by class, with chances per sol at Melas):

| Class | Size and length | Visibility | Effect | Chance per sol, Ls 180–330 | Other Ls |
|---|---|---|---|---|---|
| Dust devil | 10–200 m across, minutes; afternoons | metres inside | grit in everything; a gust | 60% (on any warm afternoon) | 15% |
| Local storm | under 1,000 km, hours to 3 sols | 0.5–2 km | ranges closed, masks, flights by instruments | 6% | 1% |
| Regional storm | over 1,000 km, 3–20 sols | 50–500 m | flights grounded, outdoor training cancelled, suits or masks outdoors | 0.8% | 0.1% |
| Planet-encircling | 30–90 sols | 50–500 m for weeks | the year's story; supplies by crawler | about once in 3 Mars Years, rolled once per year at Ls 185–310 | none |

- **Rain** is rare: the valley sees it a few afternoons a summer when the sea's moisture carries this far, mostly as virga. Frost and thin snow settle in winter on the plateaus and the northern coasts.
- **The dust** (real values): 1–3 µm basaltic grains, magnetic (magnetite), electrostatic, clinging to cloth and optics; raw ground holds 0.5% perchlorate salts (Phoenix measured 0.6%), which irritate skin and eyes and suppress the thyroid. Lowland soil has been remediated by engineered perchlorate-reducing bacteria to under 0.05%; the plateaus and the training areas on raw ground have not. Marines call the rash "Redwater rash" (BODY owns its effects; WEAPONS owns dust in guns).
- The weather is a pure function of the site, the seed and the clock, drawn from streams of its own, never stored (tradecraft's `weather.js` pattern; TECH or PLACES builds it from this table). The 0.1 standby pins a clear first sol and at least one local storm in its two weeks (my call, for the acceptance moment).

### 4.5 The terraforming and the land

"Two centuries into its terraforming" [L]: the Long Work began with the Terraforming Charter in 2152 (MY 106) and, in the Republic's honest phrase, has "sixty years yet" for every stage and "not in our lifetime" for the end. The state in 2351:

- **The air**: half an Earth's, breathable below about +3 km (section 4.2) [U 2026-10-25, D].
- **The warmth** (my call, DESIGN.md): 0.6% CO₂ cannot hold the planet 35 to 40 K above its bare temperature, so the Long Work keeps perfluorocarbons at tens of ppm in the air, made by the PFC plants on the high plains (after McKay, Toon and Kasting 1991; Marinova, McKay and Hashimoto 2005); the pressure of 52 kPa of N₂ and O₂ helps. The plants are guarded like power stations, and the levy pays them. If they stopped, the gases would decay over centuries: a slow political lever, not a cliff. The levy that pays for it is the Republic's largest budget line, and the reason the CUC fights every hull.
- **The young sea** fills the deepest northern plains (Utopia, Vastitas Borealis, Acidalia's deeps) to a level of −4.5 km (my call), 300–900 m deep, ice-covered most of the winter, green at the edges with engineered algae. It has fishing towns and no tides worth the name (Phobos' tide is millimetres).
- **Hellas holds a lake** 1,100 km across, the heart of the most populous region.
- **The land**: lichen and moss on the lowland rock, hardy grasses, barley and potatoes in the valley fields, larch and pine shelter belts planted by hand ("plant trees anyway"); the plateaus are still raw red ground.
- **The caps** have shrunk; the polar ice is mined and melted into the lowlands under water rights.

### 4.6 The Mariner Valley

Valles Marineris: about 4,000 km long, up to 200 km wide in a single chasma and 600 km across the central parallel troughs, and up to 8 km deep below its plateaus (NASA, MOLA). Game values (my call, near MOLA):

| Feature | Centre | Length | Floor | Rim | What is there |
|---|---|---|---|---|---|
| Noctis Labyrinthus | 7°S 258°E | 1,200 km maze | +1 to +3 km | +5 to +6 km | the valley's head on the Tharsis rise; cold mazes; dome air; the SERE back-country |
| Tithonium and Ius Chasmata | 5–7°S 270–282°E | 810 and 940 km | −3.5 km | +4 to +4.5 km | Camp Ius and the School of Infantry (6th Marines); the **Tharsis Spaceport** on Ius' north rim at 275.6°E, +4.2 km |
| **Melas Chasma** | 10.4°S 287°E | 560 km | **−4.5 to −5.0 km** | +3.5 km (Sinai and Syria plateaus to the south, Ophir's divide to the north) | the widest trough (200 km): **Base Melas**, Redwater, Highrim on the south rim, the Melas Training Area |
| Candor and Ophir Chasmata | 4–7°S 287–291°E | 810 and 320 km | −4.0 and −4.5 km; layered mesas rising to +1 km | +3 km | north of Melas through the gaps; the Candor mesas (climbing, cliff training); **Hecate Arms & Drive's small-arms works** on the Ophir floor (WEAPONS §3.1), the Corps' rifles made over the divide from the base |
| Hebes Chasma | 1°S 284°E | 320 km | −5.0 km | +2.5 km | a closed basin with a cold lake; a Navy radar site |
| Coprates Chasma | 13.4°S 298.6°E | 970 km | −5.2 km | +3 km | the Coprates lakes, fed by aquifer springs, and the irrigation canals; **Canal Town**; Camp Coprates (5th Marines) |
| Eos, Capri and Ganges Chasmata | 8–12°S 312–320°E | | −4.5 km | +1 km | the valley's mouth into chaos terrain and the outflow channels to Chryse |
| Chryse coast | 22°N 312°E | | −3.8 km | | the sea's southern shore; Ochre Basin |

LONGHAUL's airspaces are equatorial arcs [L]: Melas at 287°E falls in the **Tharsis** airspace (240–300°E, "Tharsis Planetary Traffic"), and LONGHAUL's "Mariner Valley" airspace (300–360°E) begins 13° east of the base, at Coprates. That is a quirk of LONGHAUL's 60° cut, kept as is: the valley people say "Tharsis Traffic" for the controller and "the Valley" for the land. Base Melas runs its own military control zone, **Melas Approach**, inside Tharsis Traffic's airspace.

### 4.7 Cities and towns

About four billion people [L]. The named cities hold a fifth of them; the rest live in some 900 towns, dome districts and farm co-ops. Domed cities are the old ones, built before the air, on the high equatorial ground where launch is cheapest and the bedrock sound; open-air "breathers' towns" are newer, in the lowlands. That is Mars' social seam: old dome families with founders' names against valley, coast and farm people who grew up in the wind (my call).

| Place | Where | Altitude | People | Kind | Character |
|---|---|---|---|---|---|
| **Londres Nova** [C] | Syria Planum, 12°S 256°E | +6.5 km | 260 million (metro) | domed: the Hundred Domes and their tunnels | the Republic's capital: the Congress, the Admiralty Precinct, Headquarters Marine Corps; precise, crowded, proud; a day's rail from Melas |
| Mars Station [L] | Meridiani Planum, 2°S 354°E | −1.4 km | 95 million | old domes, open-air new town | the first permanent settlement (2090s); the First Base museum; heavy industry |
| Dustfall [L] | the foot of Arsia Mons, 8°S 241°E | +9 km | 40 million | domed | Hecate Arms & Drive's foundries, suit lines and drive works ("the Dustfall works"; its small arms are made at Ophir, 4.6); MCB Arsia nearby |
| Low Hellas [L] | the Hellas lake shore, 42°S 70°E | −6.8 km | 210 million | open air | the thickest air and the biggest farms; lake fisheries; the Corps' dive school |
| Ochre Basin [L] | Chryse coast, 22°N 312°E | −3.8 km | 120 million | open air | port city of the young sea; shipyards for sea craft; cheerful and rough |
| Ironvale [L] | Syrtis Major, 8°N 69°E | +1.0 km | 45 million | domed and open | iron and steel; union town |
| Coldspring [L] | Acidalia shore, 46°N 330°E | −4.2 km | 30 million | open air | aquifer springs; fishing; cold |
| Kasei Deep [L] | Kasei Valles, 24°N 295°E | −2.5 km | 18 million | open air | a river city in an outflow channel; the Republic's first hydro dams |
| Firstlight [L] | Elysium Planitia, 3°N 155°E | −2.8 km | 22 million | open air | the first town to breathe unmasked (MY 158); proud of it |
| Twin Domes [L] | Gale crater, 5°S 138°E | −4.4 km | 6 million | two old domes | at the foot of Mount Sharp; a heritage town |
| Canal Town [L] | Coprates Chasma, 13.5°S 297°E | −5.0 km | 3.5 million | open air | canals, reed beds, lakes; the 5th Marines' liberty town |
| Highrim [L] | Melas south rim, 11.2°S 287.2°E | +3.6 km | 1.1 million | old domes | the rim town over the base; the **Highrim Incline** (an 11 km cable railway in three stages up a landslide scarp) joins it to the valley floor |
| **Redwater** [L] | Melas floor, 10.3°S 287.5°E | −4.3 km | 180,000 | open air | the base's town (4.8) |
| MCRD Argyre | Argyre basin, 50°S 317°E | −4.0 km | (the depot) | open air, cold | the Corps' recruit depot: "the Argyre icebox" |

**Homes** of the Corps' marines, for PEOPLE's generator and CAREER's birthplaces (shares among enlisted marines; my call, close to PEOPLE's working weights):

| Id (CAREER) | Home | Kind (PEOPLE) | Share | Name culture (12.1) |
|---|---|---|---|---|
| `redwater` and the valley towns | Redwater, Canal Town, the Melas and Coprates farms | `valley-town` | 30 | `mars-valley` |
| `tharsis` | Tharsis dome towns, Dustfall, Highrim | `dome` | 18 | `mars-dome` |
| `londres` | Londres Nova | `dome` | 9 | `mars-dome` (founders' names twice as common) |
| `hellas` | Low Hellas and the lake towns | `sea-shore` | 12 | `mars-valley` |
| `seacoast` | Ochre Basin, Coldspring, the northern coast | `sea-shore` | 10 | `mars-valley` |
| `farms` | the lowland farm co-ops (Chryse, Isidis, Acidalia) | `valley-town` | 7 | `mars-valley` |
| `callisto` | the Martian dome towns round Callisto | `dome` (low g) | 5 | `jovian` |
| `aboard` | Navy and freighter families, Phobos | `orbital` | 3 | `mars-dome` |
| `ceres` | Belt-born with Martian papers | `belt` | 4 | `belter` |
| `earth` | Earth-born, naturalised | `earth` | 2 | `earther` |

The Corps is open to every citizen and has been since its founding; women are **30%** of the Corps and of its infantry (my call, after the Republic's history of crewing everything with whoever was there; real militaries vary, from about 9% in the US Corps to more elsewhere).

### 4.8 Redwater

Redwater lies 18 km east of the base's main gate on an alluvial fan below the south wall, 25 minutes by the valley road. Its name is its first springs: the aquifer water came up rust-red with dissolved iron, and the ponds below the springs still stain the reeds. It was a water-mining camp in MY 160, a farm town by MY 180, and has lived beside the base since MY 178. 180,000 people: farmers (barley, potatoes, goats), spring and canal workers, the base's civilian staff, retired marines and their families, and the Strip.

- **The Strip**: a kilometre of bars, diners, tattoo shops, a holo house, a bathhouse, pawn shops and a liberty hotel along the old road from the gate. Friendly to marines' money and wary of their nights.
- **The town's view of the Corps**: proud and tired. Half the valley families have a marine in them; the CUC office on the square collects signatures against "a century more under the domes", and its volunteers are often marines' mothers.
- **The law**: Martian Security (MSS) keeps a station on the square; the base sends a Shore Patrol of military police on liberty nights.
- **Faces** (PEOPLE fills them): the diner owner who knew your father, the CUC volunteer, the MSS constable, the bar's ex-gunny, the girl or boy from the farm co-op, the preacher at the Long Work chapel.

### 4.9 Marine Corps Base Melas in the world

PLACES draws the base; this is its place in the world.

- **Where**: the southern floor of Melas Chasma at **10.4°S 287.2°E, −4.5 km, 66 kPa** [D for the altitude and pressure; my call for the coordinates, which match TIME's meridian]. The south wall rises 8 km about 45 km away (7–10° of sky to the south); the north wall is 150 km off (3°); east and west the canyon runs to 1–2° of horizon. PLACES and VIEWS take this profile.
- **History**: Naval Training Center Melas from MY 175 (2283), on the flat outwash below an old landslide; Marine Corps Base Melas from MY 178. Chosen because the floor is breathable (marines train unmasked), wide and flat for long ranges, walled for cliff and altitude work, far from the cities, and 680 km from the Tharsis Spaceport.
- **Who**: Headquarters, 2nd Marine Division; the **4th Marines** (1/4, 2/4, 3/4); part of the 11th Marines (fires); the 1st Deep Reconnaissance Company and the Recon school; the Raider school (5.10); Melas Field with two assault lander squadrons; a Navy branch hospital; a brig. About 19,000 marines and sailors, 6,000 civilian staff and 9,000 dependents in the married quarters ("the Terraces").
- **What the base has** (PLACES places them): the Echo lines (2/4's barracks), mess halls, the PX, chapels, the **G-house** (the centrifuge hall: CAREER's PFT at 1 G, BODY's conditioning; marines call a session "a spin"), the ranges on the floor, the Candor and wall cliffs, the **high range** on Sinai Planum at +4 km reached by the Highrim Incline, "Little Conamara" (a pressurised mock-up of an under-ice town street for Europa training), the armouries, the suit lockers and pressure-drill hall, Melas Field's pads, and **the Grove**: a stand of larch and pine with one tree for every 2nd Division marine dead in service since MY 180 (5.8).

### 4.10 Martian society, as a marine sees it

- **Government**: the Congress of the Republic (600 seats, elected), its Executive Council led by the **First Councillor**, and its caucuses (the CUC the loudest). The MCRN Admiralty answers to the Council; the Commandant of the Marine Corps sits on the Admiralty Board.
- **Levies and rights**: every citizen pays **the terraforming levy**, the one name for it everywhere: **12% of income for civilians, 1% for service members** (the Republic counts their service as the rest; CAREER §12.4 withholds it as a line on the Leave and Earnings Statement, "Terraforming levy"). Ice Control's **air levy** on Europa (7.3) is a different tax. Every citizen holds a **water right** (a daily allowance, 120 L in the lowlands, 60 L in the domes; beyond it water is metered) and an **air right** in the domes. Wasting water is a social sin before it is a crime; a **seal crime** (tampering with a pressure seal) is the gravest crime on Mars.
- **The temper**: earnest, rule-minded, precise, proud of standards ("to specification", "within tolerance"), anxious about Earth's thirty billion, dry about their own hopes ("Breathe Easy Someday" is said with a straight face in 66 kPa air). Martians respect service; the Corps is volunteer, and the valley towns fill it.
- **Voices** (my call): the **valley** accent is slow and flat, drops endings, and says "the Fall", "up top" (the plateau) and "down valley" (east); the **dome** accent is clipped and precise, the Navy's register; Hellas and the coast sing a little. Belters speak Lang Belta creole [C]; Earthers sound loud and unhurried to Martian ears.
- **Food**: potatoes, barley, beans, greens, mushrooms, cultured protein ("vat"), goat and rabbit in the lowlands; real coffee, wine and beef are delicacies [L: "meat that walked"]; marines drink **brew** (roasted barley and chicory) and **red beer** (barley beer, brewed with iron-rich spring water). The Melas mess serves vat sausage, potatoes and greens, and calls it a Tuesday.
- **Faith**: plural. The Long Work has a civic, almost religious tone; there are churches, mosques, temples and the Long Work chapels; Navy chaplains of several faiths serve the Corps.
- **Sport**: long-ball (football at 0.38 G, kicked 120 m), canyon climbing, sand-yachting on the plateaus, swimming in the lowland pools and the Hellas lake.
- **Arms makers**: WEAPONS §3.1 owns the arsenal and its makers, and this section takes its list. **Hecate Arms & Drive** (HAD [L]: the Corps' rifles and nearly everything it carries, from its small-arms works at Ophir Chasma, over the divide north of Melas; its suits, the Lorica and its drives from the Dustfall works); **Tharsis Arsenal** (the Republic's old state arsenal, absorbed by HAD two generations ago: reserves, colour guards, old garrisons); **Tessier-Ndlovu** (Earth's arms combine, Lyon and Lagos: the UN Marines' guns); **LKC Defence** (Luna-Kepler Consolidated's arms division: corporate security across the system, Europa's included); **Tycho Machine Works** (Belter, rough and repairable); **Pallas Foundry** and the **Ceres shops** (crude Belt guns for cells and miners). Beside them (my call) **Ochre Basin Ordnance** makes Martian civilian knives, tools and sporting arms, and Martian Security's police arms. Martian kit is TL4 by LONGHAUL's philosophy: excellent, reliable, dear to repair, wanting proper parts.

---

## 5. The MCRN Marine Corps

### 5.1 History in the setting (my call)

| Year (UTC, MY) | Event |
|---|---|
| 2090s | First permanent settlement, Mars Station at Meridiani; colonial security by contracted guards and the "Phobos Guard" at the first orbital yard |
| 2152 (MY 106) | The Terraforming Charter: the Long Work begins |
| 2189 (MY 125) | The Congressional Charter: Mars becomes the Martian Congressional Republic; the MCRN is founded |
| 2190 (MY 126, Sol 214) | **The Corps is raised** from the Phobos Guard and the valley militias: "the Navy's soldiers, on any world or none" |
| 2241 (MY 153) | The Hellas floor passes 50 kPa; open-air towns begin |
| 2275 (MY 171) | First recorded rain, at the Chryse coast (Rain Day) |
| 2283 (MY 175) | Naval Training Center Melas; Marine Corps Base Melas from MY 178 |
| 2316 (MY 193) | **The Ganymede War**: 41 days, UN against MCR over the domes; the 4th Marines hold Uruk Sulcus through a regional dust storm of ice fines after their officers fall (the origin of the dress stripe, 5.7). The ceasefire leaves Ganymede independent (the GAC) |
| 2331 (MY 201) | **The Pallas Refinery**: a CFB cell holds 3,100 workers in vacuum; Corps boarding teams retake it in 9 hours. The "Pallas raiders" give the Raider Battalions their name (MY 202) |
| 2339 (MY 205) | **The Ninety-Day War** with Earth: a UNN strike on the Phobos approaches is beaten off; station-defence and boarding doctrine take their modern shape |
| 2344 (MY 208) | A Deep Recon and Raider strike on a Ghost Belt lair at Iapetus (Operation KHAMSIN) |
| 2349–2351 (MY 210–211) | The Europa troubles; the Jovian Accord (7.6, 7.7) |

**Battle honours of the 4th Marines** (on the regimental colours): Phobos (MY 128, the Guard's last fight before the Corps), Uruk Sulcus (MY 193), Pallas Refinery (MY 201), Phobos Approaches (MY 205).

### 5.2 Mission and doctrine

The Corps is the Navy's ground, boarding and shipboard-security arm [D]. Its missions, in its own order:

1. **Secure the fleet**: detachments aboard the larger hulls guard the reactor, the armoury, the brig and the bridge, repel boarders, and lead damage-control parties.
2. **Board and seize**: hulls, stations and rocks, in vacuum, in every gravity.
3. **Land and hold**: from orbit, by assault lander, on worlds with air (Mars, Titan) and without (the moons).
4. **Guard the Republic's people abroad**: embassies, consulates, citizens in a crisis.
5. **Keep the peace when the Congress asks**: the Europa mission.

Doctrine in the Corps' own sayings (my call):

- **"Fight at one G."** Martians are light-boned and Earthers are not; ships cruise at 1 G and Earth sits at the bottom of a 1 G well. Every marine trains at 1 G in the G-house and under thrust and is tested there [D].
- **"Few and better."** The Corps is small and expensive, like the fleet: every marine is a rifleman, void-qualified, and trained to TL4 standard. It accepts losses badly and trains to avoid them.
- **"The drop is the attack."** Land in strength, fast, where the enemy is not; landers do not loiter.
- **"Mind the seals."** In any pressure hull, the air is the first thing to defend. Frangible ammunition aboard and in towns (WEAPONS, and the Accord's clause 4).
- **"Steady."** Precision over volume: aimed fire, short bursts, fire control by NCOs.
- **"Consent, impartiality, least force"** for peace operations: the force keeps the peace between parties who asked for it, favours none, and uses no more force than the moment needs (COMBAT turns this into ROE).

### 5.3 Organisation: fire team to division

The hub fixes the shape [D]; PEOPLE fixes the company's billets (191 with attachments). This table names them and adds the higher echelons (my call).

| Echelon | Led by | Strength | Made of | Radio callsign pattern |
|---|---|---|---|---|
| Fire team | Corporal or Lance Corporal (team leader) | 4 | team leader, automatic rifleman, assistant automatic rifleman, rifleman | "Echo Two-One Alpha" |
| Squad | Sergeant (squad leader) | 13 | squad leader and three fire teams | "Echo Two-One" |
| Platoon | Second or First Lieutenant (platoon commander), Staff Sergeant (platoon sergeant) | about 43 | three squads, platoon HQ (commander, platoon sergeant, platoon guide, radio operator), a Navy corpsman | "Echo Two" (commander "Echo Two Actual") |
| Rifle company | Captain ("the Skipper"), First Sergeant | about 191 | three rifle platoons, a weapons platoon (machine guns, mortars, assault), company HQ (PEOPLE 3.2) | "Echo" (commander "Echo Six") |
| Battalion | Lieutenant Colonel ("the Old Man" or "the Old Woman"), Sergeant Major | about 1,000 (980 deployed) | HQ and service company, three rifle companies, a weapons company | "Bulwark" for 2/4 |
| Regiment | Colonel | about 3,100 | three battalions and an HQ company | "Rampart" for the 4th Marines |
| Division | Major General | about 15,000 | three infantry regiments, a fires regiment, a reconnaissance company, combat engineers, logistics | |

Company letters follow the US practice: 1st Battalion Alpha, Bravo, Charlie (Delta weapons); 2nd Battalion **Echo, Fox, Golf (Hotel weapons)**; 3rd Battalion India, Kilo, Lima (Mike weapons).

**The player's chain** [D]: 1st Squad, 2nd Platoon, **Echo Company**, **2nd Battalion, 4th Marines** ("Two-Four", callsign BULWARK), **4th Marine Regiment** ("the Fourth", motto "Built to Last"), **2nd Marine Division** ("the Valley Division"), at Marine Corps Base Melas. Echo calls itself "Easy Echo", which is a joke.

### 5.4 Order of battle and where each unit is based

The Corps' active strength is **53,000**, with 30,000 in the Reserve (my call). LONGHAUL's 12 warships and 3 battleships are the Navy's deployable combat fleet [L]; the Navy (about 90,000 sailors with the yards and shore establishments) and the Corps are much larger than the crews afloat, and three transports exist outside LONGHAUL's force lists (6.3).

| Formation | Base | Strength | Notes |
|---|---|---|---|
| Headquarters Marine Corps | the Admiralty Precinct, Londres Nova | 1,200 | the Commandant (a General), the Sergeant Major of the Marine Corps |
| 1st Marine Division ("Tharsis") | MCB Arsia, near Dustfall (+9 km, dome air) | 15,000 | 1st, 2nd, 3rd Marines; 10th Marines (fires) |
| **2nd Marine Division ("the Valley Division")** | **MCB Melas** | 15,000 | **4th Marines at Melas**; 5th Marines at Camp Coprates (near Canal Town); 6th Marines and the School of Infantry at Camp Ius; 11th Marines (fires) at Melas and Ius; 1st Deep Reconnaissance Company at Melas |
| 3rd Marine Brigade ("the Jovians") | Camp Lofn, Callisto | 4,200 (without 1/7) | 7th Marines ("Far Side": 1/7 is on Europa with MSF-E at the start, 2/7 and 3/7 at Callisto); 2nd Deep Reconnaissance Company; 2nd Raider Battalion |
| Martian Stabilisation Force, Europa (MSF-E) | Camp Halloran, Conamara Under-Ice | 1,420 at the start (1/7 counted here, not in the brigade), cap 2,400 | section 7.7 |
| 1st Marine Assault Wing | Melas Field and Arsia Field | 4,800 | assault lander squadrons LS-21, LS-22 (Melas), LS-11, LS-12 (Arsia), LS-31 (Callisto) |
| Marine Logistics Group | Melas, Arsia, Callisto | 4,500 | supply, maintenance, water and air plant specialists, medical support with the Navy |
| Marine Security Forces | Marine Barracks Phobos | 3,100 | the Phobos Security Battalion; the ship's detachments afloat (about 800, 6.2); the Marine Security Guard (embassies and consulates on Earth, Luna, Ceres Station, Tycho, Ganymede Station) |
| Marine Special Activities Command (MSAC) | Stickney, Phobos | 900 | the Raider Regiment (1st Raider Battalion at Melas with the Raider school, 2nd at Callisto); the 3rd Deep Reconnaissance Company embarked with the command ships; works with MNI (5.10) |
| Training and Education Command | MCRD Argyre, Camp Ius, Phobos | 3,000 | the recruit depot ("thirteen weeks at Argyre", as SKILLS §6.6 and CAREER §4.2 count boot); School of Infantry; the Void Operations School at Phobos; Corporals' and Sergeants' Courses at Melas |

### 5.5 Ranks, insignia and forms of address

The US Marine model [D]; CAREER owns promotion. Insignia are the Corps' own (my call), built from four marks: the **chevron** (point up), the **rocker** (arc below), the **ring** (a small circle, from the planet's sign ♂), and the **spear** (the sign's arrow). On utilities rank is a black-metal pin on both collar points; on service and dress uniforms, chevrons on both sleeves (copper on oxblood, ochre on charcoal); on any suit it is stencilled on the helmet's brow and back and carried by the suit's IFF tag, so a suit HUD shows rank only when it reads the tag (VIEWS, "we only know what we know").

| Grade | Rank | Abbrev. | Insignia | Spoken to as |
|---|---|---|---|---|
| E-1 | Private | Pvt | none ("slick-sleeve") | "Private Okafor" |
| E-2 | Private First Class | PFC | one chevron | "PFC Okafor"; peers: "Okafor" |
| E-3 | Lance Corporal | LCpl | one chevron over a ring | "Lance Corporal Okafor" |
| E-4 | Corporal | Cpl | two chevrons over a ring | "Corporal Okafor" |
| E-5 | Sergeant | Sgt | three chevrons over a ring | "Sergeant Okafor" |
| E-6 | Staff Sergeant | SSgt | three chevrons, one rocker, the ring | "Staff Sergeant" |
| E-7 | Gunnery Sergeant | GySgt | three chevrons, two rockers, the ring | "Gunnery Sergeant"; "Gunny" only by those the gunny allows |
| E-8 | Master Sergeant | MSgt | three chevrons, three rockers, the ring | "Master Sergeant"; "Top" informally |
| E-8 | First Sergeant | 1stSgt | three chevrons, three rockers, a diamond in place of the ring | "First Sergeant" |
| E-9 | Master Gunnery Sergeant | MGySgt | three chevrons, four rockers, the ring pierced by the spear (the full ♂) | "Master Gunnery Sergeant", "Master Gunny" |
| E-9 | Sergeant Major | SgtMaj | three chevrons, four rockers, a star | "Sergeant Major" |
| E-9 | Sergeant Major of the Marine Corps | SgtMajMC | three chevrons, four rockers, the Corps emblem between two stars | "Sergeant Major" |
| W-1 | Warrant Officer | WO | a copper bar broken by one black square | "Gunner" (infantry weapons officers) or "Mister/Miss" plus name; "sir/ma'am" |
| W-2 to W-5 | Chief Warrant Officer 2–5 | CWO2–5 | a steel bar broken by 1–4 black squares | as above |
| O-1 | Second Lieutenant | 2ndLt | one copper bar | "Lieutenant"; "sir/ma'am" |
| O-2 | First Lieutenant | 1stLt | one steel bar | "Lieutenant" |
| O-3 | Captain | Capt | two steel bars | "Captain"; aboard ship "Major" (below) |
| O-4 | Major | Maj | a copper ring | "Major" |
| O-5 | Lieutenant Colonel | LtCol | a steel ring | "Colonel" |
| O-6 | Colonel | Col | the ring and spear (the full ♂) in steel | "Colonel" |
| O-7 to O-10 | Brigadier General to General | BGen, MajGen, LtGen, Gen | one to four steel stars | "General" |

Rules of address: officers are "sir" or "ma'am"; NCOs are never "sir" ("Don't call me sir, I work for a living"); in the squad, peers use family names and nicknames; first names are for liberty. A recruit's drill instructors are "Drill Instructor" and their senior is "Senior Drill Instructor". Navy corpsmen are "Doc", whatever their grade. Aboard ship there is one Captain: a Marine Captain embarked is addressed as "Major" by courtesy, and the ship's commanding officer is "Captain" whatever their rank (naval custom).

**The Navy's grades** (for NPC sailors, corpsmen, chaplains and naval officers; LONGHAUL's ratings and its MCRN officer ladder [L], extended by me):

| Grade | MCRN rank | Marine equivalent for courtesies |
|---|---|---|
| E-1, E-2 | Rating | Pvt, PFC |
| E-3 | Able Rating | LCpl |
| E-4 | Leading Hand | Cpl |
| E-5 | Petty Officer Second Class | Sgt |
| E-6 | Petty Officer First Class | SSgt |
| E-7 | Chief Petty Officer ("Chief") | GySgt |
| E-8 | Senior Chief Petty Officer | MSgt |
| E-9 | Master Chief Petty Officer | SgtMaj |
| O-1 | Ensign | 2ndLt |
| O-2, O-3 | Lieutenant | 1stLt, Capt |
| O-4 | Lieutenant Commander | Maj |
| O-5 | Commander | LtCol |
| O-6 | Captain | Col |
| O-7 | Commodore | BGen |
| O-8 | Rear Admiral | MajGen |
| O-9, O-10 | Vice Admiral, Admiral | LtGen, Gen |

Corpsmen carry the prefix "Hospital": PEOPLE's "junior hospital rating" is a **Hospital Able Rating** (E-3), "third class" a **Hospital Leading Hand** (E-4), "second class" a **Hospital Petty Officer Second Class** (E-5).

**The Marine Corps Martial Arts Programme (MCMAP)**, spoken "mick-map" (my call: the US Corps' programme of the same name is the model, and its name is public military practice, not canon; the British spelling is the house style). SKILLS, CAREER, PEOPLE and ROADMAP use this name, and SKILLS reads the belts. Belts, with the barracks' names for them: tan ("dust"), grey ("basalt"), green ("lichen"), brown ("umber"), black first to sixth degree. Keys: `mcmap-tan`, `mcmap-grey` (never `gray`), `mcmap-green`, `mcmap-brown`, `mcmap-black-1` to `mcmap-black-6`. Recruits leave Argyre with tan; grey is a corporal's expectation.

### 5.6 The MOS list

Codes follow the US Corps' scheme where a real equivalent exists (my call, agreeing with CAREER 9.1, so builders and the user can read them); Martian specialties take free codes, marked *new*. Officer codes end in 2 where the US uses that pattern.

| Code | MOS | Field | Notes |
|---|---|---|---|
| **0311** | **Rifleman** | Infantry | the player's start [D, CAREER] |
| 0331 | Machine gunner | Infantry | weapons platoon |
| 0341 | Mortarman | Infantry | ranges grow in 0.38 G and thin air (WEAPONS) |
| 0351 | Assaultman | Infantry | rockets, demolitions, breaching |
| 0352 | Anti-armour missile gunner | Infantry | |
| 0317 | Scout sniper | Infantry | |
| 0365 | Infantry squad leader | Infantry | Sergeants |
| 0369 | Infantry unit leader | Infantry | Staff Sergeant and up |
| 0302 | Infantry officer | Infantry | |
| 0321 | Reconnaissance marine | Reconnaissance | Deep Recon companies (5.10) |
| 0372 | Critical skills operator ("Raider") | Special activities | MSAC (5.10) |
| 0315 *new* | Void boarding marine | Boarding | holds CAREER's V designator; fleet boarding teams and detachments |
| 0316 *new* | Shipboard security marine | Boarding | ship's detachments, Phobos |
| 1371 | Combat engineer | Engineers | fieldworks, breaching walls, ice cutting |
| 1171 | Water support technician | Logistics | water and air plants in the field (a real US MOS, more important here) |
| 1179 *new* | Field air-plant technician | Logistics | oxygen generation and CO₂ scrubbing for camps and outposts |
| 2111 | Small arms repairer (armourer) | Ordnance | |
| 2147 *new* | Suit technician | Ordnance | light vac suits, hardshells |
| 2149 *new* | Powered armour technician | Ordnance | the Lorica (MSAC only) |
| 2311 | Ammunition technician | Ammunition | |
| 2336 | Explosive ordnance disposal | Ammunition | Sergeant and up |
| 0621 | Field radio operator | Communications | |
| 0627 *new* | Tight-beam and relay operator | Communications | under-ice relays, laser links |
| 0231 | Intelligence specialist | Intelligence | |
| 2641 | Linguist (Lang Belta) | Intelligence | Lang Belta interpreters for Europa |
| 0811 | Field artillery cannoneer | Fires | rocket and gun batteries |
| 0861 | Fire support marine | Fires | calls ship and orbital fires |
| 3043 | Supply specialist | Logistics | |
| 3381 | Food service specialist | Logistics | |
| 3531 | Crawler and rover operator | Transport | |
| 5811 | Military police | Police | the Shore Patrol in Redwater |
| 5831 | Corrections specialist | Police | the brig |
| 6211 *new* | Assault lander crew chief | Assault wing | |
| 6231 *new* | Assault lander mechanic | Assault wing | |
| 7562 *new* | Assault lander pilot | Assault wing | officers |
| 8511, 8411, 8156 | Drill instructor, recruiter, embassy guard | B-billets | free MOS for the tour (CAREER) |
| 0916, 8531 | Close combat instructor, marksmanship coach | additional | |

### 5.7 Uniforms and suits

VIEWS draws them; WEAPONS and BODY give the suits' numbers (life support, protection). These are the Corps' kit as a marine knows it (my call on all names and patterns).

| Uniform | Worn | Look |
|---|---|---|
| **Utilities**, Valles pattern | on duty on Mars, in the field | a blocky disruptive pattern of rust, ochre, umber, basalt grey and dust pink (VIEWS' "red-tan field pattern"); sleeves down in the cold, rolled in summer; soft utility cover outdoors; name tape over the right pocket, "MCRN MARINES" over the left; rank pins on the collar; tan rough-out boots with dust gaiters. No unit patches: "you know a unit by its people" |
| **Ship greys** | aboard ship, at Phobos, on Europa under the ice | flat grey-blue flame-retardant coveralls with no snagging pockets, quick to strip at the suit locker; at action stations they go on over the suit's cooling liner, so suiting up is greys off, suit on; on Europa with the white MSF brassard and a white helmet band |
| **PT kit** | physical training | an oxblood shirt with the Corps emblem, grey shorts; "the sweats" (oxblood fleece and grey trousers, a balaclava) for −20 °C dawn PT; compression "spin kit" for the G-house |
| **Service charcoals** | travel, offices, leave | charcoal coat and trousers, an ochre shirt and black tie, a garrison cap |
| **Dress oxbloods** | parades, the Birthday Ball, funerals | a high-collared tunic in deep oxblood red with copper buttons bearing the emblem, black trousers, white cover and gloves; NCOs and officers wear the ochre **dust stripe** down each trouser seam, for the NCOs who held Uruk in the storm of MY 193 when their officers fell; officers and staff NCOs carry the straight-bladed **spatha** |

Suits (each is a name a marine knows; the numbers are BODY's and WEAPONS', and this list only names them):

- **The light vac suit**, HAD Mk 7 ("the seven", "the can"): a **soft pressure suit at 34 kPa of oxygen** (a gas-filled bladder with a self-sealing gel layer and a restraint layer, over a liquid-cooling liner) under a clip-on **hard shell**: the hard upper torso with the backpack life-support unit, the helmet with its HUD, pressure gloves and boots (the barracks call the clip-on part "the top", so that "the shell" stays the M-22's name). A hole anywhere in the soft suit vents the one gas loop, which is why the hand goes to the hole and the patch kit rides on the thigh (BODY §19.4, §19.5). The design is the one BODY §19 models (55 L loop, 600 g of primary oxygen and a 150 g reserve, about 19 kg); a mechanical counter-pressure skin was considered and rejected (my call, in the contract patch: one machine, and BODY's leaks, patches, ebullism and tests describe it). Donning is BODY §19.7's one table: about 5.5 minutes in full with the leak check and the buddy check, and the Corps' drill standard of **sealed in 3 minutes from the locker**; other sections cite that table and give no times of their own. HAD's catalogue says 8 hours of air; marines plan on 6 (BODY's budget at moderate work is about 7.5 h). Every marine owns one, fitted at Argyre. WEAPONS §8.3's "light vac suit shell" layer is this suit's outer covering, hard shell and soft layers together.
- **The hardshell**, HAD M-22 combat vacuum armour ("the shell", "the heavy"): segmented hard armour and a radiation liner built round a soft pressure layer at the same 34 kPa, with a bigger life-support pack: 20 hours of air in the catalogue, magnetic soles, a cold-gas EVA pack. For boarding, EVA and Europa's surface. About 42 kg: 16 kg of weight on Mars, 5.6 kg on Europa, all of its mass anywhere.
- **The Lorica**, HAD PA-3 powered assault armour ("iron"; "going iron"): an exoskeleton with armour, radiation hardening for long work on Jupiter's moons, 40 hours of air and heavy weapons mounts. About 190 kg. Issued only to MSAC teams after the Lorica course; a later item (16).

Badges and decorations (CAREER awards them; names mine):

| Item | Look |
|---|---|
| **The Corps emblem**, "the Spear and Ring" | the planet's sign (a ring with a spear rising to the upper right) over a flared drive plume, with two small moons on the ring; the ribbon reads STEADFAST |
| Rifle badges | Marksman (a plain copper bar), Sharpshooter (a ring), Expert (crossed spears in a ring) |
| Void badge | a steel ring open at the bottom (CAREER's V) |
| Orbital insertion wings | copper wings around a falling star |
| Drop badge | a small copper meteor, with a star per combat drop |
| G-house pin | a small steel spiral (the One-G Standard) |
| Recon badge, **"the Deimos"** | a dull grey pebble-shaped moon on black |
| Raider badge, **"the Phobos"** | a black moon with Stickney's crater cut through it |
| Good Conduct Medal | as the US |
| **Corps Achievement Medal** | CAREER's Achievement Medal |
| **Navy and Corps Commendation Medal** | CAREER's Commendation Medal |
| Valour, lowest to highest: **Bronze Spear**, **Silver Spear**, **Corps Cross** | CAREER's three grades |
| **Star of the Republic** | the Congress' highest award, nearly always posthumous |
| **The Red Seal** | the wound medal: a red disc like a pressure seal's wax |
| Combat Action Ribbon | as the US |
| Campaign medals | Europa Stabilisation Medal, Jovian Service Medal, Void Service Medal |

### 5.8 Customs and courtesies

PEOPLE performs them and enforces them; these are the rules (my call, from US Marine practice and Martian additions).

- **Saluting**: outdoors, in uniform and covered, to officers and to the colours; not indoors except when reporting to an officer; never in the field where it marks officers for a sniper; not inside a ship; in suits, two fingers tapped to the visor (the **visor tap**) in place of a salute.
- **Reporting**: knock once, enter on "Come", halt two paces from the desk at attention: "Sir, Private Okafor reports as ordered." Leave with an about-face on "Dismissed".
- **"Attention on deck"** when an officer enters, unless he or she says "Carry on" first; "As you were" restores what was. "Gangway" or "Make a hole" clears a passage for a senior.
- **"Aye aye"**: an order heard, understood and to be done. "Yes" answers a question.
- **Colours**: morning colours at 08:00 local, evening colours at sunset (TIME gives the time); everyone outdoors stops, faces the flag and salutes for the music, about 60 s.
- **The Republic's flag** (my design): a rust-red field; at the hoist, the planet's sign in white with its spear pointing to the fly; above it, two small white discs for Phobos and Deimos.
- **The general orders of a sentry** (adapted from the US eleven; PEOPLE's "post's orders"): 1. To take charge of this post and all government property in view. 2. To walk my post in a military manner, always on the alert, observing everything within sight or hearing. 3. To report every violation of orders I am instructed to enforce. 4. To repeat all calls from posts farther from the guardhouse than my own. 5. To quit my post only when properly relieved. 6. To receive, obey and pass on to my relief all orders from the commanding officer, the officer of the day and the officers and NCOs of the guard. 7. To talk to no one except in the line of duty. 8. To give the alarm in case of fire, breach, loss of pressure or disorder. 9. To check every seal and hatch on my post at each round. 10. To call the corporal of the guard in any case not covered by instructions. 11. To be especially watchful at night and in the timeslip, to challenge all persons on or near my post, and to let no one pass without proper authority.
- **The oath of enlistment**: "I, (name), do solemnly swear that I will defend the Martian Congressional Republic, its Charter and its people; that I will keep its air and its water; that I will obey the lawful orders of the officers appointed over me; and that I will serve where the Corps sends me, on any world or none."
- **Aboard ship**: request permission to come aboard and salute the colours at the brow if they are displayed; no covers and no salutes inside; berthing is silent after taps; the ship's people come first at the galley.
- **Water and seal discipline**: showers are two minutes of water ("a Navy shower"); water spilt in the mess earns a lecture; every marine checks a hatch's seal as he passes it ("seal habit"), and leaving a hatch unsealed is a counselling offence.
- **The Birthday Ball** (Sol 214): the Commandant's message read, the first piece of cake to the oldest marine present, the second to the youngest; dress oxbloods; a night in Redwater after.
- **The Planting**: when a marine of the 2nd Division dies in service, the company plants a larch or pine sapling in the Grove with the marine's name on a basalt marker. Friends touch the bark before a deployment. CAREER's memorial lists the same names.
- **The Muster of the Lost** (1 Vigil): the year's dead are read out at the Grove; after each name the company answers "Absent. Mind the seals."
- **The flip**: aboard a transport at turnover, a toast in brew or contraband: "To the far side."
- **Crossing the Belt**: when a transport crosses the Belt's mean radius (2.75 AU), marines on their first crossing ("dustlings") are tried by "Old Ceres" and her court of Belt-crossers: rhymes, cold water, a certificate. Hazing beyond the ceremony is an offence (PEOPLE).

### 5.9 Slang and sayings

The instinct's lines, NCOs and barracks talk draw on these (my call, built on LONGHAUL's Martian phrases [L]).

| Word | Meaning |
|---|---|
| boot | a new marine; "boot" anything means new and clumsy |
| dustling | a recruit at Argyre; a marine on his first Belt crossing |
| salty | experienced, a little too pleased about it |
| the G-house, a spin | the centrifuge hall; a session in it |
| heavy day | a training day at 1 G |
| thin, gone thin | struggling at 1 G; deconditioned after low g |
| juiced, the hangover | on juice [C]; what follows it |
| the can, canned | the light vac suit; suited and sealed |
| the shell, the heavy | the hardshell |
| iron, going iron | powered armour |
| brick | an assault lander; "the brick ride" is the drop |
| the Pens | the transit halls at Phobos |
| the Yard | Phobos Naval Yard; its light in the night sky |
| torchie | a sailor (they run the torch) |
| Doc | a corpsman |
| Skipper; the Old Man, the Old Woman | the company commander; the battalion commander |
| Gunny; Top | a gunnery sergeant; a master sergeant |
| up top; down valley; the Fall; the Wall | the plateau; east; the night wind; the canyon walls |
| ice rat, lenser, shaftie | a Europa miner (rude); a Thera Lens local; a shaft worker |
| Earther, Belter, inners | as the world says them; Belters' word for Martians and Earthers together [C] |
| TL-one | jury-rigged, cheap, about to break |
| slab | the field ration bar |
| brew; real bean | the barley-chicory coffee; real coffee |
| red beer | valley barley beer |
| your number | your radiation dose to date, on Europa |
| lagging | slow to answer (from light lag) |
| seal crime | sabotaging a pressure seal; any unforgivable act |
| seal check | "are you all right?" (and the literal check) |
| void, void-qualified | vacuum; qualified to work in it |

| Saying | When |
|---|---|
| "Plant trees anyway." | the Corps' unofficial motto: do the work you won't see finished |
| "Mind the seals." | goodbye; the answer at the Muster |
| "Dust in everything." | resignation |
| "Within tolerance." / "Out of tolerance." | fine / wrong |
| "To spec." / "Inspected and passed." | good work / approved |
| "Sixty years yet." / "Not in our lifetime." | a long time / never |
| "Fight at one G." | the doctrine; also "toughen up" |
| "Steady." | the Corps' cry and acknowledgement (from STEADFAST); fire commands never use the word |
| "On any world or none." | the oath's end; said of a posting nobody wants |
| "Breathe easy." | relax (said in 66 kPa air, with a straight face) |

### 5.10 Deep Reconnaissance and MNI Special Activities

CAREER owns selection, schools and missions; this is the lore.

- **The Deep Reconnaissance companies** ("Deep Recon", "the Pebbles"): three companies of about 125 (four platoons of four six-man teams and an HQ). The 1st at Melas (with the Recon school: CAREER's Basic Reconnaissance Course), the 2nd at Callisto, the 3rd embarked on the Olympus-class command ships. Their work: going first and quietly, by insertion craft (6.4) onto moons, rocks and Mars' back-country; watching, measuring, marking landing zones; small raids. Their badge is **the Deimos**: Homer's Ares went to war with his sons Phobos and Deimos, Fear and Dread, and the recon marines took the dread one. Motto: "Seen by nobody."
- **The Raider Regiment** of the **Marine Special Activities Command** (CAREER's "Raiders"; the name comes from the Pallas raiders of MY 201): the 1st Raider Battalion at Melas (the Raider school: CAREER's Assessment and Selection and Individual Training Course, with phases at Phobos and Deimos) and the 2nd at Callisto; teams of 14 (CAREER). Their work: seizing stations and ships, hostage recovery in vacuum, direct action, training friendly forces. Their badge is **the Phobos**, Fear. Motto: "Fear goes first."
- **MNI Special Activities**: Martian Naval Intelligence's covert arm, a few dozen officers at the **Stickney Annex** on Phobos, tasks Raider teams for operations the Republic will not sign: plain clothes, civilian cover, borrowed hulls, against Earth's agents, CFB cells and, by rumour, rivals inside the Republic (LONGHAUL's covert jobs against a rival sub-faction [L]). Marines seconded to it go off the Corps' books for the tour; their records show "Temporary Additional Duty, Phobos". MNI's people are polite, unhurried and never in uniform.
- **The Deimos range**: a training camp on Deimos (0.0003 G, no station [L]: huts, a mast and a fuel cache under regolith), where recon and Raider candidates learn to move, shoot and fall in near-zero gravity on a real rock.

---

## 6. Ships and craft

### 6.1 Phobos Naval Yard as embarkation

[L] for the yard's specification; lore and use mine.

- **The rock**: 27 × 22 × 18 km of rubble, 9,377 km from Mars' centre, round every 7.66 h, locked with its long axis on Mars. Gravity 0.0057 m/s² (0.0006 G): a dropped helmet takes 19 s to fall a metre. A hard jump (a leg push-off of about 2.5 m/s) carries a marine some **600 m up, and down again about 16 minutes later** (computed: 2 m/s gives 370 m and 12 min, 3 m/s 870 m and 20 min), well short of the 11 m/s escape speed; only near the tips of the long axis, where Mars's tide and the moon's own turn cancel about half its pull, can a jump of a few metres a second carry a marine off for good. VIEWS and BODY use this, not "a jump leaves Phobos". From inside Stickney's rim, Mars fills 42° of sky, half way up.
- **The yard**: 60,000 people, the MCR's only station, dug into Phobos by Stickney [L]: three yard sheds 600 m long, a command block, gantry towers A and B with eight arms, naval cradles N1 and N2 (260 m each, for L hulls), TL4 defences (24 PDCs, 8 torpedo silos). No market, no shore leave, strangers watched. A full Navy hospital (neural surgery). Controllers are clipped: "Phobos Control. Your transponder is logged. State your purpose." [L]
- **The Corps there**: Marine Barracks Phobos and the Phobos Security Battalion (shed and cradle patrols in free fall, CAREER's `phobos`), the Void Operations School, MSAC's headquarters and MNI's Stickney Annex.
- **Embarkation**: a battalion lifts from Melas Field by assault lander (6.5), docks at gantry tower A's low arms, and waits **1–3 sols in the Pens**: transit halls cut in the rock with steel deck plates for magnetic soles, handlines on every wall, elastic sleeping bags in racks. There the battalion takes its medical and G checks, fits suits, stows weapons in the transport's armoury (WEAPONS: weapons travel cased), writes last letters, and looks at Mars through the observation slot. The transport lies in cradle N1.

### 6.2 MCRN hulls and their marine detachments

LONGHAUL's classes carry no troops [L]; OLYMPUS adds a `troops` column (my call). Fleet totals use LONGHAUL's 12 hulls drawn from corvette ×2, frigate ×2 and destroyer (about 5, 5 and 2) plus 3 battleships.

| Hull | Length, crew (std) | Marines aboard | What they are | Craft |
|---|---|---|---|---|
| Tharsis-class corvette (TL4) | 46 m, 9 | 0 (4 berths in the brig deck for a fire team on special tasking) | | pinnace |
| **Hellas-class frigate** (TL4) | 120 m, 26 | **15** | a marine detachment: a gunnery sergeant in command, a rifle squad of 13 (the boarding squad) and a corpsman, in 18 racks (PLACES §5.3) | pinnace (12 seats; the squad leader rides the second crew seat; the gunnery sergeant and the corpsman follow by the collar or stay with the ship) |
| **Valles-class destroyer** (TL4) | 220 m, 80 | **30** | a light platoon: two squads, a platoon HQ, a corpsman | 2 pinnaces |
| **Olympus-class battleship** (TL4, a command ship) | 480 m, 280 | **222** | a ship's detachment of 42 for security, plus a ready boarding company of 180 | 4 pinnaces, 2 landers, and 2 assault landers when the company embarks |
| Martian Security cutter | 55 m, 8 | 0 | police | pinnace |
| **Coprates-class assault transport** (6.3) | 260 m, 90 | **up to 1,056** | a reinforced battalion | 6 Simoom assault landers, 2 Haboob heavy landers |

Afloat at any time: about 75 marines in frigates (5 × 15), 60 in destroyers and 666 in the battleships, **about 800** (801), plus whatever battalion a transport carries. PLACES §5.3 and this table carry the same 15.

### 6.3 The Coprates-class assault transport

Three in commission: **MCRN Coprates** (AP-31), **MCRN Halloran** (AP-32) and **MCRN Testudo** (AP-33), the player's first ride (names from LONGHAUL's MCRN pools [L]; AP is a new hull code). PLACES §5.2's "Noctis class" is this class: the name is SETTING's, and the hull's size, crew, berths and guns are PLACES's deck program, adopted here so that one set of numbers stands (my call, in the contract patch). Navy auxiliaries outside LONGHAUL's force lists: they are on rails between Phobos, Callisto and exercises, and the background war does not spend them (TECH). Data in LONGHAUL's `ship-classes.js` shape:

```js
{ id: 'mcrn-transport', kind: 'Assault transport', name: 'Coprates-class assault transport',
  yard: 'MARS', tl: 4, size: 'L', category: 'military', code: 'AP',
  lengthM: 260, hullM: [260, 44, 40], massT: 68000,          // PLACES §5.2's hull
  crew: [80, 100], crewStd: 90, troops: 1056, brig: 30,       // 8 company compartments of 132 racks
  cruiseG: 1, maxG: 5, ratedG: 3, standingG: 1.5, evasive: true, // 1.5 G with people standing, 3 G couched
  armor: 2, pdc: 6, tubes: 0, magazine: { he: 0, nuke: 0 }, rail: 0,  // it sails escorted
  craft: { simoom: 6, haboob: 2 },                            // eight silos
  pitch: 'A tower of troop decks round a drive: a battalion, its landers and a month of stores, at one G.' }
```

The ship is LONGHAUL's grammar: a tower whose decks are floors under thrust [L]. PLACES builds its deck program (troop berthing decks by company, galley, the armoury, the eight lander silos, the couch decks for burns over 1.5 G, the brig, the hospital). A wave is what the silos hold: six Simooms of 44 and two Haboobs of 60, **384 marines** (or two vehicles and 40), so 2/4 at 980 goes down in three waves. `cruiseG` is the class's cruise; the thrust a movement flies is doctrine's (6.5).

### 6.4 Assault landers and insertion craft

The only atmosphere-rated hulls are carried craft [U 2026-10-25]; the Corps' are TL4 relatives of LONGHAUL's pinnace: lifting body, belly tiles, skids (my call on all names and numbers).

| Craft | Role | Length, loaded mass | Crew, seats, cargo | G cruise / max / troop-rated | Other |
|---|---|---|---|---|---|
| **Simoom-class assault lander** ("the brick"; PLACES §5.5's D-16) | lands a reinforced platoon from orbit and lifts it back | 26 m, 92 t (58 t dry) | 2 pilots and a crew chief; **44 crash couches**; 6 t | 1 / 4 / **2.5 G** | lift-to-drag 1.2; β ≈ 655 kg/m²; tiles 1.1 MW/m²; a chin cannon (WEAPONS); radiation-shielded cabin (about 8 g/cm²) |
| **Mistral-class insertion craft** | puts a recon or Raider team down unseen | 15 m, 34 t | 2 pilots; 10 seats; 2 t | 1 / 5 / 3 G | TL4 signature × 0.7 again (radar-absorbent skin, a cold-gas final descent, no plume in the last 300 m) |
| **Haboob-class heavy lander** (PLACES §5.5's L-60, named here) | lands vehicles, stores and big lifts of troops | 30 × 10 × 7 m, about 150 t loaded (my call) | 2 pilots and a crew chief; **60 couches**, or a vehicle of up to 20 t and 20 couches | 1 / 3 / **2.5 G** | the Simoom's systems, scaled; the crawlers for the FOBs ride down in them |
| Pinnace (LONGHAUL's) | the Navy's utility craft aboard frigates and destroyers | 18 m, 45 t | 1–2 crew; 12 seats; 4 t | 1 / 4 | [L] |

PLACES §5.5's D-16 is the Simoom: its cabin is drawn for the Simoom's 44 couches, and the transport's silos are sized for its 26 m (PLACES §5.2).

**The troop-rated limit caps the drop** (computed against LONGHAUL's Europa runs, read-only). Europa's low-orbit speed is 1.43 km/s, but a drop from the transport's parking orbit (LONGHAUL's, 5,258 km from Europa's centre, 3,700 km up) falls in faster: on the fast 0.9 h run the craft burns about 1.0 km/s to leave the orbit, coasts, and arrives over the pad at about 1.9 km/s, which its **braking burn** kills in about **77 s at the 2.5 G cap**; the slow 2.3 h run arrives at about 0.25 km/s and brakes in 10 s. The landing from LONGHAUL's 10 km hover then takes **90 s at under 1 G** (LONGHAUL's profile opens with a shove of up to 3.7 G, the part the cap trims). So the powered descent is up to about a minute and a quarter at the cap and a minute and a half gentle: about 2.0 km/s in 2.8 minutes, a mean near 1.25 G under a 2.5 G peak. Mars entry peaks near 2.2 G anyway (LONGHAUL's pinnace profile). COMBAT and TIME fly the drop; BODY feels it; the drop test prints each burn's Δv, duration and peak G (14).

### 6.5 How a battalion moves to Europa (the default, my call)

**MCRN doctrine on troop voyages** (settled in the contract patch, my call; SETTING owns the doctrine, TIME §12.5 and §20 question 5 and PLACES §5.2 align, and the hub's decision log records it):

| Movement | Thrust | Why |
|---|---|---|
| **The Alert Battalion, reinforcements, any movement in a crisis or at war, outbound** | **1 G** | "Fight at one G" (5.2): the battalion arrives a week after the vote, not twelve days, and arrives having lived a week at the gravity it trains for. After the Murias seal attack (7.7), 2/4's movement is urgent, so the player's first voyage is this one: **7.3 days** |
| Homeward, after a tour in low gravity | **0.3 G** | 13.4 days: a step for bodies deconditioned by months at 0.134 G, between Europa's pull and Mars's, and the Navy saves the drive (BODY owns what each does to the body) |
| Routine rotations, reliefs and administrative moves | 0.38 G (Mars-normal, TIME's profile) | 11.8 days at home gravity |
| Fleet exercises (CAREER's `exercise`) | 1 G for weeks | the test the G-house trains for |

This is what makes the standby's centrifuge sessions pay or cost on the voyage (ROADMAP 0.2's "The short day": the marine who skipped the G-house faints at formation under 1 G), and the voyage the G-conditioning stat's first test. TIME's voyage tests print the 1 G profile as the default.

| Leg | Time | Felt gravity | Notes |
|---|---|---|---|
| Melas Field to Phobos | 2–3.5 h (LONGHAUL's Mars lander runs) | about 5 min of ascent capped at 2.5 G, then free fall with a few minutes of 1 G burns | the first time in space for most |
| The Pens, Phobos | 1–3 sols | 0.0006 G | 6.1 |
| Departure | 1–2 h | near zero | LONGHAUL's RCS departure |
| Burn, flip, brake | **7.3 days at 1 G** (departing Sol 602, 2351-12-31) | 1 G; 6 min of free fall at the flip, couches from 30 min before | the voyage chapter (TIME); doctrine's urgent outbound profile (above); the way home is 13.4 days at 0.3 G |
| Callisto | 2–4 sols | 0.126 G | **reception and staging** at Camp Lofn: dosimeter issue, the Accord classes, rifles zeroed on the surface range in vacuum, Lang Belta phrases |
| Callisto to Europa's parking orbit | 6–9 h at 1 G | 1 G | the transport stays no longer than the drop needs: Europa's orbit is inside Jupiter's belts |
| The drop | 0.9–2.3 h per wave (LONGHAUL's runs from Europa's parking orbit), three waves of up to 384 for a battalion (6.3) | free fall; a deorbit burn of about 1.5 to 2.5 min at 1 G (0.8 to 1.4 km/s); a braking burn of up to about 77 s at the 2.5 G cap; 90 s down from the hover at under 1 G (6.4) | onto the Pwyll spaceport's pads, beside FOB Pwyll; the transport's eight landers go back aboard after the last wave (the Accord's clause 3 counts the landers based on Europa, 7.6) |

Total, gate to under-ice camp: **about 12–15 sols**. The departure day is UTC New Year's Eve (my call: a beat for TIME).

---

## 7. The Jovian theatre

### 7.1 Jovian space

Mars holds it at 0.66, Earth contests Europa and Ganymede at 0.40, and the Belt's 0.30 is over the insurgency threshold [L]. The Hungry Dark clan lies up cold in the gulf near Jupiter, Callisto and Europa [L]. The MCRN keeps a squadron share in the insurgency zone (LONGHAUL commits 10% of the inner power's navy, about one or two hulls) and an Olympus-class command ship at Callisto during crises. Light lag to Mars runs 31–56 minutes over the synodic cycle (47 at the start): orders and letters are always old.

### 7.2 Callisto and the MCRN's Jovian base

Callisto [L]: 0.126 G, the most cratered surface known, outside the worst of Jupiter's belts: **about 0.1 mSv a day** at the surface (Ringwald 2000: 0.01 rem a day), "the safe moon to build on". Ground control MCR, "Naval Air Control", airspaces Valhalla, Asgard, Adlinda and Heimdall [L]. Solar day 402 h (16.75 Earth days); Jupiter hangs 4.3° wide in the sky.

- **Naval Station Valhalla** (TIME's "Callisto Station"): the MCRN's Jovian base on the floor of the Valhalla basin, near the Valhalla Spaceport: Navy repair docks for the squadron, fuel, a hospital (clinic grade [L]), MARFORJOV and the Jovian Command headquarters.
- **Camp Lofn**: 3rd Marine Brigade's camp 12 km away, with its centrifuge hall (BODY: mandatory sessions in 0.126 G), the surface range in vacuum, and the RSOI halls for arriving battalions. PLACES §6's "MCRN Base Callisto" is Camp Lofn: its Transit is the RSOI halls, its Spin the centrifuge hall, its Flats the surface range, and its Jovian Command block MARFORJOV's rear headquarters for MSF-E (the Jovian Command itself sits at Naval Station Valhalla). Its 400 m tunnel ends at **Lofn Gate**, a quarter of Valhalla Town.
- **The dome towns** (2.4 million on Callisto, my call): **Valhalla Town** (900,000; the base's liberty town, bars under lamps, black-market real coffee), **Asgard Dome** (600,000; ice mining and farms under lamps), **Tindr** and **Bran** (smaller, quiet). Martian colonists, Navy families, Belter labour. Their accent is Martian with Belter words.

### 7.3 Europa: the world

[L] for the body facts; numbers checked against real values.

- 0.134 G (1.315 m/s²); radius 1,561 km; a shell of ice **15–25 km** thick over a salt ocean about 100 km deep, twice Earth's water. Surface 50–125 K (about 100 K at the equator).
- **The sky**: Jupiter 11.9° across (24 full Moons) fixed in the sky over the sub-Jovian hemisphere; the sun 0.1° across giving about 50 W/m²; Jupiter's shadow eclipses the moon for about 2.9 hours each 3.55-day orbit (TIME 2.6).
- **The ice and the towns** (my call on the model and every temperature, from ice mechanics; the numbers computed in a scratch script). Closure is tied to the temperature of the ice round a gallery, so the liner ("the felt") and, at Thera, the cold lines are what a reamer fights:
  - The shell's conductive lid is cold: about **105 K at 1 km and 120–125 K at 3 km** (a heat flow of 40 to 50 mW/m² through ice whose conductivity is 651/T W/(m·K)), everywhere but over Thera's lens.
  - Ice flows by **Glen's law**, strain rate = A τⁿ with **n = 3**, and an Arrhenius rate factor **A(T) = 3.5 × 10⁻²⁵ Pa⁻³ s⁻¹ at −10 °C**, with an activation energy of **60 kJ/mol** below −10 °C and 115 kJ/mol above (Cuffey & Paterson 2010). At 105 K, A is about 10¹⁸ times smaller than at −10 °C: the lid's ice is rigid.
  - A gallery closes by **Nye's (1953) law for a tunnel**: its half-width a shrinks at `ȧ = a · (ΔP / (2 I))³`, with `I = ∫₁^∞ A(s)^(−1/3) s^(−5/3) ds` over the ice round it (s = r/a), and ΔP the weight of the ice above (920 kg/m³ × 1.315 m/s² × depth: **1.21 MPa a kilometre**) less the town's air (55 kPa). In ice of one temperature this is Nye's `ȧ/a = A (ΔP/3)³`. The integral is why cold ice a few metres in holds a warm face: a warm wall alone does not squeeze, a warm halo does.
  - **The cold towns** (every town but Thera Lens, 200 to 1,400 m): the felt (PLACES §3.8's liner, 0.25 m of foam and a membrane, U 0.1 W/(m²·K)) holds the ice face near **130–140 K** against the town's 18 °C, and the galleries **do not close by creep** (under a micrometre a century; even a hall whose face is held at −10 °C for decades stays put, because the cold ice behind it is rigid). Their danger is melt: a hole in the felt lets the bare face reach 0 °C within hours, and it **sweats about 0.3 L an hour from every square metre** (8 mm of wall a day), runs, refreezes on floors and cables, and spalls: PLACES's "dripping street". Their **reamers** cut new galleries and trim back what melt and refreeze build.
  - **Thera Lens** lies 300 to 700 m over a lens of brine at 3 km, and its ice is warm: about **215 K at 2,300 m, 230 K at 2,500 m and 245 K at 2,700 m** (a conductive profile from 100 K at the surface to 270 K at the lens). It creeps. The town's **cold lines** (brine loops behind the felt, run off its heat pumps) hold the faces at −45 °C (228 K), and still a 5 m gallery loses about **27 cm of its width a year at 2,300 m, 80 cm at 2,500 m and 2 m at 2,700 m**: Thera's reamers work every street, recutting the deep ones every year or two.
  - **When the cold lines stop** (a power cut: Europa's power is dear), the felt alone lets Thera's faces settle at −20 °C (PLACES's limit), and the warmth soaks into the ice at its diffusivity of about 1.5 × 10⁻⁶ m²/s, a metre in about a week. At 2,700 m the width a gallery loses rises from 2 m a year to **1 cm a day within a week** and 1.5 cm a day within a month; with a hole in the felt as well (the face sweating at 0 °C), to 1.4 cm a day in a week and 2.4 cm a day in a month. At 2,500 m the same failure takes it from 0.8 m a year to 1.3 m a year in a week and 2.4 m a year in a hundred days. A sweating wall in Thera is an emergency measured in weeks and read with a tape across the street; Thera calls it "the squeeze".
  - What PLACES needs from this (it runs the environment): a face temperature per zone from its liner model, the far-field ice temperature by town and depth (these values), and each gallery's width, narrowed by this law in its slow layer.
- **The towns' air** is PLACES §3.2's **Belter town standard** (55 kPa, pO₂ 19 kPa, 34.5% O₂, CO₂ often 0.5 to 1 kPa, 18 °C: less pressure on the liners and less imported nitrogen), from the electrolysis of meltwater; the towns call it "town air". PLACES owns the airs, and its choice replaces this section's earlier "Ice standard" draft. The force's FOBs and Camp Halloran keep Martian indoor standard (66 kPa). Air is metered and taxed (the **air levy**).
- **Radiation**: Europa's surface takes **5.4 Sv a day** [D] (Ringwald 2000: 540 rem a day). The table below is the environment the BODY model reads (my call: order-of-magnitude values from electron ranges in water-ice and the attenuation of their bremsstrahlung; shielding in g/cm²):

| Where | Shielding | Dose rate | Time to 50 mSv |
|---|---|---|---|
| Surface, bare skin | 0 | 5.4 Sv/day (225 mSv/h) | 13 min |
| Surface, light vac suit | about 1.5 g/cm² | 2.2 Sv/day (90 mSv/h) | 33 min |
| Surface, hardshell with its liner | about 5 g/cm² | 0.65 Sv/day (27 mSv/h) | 1 h 50 min |
| Surface, the Lorica | about 12 g/cm² | 0.12 Sv/day (5 mSv/h) | 10 h |
| Assault lander cabin on the pad | about 8 g/cm² | 0.25 Sv/day (10 mSv/h) | 5 h |
| Crawler cab or surface shelter (water jacket) | about 25 g/cm² | 25 mSv/day (1 mSv/h) | 2 days |
| Under 1 m of ice | 92 g/cm² | 0.2 mSv/day | 250 days |
| Under 3 m of ice | 275 g/cm² | 0.01 mSv/day | |
| In the towns (200 m and deeper) | | 0.002 mSv/day (0.7 mSv a year, below Earth's average) | |
| Transport's berthing in Europa's parking orbit | about 40 g/cm² (hull, water walls) | 5 mSv/day | 10 days |
| For comparison: Io's surface; Ganymede's; Callisto's | | 36 Sv/day; 0.08 Sv/day; 0.1 mSv/day (Ringwald 2000) | |

- **The rules on dose** (the Corps' regulations, which BODY and COMBAT apply): 50 mSv per rotation per marine as the planning limit; a battalion commander may authorise up to 150 mSv for operational need; 250 mSv only to save life. Every marine wears a dosimeter on Europa and is asked for "your number". Ice Control's surface rules apply to joint work: dosimeters, buddy lines, and the **30-minute rule** (no unshielded walk longer than 30 minutes from a shelter).

### 7.4 Europa's towns

About 2.95 million people in nine towns and some forty rigs ("a few million" [L]). Towns are placed inside LONGHAUL's three airspace arcs (Conamara 0–120°E, Pwyll 120–240°E, Thera 240–360°E, each with its spaceport) [L]; they take the real features' names and terrain (chaos rafts at Conamara, crater rays at Pwyll, the dark lens at Thera), but not the real features' coordinates, which LONGHAUL's arcs do not follow (flagged, my call).

| Town | Airspace | Depth | People | Character | Who holds it |
|---|---|---|---|---|---|
| **Conamara Under-Ice** | Conamara | 350–900 m | 820,000 | the oldest town, galleries cut through the tilted ice rafts of the chaos; seat of Ice Control and the Ice Council; markets, union halls, the old shafts; **Camp Halloran** (MSF-E's headquarters) beside the spaceport shaft | Ice Control; the Accord unions |
| Murias | Conamara | 200–500 m | 95,000 | an old rig town gone poor; shaft families; tight galleries, bad air in the low streets | the Reamers' and Shaftmen's Union (militant) |
| Annwn | Conamara | 300–700 m | 140,000 | a boom town of new shafts and new arrivals from the Belt | mixed |
| **Pwyll Deep** | Pwyll | 600–1,400 m | 610,000 | a crater town under Pwyll's bright rays; the **Pwyll catapult**, a mass driver on the surface that throws ice blocks to orbit for the haulers; **FOB Pwyll**, 2/4's base, beside the Pwyll spaceport, 2 km from the main shaft's head (PLACES §7.5 maps it) | the Ice Haulers' Union; the FOB and the corridors are the force's |
| **Tyre Works** | Pwyll | 400–1,000 m | 380,000 | the waterworks: melt halls, refineries and the electrolysis plants that make oxygen and hydrogen for the Jovian moons; reactors run by Hecate Jovian Power (HAD's subsidiary) under contract | the Works are MSF-E's to guard (2/4's sector) |
| Manannán | Pwyll | 250–600 m | 160,000 | Pur'n'Kleen's hauler port: warehouses, crew bars, contract labour | Pur'n'Kleen and its guards |
| **Thera Lens** | Thera | 2,300–2,700 m (its pumping halls and the lake borehole below) | 290,000 | deep, warm and squeezed (7.3), over a lens of liquid water at 3 km; the poorest town, devout, the CFB's heartland; reamers work every street | Star Helix alone; outside the Works and the force's zones ("past the Thera line") |
| Callanish | Thera | 400–900 m | 210,000 | LKC's mining claim: a company town with Earth managers and Belter crews | LKC (the UN's interest) |
| Cilix | Thera | 300–600 m | 45,000 | the Europan Biosphere Survey's drill camp (a Tycho and UN project that has found no life); the UN observers' office | neutral |
| The rigs | all | 50–300 m | about 200,000 | camps at quarries, shafts, relay masts | various |

PLACES's town templates are kinds, not towns (1.4): a **shaft district** (a mine head, its rings of housing and its works round a shaft: PLACES §7.2), a **gallery district** (a long vault street: Thera Lens is built of them, §7.3) and a **berm camp** (surface modules under quarried ice: a rig, §7.4). Each instance takes a town's name and a district's ("Pwyll Deep, Shaft Head", "Thera Lens, the Long Gallery"). The towns' depths are this table's lore; PLACES, which owns the maps, reconciles its shallow levels (−15 to −80 m) with them (one reading: a shaft head's upper levels, with the town's streets below).

Folklore: miners say the old ones live in the ocean and knock on the deep shafts. The Biosphere Survey has found no life, and says so.

### 7.5 The parties on Europa

- **Ice Control** (Europa Ice Control Authority): the OPA's ground control [L], in practice Europa's government. Run by the **Ice Council** (town delegates and union seats) and its Chief Controller, under the Tycho Council's OPA. It clears every flight, meters the air and water, and pays Star Helix. It invited the Martians (the Accord) and resents needing them.
- **Star Helix Security** [C]: the OPA's police contractor, the towns' police. Underpaid, outnumbered, half Belter and half anyone; some honest, some bought.
- **The miners' unions** (locals of LONGHAUL's Belt Unions [L]): the **Ice Haulers' Union** (Pwyll and the catapult), the **Reamers' and Shaftmen's Union** (tunnels; militant), the **Water Workers' Federation** (Tyre). Two camps: the **Accord unions**, who signed on to the peace, and **Hard Ice**, who call the Martians an occupation and shelter the cells.
- **Corporate security**: **LKC Asset Protection** (Earth's combine at Callanish, ex-UN marines in grey), **Pur'n'Kleen Protective** (the water company's guards at Manannán and on the haulers), and **BSS contractors** (LONGHAUL's mercenaries [L], hired by LKC after the Callanish shooting). Armed under Ice Control licences; tense with everyone.
- **Ceres Free Belt cells** (LONGHAUL's `opa-ceres` insurgency [L]): small, local, young, linked to Ceres by money and slogans. Their weapons are improvised bombs in shafts, snipers on catwalks, sabotage of seals and air plants, and crowds. Their best-known signature on Europa is a bomb-maker the news calls **"the Lantern"**.
- **The UN Observer Mission, Europa (UNOME)**: 64 unarmed observers and 200 staff, pale blue armbands, under a UN major general; the Accord gives them access (7.6). One **UN Security cutter** (UNS) holds Europa's parking orbit under Ice Control clearance. Some observers are honest soldiers; some are EID.
- **Hecate Jovian Power** (HAD): runs the Tyre reactors. The CUC asks in the Congress why marines guard a Hecate contract.
- **The Hungry Dark** [L]: pirates who take haulers in the gulf; on Europa, a market for stolen ice and stolen people.

### 7.6 The Jovian Accord and the stabilisation force

The **Jovian Accord on Europa**, signed at Conamara Under-Ice on **2351-09-03 UTC** by Europa Ice Control and the Ice Council, the Tycho Council for the OPA, and the Martian Congressional Republic, with the UN acceding as observer party (my call on all clauses; COMBAT turns them into ROE, PEOPLE into behaviour):

1. **Purpose.** The force secures the Works (the Tyre waterworks, the Pwyll catapult, the Conamara reactor hall, the three spaceport shafts and six trunk tunnels, "the corridors"), keeps the peace between the parties, and protects civilians in its zones.
2. **Authority.** Ice Control is the civil authority and Star Helix the police. The force acts in the towns only in its zones (the Works, the corridors, its checkpoints), at Ice Control's request, or to defend itself or others from imminent threat.
3. **Size.** No more than **2,400 Martian personnel** on Europa; up to eight assault landers; no armoured vehicles inside pressure. (No warship can land.)
4. **Weapons.** Inside any inhabited pressure volume, **frangible ammunition only**; ball and AP on the surface, in vacuum, or on a battalion commander's written authority; no explosives inside pressure except engineers' breaching charges under the same authority; crew-served weapons only on the Works' perimeters.
5. **Detention.** The force may detain anyone who attacks it, the Works or civilians, and hands them to Star Helix **within 6 hours**; every detention goes in the joint log, open to the observers.
6. **Search and entry.** Checkpoints search persons and loads in the corridors. No entry into a dwelling without Star Helix present or an Ice Council magistrate's warrant, except in hot pursuit or to save life.
7. **Observers.** UNOME may ride with patrols (two observers at most), read the detention and checkpoint logs, and visit any force site on 2 hours' notice (24 hours for the Works' control rooms).
8. **Air and water.** The force pays its own air and water into Ice Control's ledgers at the levy rate and requisitions no civilian stores.
9. **The surface.** Ice Control's surface rules (7.3) apply to joint work; the force's own dose limits are its own.
10. **Flights.** Martian craft fly under Ice Control clearance; MCRN warships keep to the parking orbit or beyond.
11. **Incidents.** A Joint Incident Commission (Ice Control, OPA, MCR, an observer) reviews every death the force causes and publishes its findings.
12. **Term.** 18 months from signature, renewable by the Ice Council's vote; any party may withdraw on 60 days' notice.

The force: the **Martian Stabilisation Force, Europa (MSF-E)**, conducting **Operation STILL WATER**, under Marine Forces Jovian at Callisto. Marines say "the Force" and "Still Water". CAREER's deployment `esf` is this mission.

### 7.7 The Europa situation at the start

The authored timeline injected by the prologue (2.3); UTC dates; my call.

| Date | Event |
|---|---|
| 2349 | LKC buys the Callanish ice claims from a bankrupt Ice Control contractor; union protests |
| 2350 | Pur'n'Kleen raises haulage rates; water prices across the Jovian moons rise 30% |
| 2351-05-02 | **The Pwyll strike**: the Ice Haulers' Union shuts the catapult for 19 days |
| 2351-06-11 | **The Tyre bombing**: a CFB cell bombs an electrolysis hall: 43 dead; three towns on air ration for 11 days (the zones are pinned from 2351-06-01) |
| 2351-07-20 | **The Callanish shooting**: BSS contractors fire on a union picket: 9 dead; Star Helix loses Callanish for a week |
| 2351-08 | The UN proposes a peacekeeping mission of its own; the Tycho Council, to keep Earth off the ice, asks Mars instead |
| 2351-09-03 | **The Jovian Accord** signed at Conamara |
| 2351-09-20 | MSF-E's first elements land: 1st Battalion, 7th Marines from Callisto |
| 2351-11-14 | **The Murias seal attack**: a pressure door sabotaged in Murias's low streets: 12 dead. The Congress debates a second battalion; the CUC opposes |
| 2351-12-19 | **The start.** MSF-E stands at **1,420** of its 2,400: 1/7 (960 deployed) holds the Conamara airspace and the Tyre Works; a headquarters of 180, an MP platoon of 45, a logistics detachment of 150, a lander detachment of 60 with four landers, a Navy surgical team of 25. The Congress' vote on the reinforcement is due within the standby (CAREER triggers the orders); 2/4, the Alert Battalion, deploying at 980, would bring the force exactly to its cap and take the Pwyll airspace (Pwyll Deep, Tyre Works, Manannán) from **FOB Pwyll**; 1/7 keeps Conamara from Camp Halloran's lines |

Public figures for the news and the papers (my call; PEOPLE may promote any to a persistent person). Their full names are registered at new game (12.5) and their family names are kept off the squad and the chain of command (12.6), so a squad leader never shares a name with the Commandant by chance and reads as a plot point. (The Commandant was "Okonjo" in an earlier draft, the surname that CAREER §5.3 and PEOPLE §14.4 and §18 give a squad leader and a squadmate; the Commandant is renamed rather than the examples, my call: one change instead of three, and hand-written examples must avoid the names below as well.)

| Who | Role |
|---|---|
| General Halima Strand | Commandant of the Marine Corps |
| Sergeant Major Teodor Brennan | Sergeant Major of the Marine Corps |
| First Councillor Signe Abernathy | head of the Republic's Executive Council |
| Congresswoman Noor Castellanos | the CUC's floor leader |
| Admiral Vidar Hakimian | chief of the MCRN Admiralty |
| Colonel Imre Danso | Commander, MSF-E |
| Chief Controller Ilan Achieng | head of Europa Ice Control |
| Rilka Otieno | the Ice Haulers' Union's bosmang at Pwyll |
| Major General Lerato Mahlangu (UN) | head of UNOME |
| Pieter De Vries | LKC's manager at Callanish |
| "the Lantern" | an unidentified CFB bomb-maker |

---

## 8. Beyond Europa: the theatres special operations reach

The settings CAREER's recon and Raider missions and its other deployments draw on (PLACES builds them).

| Theatre | Gravity | Air | Radiation | People, holder [L] | What a team goes there for |
|---|---|---|---|---|---|
| **Ganymede**: the farm domes and Ganymede Station | 0.146 G | domes; station air | 0.08 Sv/day at the surface (its own magnetic field shelters the equator); domes shielded | 100 million in domes and mirrors; Ganymede Station 210,000 (independent); claimed by Earth and Mars, held by the GAC | the likeliest war front; a standoff at a lock with UN marines; a dome seized or held; the Uruk memorial of MY 193 |
| The Jovian gulf | free fall | none | interplanetary | Hungry Dark lairs on cold rocks and derelicts | a derelict boarded in vacuum; hostages on a water hauler |
| Pallas Refinery | 0.021 G | station air | as space | 240,000; OPA, with a Martian interest (0.35) | the old fight's ground; refinery sabotage and seizure |
| Io's labs | 0.183 G | none | 36 Sv/day | a few corporate labs, nobody's | a team in Lorica for hours, never more; a lab's secrets |
| Ceres Station | 0.029 G at the port; **0.30 G spin in the drums** (8.1) | station air | as space, shielded | 1.8 million, the OPA's capital | the consulate in a riot; a deniable job in the Belt's own house |
| Hygiea Ring | 0.30 G on the ring (8.1) | station air | | 45,000; OPA | a quiet ring station: a defector, a ship that should not be there |
| Vesta Depot | 0.026 G | station air | | 30,000; independent; narcotics | a smuggler's cargo; a pirate fence |
| Tycho Station (round Juno [L]) | 0.30 G on the ring (8.1) | station air | | 130,000; OPA's builders | a hull on the slips that should not exist |
| Titan's stilt towns | 0.138 G | 147 kPa of nitrogen at 94 K: a mask and a heated suit, not a pressure suit | low | a few hundred thousand; OPA | the long voyage; a survey that found something |
| Luna and Earth | 0.166 G; 1 G | Earth's | Earth's | UN | embassy and consulate guard; a prisoner exchange; a defector at the gate |
| Deimos | 0.0003 G | none | as space | no station [L]; the Corps' training range | selection, the near-zero range |
| Phobos | 0.0006 G | yard air | dug in | 60,000; the Yard | station defence; a stranger in the sheds |

### 8.1 Spin gravity where LONGHAUL spins things

The hub allows spin gravity only where LONGHAUL spins things [D]. LONGHAUL's `stations.js` gives three spin rings their radii (Hygiea Ring 450 m, Tycho Station 700 m, Ganymede Station 550 m) and calls Ceres Station "spun up" in its lore without a number, while its port is a surface port that rides Ceres' nine-hour turn at 0.0017 G [L]. The values below are mine, all at the Belt's standard of **0.30 G at the rim** (the G LONGHAUL's Belters fly at), and computed (ω = √(g/r)):

| Where | Radius at the rim | ω | Turn | Rim speed | What a marine feels |
|---|---|---|---|---|---|
| **Ceres Station, the drums** | **450 m** | **0.0809 rad/s** (0.77 rpm) | 78 s | 36.4 m/s | 0.300 G of spin plus Ceres' own 0.029 G along the drum's axis: **0.301 G, 5.5° off the radial**, so the drums' floors are coned 5.5° to sit square to it |
| Hygiea Ring | 450 m | 0.0809 rad/s (0.77 rpm) | 78 s | 36.4 m/s | 0.30 G (PLACES §8's setting 6 uses the same ω) |
| Ganymede Station's ring | 550 m | 0.0731 rad/s (0.70 rpm) | 86 s | 40.2 m/s | 0.30 G |
| Tycho Station's ring | 700 m | 0.0648 rad/s (0.62 rpm) | 97 s | 45.4 m/s | 0.30 G |

- **Ceres Station** (my call on its shape): the port LONGHAUL draws (gantry towers, cradles, the ground works) sits on the surface; the city lives below it in **six drums**, caverns 900 m across and about 3 km long cut under some 600 m of rock (Ceres' weak pull makes that only 0.37 MPa of overburden, so the caverns stand), each a cylinder turning on bearings about a vertical axis, its rim the **concourse** and a dozen levels of districts stacked toward the axis. A 3 m level loses 0.002 G, so the upper districts are lighter by a few hundredths. Lifts and spoke ladders join the levels and the despun hub, where the drum meets the port. PLACES §8's setting 12 (the consulate in a concourse district) takes 0.301 G from this table; CAREER §4.3, §10.2 and §11.3's 0.3 G stands.
- **What spin does to a body and a gun** (BODY and WEAPONS own the effects; these are the numbers): walking at 1.5 m/s with the spin makes a marine about **8% heavier**, against it 8% lighter (the rim moves at 36 m/s); a magazine dropped from 1.5 m lands about **8 cm to antispinward** of where it was let go; head and feet differ by 0.4% of weight, too little to feel at under 1 rpm. On the bigger rings each of these is a little smaller (Tycho: 6.7% and 6.6 cm).

---

## 9. Faces: each faction as a marine meets it

PEOPLE builds the persons; VIEWS dresses them; this is who they are to a marine (my call).

| Faction | Where you meet them | What they wear | How they talk | What they want from you |
|---|---|---|---|---|
| Your own NCOs and officers | everywhere | utilities; dress oxbloods on parades | short, procedural, dry; never "sir" for an NCO | standards, on time, to spec |
| The MCRN (torchies) | Phobos, aboard | ship greys; officers' charcoal | clipped, the dome register; "logged", "state your purpose" [L] | stay out of the way; strap in when told |
| Martian Security (MSS) | Redwater, the cities | dark blue with a white collar flash, sidearms | "precise, polite, and armed better than most navies" [L] | marines who behave on liberty |
| MNI | Phobos, briefings, never announced | civilian clothes, good ones | patient, polite questions, no answers | what you saw; your silence |
| Hecate (HAD) | the armoury, the Tyre Works | company overalls with the HAD flame | engineers' talk, contracts in every sentence | their kit kept to spec; their works guarded |
| The CUC | Redwater's square, the news | civilian, earnest badges | the budget and the domes | your vote, your mother's signature |
| Ice Control | Conamara, every clearance | grey uniforms with the white ice-crystal badge | Belter-accented officialese; Lang Belta to each other | the Accord kept to the letter; the force small |
| Star Helix | the towns' streets | dark grey armour vests, helmets with the helix | tired, ironic, cautious with Martians | help that does not make them look weak |
| The Accord unions | union halls, checkpoints | work coveralls, union patches, dosimeters | Lang Belta creole, blunt | the Works open, the prices down, respect |
| Hard Ice | the low streets, the crowd | the same coveralls, faces covered | slogans, insults, "inyalowda go home" [C] | you gone |
| CFB cells | you seldom see them before they act | anything | nothing, until the bomb | the Republic out of the Jovian moons |
| LKC Asset Protection and BSS | Callanish, the corridors | grey armour, good rifles, company badges | professional, contemptuous, Earth accents | a free hand |
| Pur'n'Kleen Protective | Manannán | blue-and-white overalls, shotguns | cheerful, venal | their haulers safe and their cargoes unchecked |
| UNOME | on patrol with you, at checkpoints | UN blue armbands, unarmed | polite, exact, writing everything down | a violation, or the truth; both look the same to you |
| UN marines | Ganymede, embassy gates | UN blue-grey, older kit | loud, unhurried, at home at 1 G | to watch you fail |
| Belter civilians | every town | patched coveralls, tattoos, family badges | Lang Belta and quick humour | water, air, work, to be left alone |
| The Hungry Dark | the gulf, the market for stolen ice | stolen everything | nothing on open channels | what you carry |

---

## 10. The news

TIME sets when items arrive and VIEWS how they look; this is what the news is (my call on outlets and voice, LONGHAUL's model underneath [L]).

- **The model**: LONGHAUL's politics and conflict produce events; `intel.relay` sends each from its source at light speed (capitals: Earth for the UN, Mars for the MCR, Ceres for the OPA [L]; Europa's own news from Conamara). Every item carries its outlet, its source time and its age on arrival ("Ceres · 23 min").
- **Where a marine reads it**: the news board in the mess, Navy Radio Melas in the barracks, the wrist terminal's feed, the troopship's daily sheet (under OPSEC censorship during a movement), Europa's pirate radio under the ice.

| Outlet | Who | Voice |
|---|---|---|
| Republic Broadcasting (RB) | Mars, public | measured, official, the First Councillor's words in full |
| The Valles Courier | the valley's daily, Redwater | local, sentimental, farm prices and marine weddings |
| The Tharsis Herald | Londres Nova | political, sharp, the Congress' gossip |
| Spear & Ring | the Corps' monthly | proud, careful, promotion lists |
| Navy Radio (MCRN Broadcasting Service) | every base and ship | cheerful, cleared, music between bulletins |
| Tycho Voice | the OPA's Tycho Council | reasonable, Belter-proud |
| The Ice Courier | Conamara's paper | Ice Control's view, union news, air prices |
| Radio Thera | pirate radio, Thera Lens | Hard Ice's view; Lang Belta; songs |
| UN Press Service (UNPS) | Earth | institutional, confident, long |
| Ganymede Agricultural Wire | the GAC | prices, weather, neutrality |

Templates: LONGHAUL's politics headlines are used as written ("Budget fight: the {A} wins the vote against the {B}."; "Leaked files embarrass the {B}; the {A} denies any part in it."; "Investigators trace the money behind the {sub}'s raids to {backer}. {backer} denies everything."; "Bombings and sabotage on {body}: {Ceres Free Belt} cells against {power}.") [L], plus these (examples as they read at the start):

- RB · Londres Nova · 0 min: "Congress to vote this week on a second battalion for Europa. First Councillor Abernathy: 'We keep our word, and we keep it small.'"
- Tharsis Herald · 0 min: "Castellanos: 'Every marine on the ice is a century more under the domes.' The CUC tables the Hecate contract."
- The Ice Courier · Conamara · 47 min: "Air at 0.31 a cube in Murias after the seal attack. Council asks the Force for more patrols in the low streets."
- Radio Thera · 47 min: "Inyalowda go home. The Lantern says nothing, and the Lantern is right."
- UNPS · Earth · 19 min: "Observer Mission reports 14 detentions by Martian forces in November, all handed over within the Accord's six hours."
- Valles Courier · Redwater: "Barley up 4%. Dust devils over the Echo lines. A Redwater girl wins the long-ball cup for the Fourth."
- Spear & Ring: "Two-Four takes the Alert Battalion watch. Echo Company: 'Steady.'"
- Navy Radio: "Regional dust storm over Daedalia moving east; Melas Approach expects instrument flights Thursday."

---

## 11. Money and prices

- **The MCR credit** (written "MCR", spoken "credits", slang "reds"): LONGHAUL's currency [D]. In OLYMPUS it is the Republic's money and the trade unit of the system (my call: Martian banks clear the outer system's trade, so prices everywhere are quoted in it, as LONGHAUL quotes them); Earth uses UN dollars at home, the Belt uses credits and scrip.
- **Its worth**: **1 MCR ≈ US$14.5** of purchasing power, CAREER §12.1's scale, which this list follows (it replaces this section's earlier US$12). A Private's basic pay is **145 MCR** a 30-day period (CAREER §12.2: the US 2025 E-1's basic pay of about US$2,100, divided by 14.5), beside a merchant deckhand's 120 and LONGHAUL's ship wages of 150–560 MCR a month [L]. LONGHAUL's wholesale commodity prices stand behind it [L]: food 950 MCR/t, delicacies 7,500 MCR/t, water ice 260 MCR/t (dear because Mars imports volatiles; the water right makes household water cheap).
- Pay comes every 30 days on the UTC calendar [D]; meals in the mess, quarters, uniforms on first issue and medical care are free; uniforms replaced through negligence, lost kit and lost property are charged (WEAPONS and PEOPLE decide when). The terraforming levy is withheld at 1% (4.10).
- **This is the one price list** (`setting/prices.js`; my call on every price). CAREER §12.7's working table is folded into it (its items are all here, at these prices), and CAREER deletes its table and cites this one; PLACES's and PEOPLE's shops and TIME's `px` activity read their prices from it. A price that a shop or a stall varies (a town's markup, a seller's mood) is a multiplier on these, never a second list.

Prices (`priceMcr`; Melas and Redwater unless noted):

| Item | Price |
|---|---|
| **On base** | |
| Mess meal for a guest | 1.0 |
| Cup of brew at the PX | 0.12 |
| A PX counter lunch (soup, a vat roll, fizz) | 0.6 |
| Fizz (soft drink) | 0.15 |
| Red beer at the base club, 0.4 L | 0.4 |
| Extra slab (ration bar) | 0.25 |
| Hygiene kit for a month (soap, razor, toothpaste) | 2.0 |
| Boot socks, three pairs | 1.7 |
| Better dust gaiters than issue | 5 |
| Shooting gloves | 6 |
| An approved sling | 7.5 |
| Personal boots, better than issue | 18 to 40 |
| A knife: a utility folder; an Ochre Basin Ordnance folding knife; a fixed blade | 4; 10; 20 |
| A mechanical watch, Martian-made | 50 |
| A civilian wrist terminal, better than the issue one (which is free) | 25 to 120 |
| A printed book; a book file | 3; 0.3 |
| A training manual (SKILLS's books) | 1 to 3 |
| Haircut at the base barber | 0.5 |
| Express laundry (normal laundry free) | 0.4 |
| Replacement utilities set | 12 |
| A video letter to Earth or Jupiter (bandwidth) | 0.8 (text mail free) |
| A care package sent home | 2 to 5 |
| **Redwater** | |
| Bus, gate to Redwater, each way | 0.25 |
| Diner meal (beans, greens, vat) | 1.2 |
| A good dinner in town | 3 |
| A plate of farm goat | 7.5 |
| A dome-grown apple | 1.0 |
| Red beer in a Redwater bar, 0.4 L | 0.6 |
| A bottle of valley wine | 3 |
| Tharsis rye whisky, a measure | 2.0 |
| A cup of real coffee at a Redwater café | 1.5 |
| Real coffee beans, a 100 g bag (about ten cups; LONGHAUL's delicacies) | 2.5 |
| A night at the liberty hotel | 5 |
| Bathhouse, 10 hot minutes beyond your water right | 0.8 |
| Holo show | 0.8 |
| A tattoo, small to a sleeve piece | 8 to 30 |
| Civilian dust mask | 1.7 |
| **Travel** | |
| Rail, Redwater to Londres Nova (by the Highrim Incline and the plateau line, a day) | 15 |
| Hotel night in Londres Nova | 12 |
| Liner passage, Mars to Callisto (Valles Express line) | 2,000 |
| **Europa** | |
| Conamara canteen meal (food is imported from Ganymede) | 3.0 |
| Belter ice beer | 1.2 |
| Shower token, Conamara (water is cheap on Europa; heat is not) | 0.3 |
| Air levy for a visitor in an Ice Control town, a day (the force is exempt and pays by ledger) | 0.15 |
| A Lang Belta phrasebook file | 0.25 |

Replacement values the Corps charges for negligent loss (the scale is the point: TL4 kit is dear). Weapons and optics are WEAPONS §10.6's (the R-7 rifle 1,400, the P-12 pistol 450, the SO-4 sight 600), which replace this section's earlier figures. Suits and helmets (my call; WEAPONS and BODY may adjust): ballistic helmet 150, light vac suit 6,500, hardshell 22,000.

---

## 12. Names

Ported from LONGHAUL's `names.js` approach [L]: names are patterns filled from word lists chosen by culture; variety is a budget (each pattern's weight held to what its space can bear); a registry makes repeats impossible; tests print the entropy and the duplicate rate. `setting/names.js` holds the pools; PEOPLE's `personName(culture, homeKind, sex, rng)` draws.

### 12.1 Cultures and pools

| Culture | Given names | Family names |
|---|---|---|
| `mars-dome` | LONGHAUL's Mars list minus "Bobbie" [L] plus the additions below (45) | `MARS_FOUNDER` (83) at 20% (40% for a Londres Nova home), else `FAMILY` (387) |
| `mars-valley` | the valley list below (44) at 60%, the dome list at 15%, `GIVEN` (344) at 25% | the valley list below (48) at 45%, `FAMILY` at 50%, `MARS_FOUNDER` at 5% |
| `jovian` | LONGHAUL's Jovian list [L] | `FAMILY` |
| `belter` | LONGHAUL's Belt list minus "Naomi", "Camina", "Sadavir", "Diogo", plus the additions below | `FAMILY`; often a byname of habitat or crew ("of Tyre Shaft") |
| `earther` | LONGHAUL's Earth list plus `GIVEN` | `FAMILY` |
| `lunar` | LONGHAUL's Luna list | `FAMILY` |

Additions (my call):

- **Dome given** (to LONGHAUL's Mars list): Ansgar, Darius, Eira, Farid, Ingeborg, Roshan, Sigrun, Torin, Yasmin, Leontine.
- **Valley given**: Abel, Adina, Amir, Ash, Aurelio, Beni, Bryn, Cade, Calder, Cira, Dahlia, Dmitar, Ebba, Ekon, Esra, Faro, Gwen, Halim, Idris, Iker, Jalen, Janek, Kaveh, Keturah, Leander, Lumi, Mads, Marisol, Nasrin, Nico, Odalys, Omari, Rafe, Roza, Sabin, Saskia, Tobin, Ulises, Vanja, Wendell, Yasmin, Zeno, Zuri, Hollin.
- **Valley family**: Abara, Acevedo, Amadi, Arce, Baptiste, Barros, Bekov, Brannigan, Cardenas, Castell, Dagher, Darko, Eskandari, Esteban, Farouk, Fennick, Galvan, Grieve, Hale, Ibarra, Iwu, Jarrah, Kader, Kask, Loera, Madsen, Marangoni, Mendel, Navid, Ochoa, Okeke, Pasko, Quarles, Rahimi, Rask, Salo, Serrat, Tamez, Ugarte, Vasquez, Vey, Wallin, Yanez, Zamora, Redfern, Coldwater, Stonefield, Ashby.
- **Belter given**: Akin, Bertil, Chava, Dusan, Eko, Gaudi, Hasi, Ilan, Jiro, Kamu, Lual, Mosi, Nkem, Oyo, Paz, Rafi, Tavi, Uri, Vasu, Xola, Yeni, Zev.

### 12.2 Patterns and sex

A person's name is `{given} {family}` (single pattern; entropy comes from the pools: about 45 × 470 ≈ 21,000 per Martian sub-culture before the melting pot, and well over 100,000 with it). Given lists are split by sex where a name is conventionally one (a `sex` tag per entry, `any` for names worn by both); the split is data, not a rule. Middle names exist on papers only (one more `{given}` draw, at 60%).

### 12.3 Nicknames

PEOPLE's pools, keyed (my call; PEOPLE chooses when):

| Key | Examples |
|---|---|
| surname pun | Oak (Okafor), Bricks (Brannigan), Salt (Salo), Tamer (Tamez), Ice (Iwu) |
| home | Hellas, Valley, Domes, Callisto, Coast, Earth, Belt |
| body | Tall, Spin, Lungs, Thin, Bones, Heavy |
| deed | Berm, Twice, Seal, Dropsy, Long Ball, Fall, Slip |
| ironic | Sunshine, Lucky, Professor, Quiet, Speedy |
| doubled family name in a company (PEOPLE 3.5) | Big Okonjo, Little Okonjo, Tharsis Okonjo |

### 12.4 Callsigns and operation names

- **Unit callsigns**: battalions and regiments take a word from LONGHAUL's `MARTIAL` list [L] (2/4 BULWARK, the 4th Marines RAMPART, 1/7 SENTINEL, MSF-E WARDEN); companies their letter word; subordinate numbers as in 5.3.
- **Assault landers** carry a tail number ("Lander 21-04") and a crew name painted by the crew from LONGHAUL's Martian ship-name pools ("Second Spring", "Dust Devil", "Patient Furrow") [L].
- **Operations**: two words in capitals, drawn from Martian adjectives and nouns (`MARS_ADJ`, `MARS_NOUN`) for large operations (STILL WATER, STEADFAST FURROW), from winds and weapons (`MARS_WIND`, `MARS_WEAPON`) for raids (KHAMSIN PILUM), never repeated within the registry.
- **Ships**: LONGHAUL's generator as is for every hull [L], minus its canon entries (12.6).

### 12.5 The registry

`state.names` (PEOPLE's persistent registry, LONGHAUL's idea made persistent): every full name of a tier 1–3 person is unique in the world; a clash rerolls up to 10 times, then takes the middle name. Family names may repeat within a company (PEOPLE 3.5). Ship and operation names share the same registry by kind. **The public figures of 7.7 are registered at new game**, before the roster is drawn, so no generated person takes their full names; a public figure who later leaves office keeps the name, and a successor drawn by the world is registered the same way.

### 12.6 The canon blocklist

Never generated, as full names: James Holden, Naomi Nagata, Amos Burton, Alex Kamal, Roberta (Bobbie) Draper, Chrisjen Avasarala, Fred Johnson, Josephus (Joe) Miller, Julie Mao, Jules-Pierre Mao, Clarissa Mao, Camina Drummer, Klaes Ashford, Anderson Dawes, Praxidike Meng, Elvi Okoye, Marco Inaros, Filip Inaros, Anna Volovodov, Sadavir Errinwright, Michio Pa, Winston Duarte, Dimitri Havelock, Octavia Muss, Diogo Harari, Basia Merton, Carlos Baca. Never used as a family name for tier 1–2 people (the squad and the chain of command, where a player would notice): Holden, Nagata, Kamal, Draper, Avasarala, Errinwright, Inaros, Drummer, Ashford, Dawes, Duarte, Volovodov; and **the family names of the setting's public figures** (7.7: Strand, Brennan, Abernathy, Castellanos, Hakimian, Danso, Achieng, Otieno, Mahlangu, De Vries, and any successor's), because a squad leader who shares the Commandant's name reads as a plot point. Several of them are LONGHAUL's `MARS_FOUNDER` names, so the founders' pool for tier 1–2 draws loses them while they are in the news; tier 3 and the crowd may still carry them. Authored examples in the other sections (CAREER's, PEOPLE's) keep to the same rule. Ship names removed from LONGHAUL's pools: Donnager, Scirocco, Rocinante, Canterbury, Agatha King, Behemoth, Tachi, Thomas Prince, Seung Un, Okimbo, Ravi, Guy Molinari.

---

## 13. Reuse from LONGHAUL and tradecraft

| Source (read-only) | Verdict | What changes |
|---|---|---|
| `longhaul/js/sim/ephemeris.js` | **reuse as is** (TECH ports) | none; the distances in 2.4 are its numbers |
| `longhaul/js/sim/bodyfacts.js` | **reuse, edit text** | Mars' air composition [D]; "domes keep out the radiation" becomes "keep in the pressure and the warmth" (2.2) |
| `longhaul/js/sim/factions.js` | **reuse as is** | none; MSF-E and the Corps are units, not sub-factions |
| `longhaul/js/sim/politics.js`, `conflict.js`, `forces.js`, `intel.js` | **adapt** (TECH) | the prologue's constraints and pinned Europa zones (2.3); the injected timeline (7.7); news outlets (10) |
| `longhaul/js/sim/worlds.js` | **adapt the data** | `SETTLEMENTS`, `GROUND_CONTROL`, `AIRSPACE_NAMES`, `CONTROLLER_WORD` kept; towns and bases added in `setting/` |
| `longhaul/js/sim/ship-classes.js` | **reuse data, extend** | a `troops` column (6.2); the Coprates transport, the Simoom, Haboob and Mistral craft (6.3, 6.4) |
| `longhaul/js/sim/planetary.js`, `lambert.js`, `stations.js` | **reference (numbers)** | the drop's burns against the troop-rated cap (6.4), the rings' radii for spin (8.1); read-only from a scratch script, and through TECH's ports in `setting-craft.test.mjs` |
| `longhaul/js/sim/names.js` | **adapt** | person pools by culture and home (12.1), the canon blocklist (12.6), a persistent registry; ship pools as is |
| `longhaul/js/sim/careers.js` home given-name lists | **data** | trimmed of canon nods, extended (12.1) |
| `longhaul/js/sim/service.js` `RANKS.MCR` | **data** | the naval officer ladder, extended to Vice Admiral and Admiral (5.5) |
| `longhaul/js/sim/goods.js` prices | **reference** | the wholesale scale behind 11 |
| `longhaul/js/sim/dialogue.js` voices | **reference** | the Martian clipped register, UN read-backs, Belter Lang Belta (4.10, 9) |
| `tradecraft/src/sim/weather.js` | **reference (pattern)** | Mars' climate and dust table (4.4) as a pure function of site, seed and clock |
| `tradecraft/src/sim/cities/*.js` | **reference (pattern)** | a place is a data file of names, dress, people and look (`setting/mars.js`, `setting/jovian.js`) |
| `tradecraft/src/sim/people.js` `passerby()` | **reference** | crowd names by culture from 12.1 |

---

## 14. Testing: the numbers the tests print

- `setting-calendar.test.mjs`: the vectors of 3.8 (epoch MSD, Melas civil time, sol and month and weekday at the epoch and the start, Ls, the MY 211–216 boundaries and lengths, daylight at four Ls values).
- `setting-ephemeris.test.mjs`: Mars–Jupiter at the epoch 6.410 AU, at the start 5.734 AU, the minimum 3.68 AU in early August 2352 and the maximum 6.73 AU at the end of June 2351 (daily sampling); 1 G and 0.3 G transits at the start (6.86 and 12.52 days analytic); light times 47.7, 19.3 and 23.3 min.
- `setting-air.test.mjs`: the air table of 4.2 row by row (pressure, O₂, Earth-equivalent altitude, boiling point), within 0.1 kPa and 1 °C, and the hub's rows (−5 km 67.6–67.7 kPa, datum 52 / 16.6, +5 km 40 / 12.8, +10 km 30.7 / 9.8).
- `setting-names.test.mjs`: over 20,000 draws per culture, the duplicate rate of full names (target under 1 in 1,000 before the registry, 0 after); no blocklisted name ever; no public figure's family name in a tier 1–2 draw, and their full names registered before the roster; family-name share per pool within 2 points of 12.1.
- `setting-data.test.mjs`: every rank has a grade, abbreviation, insignia and address; every MOS a code and field; every home a share, kind and culture, shares summing to 100; every price positive, and no second price table in `src/` (a shop's prices are multipliers on this one); every Europa town in one of LONGHAUL's three airspaces; populations summing to 2.95 million ± 0.05; the hull table's afloat total, printed (801: frigates 15 each); the transport's wave (384) and waves for 980 (3); the MCMAP belt keys spelt `grey`.
- `setting-europa-dose.test.mjs`: the radiation table's times to 50 mSv (13 min bare, 33 min in a light vac suit, 1 h 50 min in a hardshell).
- `setting-craft.test.mjs` (my proposal; it runs OLYMPUS's own ports, TECH's `src/world/lambert.js` and `dropship.js`, never the sibling project, and holds them to the scratch run's numbers): the Europa drop from LONGHAUL's parking orbit on its 0.9 h and 2.3 h runs, printing **each burn's Δv, duration and peak G** (deorbit about 1.0 and 0.8 km/s; braking about 1.9 and 0.25 km/s, 77 and 10 s at the 2.5 G cap; the landing from the 10 km hover 90 s at under 1 G), and failing if any troop-carrying burn exceeds 2.5 G; Phobos jumps at 2, 2.5 and 3 m/s (370, 590 and 870 m up; 12, 16 and 20 min aloft); the spin table of 8.1 (ω, turn, rim speed; Ceres' 0.301 G at 5.5°; ±8% walking at 1.5 m/s; the 8 cm drop).
- `setting-ice.test.mjs`: the closure law of 7.3 against Nye's closed form in ice of one temperature (−20 °C at 600 m: 10 cm a year of half-width); the cold towns' closure, printed and under 10⁻⁶ m a year; Thera's widths lost a year with the cold lines on at 2,300, 2,500 and 2,700 m (27, 80 and 200 cm, ±15%); the cold lines off at 1, 7, 30 and 100 days at 2,500 and 2,700 m; a felt hole's sweat in a cold town (0.3 L an hour a square metre).

---

## 15. Fun

**Decisions and stories this world makes.**

- **The calendar is a rhythm**: a week of training sols and two rest sols; the timeslip's dead hour on guard; the dust season's afternoon devils and the storm that cancels the range; the Muster at the Grove; the Martian New Year on the ice, 47 light-minutes from home.
- **Light lag is a story engine**: the news of the Murias attack is 47 minutes old when it lands on the mess screen; a letter from home answers what you asked two weeks ago; orders arrive older than the situation they answer.
- **The Accord makes choices**: frangible inside pressure means you cannot shoot through a wall; six hours to hand over a prisoner means the clock runs on every detention; observers on patrol mean every act is witnessed; past the Thera line you have no right to follow.
- **Factions give faces to dilemmas**: the union steward who helps you and the Hard Ice cousin he shelters; the Star Helix sergeant who needs you to look like he is in charge; the LKC contractor who would rather you were not there; the UN observer who is either honest or EID.
- **The Corps' culture gives the barracks its texture**: nicknames, sayings, the visor tap, the dust stripe's story, the tree in the Grove for someone you knew.
- **Money is small and specific**: a private on 145 MCR chooses between a cup of real coffee in a Redwater café (1.5) and a dozen cups of brew, a night in Redwater or the watch he wants, a video letter or a text.
- **The hard numbers make the danger legible**: 33 minutes in a light vac suit on Europa's surface; a hardshell buys two hours; under a metre of ice a day costs about two chest X-rays, and in the towns less than one dental X-ray. In Thera a power cut is a tape measure across the street: the gallery a centimetre narrower each day within a week.

**Where it would turn into chores, and what removes them.**

- Reading every news item: the board shows headlines; the instinct mentions the one that matters to you; the rest waits in the archive.
- Customs repeated a hundred times a day: saluting and colours are performed by the body on a key (PEOPLE, VIEWS); only a missed one costs.
- Shopping: **the PX and the town's shops are entered and walked**, their shelves and racks fixtures that offer R (look, pick up, put back), and only **the purchase at the counter is a timed action**, as TIME §8.7's `px` has it ("browsing is lived"). These are the user's two tradecraft rules together: shops walked in since rc24 (the user, 2026-10-27: "doing the things like going out the back should be a thing we do when inside and not abstracted") and the purchase skipped since rc27 (the user, 2026-10-28: "went to buy a book in a bookstore, never came out even after 3 minutes"). Nobody is ever stuck inside a list.
- Transit legs: the lift to Phobos, the Pens and the voyage are chapters with key days lived (TIME); Callisto's reception is two to four sols of chosen activities, with the zeroing range and the Accord class lived.
- Dose bookkeeping: the dosimeter's number on the HUD and the NCO's "what's your number?" carry it; nobody does sums.

---

## 16. Build order

**0.1, a standby week at Base Melas** (needs from this section):

1. `setting/calendar.js` with its test vectors (3.8): the start date, Mars Year, sols, months, weekdays, holidays (Charter Day and the Birthday are outside the first weeks; the UTC Christmas falls in them).
2. Base Melas' lore and coordinates (4.9), Redwater's lore (4.8, for the bus and the Strip if liberty is in 0.1), Melas' climate with a pinned clear first sol and one local storm (4.4), the air at −4.5 km (4.2).
3. The Corps for the barracks: ranks, insignia and address (5.5), the player's chain and the company's callsigns (5.3), MOS 0311 and the squad's MOSs (5.6), utilities, PT kit, ship greys and the light vac suit for the suit drill (5.7), customs and the general orders (5.8), slang and sayings for the instinct (5.9).
4. Names: the Martian pools, the registry and the blocklist (12).
5. The news board with the prologue's archive and the Europa timeline up to the start (2.3, 7.7, 10); the Congress' vote as the week's beat.
6. The one price list, for the PX, the base club and the barber (11).
7. The settled names (1.4), so no template carries a working name.

**0.2, the voyage and the drop**: Phobos (6.1, its jumps), the Coprates transport and the Simoom (6.3, 6.4) with the drop's capped burns, the voyage doctrine and the movement table (6.5: 1 G out), Callisto's base and reception (7.2), the Crossing the Belt and flip customs (5.8).

**0.3, Europa**: the towns (7.4) and FOB Pwyll, the parties and their faces (7.5, 9), the Accord's clauses (7.6), the radiation table and the ice's closure law (7.3), Lang Belta phrases.

**Later**: the other cities and homes in full (4.7), Ganymede and the theatres (8), spin gravity at Ceres and the rings (8.1), Deep Recon and the Raider Regiment (5.10), MNI Special Activities, the Lorica (5.7), the embassies.

---

## 17. Cross-references

What this section needs from the others, and what they take from it. The contract patch's settlements (1.4) are listed by owner.

- **DESIGN (the hub)**: its decision log records the contract patch's calls (my calls, the user may overrule): the voyage doctrine (1 G out for the Alert Battalion and urgent movements, 0.3 G home, 0.38 G routine; 6.5), the light vac suit as a soft 34 kPa suit (5.7), the settled names (1.4) and the start date (3.7).
- **TIME**: implements the calendar (3) with these constants (`LS_EPOCH_DEG` 174.0 and Sol 1 on the Airy-0 sol replace its drafts); the start instant (3.7); shift names on Europa (3.6); the prologue's world steps (2.3) with TECH. **The voyage**: §12.5's default and §20 question 5 take the doctrine of 6.5 (the player's first voyage is 1 G, 7.3 days; 0.38 G stays the profile for routine rotations), and TIME's voyage tests print the 1 G profile as the default. The drop's powered part is 6.4's (a braking burn of up to about 77 s at the 2.5 G cap, then 90 s from the hover), not "1.5 min at up to 3.69 G". Shops: §8.7's `px` (browsing lived, the counter timed) is the rule 15 follows; its prices come from 11.
- **BODY**: reads the air table (4.2), the dust facts (4.4), Mars' and Europa's dose environments (4.3, 7.3), gravities and spin (8.1), the suits' identities (5.7) and the dose regulations (7.3); owns every physiological effect and the suits' life-support numbers. **The light vac suit is BODY §19's soft suit** (5.7): its 34 kPa is the one suit pressure, and §19.7 is the one donning table every section cites (COMBAT's 120 s, TIME's 8 to 11 min and CAREER's 90 s qualification align to it). One number to settle: §19.1's ×0.6 dose factor for the light suit against 7.3's table (2.2 of 5.4 Sv a day, ×0.41), whose 90 mSv an hour ROADMAP's `moment-surface` uses. The Phobos jump is 6.1's (600 m and 16 minutes, not escape).
- **SKILLS**: reads ranks (5.5), the MCMAP belts and their keys (5.5: `mcmap-grey`, not `mcmap-gray`; "gray" becomes "grey" in §6.6 and the reading tables), the MOS list (5.6) and languages (Lang Belta for Belters and linguists). Boot is 13 weeks in both. §10.2's backgrounds: `hecate-line` is "Hecate Arms & Drive's small-arms line at Ophir Chasma" (HAD makes no guns at Hellas, 4.10), and `old-domes` is "Highrim's old domes" (Redwater is an open-air town, 4.7).
- **WEAPONS**: owns the makers (§3.1), which 4.10 adopts; applies the Accord's ammunition clause (7.6, clause 4); sets the suits' and helmets' protection (§8.3's "light vac suit shell" is the soft suit with its hard shell, 5.7); its replacement values (§10.6) replace this section's for weapons and optics (11). §8.7's "at 30 kPa a 6.5 mm hole loses 3.7 g/s" is recomputed at BODY's 34 kPa.
- **COMBAT**: turns the doctrine (5.2) and the Accord (7.6) into ROE and escalation of force; flies the drop under the troop-rated limit (6.4); the suit-up time is BODY §19.7's.
- **PEOPLE**: generates people from the homes, shares, cultures, names and nicknames (4.7, 12), with the public figures' family names kept off tier 1–2 and their full names registered (12.5, 12.6); performs the customs and general orders (5.8); uses the faces (9) and the public figures (7.7: the Commandant is now General Halima Strand, so §14.4's and §18's Okonjo stays a squadmate); the Navy grades for corpsmen (5.5); "MCMAP" is the programme's settled name.
- **CAREER**: the start date replaces §5.1's working default (3.7); uses the MOS codes (5.6), ranks and insignia (5.5), awards and badges (5.7), the order of battle and bases (5.4), Deep Recon and the Raider Regiment names (5.10), the theatres and Ceres' 0.3 G (8, 8.1), MSF-E and Operation STILL WATER (7.6), the birthplaces' lore (4.7); sets the pay table (§12.1–12.2) whose scale 11 follows. **§12.7 deletes its price table and cites 11**; §12.4's "Air and water levy: 1%" becomes "**Terraforming levy: 1%**" (4.10's one name: civilians 12%, service members 1%), and the LES sample line with it. Its G-3 note ("the troopship's thrust is under 1 G") meets the 1 G doctrine (6.5): a G-3 marine rides the Alert Battalion's voyage at 1 G, and CAREER decides what that costs or excuses.
- **PLACES**: maps Base Melas, Redwater's Strip, the Highrim Incline, Little Conamara, Phobos' Pens, the Coprates transport's deck program, the Simoom, Camp Lofn, Camp Halloran, FOB Pwyll and the towns from this lore; confirms Melas' horizon profile (4.9). From the contract patch (1.4): **renames** "Noctis class" to the Coprates class and MCRN *Testudo*, D-16 to the Simoom (its cabin drawn for 44 couches, the silos sized for 26 m), L-60 to the Haboob, "FOB Conamara" to FOB Pwyll in the Pwyll airspace, "MCRN Base Callisto" to Camp Lofn, and its town templates to kinds whose instances take 7.4's names, all before any template is authored; flies the transport at doctrine's thrust (6.5), not a 0.38 G cruise; keeps its frigate detachment of 15 (6.2 now agrees); takes Ceres' 0.301 G and the rings' spin from 8.1 (§8's setting 12); runs the ice's closure law (7.3) from its liner model's face temperatures and these far-field temperatures; its Belter town standard is the towns' air (7.3). TECH §1.3, correction 7, applies to its chunks (§2.4, §11: lazy pure generation counted in cells generated per tick, no 4 ms budget).
- **VIEWS**: draws the Valles pattern and the other uniforms, the insignia and badges (5.5, 5.7), the flag and the emblem, the Martian sky (4.1), the letterhead ("Marine Corps, Martian Congressional Republic Navy" with the Spear and Ring); shows "Sol 590 · MY 211" on the watch. §7.2's sample `SUIT 30.2 kPa` reads at BODY's 34 kPa (`SUIT 34.0 kPa`). A jump on Phobos rises and hangs for minutes (6.1).
- **TECH**: puts these tables in `src/data/setting/` (1.3, correction 11); ports `ephemeris.js`, `factions.js`, `politics.js`, `conflict.js`, `forces.js`, `intel.js` and `names.js` (13); runs the prologue with its constraints; adds the transports as non-combat Navy hulls; its `src/data/hulls.js` carries the `troops` column (6.2).
- **ROADMAP**: the build order (16). §3.4's open disagreements are settled (1.4: the voyage thrust, the start date, the ship, craft and FOB names). `moment-drop`'s "powered descent of about two minutes at up to 2.5 G" becomes 6.4's braking burn of about a minute and a quarter at the cap and a minute and a half from the hover, and its "first breath of Ice standard air" becomes the towns' Belter town standard (at the FOB, Martian standard).

---

## 18. Open questions for the user

Settled in the contract patch (my calls, recorded in the hub's decision log; the user may overrule either, and the change is a constant):

- **The start date**: late 2351, **2351-12-19 02:20 UTC** (Mars–Jupiter 5.73 AU and closing, nine months of rolled-forward history), rather than LONGHAUL's own opening (2351-03-22, 6.41 AU, no prologue). CAREER §5.1 and TECH use it (3.7).
- **The first voyage's thrust**: **1 G out** for the Alert Battalion ("fight at one G"; 7.3 days, the standby's centrifuge sessions tested by a week at the gravity they train for), **0.3 G home** after months at 0.134 G, and 0.38 G for routine rotations (6.5). TIME's 0.38 G default yields to it.

Still open:

1. **Callisto first.** Should every Europa rotation stage through Callisto for two to four sols (reception, zeroing in vacuum, the Accord classes), as real forces stage into a theatre, or drop straight from the voyage? **Default: Callisto first.**
2. **The size of the Navy and Corps.** LONGHAUL's 12 warships and 3 battleships are kept as the combat fleet; OLYMPUS adds three troop transports outside LONGHAUL's force lists and a 53,000-strong Corps. Is growing the Navy's auxiliaries acceptable, or should transports come from LONGHAUL's existing hulls (battleships carrying a company each)? **Default: add the three transports.**
3. **Canon terms.** Keep Star Helix, Pur'n'Kleen, Tycho, Londres Nova, juice and Lang Belta (all already in LONGHAUL), or replace them with original names? **Default: keep them, flagged.**
4. **War with Earth after the start.** The prologue forbids an Earth–Mars war before the game opens; afterwards LONGHAUL's politics run free, so a war can break out mid-career (Ganymede becomes a front, leave is cancelled). Is that wanted from the first career on? **Default: yes, emergent.**
