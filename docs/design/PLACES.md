# PLACES

Where everything happens: the data model of sites, areas, rooms and fixtures; how people find their way; the environment each place holds (air, fire, heat, light, radiation, gravity, water, weather); Base Melas in full; the ships' deck programs; Phobos, Callisto and Europa; the special-operations settings; and how its variety is authored.

Written 2026-11-05 against DESIGN.md of the same date, which wins where this file disagrees. Numbers I chose are marked "(my call)"; the user's decisions are quoted with their dates. Lore and names of places belong to SETTING.md, and this file uses SETTING's: Base Melas as a division base (SETTING §4.9), the Coprates-class transport MCRN *Testudo* (§6.3), the Simoom and Mistral craft (§6.4), the Pens (§6.1), Naval Station Valhalla and Camp Lofn (§7.2), and Europa's towns at their depths (§7.4). A name SETTING does not yet give is marked "working name", and a test (section 11) fails on any name a template prints that SETTING's data does not hold.

Revised 2026-11-05 after the five critics' review: one troopship (SETTING's), one dose helper, one site record and one weather table (SETTING's numbers), Europa's towns at SETTING's depths with Ice standard air, Callisto split into its two sites, the Pens, a compact battalion area inside the division base, couches for every soul on a hull rated over 1.5 G, atomic path solves with a deterministic delivery, a ground waypoint graph, a flux-limited zone exchange, the Ring as ten car areas, walked searches.

Revised 2026-11-06 for the user's two rules of 2026-11-05 (the hub's Settled decisions): "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural", and "All people generated". Every place in this file is authored once and is the same in every career; what happens in it, and everyone in it, is procedural. Section 9 is rewritten as authored variety, section 9.5's grounds are laid with tools while authoring and committed as data, a site record carries no layout seed, and section 4 takes Base Melas's plan and walks as v0.0.2 built and measured them, with CONTRACTS §19's settlements of 2026-11-06 (items 2 and 11).

Revised 2026-11-06 for v0.0.4 as built: a drinking fountain in each wing's hallway of Echo's barracks, and the floors' counts with them (§4.4).

Revised 2026-11-07 for v0.0.7 as built: the KD range in full beside the 25 m bay, its lines, faces, pits, berm, flags, ready line, canopy and rope (§4.12, the build sheet `docs/build/0.0.7.md` §8 items 21 and 37).

Revised 2026-11-07 for v0.0.8 as built: `test-pairs`' turners and its 7 m and 10 m lines on the 25 m bay (§4.12, the build sheet `docs/build/0.0.8.md` §8 item 4).

Revised 2026-11-08 for the user's lore of that day (DESIGN.md's log; SETTING §5.11): what the Ring trains and what it cannot, the heavy day and the laser lane (§4.9); the deck range as the Corps' live range at 1 G (§5.2); the Void Operations School at Phobos, its Wells and the Wreck (§5.7).

Revised 2026-11-08 again for the user's rule of that day, "martian marines always train at 1G except for basic weapons training" (DESIGN.md's log; SETTING §5.11): **the Wheel**, the 1 G training hall buried under Base Melas (§4.15, X13 in §4.2), where the shoot house and the Hulk move (§4.12); the Ring's role narrowed and the heavy day withdrawn (§4.9); **the Drum**, the 1 G field off Phobos (§5.8); the School of Infantry's void week moved to its seventh week (§5.7). My calls throughout; the numbers [computed] are SETTING §5.11's.

## Summary of the model

- **The world is a set of sites** (Base Melas, MCRN *Testudo*, the Pens at Phobos, Camp Lofn and Naval Station Valhalla on Callisto, Pwyll Deep, a derelict). A site is made of **areas**: a building's floor, a ship's deck, a craft's cabin, a large enclosed level, or an outdoor ground. **One area is live at a time** (the hub). Outdoor grounds and very large levels stream their detail in **32 m chunks** around the player; a site's big objects (buildings, berms, targets) are always loaded as a light static index, so sight lines and the fog's reach run to 600 m, and the far window builds the one chunk under its point (section 2.4).
- **Areas hold rooms; rooms hold fixtures.** A fixture is a sized catalogue piece with **uses** (sleep, wash, eat, issue, shoot, suit…), **spots** where one stands or sits to use it, and **staff spots** for whoever works it. Spots are booked: no two bodies on one spot. Rooms are joined by **openings** (doorways, doors, pressure doors, hatches, airlocks); areas by **portals** (doors to outside, ladders, lifts, stairs, collars).
- **Navigation** is three-level. Inside the live area, an A* with a binary heap runs on a **0.25 m grid** per clearance class, string-pulled straight, toward the next node of a coarser route. Across a building or deck a **room graph** of openings picks the rooms; across a site and for everyone off-map, a **site graph** of portals and authored ground waypoints gives routes and closed-form positions. Solves are atomic and their results land on a tick fixed by their cost, so a saved and loaded game walks the same paths.
- **The environment is a gas model of air zones** (O₂, N₂, CO₂, H₂O, CO, soot and temperature per zone, ideal gas), joined by openings through the **compressible orifice equation**, with a flux limiter so the exchange is stable and independent of order at any step. A hole's size sets its time constant: a bullet hole in a 100 m³ compartment leaks for hours, a fist-sized hole (100 cm²) brings it to the Armstrong limit in about three minutes, a door-sized breach in about two seconds. Life support pulls zones back to their set points. **Fire** burns per 0.5 m cell on fuel, oxygen and pressure; **lighting states** follow power and orders; **radiation** is one helper, `doseAt`, for every section; **gravity** is a vector per area that a ship's thrust can change mid-scene (section 3.11), and every place's gas, gravity, light, surface and temperature come from one environment record read through one helper each (sections 1.2, 1.3, 3.16: nothing here assumes Mars, TECH §1.4); **weather** on Mars is a pure function of site, date and the world's seed, on SETTING §4.4's table (weather is something that happens in a place, so it is procedural).
- **Base Melas** is SETTING's division base on the floor of Melas Chasma. The player lives in **the Two-Four lines**, 2/4's battalion area of about 360 × 180 m where barracks, mess, armoury, aid station, gym and field lie within 120 m of Echo's door; round it, **Main Side** (1,000 × 700 m) holds the base's shared buildings, reached on foot, in formation or by the base shuttle; further out lie the other districts, Melas Field, the ranges and the training areas. Every building has a plan; the ones a marine lives in are specified room by room.
- **Ships** are stacks of decks along the thrust axis, authored as ASCII templates at 0.5 m a character and stacked by **deck programs** (LONGHAUL's idea, at real scale): the Coprates-class assault transport, a Hellas-class frigate with its marine detachment, a Tharsis-class corvette, the Simoom's and Mistral's cabins, and the Pens at Phobos. Every hull rated over 1.5 G has a secure seat for every soul aboard.
- **Europa** has three town templates (the shaft town, mapped onto Pwyll Deep; the gallery town, Thera Lens's form; the rig camp), 2/4's forward operating base in Pwyll Deep, four checkpoint templates, the water and power works (the Tyre Works), markets, housing and clinics, all at SETTING's depths and in Ice standard air. **Twelve special-operations settings** cover vacuum, spin, micro-g, ice, radiation and derelicts.
- **The world is handcrafted; what happens in it is procedural** (the user, 2026-11-05: "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural"; **reconciled 2026-11-08** with "We will play in predefined chunks (scenes) that will be generated using basic rules" by section 9.9: the career's places stay authored, and a mission's scene somewhere the career never lives is assembled from authored chunks by rules). Every site, area, building, deck, town and ground in this file is authored, placed by hand, and the same in every career: nothing in a layout or its dressing is rolled per world or per career, and a site record carries no layout seed. What happens there is drawn from the world's seed and the career's choices: events and incidents, weather, assignments and orders, opportunities, and **mission details** (objectives, the opposition, intel, timing, and where inside a handcrafted place things happen), which CAREER, COMBAT and PEOPLE deal into these places (section 8). Every person in them is generated (the user, 2026-11-05: "All people generated"; PEOPLE).
- **Variety is authored** (section 9): templates are authored layouts, at least three of every kind across the authored buildings (three squad bays laid out three ways, not three rolls of one), each building dressed once by hand (makes, finishes, wear, a culture's way of keeping a place), with tools that propose a layout or a dressing while authoring and whose output is committed as data and finished by hand; validated by tests that prove every spot reachable and every exit visible.

---

## 1. The data model

### 1.1 Frames and units

- **Metres everywhere**, x east, y up, z south (toward the camera), as tradecraft's plans (`tradecraft/src/sim/interiors/plan.js`). The camera always looks along −z ("north") and 45° down.
- **Site frame**: the site's own origin and axes. **Area frame**: an area's origin given in the site frame (`originM`), same axes. All buildings on a ground are axis-aligned to the site grid; a template is placed only turned by 0° or mirrored east–west (tradecraft's `mirror()`), never rotated (my call: the pixel art draws boxes on the grid, and a turned building would smear).
- **Ship decks**: x is starboard, z is ventral (toward the keel, so the keel is at the bottom of the screen and **screen-up is the dorsal side on every deck**, VIEWS's rule), y is toward the bow. Under thrust, "down" is −y, into the deck. **Decks are numbered from the bow**: Deck 1 is the most forward, and ladders go "down" toward higher numbers.
- **Heights**: `floorY` per area (a building's storey at 3.4 m intervals, a ship's deck at its deck height), `ceilingM` per room (clear height). Base buildings 3.0 m (my call: a lope at 0.38 G lifts the head 0.2–0.3 m, and 2.8 m reads cramped to a bounding Martian); ship decks 2.4 m clear in 3.0 m deck-to-deck; Europa corridors 2.4–3.2 m with padded ceiling strips (section 7.1).
- Every constant carries its unit (`cellM`, `ceilingM`, `volumeM3`, `leakM2`, `doseUSvH`).

### 1.2 Sites

A site is authored once as a template and is the same in every career: it carries no seed, so there is nothing to roll (the hub, 2026-11-05: the world is handcrafted). Its version pins what saves rebuild (`template@version`, section 9.1). Shape (the instance as saved is only the template id and the deltas, section 1.10):

```json
{
  "id": "melas",
  "kind": "base",
  "template": "melas@1",
  "body": "Mars",
  "geo": "melas",
  "clock": "mars-local",
  "outside": { "kind": "air", "air": "mars-melas", "weather": "mars-weather" },
  "gravity": { "regime": "surface", "down": [0, -1, 0] },
  "inside": { "air": "martian-indoor" },
  "routine": "melas",
  "lighting": "base",
  "water": "melas",
  "palette": "mars",
  "horizon": "melas",
  "areas": ["melas.ground", "melas.echo.1", "melas.echo.2", "..."]
}
```

**The site is the environment record's middle layer** (the user, 2026-11-08: "the systems we build need to allow for procedural generation of scenes and missions on earth the same way as on Europa or Ganymede or some portion of a station under Ceres"; TECH §1.4). `body` names a row of `BODIES` (Mars, Earth, Europa, Ganymede, Callisto, Ceres, Phobos, `none` for deep space: surface gravity, day length, sky class, default palette and ground); `clock` one of `CLOCKS` (`mars-local`, `utc`, `earth-local`); `outside.air` a row of `AIRS` (section 3.2's table as data); `gravity` a regime and a vector (section 3.11); `lighting` a regime of `LIGHT_REGIMES` (base, ship, town, emergency, with their moods and times); `water` and `palette` the site's. All of them are data in `src/data/places/env.js` and the site records, which live in one registry (`src/data/places/sites.js`) that `model.js` and `sun.js` both read; a site whose record names no body, air or palette **throws**, so no Melas default can hide a missing wire.

`geo` names the site's place on its body, which SETTING §3.8's `SITES.melas` carries in `src/data/setting/calendar.js` (latitude, longitude, altitude); `horizon` names its walls, this section's own data (`MELAS_WALLS` in `src/data/places/melas.js`: the walls' distances and heights, section 3.15), which `src/sim/places/sun.js` reads (my call: one record each, as built in v0.0.3). This section owns the site's numbers (section 4.1, CONTRACTS §2), and PLACES, TIME and VIEWS read them there: nothing copies them (the hub: one quantity, one helper).

| `kind` | Examples | `gravity.regime` | `outside.kind` |
|---|---|---|---|
| `base` | Base Melas, Camp Lofn, Naval Station Valhalla, 2/4's forward operating base | `surface` | `air` (Mars, Earth), `vacuum` (Callisto, Europa) |
| `ship` | the Coprates-class transport, frigate, corvette, the Simoom, the Mistral | `thrust` (the hull's felt G and its direction, a profile of events: section 3.11), `free` when coasting | `vacuum` |
| `station` | the Pens at Phobos, a relay station, a ring station | `micro`, `spin` | `vacuum` |
| `town` | Pwyll Deep (the shaft template), Thera Lens (the gallery template), a rig camp | `surface` | `vacuum` (the town's own air inside) |
| `wreck` | a derelict, a pirate lair | `free`, `micro`, `spin` (tumbling) | `vacuum` |
| `field` | the Talus training area, a crash site | `surface` | by body |

Sites far from the player are never simulated. Their places exist only as template plus deltas until the player arrives (LONGHAUL's rule: "far-away things get outcomes, not simulation"); what happens there meanwhile is procedural, an outcome written into those deltas (section 3.1).

**As built in v0.0.11** (`src/data/places/sites.js`, `SITE_LIST`; `TEST_SITE` and `MELAS_SITE` live there, no longer in melas.js and testroom.js). The record has `gravity: { regime, down }`, and a `surface` site reads its gG from its body (`BODIES.mars.gG` 0.38: one home for the number), so the example's old `gG: 0.380` is gone; a site may override it. A site also carries `inside: { air }`, the air of its buildings and decks (`martian-indoor` at Melas), `routine` (a row of `src/data/pod.js` `ROUTINES`, its Plan of the Day: `reveilleH`, `reveilleHolidayH`, `tapsH`, `holidays`) beside `water` (a row of `src/data/activities.js` `WATER_MIN`). `CLOCKS` rows carry `day` (`'sol'` or `'day'`) and `built`; `'earth-local'` is not built and throws where a site names it. A site with no routine or no water throws where it is read. `model.js` `lonOf` throws for an unknown site and for a site not on Mars's clock; before any site is entered it returns the start site's. Hours of the Plan of the Day have one home, `ROUTINES.melas` (reveille 5.5 h, 7.0 h on holidays 5 and 6, taps 22.0 h); the evening's 18.0 h is `LIGHT_REGIMES.base.hours.eveningH`. The DI's hours (grooming from reveille minus 0.5 h to taps minus 10 min, the taps window, the evening at taps minus 1 h, the night) are read from the site's routine; his words still say "Taps at 22:00" as literal text until a site keeps other hours.

### 1.3 Areas

| `kind` | What | Size rule | Nav grid |
|---|---|---|---|
| `ground` | open outdoor ground of a site | unbounded in principle, chunked | per 32 m chunk |
| `floor` | one storey of a building | ≤ 120 × 80 m | one grid for the area |
| `deck` | one deck of a ship or station | its hull section | one grid |
| `craft` | a small vehicle's interior (a Simoom's cabin, a rover, a car of the G-house's Ring; a lift car is not one) | ≤ 30 × 10 m | one grid |
| `hab` | a large enclosed level (a Europa town level, Camp Lofn's streets, the Pens) | larger than 64 m on a side | chunked like ground |

There is no wrapping area (my call, after the feasibility review): a spinning ring is a loop of `craft` or `deck` areas joined by portals (the Ring's ten cars, section 4.9; a ring station's rim sectors, section 8), so the nav grid, A*, collision, the actor grid, sight, hearing, batching, cutaways, the camera's clamps and the fog all keep their plain 2D form. True wrapping waits for the spun ring station at 0.7, if it is still wanted then.

```json
{
  "id": "melas.echo.1",
  "site": "melas",
  "kind": "floor",
  "name": "Echo Company barracks, ground floor",
  "floorName": "ground floor",
  "level": 1,
  "originM": [480, 0, 190],
  "boundsM": { "x0": 0, "z0": 0, "x1": 84, "z1": 24 },
  "plan": { "template": "barracks-company@1", "variant": "A", "mirror": false, "dress": "echo" },
  "gravity": null,
  "air": null,
  "surface": "tile",
  "sky": "none",
  "lightingDefault": "normal",
  "portals": ["o:echo:front", "o:echo:east-exit", "o:echo:west-exit", "l:echo:stairs-up"]
}
```

`gravity: null` means the site's, and so do `air: null` (the area's inside air, from `AIRS`), `sky` (`open` or `none`: a ship's deck or a building's floor has none), `palette` and `surface` (the area's default floor, an id of `SURFACES`, section 2.7). The most specific layer that sets a field wins: body, site, area, then the zone and the room (a zone's gas and temperature, a room's surface, light state and noise), then the **live** layer in `state.places.live.env` (gravity now, the brace state, a forced light level, any scene override; saved, so a save made mid-burn carries on byte for byte). A scene's environment is a preset or a set of overrides on top of these (section 3.16); an area that names none of them reads its site's. `plan` names the authored layout and `dress` the authored dressing of this building (section 9.2): both are data, the same in every career, with no seed. A building's ground floor is a `floor` area of its own: walking through its front door is an **area change** (VIEWS's scene cut at the door). Only **small structures** of one room and at most 100 m² (a guard shack, a sentry box, the range tower's base, the range shack, a bus shelter) are **inset** in the ground area and opened in place by the slot cut (VIEWS, my threshold). **Open structures** (a canopy on posts, the range's firing points and pits, the reviewing stand, the rail halt's platform) belong to the ground area whatever their size.

### 1.4 Rooms

```json
{
  "id": "e1.bay-2-1", "area": "melas.echo.1", "kind": "squadBay",
  "name": "1st Squad, 2nd Platoon",
  "rect": [49.0, 0.3, 60.6, 7.6], "ceilingM": 3.0,
  "zone": "e1.z.bay-2-1",
  "floor": "sinterTile", "wall": "paint:melasCream", "lamps": "bayStrip",
  "owner": { "unitId": "2/4-E-2-1" }, "access": "unit:2/4-E-2",
  "capacity": 15, "noiseDb": 35,
  "grime": 12
}
```

- `rect` is `[x0, z0, x1, z1]` in the area frame. L-shaped rooms are two rects with one id (`rects: [[…], […]]`).
- `kind` drives the dressing, the default lamps and the activity offers. Kinds used in this file: `squadBay, rackRoom, head, shower, laundry, closet, lounge, hall, lobby, office, conference, classroom, mess, galley, scullery, serving, store, coldStore, armoury, cage, shop, exam, ward, pharmacy, gym, mat, chapel, bar, retail, range, booth, tower, lock, suitLoft, tank, garage, bay, plant, control, berthing, crewMess, sickbay, brig, bridge, cic, trunk, magazine, tankDeck, hangar, cabin, concourse, market, pod, works, checkpoint, sangar, cell`.
- `access` is who may enter without cause: `all`, `unit:<id>`, `rank>=<grade>`, `staff:<post>`, `key:<id>`, `none`. Entering without access is allowed physically and read by PEOPLE's discipline and perception (a marine in the CO's office uninvited is a story, not a wall).
- `capacity` is for bookings and for PEOPLE's crowd budgets.
- `noiseDb` is the room's ambient level at its busiest (SKILLS and COMBAT read it for hearing and comms; my values in the templates).
- `grime` 0–100 is the room's cleanliness, a place-level twin of the body's hygiene (section 3.13).

### 1.5 Fixtures, uses, spots and booking

The catalogue is tradecraft's `FURNITURE` shape (`tradecraft/src/sim/interiors/furniture.js`): `{ w, d, h, block, wall, y0, use, seats, spot, staff }`, sizes in metres in real proportions, as the piece stands facing `down` (+z), with `footprint()` swapping w and d when turned left or right. OLYMPUS adds:

- `uses: [..]` (a piece may offer several: a squad bay table is `study` and `clean`);
- `make` (the look, at least three per kind, section 9);
- `secured` (`true` for anything bolted; loose things fall aft at a burn and float in free fall);
- `fuel` (kg per 0.5 m cell, for fire) and `material` (for penetration, section 3.15);
- `power` (the bus it draws from) and `lightKind` (if it is a lamp or glows);
- `state` (per kind: a door's dogs, a rack's curtains, a locker's lock, a target's face, a tank's litres).

A fixture instance:

```json
{ "id": "f:e1:rack:07", "kind": "rack2", "make": "steelTube", "x": 51.2, "z": 1.33, "face": "down",
  "room": "e1.bay-2-1", "assignedIds": ["p233", "p412"], "state": { "curtains": [0, 1] } }
```

**Spots and seats** are offsets from the piece's centre turned with it (tradecraft's `seatsOf()`); `spot` is where one stands to use it, `seats` where one sits or lies, `staff` where its operator stands. Each spot has an id `<fixture>#<n>` and holds at most one body. As built in v0.0.3 (`src/sim/places/fixtures.js`): a kind's `seats: [{ n, dx, dz, y, use, head }]` are numbered after its spots (a `rack2`'s spot #1 is its foot, its seats #2 lower at y 0.45 and #3 upper at y 1.35; a `rack1`'s #2 at 0.45; a footlocker's #2 at 0.40; a stool's and a chair's #1 spot is the seat, at 0.47 and 0.45), and seats are not walking spots; a rack lists its berths' billets (`berths`, lower first, null a spare) with each berth's locker and footlocker, so `berthOf(unitId, billet)` and `seatOf(seatId)` answer from data alone, and `postOf(postId)` names a post's seat (the fire watch's, section 4.4). A kind's `sightH` is how high it blocks sight (its `h` unless the catalogue says otherwise; `rack2` and `rack1` 1.0 m, so a standing eye sees into a bay's racks: PEOPLE §7.6). v0.0.3 adds the kinds `wallClock`, `stairs` (1.2 × 4.8 × 3.4, cost 15; no block until v0.0.6, guarded since: below), `stairsWell` (blocks but its top `STAIR_TOP_M` 1.0 m) and `lampPost` (0.25 × 0.25 × 4.0, blocks), each equal to the kit's `FOOTPRINTS`. `openTopOf(fx)` gives that top, the landing. **The kit draws the landing, its DOWN mark, the dark well and the guard from the same rule**, `src/art/kit/structure.js` `stairEnd` (a flight's back is its top, the rule `blockRectOf` already kept), and `places-stairs` holds the two equal in every area, within the 1/16 m pixel the builder snaps to (v0.0.5; v0.0.4 drew the landing at the well's front, the user's report of 2026-11-06, VIEWS §2.9).

**A flight is entered only at its foot** (as built in v0.0.6, `src/sim/places/fixtures.js`; the user, 2026-11-07, playing v0.0.5: "we can get on the upwards staircase from the wrong end"; DESIGN.md's log). A `stairs` flight is no longer a kind that blocks nothing: v0.0.5's could be stepped onto from its open side right beside its top, one step from the floor's band. `flightGuardOf(fx)` is what it stops walkers on, in this order: its closed far end (`FLIGHT_END_M` 0.06 m across its top); a rail `FLIGHT_RAIL_M` 0.06 m wide along each long side, from the top to the end you step onto, stopping `FLIGHT_FOOT_M` 1.2 m short of the foot on the side the fixture names `open` (`'left'`, its −x as it faces down; `'right'`, its +x; both sides when it names none); and, when a side is named, a rail across its foot, so it is stepped onto from that side only. `flightLaneOf(fx)` is the treads between the rails; `flightFarOf(fx)` is its last `STAIR_TOP_M`, where its band may fire, reached only up the lane. A flight with `dir: 'down'` is the same turned end for end. **A `stairsWell`'s guard runs on along its landing's two long sides** (`landingRailsOf(fx)`, `WELL_RAIL_M` { rail: 0.05, wall: 0.12 } by make), so the landing is walked onto across its far edge only (v0.0.5's open sides let a walker crossing the room past it slide onto it and down mid-stride). `blockRectsOf(fx)` is the one list of blocked rects the nav grid and collision read (a flight's guard; a well's `blockRectOf` and its landing's rails; any other blocking piece's `blockRectOf`). The kit's `flightGuard` (`structure.js`) keeps the same rule, and `places-stairs` holds the two equal. `FLIGHT_FOOT_M` is 1.2 m so that the suited C2 (0.8 m) passes the opening on the 0.25 m grid (1.14 m between the foot's rail and the newel); at 1.0 m the grid shut C2 out (my calls: the three widths, the rail across the foot, the landing's rails and the `open` side in data).

**Booking** (LONGHAUL's mess rule, the user's at v1.2.0, 2026-10-24: each diner books a place of their own, "no two bodies on one spot, and behaviour must match the picture"): `book(state, spotId, who, untilMs) → ok | taken`, `release(state, spotId, who)`. Bookings live in `$bookings` (runtime) and are rebuilt on load from where persistent people are (PEOPLE). A walker heading to a spot books it before setting off; if taken on arrival, it books the nearest free spot of the same use in the room, else queues (section 2.6).

**The fixture catalogue.** Sizes are w × d × h in metres. `B` blocks movement. Uses in italics.

| Group | Kind | Size | B | Uses and spots |
|---|---|---|---|---|
| Berthing | `rack2` two-high bunk, curtained | 0.95 × 2.05 × 1.75 | yes | *sleep* (2 seats: lower y 0.45, upper y 1.35), *rest*; a ladder spot at the foot |
| | `rack1` single rack | 0.95 × 2.05 × 0.60 | yes | *sleep* |
| | `rack3` three-high "coffin rack", curtained, pan locker under each mattress (transit barracks and anything that never burns: Camp Lofn's Transit) | 0.80 × 2.00 × 2.10 | yes | *sleep* (3 seats at y 0.30, 0.95, 1.60), *store* |
| | `couchRack` two-high **berth couch** (MCRN hulls): each berth a contoured couch on a gimbal frame, five-point harness, juice port, reading lamp, curtain, pan locker under it | 0.85 × 2.10 × 2.10 | yes | *sleep*, *strap in* (2 secure seats at y 0.35 and 1.25), *store*; you sleep in your couch, so a secure call is a few steps (my call, the Expanse's berthing couches) |
| | `bagRack` micro-g sleeping-bag rack (the Pens): a steel frame of 5 tiers, two elastic bags a tier back to back, tethers, a privacy flap | 0.90 × 2.10 × 11.0 (a tier every 2.2 m) | yes | *sleep* ×10 in micro-g only, *store* (a net bag a berth) |
| | `wallLocker` | 0.60 × 0.60 × 1.90 | yes | *store*, *dress* (spot 0.55 in front) |
| | `footlocker` | 0.80 × 0.45 × 0.40 | yes | *store*, *sit* |
| | `podFamily` (Europa) | 4.0 × 3.0 × 2.4 | yes | a room-in-a-room with a door: *sleep* ×4, *store* |
| | `capsule` (Europa, stacked ×3) | 1.0 × 2.0 × 1.0 each | yes | *sleep* |
| Hygiene | `toiletStall` (partition, door, toilet) | 0.90 × 1.50 × 2.00 | yes | *toilet* |
| | `urinal` | 0.45 × 0.35 × 0.60 (y0 0.4) | no | *urinate* |
| | `sinkRow` (per basin, counter and mirror) | 0.60 × 0.55 × 0.90 | yes | *wash*, *shave* |
| | `showerHead` (open bay, push-button: one press runs the site's `pressMin` at its `flowLMin`, section 3.12) | 1.00 × 1.00 | no | *shower* |
| | `showerStall` | 0.90 × 0.90 + 0.60 dry | yes | *shower* |
| | `vacToilet` (ships, zero g: thigh bars, suction) | 0.70 × 0.80 × 1.20 | yes | *toilet* |
| | `washer`, `dryer` | 0.70 × 0.70 × 0.90 | yes | *launder* |
| Meals | `messTable8` (with fixed stools) | 2.40 × 2.20 × 0.75 | yes | *eat* ×8 |
| | `messTable4` | 1.20 × 2.20 × 0.75 | yes | *eat* ×4 |
| | `serveSeg` (serving line segment, sneeze guard) | 1.50 × 0.90 × 0.90 | yes | *serve*: 1 spot in front, 1 staff behind |
| | `trayStart`, `drinks`, `utensils` | 1.20 × 0.70 × 0.90 | yes | *tray*, *drink* |
| | `dishReturn` (window and conveyor) | 2.00 × 0.80 × 1.00 | yes | *return* |
| | `headcount` (clerk's desk and reader) | 1.20 × 0.60 × 0.75 | yes | *checkIn*: queue spot, staff |
| | `galleyRange`, `kettle`, `oven`, `prepTable`, `dishMachine` | 1.0–3.0 × 0.9 × 0.9 | yes | *cook*, staff only |
| Arms | `rifleRack` (10 rifles, locking bar) | 1.60 × 0.50 × 1.40 | yes | *stow*, *draw* (armourer) |
| | `pistolCab` (30 pistols) | 0.90 × 0.60 × 1.20 | yes | *stow*, *draw* |
| | `issueWindow` (Dutch door, counter, pass-through) | 1.20 × 0.60 × 1.10 | yes | *issue*: customer spot, staff spot |
| | `clearingBarrel` (sand-filled, 45° tube) | 0.60 × 0.60 × 1.00 | yes | *clear*: spot facing it |
| | `armourerBench` (vise, tools, parts drawers) | 2.00 × 0.80 × 0.90 | yes | *repair* (staff) |
| | `cleanTable` (outdoor, solvent tank, air hose) | 2.40 × 0.90 × 0.90 | yes | *clean* ×4 |
| | `ammoLocker` (ready-use, ships) | 1.20 × 0.60 × 1.80 | yes | *draw* |
| Work | `desk` (+chair) | 1.60 × 1.40 × 0.75 | yes | *work*, a visitor spot in front |
| | `dutyDesk` (logbook, phone, key box, clock) | 2.00 × 1.20 × 1.00 | yes | *checkIn* (front), staff behind |
| | `counter` (clerk window) | 1.80 × 0.60 × 1.10 | yes | *checkIn*: queue spot, staff |
| | `confTable12` | 4.80 × 2.60 × 0.75 | yes | *brief* ×12 |
| | `classDesk2` | 1.40 × 1.20 × 0.75 | yes | *study* ×2 |
| | `podium`, `screenWall` | 0.6 × 0.5 / 3.0 × 0.1 | yes / no | *teach* / *watch* |
| | `console` (ship station, crash-rated seat) | 1.20 × 1.40 × 1.20 | yes | *stand watch*, secure seat |
| | `wallClock` (TIME's faces) | 0.30 × 0.05 (y0 2.2) | no | read |
| Medical | `examBed` | 0.80 × 2.00 × 0.80 | yes | *treat* (patient seat), staff spot |
| | `traumaBay` (bed, monitor column, suction) | 1.60 × 2.60 | yes | *treat* |
| | `autodoc` (enclosed) | 1.00 × 2.40 × 1.40 | yes | *autodoc* (patient lies in) |
| | `pharmacyWindow` | 1.20 × 0.60 | yes | *checkIn* |
| | `stretcherRack`, `wardBed` | 0.9 × 2.1 | yes | *sleep*, *treat* |
| Fitness | `squatRack` with flywheel loader | 1.50 × 1.50 × 2.30 | yes | *lift* |
| | `bench`, `dumbbellRack`, `rower` | 0.6 × 1.8 / 2.0 × 0.6 / 0.6 × 2.4 | yes | *lift*, *row* |
| | `gTreadmill` (harness pulls the runner down toward 1 G) | 0.90 × 2.20 × 2.00 | yes | *run* |
| | `matTile` (combatives) | 1.0 × 1.0 × 0.04 | no | *spar* |
| Suits | `suitStand` (locker, stand, charging umbilical, O₂ and water top-up) | 0.80 × 0.70 × 2.10 | yes | *suit* (don, doff, check, charge) |
| | `leakBell` (suit leak test chamber) | 1.20 × 1.20 × 2.20 | yes | *test* |
| | `crashCouch` (gimballed, secure seat) | 0.75 × 2.00 × 1.00 | yes | *strap in* |
| | `troopCouch` (the Simoom's and the Mistral's crash couches, gimballed) | 0.60 × 1.10 × 1.20 | yes | *strap in* |
| | `gMat` (storm shelter: a padded strap-down mat with harness points, rated to the hull's `ratedG` lying flat, not to jinks) | 0.80 × 2.00 × 0.08 | no | *strap in* (shelter only), *rest* |
| Ranges | `firingPoint` (prone mat, number post) | 1.00 × 2.00 | no | *shoot* (prone, kneel, stand) |
| | `targetCarrier` (pits) | 1.80 × 0.40 × 3.60 | yes | *mark* (pit spot behind the berm) |
| | `boothDivider`, `rangeBench`, `bulletTrap` | tradecraft's range set | yes | *shoot* |
| | `steelTarget`, `paperStand` | 0.6 × 0.3 | yes | target (WEAPONS) |
| Leisure | `pew5`, `altar` | 2.50 × 0.60 / 1.6 × 0.8 | yes | *sit* ×5, *pray* |
| | `poolTable`, `barCounter`, `barStool`, `screenWall` | 2.5 × 1.4 / n × 0.6 | yes | *play*, *drink*, *watch* |
| | `commBooth` (light-lagged messages home) | 1.00 × 1.00 × 2.10 | yes | *call* |
| | `vending`, `gondola`, `checkout`, `barberChair` | real sizes | yes | *buy*, *pay*, *haircut* |
| | `barberPole` (v0.0.6: the PX barber's pole on its own steel stand, a red, white and blue spiral in a glass tube 0.3 m wide and 0.8 m tall from 1.3 m, chunkier than life so its spiral reads at 16 px/m; makes `pole` and `lit`, its tube glowing after dark) | 0.36 × 0.36 × 2.20, `sightH` 0 | yes | *haircut*: one spot 0.65 m beside it on its left as it faces you, facing it, so the pole never stands between you and the camera (my calls) |
| Plant | `pump`, `filterBank`, `tankV` (vertical), `heatX`, `scrubber`, `electrolyser`, `melter`, `breakerPanel` | 1–6 m | yes | *operate*, *repair* (staff) |
| Movement | `handhold` (every 1.0 m in micro-g spaces), `towLine` (moving loop, 1.0 m/s), `magStrip` (ferrous deck strip, 0.3 m wide) | line or point | no | BODY's locomotion reads them |
| Cover | `iceBag` wall (water bags frozen), `sandbag` wall, `berm`, `jersey` barrier | per metre | yes | cover (COMBAT), with `material` |

**As built in v0.0.6** (`src/sim/places/fixtures.js`, `src/art/kit/signs.js` `barberPole`, `src/art/kit/index.js`; the build sheet 0.0.6 §2.2, §8 item 20): the kind `barberPole`, `uses: ['haircut']`, equal to the kit's `FOOTPRINTS`, standing free on its stand rather than on a wall (the build sheet's "0.3 × 0.15 on the north face, no block" was not built: section 4.13).

Thin things (rails, tow lines, handholds) are `THIN` in the art (tradecraft's lesson: the outline pass inks anything under 3 px).

### 1.6 Openings: doors, hatches and airlocks

An opening is a gap in a wall line, tradecraft's `{ axis, at, a, b }`, plus what fills it:

```json
{ "id": "o:e1:bay-2-1", "kind": "door", "axis": "x", "at": 7.6, "a": 54.3, "b": 55.3,
  "rooms": ["e1.bay-2-1", "e1.hall-2"], "leaf": "hinged", "state": "closed",
  "lock": null, "sealKPa": 0, "leakM2": 0.008, "openS": 0.4, "closeS": 0.4 }
```

| `kind` | Clear w × h m | Open / close s | Holds ΔP (kPa) | Leak closed (m²) | Sight | Notes |
|---|---|---|---|---|---|---|
| `doorway` | any | 0 | 0 | always open | open | rooms joined by a doorway share one air zone |
| `door` (interior, hinged) | 0.9 × 2.1 | 0.4 / 0.4 (1.0 / 1.0 until v0.0.6) | 0 | 0.008 (the undercut) | blocks | may have a vision panel |
| `extDoor` (weather and dust) | 1.0 × 2.2 | 0.6 / 0.6 (1.2 / 1.2 until v0.0.6) | 2 | 2 × 10⁻⁴ | blocks | always in a **dust vestibule** pair, 2.0 m apart, with an air curtain and a boot brush; crossing the pair takes 3–4 s |
| `fireDoor` | 1.0 × 2.1 | 1.0 / 2.0 | 1 | 5 × 10⁻³ | blocks | held open on magnets, released by the fire alarm |
| `pressureDoor` (sliding, powered) | 1.0 × 2.0 | 3.0 / 3.0 | 100 | 1 × 10⁻⁵ | window 0.2 × 0.3 | closes by itself (below); cannot be opened against ΔP > 2 kPa (4 kN on 2 m²); has a 2 cm² equalising valve |
| `bulkheadDoor` (ship, dogged, oval) | 0.8 × 1.8 | undog 4 s (lever) or 6 × 1 s (six dogs by hand) / same | 150 | 5 × 10⁻⁶ | blocks | dogged or undogged state; at battle stations dogged |
| `hatch` (in a deck, with ladder) | 0.80 × 0.80 | 2.5 powered, 5 manual | 150 | 5 × 10⁻⁶ | blocks | under thrust its weight is felt: lifting it at 1 G is a 20 kg pull, so it is counterbalanced |
| `airlockDoor` | 1.0 × 2.0 | 3.0 / 3.0 | 100 | 1 × 10⁻⁵ | window | interlocked with its pair |
| `vehicleDoor` | 4.0 × 4.0 | 20 / 20 | 70 | 1 × 10⁻⁴ | blocks | panel door |
| `blastDoor` (armoury vault) | 1.0 × 2.1 | 6 / 6 | 0 | none | blocks | armoured; keyed and logged |
| `gate` (fence) | 1.0 or 4.0 | 2 / 2 | 0 | open | see-through | a turnstile at the main gate |
| `curtain` (rack, privacy) | any | 0.5 | 0 | open | blocks sight only | |
| `window` | none | none | as its wall | as its wall | open | sight and daylight; ship viewports have an armoured shutter |

- **A door is as quick as a hand makes it** (as built in v0.0.6, `src/sim/places/echo.js` `OPEN_S`, `src/sim/places/doors.js` `DOOR_S` 0.4, the time of a leaf whose opening gives none; the user, 2026-11-07, playing v0.0.5: "doors open and close much too slow"; DESIGN.md's log): an interior door swings in **0.4 s** and a weather door in **0.6 s**, both ways (v0.0.5's 1.0 and 1.2 s). Opening, the leaf blocks until it has swung fully open, then the way is free; closing, it blocks at once while its picture swings shut. So walking through a door you open costs 0.4 s of waiting, well under a second (the lead's call: the way freed at about two thirds open, first written in the log, was not built, 0.4 s being short enough).
- **Automatic closure** (pressure doors, airlock doors, hatches set to auto): a door closes when the pressure difference across it exceeds `AUTO_CLOSE_DKPA` 5 kPa, or when either zone raises a decompression or fire alarm. A 5 s warning (strobe and horn) precedes it except when ΔP rises faster than 1 kPa/s, when it closes at once (my call: a big breach does not wait). **Obstruction stops the leaf** (a body, a dropped rifle, a crate in the doorway): the door reports "blocked", the alarm sounds, and the neighbouring zone keeps losing air until someone clears it. That is a decision a marine can face: drag the body clear, or not.
- **Against pressure**: a door with ΔP > 2 kPa across it will not open by hand or power. Its equalising valve (2 cm²) bleeds the higher side into the lower at the orifice rate (section 3.4): opening a door into a vented compartment from a pressurised one means venting your own side through the valve first (suits on).
- **Jammed**: blast or impact damage may jam a leaf (`state: 'jammed'`). Forcing a jammed hatch or door takes two people or a pry bar and a check (SKILLS's `tech` or fitness); a breaching charge opens it (COMBAT).
- **Locks**: `lock: { kind: 'key'|'card'|'code'|'staff', holder, log: true }`. The armoury's blast door and the vault cages are logged: every opening is a line in the armoury's book (WEAPONS's accountability reads it).
- **Leaving an area through a portal** counts from the doorway's band plus `STEP_M` 0.4 m beyond it (tradecraft's rule after the user's "The door to exit the embassy is finicky, we have to really try to get out", 2026-10-28), and at most `PORTAL_DEPTH_M` 0.6 m further (built in v0.0.3, `src/sim/places/plan.js`: so one who comes round a flight's side onto it is on the stair, and one who stands farther off is not); a floor keeps `PORCH_M` 1.0 m of floor past an outside door, so the step can be taken.
- **Exits are marked**: every portal out of an area carries a plaque on the back wall over it or at its side (VIEWS draws it; the user, tradecraft rc28: "where is the door out of the flat"). The plan validator checks nothing stands in front of a plaque or a door's 0.9 m clear zone. On a ground, a portal into a building carries the building's sign instead, as Echo's street doors carry the company's plate (section 4.4; validator rule `door-sign`, section 9.6): an EXIT sign seen from the street read wrong (v0.0.3's review).
- **The hinge side** (settled 2026-11-07 for close quarters, COMBAT §25.10.2, my call): an opening may record `swing: { hinge: 'a' | 'b', into: <room index> }`, the hinge end and the room it opens into; the stage hinges the leaf there, and the room plan and the door's rows (COMBAT §25.7.3, §25.11) read it. An opening without one keeps v0.0.3's rule (the leaf hinged at its `a` end, swinging into `rooms[0]`; the doors on a floor's north boundary painted on the wall). X4's doors all record it; others gain it as their scenes need it.

**Airlocks.** An airlock is a `lock` room between an inner and an outer `airlockDoor`, with a pump, a vent valve, a repress valve fed from tanks or (on Mars) from the outside air through filters, a control panel at each door and inside, pressure gauges at each panel, and a suit-check mirror. The standard personnel lock is 2.0 × 2.4 × 2.4 m inside (11.5 m³), for 2–4 suited people (my call).

| Cycle | Steps | Time (my call, from the numbers in section 3.6) |
|---|---|---|
| Out (pressure to vacuum) | close inner 3 s; pump to 10 kPa at 0.75 m³/s (25 s, the air saved to the tank); vent the rest through 0.05 m² (6 s); open outer 3 s | 37 s; 1.2 kg of air lost per cycle (8 kg if dumped from 66 kPa) |
| In (vacuum to pressure) | close outer 3 s; repress to the inner side's pressure (15 s); open inner 3 s | 21 s |
| Emergency | both doors' interlock overridden at a panel with a key: dump through the vent in 6 s | crew-only; logged |

Interlocks stop both doors being open at once unless overridden. The panel reads both sides' pressure (the lock refuses to open the outer door if a person inside has no sealed suit on the lock's sensor list, unless overridden: my call, the suit reports its seal to the lock).

The **vehicle lock** is 12 × 6 × 5 m (360 m³): pump to 10 kPa at 3 m³/s in 3 min 46 s, vent 15 s, repress 60 s (my call).

**As built in v0.0.12**: the stage reads `swing` from the area's own openings (a door's hinge side and the way the leaf swings, drawn from the opening, not a render table); `src/sim/places/validate.js` has no `swing` rule yet (`places-validate` checks a swing on every leaf by itself).

### 1.7 Vertical links: stairs, ladders, lifts, trunks

```json
{ "id": "l:hellas:trunk", "kind": "ladder", "lengthM": 3.0,
  "stops": [
    { "area": "hellas.d4", "x": 8.7, "z": 7.7, "face": "up", "opening": "o:h:d4:trunk" },
    { "area": "hellas.d5", "x": 8.7, "z": 7.7, "face": "up", "opening": "o:h:d5:trunk" } ] }
```

A link's id is `l:` and its template path, as fixtures and openings take `f:` and `o:` (TECH §2.3.1, CONTRACTS §10).

| `kind` | Where | Geometry | Time per level (my call; BODY's locomotion may refine) |
|---|---|---|---|
| `stairs` | buildings | 1.2 m wide, 0.20 m risers, landing every storey (3.4 m) | 6 s at Mars g walking; 4 s bounding |
| `ladder` | ship trunks, hatches, the G-house, mine shafts | 0.45 m wide rungs 0.30 m apart in a 0.9 m shaft under a hatch | at 1 G 5 s a 3 m deck; at 0.38 G 3 s; at 0.134 G 2 s; in free fall a push-off along the rails, 1.5 s |
| `inclined ladder` | small ship decks | 70°, 0.6 m wide | 4 s at 1 G |
| `lift` | buildings ≥ 3 storeys, frigates and larger, towns | car 1.6 × 2.4 m (a stretcher fits), doors 4 s, travel 1.0 m/s (8 m/s in Europa's town shafts, section 7.2) | 3 s per deck plus 8 s of doors |
| `trunk` | a ship's spine: a ladder and a lift side by side behind the same hatches | as both | as both |
| `ramp` | vehicle ways, the Ring's spin-up seating | ≤ 1:8 | walking |

A lift is a fixture (`liftCar`) moving along its link; riding it is lived (the doors close, the indicator counts, the doors open on the other area). Under a ship's thrust above 1.5 G lifts are locked and ladders are closed by the standing order (LONGHAUL's, the user, 2026-03-27: 1.5 G "is the line where moving about stops").

### 1.8 Air zones

Rooms joined by doorways share a zone. A zone is the unit of the gas model (section 3):

```json
{ "id": "e1.z.bay-2-1", "site": "melas", "rooms": ["e1.bay-2-1"], "volumeM3": 254,
  "gas": { "o2Kg": 70.04, "n2Kg": 129.03, "co2Kg": 0.46, "h2oKg": 1.77, "coKg": 0, "sootKg": 0 },
  "tempK": 293.15, "heatCapJK": 4.0e6, "lifeSupport": "ls:echo-hvac-east",
  "envelope": { "outsideM2": 85, "uWM2K": 0.30 },
  "lighting": "normal", "alarm": null }
```

(These are the masses of Martian indoor standard air, section 3.2, in a 11.6 × 7.3 × 3.0 m squad bay at 20 °C.) Argon is carried inside `n2Kg` as an inert (my call: it changes nothing a body notices). Pressure and partial pressures are derived from masses and temperature by the ideal gas law; nothing stores a pressure.

Connections between zones are the openings (doors, hatches, holes, vents, ducts) with an area that depends on their state.

### 1.9 Portals and the site graph

A **portal** is an opening or a link stop that leaves the area: `{ id, from: {area, x, z}, to: {area, x, z, face}, via: openingId | linkId, timeS, cond }`. It is named by its opening's or its link's id (`o:echo:front`, `l:echo:stairs-up`), never by a `p:` id, since `p` is the persons' prefix (CONTRACTS §10). v0.0.2's site plan names its outside doors `o:melas:<building>-<side>` (below). `cond` lists what passing needs: `{ pressurised: true }` for anyone unsuited, `{ key: 'armoury' }`, `{ gGmax: 1.5 }` for ladders under thrust.

**Ids on a site plan** (CONTRACTS §10; built in v0.0.2 for Base Melas): a building is `b:<name>` (`b:echo`, `b:mess`), its outside doors `o:<site>:<building>-<side>` (`o:melas:echo-front`, `o:melas:mess-north`), a waypoint `w:<building>:<place>` (`w:echo:front`, `w:armoury:window`) or `w:j:<x>-<z>` for a junction, a road or walk `r:<name>` (`r:valley`), a ground zone `<site>.<name>` (`melas.apron-mess`). Inside a floor or deck area, rooms take the area's short code (`e1.bay-2-1` on Echo's ground floor, `m1.serving` in the mess hall) and fixtures their template's path (`f:e1:rack:07`, `f:mess:t14`, its seat `f:mess:t14#3`). An open structure on the ground (the KD range's firing lines, the cleaning canopy) is a zone of the ground area (`melas.kd-line-200`), not a room of an area of its own (section 1.3). When a building's floor becomes an area (Echo's at 0.0.4), its portal through an outside door takes the plan's id, so this file's samples' `o:echo:front` reads `o:melas:echo-front` (my call: one door, one id). So PEOPLE's samples read `o:melas:mess-north` for `o:mess:front`, `o:melas:<company>-front` for `o:bks-5:front`, the ground zone `melas.kd-line-200` for the room `kd.line-200`, and the armoury's issue hall `a1.issue-hall` (or outside it the waypoint `w:armoury:window`) for `armoury.window`; `f:mess:line`, `f:mess:t14#3` and `f:e1:head-2a:showers` with spots `#n` are good forms.

The **site graph** is built when a site is instanced: nodes are portals plus authored **waypoints**; edges are walking lengths inside one area or link times between areas. Its use is section 2.3. Three graphs feed it, coarsest first:

- **The ground waypoint graph** (authored in the site plan, for every `ground` and `hab` area): road centre lines and their crossings, path junctions, every building door and gate, gaps in fences and berms, formation marks and muster areas, the shuttle's stops, with each edge's length in metres and its surface cost (section 2.1). Inside a 1,000 × 700 m ground there are no portals, so this graph is what long outdoor routes are planned on (section 2.3). Its edge lengths are authored as the polyline lengths and checked by the nav test against A* on built chunks (within 5%).
- **The room graph** (built from a floor's or deck's plan): nodes are openings, edges the A* length across each room between its openings (lazily, cached in `$siteGraph`). It picks which rooms a route crosses, so the fine A* runs only on the corridor of those rooms.
- **Links** between areas (stairs, ladders, lifts, collars) with their times (section 1.7).

### 1.10 State shape and saves

The authored data rebuilds everything; the save holds only what changed. `state.places` (saved, plain JSON, `$` keys stripped as the hub requires):

```json
{
  "live": { "site": "melas", "area": "melas.echo.1" },
  "nav": {
    "queue": [ { "id": "pr5531", "who": "p412", "area": "melas.echo.1", "cls": "C0", "from": [51.2, 2.4], "to": [42.0, 23.6], "atTick": 88120 } ],
    "pending": [ { "id": "pr5530", "who": "p388", "deliverTick": 88122, "pts": [[61.0, 9.0], [42.0, 9.0], [42.0, 23.6]], "lengthM": 33.6 } ],
    "debtNodes": 0
  },
  "sites": {
    "melas": {
      "template": "melas@1",
      "openings": { "o:e1:bay-2-1": { "state": "open" } },
      "fixtures": { "f:e1:rack:07": { "curtains": [1, 0] }, "f:e1:hw-east": { "hotL": 412 } },
      "zones": { "vac.tank": { "gas": { "o2Kg": 0.6, "n2Kg": 1.1, "co2Kg": 0, "h2oKg": 0, "coKg": 0, "sootKg": 0 }, "tempK": 255 } },
      "holes": [], "fires": [], "rooms": { "e1.bay-2-1": { "grime": 12 } },
      "lighting": { "melas.echo.1": "lightsOut" },
      "power": { "plant": "nominal", "buses": {} },
      "items": [ { "id": "i9921", "area": "melas.ground", "x": 1102.4, "z": 352.1 } ],
      "marks": [ { "kind": "scorch", "area": "melas.echo.1", "x": 51.2, "z": 1.3, "rM": 0.8 } ],
      "visitedAtMs": 23484000000
    }
  }
}
```

- **No layout seed.** A site's saved record is its template and its deltas. v0.0.2's record carried a `seed` (`hash('site', id, the world's seed)`) that nothing read; v0.0.3 writes none, the places domain's upgrade `places:no-site-seed` drops it from older saves (marking `flags['mig:no-site-seed']`), and the validator's `no-seed` rule holds it (section 9.6; my call).
- `nav` holds the path requests still queued, the results solved but not yet delivered, and the work debt (section 2.2). They are saved because a loaded game must deliver every path on the tick the unsaved run would have (TECH's `game-determinism`); the grids themselves are derived and rebuilt. A request's id is counted, `pr<n>` (TECH §2.3.1, CONTRACTS §10); once answered it is gone from the queue, and the id walk still accepts it.
- A zone is saved only while it is off its life-support equilibrium by more than 0.5% in any partial pressure or 0.5 K; otherwise it is recomputed on load.
- `items` is the site's lying list: ids and positions only. Each item's record is in `state.items`, wherever the item is (WEAPONS owns it, TECH §6.7): `i9921` here is a dropped magazine, its count and load on its record. Brass is not an item: up to 64 moving cases are particles, and a case at rest is a count on its 1 m tile (TECH §9.5, §19).
- Lists are capped: `items` 2,000 per site (oldest litter goes first; nothing a person owns is dropped), `marks` 500 (scorch, bullet holes, blood are kept until repaired or cleaned; LONGHAUL's rule after the user's "BURNED for good" complaint, 2026-10-31: everything has a life cycle).
- Footprints and tracks are runtime only (`$marks`), never saved (my call; the user wanted them "without it being too heavy in performance", tradecraft 2026-11-04).

**As built in v0.0.11**: `live.env` is absent for the site's own environment, not null: `{ live: { site, area, env? } }`. The upgrade `places:env` (`src/sim/places/env.js` `upgradeEnv`) turns a null into the absence, because a null in every save would have changed every digest and broken the step 1 proof. The env record is `{ preset, gravity?, air?, airC?, rev }`; `enterSite` keeps it within its site and drops it at another. `setLiveEnv` resolves an override before it writes it, and `upgradeEnv` resolves a saved one (preset, gravity, air, airC), so a malformed override throws at load and never at the first tick.

---

## 2. Navigation

### 2.1 The fine grid

- **`CELL_M` 0.25 m**, as tradecraft's `path.js`. A cell is free for a clearance class if a circle of that radius at the cell centre touches no blocker.
- **Clearance classes** (my call): `C0` radius 0.27 m (PT kit or uniform); `C1` 0.33 m (fighting load: plates, pack, rifle slung); `C2` 0.40 m (vac suit with its backpack). A standard 0.9 m door passes all three; a 0.8 m hatch is a link, not grid cells, and is checked by the link (a C2 suit fits a hatch by ducking, BODY's time).
- **Blockers**: wall runs (tradecraft's `walls()` and `wallRect()`), fixtures with `block: true` (their footprint), closed door leaves, and dynamic blockers (a parked vehicle, a dropped crate over 0.5 m tall). People do not block the grid (tradecraft: "a crowd would trap the player"); they steer round each other (PEOPLE).
- **Costs** per cell (Uint8, 10 = 1.0): floor, deck, grating 10; ice walkway 11; loose regolith or deep dust 13; stairs within an area 15; meltwater or a wet galley floor 18; rubble 25; 255 impassable. Costs multiply walking distance for A* only; actual speed comes from BODY.
- **A walker collides as its class's circle** (`src/sim/places/collide.js`, built in v0.0.2; my call after the 0.0.2 review). The grid says where a path may go; a walker is a point anywhere in a cell, so it is tested as its own circle of its class's radius against the very rects its grid was built from (wall runs, blocking fixtures, closed leaves), on the grid's floor, and it stands off every wall and fixture by exactly its radius (C0 0.27 m) and slides along a wall it presses into at an angle. A 0.9 m door then passes C0 over a 0.36 m band. **The door assist**: with one key held and the step cut short, the walker looks up to `NUDGE_M` 0.3 m either way along the other axis (in 1 cm steps, west or north first on a tie) for the nearest point from which the whole step is clear, and slides toward it by at most a step, so a door missed by its middle still lets you through; a flat wall finds none. A walker whose own point it may not stand on (a door closed on it, a position inside a wall from an older save) is **settled** at once on the nearest free cell's centre within 2 m, keys held or not (TECH §3.1, layer 2). **From v0.0.6 it is settled on its own side of every blocker** (`src/sim/places/nav.js` `nearestFreeInReach`): the nearest free cell within `NEAREST_FREE_M` 2 m that a flood from its cell reaches, cell to cell, crossing no wall run, fixture rect or closed leaf (one that holds the walker itself excepted), falling back to `nearestFree`. Before, it went to the nearest by straight distance, so a walker squeezed between a flight's closed top and the vestibule's wall (a URL, an old save) was put across the top into the flight's lane, a step from its band (the review of 0.0.6).
- **Grids are built once per area per class** (`Uint8Array`, about 21,000 cells for a 38.4 × 34.4 m troop deck, 3 classes, 64 KB) and kept in `$nav` while the area is live or was visited in the last 10 minutes. A door opening or closing re-marks only the cells within the class radius of its leaf (an incremental update of a few dozen cells).

### 2.2 A* with a binary heap

Tradecraft's `wayAcross` scans its open set linearly ("fine for a flat, too slow for a 100 m ship deck", the research note). OLYMPUS keeps its rules and replaces the open set. Solves never allocate: a fresh `Float32Array` per solve on a 120 × 80 m floor would be 1.4 MB of garbage, and at 6 solves a tick up to 170 MB/s pushed into old space, with major-GC pauses of tens of milliseconds (tradecraft's "staggers"). Because solves are atomic (below), one scratch set serves them all: it is sized to the largest grid among the live and cached areas, grown only behind an area change's cut, and reset between solves by a generation counter instead of a fill (my call: the review asked for a set per grid; one shared set does the same in a ninth of the memory of a set per grid for three areas and three classes: 16 bytes a cell, 2.5 MB for the largest floor):

```
scratch (one per sim): g Float32Array(n), parent Int32Array(n), seen Uint32Array(n), shut Uint32Array(n), gen
heap: one binary min-heap per sim, typed arrays sized to NODE_CAP × 8 pushes, reset by its length

path(area, cls, from, to, opts) → { pts:[[x,z]...], lengthM, cells, expanded } | { fail: 'blocked'|'locked'|'cap'|'access', expanded }
  grid = $nav[area][cls]; s = $pathScratch; s.gen += 1           // a cell is fresh when seen[i] != gen: no fill()
  A = cellOf(from); B = cellOf(to)
  if !free(A): A = nearestFree(A, 2 m)      // someone standing against a table
  if !free(B): B = nearestFree(B, 2 m)
  corridor = opts.rooms ? cells of those rooms (room graph, §1.9) : all
  touch(A); g[A] = 0; heap.reset(); heap.push(A, h(A))            // touch(c): seen[c] = gen, g[c] = ∞, parent[c] = −1
  while heap not empty and expanded < NODE_CAP:
    u = heap.pop(); if shut[u] == gen: continue; shut[u] = gen; expanded += 1
    if u == B: break
    for each of 8 neighbours v of u in corridor:
      if !free(v) or shut[v] == gen: continue
      if diagonal and not (free(side1) and free(side2)): continue     // no corner cutting
      if seen[v] != gen: touch(v)
      step = (diagonal ? 14 : 10) * cost[v] / 10
      if g[u] + step < g[v]: g[v] = g[u] + step; parent[v] = u; heap.push(v, g[v] + h(v))
  h(c) = 10 * max(dx, dz) + 4 * min(dx, dz)                            // octile in the step's own whole weights (10, 14): admissible and consistent, min cost being 10
  ties: smaller h first, then smaller cell index                      // deterministic order
  if B not reached: return fail
  cells = walk parents from B; pts = stringPull(cells)                // extend while every cell the line crosses is free
```

The heuristic's weights are the steps' own (10 straight, 14 diagonal, as v0.0.2 builds them): this file's earlier `10 × (max + 0.4142 × min)` overestimates a 14 diagonal, so it was not admissible, and `√2` in floating point made A* fill the ellipse between the ends.

- **Hierarchy first.** A request names its target; the planner takes the site graph (across areas and along the ground waypoint graph) and then the room graph (across a floor or deck), and the fine A* runs only from where the walker is to the next node of that route, on the corridor of the rooms it crosses. So a fine solve is door to door or waypoint to waypoint, and rarely passes 8,000 expansions even on a 21,000-cell troop deck.
- `NODE_CAP` **16,000 expansions a solve** (my call). A leg that hits it fails with `cap`, and the planner splits it at the room graph's next opening or the next waypoint and asks again. Measured in v0.0.2: on ground windows of about 130 m or more, random pairs that cross buildings hit the cap (131 of 300 on a 130 × 118 m window), which is what the hierarchy is for; `places-nav` benchmarks a 64 m window, the near ring's size, and 0.1's chunk planner splits long legs at waypoints. On v0.0.3's 96 m ground windows (section 2.4) 1,000 pairs a chunk apart at most solve in 836 µs and 4,230 expansions at p95 (in a foreground terminal's terms), but a pair round the mess hall can still hit the cap, which the planner's split at waypoints is for.
- **The "locked" answer** (a way only through a closed door) is a second solve on the area's all-open grid, built once per area and class and cached, its expansions counted with the first's (v0.0.2; it built one per request, 0.25 ms each, before the review).
- `stringPull` accepts a segment while **every cell it passes through** is free (a supercover line, corners counted on both sides; built in v0.0.2), where tradecraft's `clear()` sampled every half cell and could clip a blocked cell's corner between two samples (my call: the walker follows the pulled points).
- **The budget is TECH's** (TECH §3.1, step 9: `PATH_SOLVES_TICK` 6 and `PATH_NODES_TICK` 8,000 node expansions), counted in work units, never in milliseconds (TECH §3.2). This file sets no other number; PEOPLE's share and COMBAT's path estimates are drawn from the same units (below).
- **Solves are atomic, and their delivery is deterministic.** Requests wait in `state.places.nav.queue` in the order they were made (the player's own walks first, then persistent people, then the crowd, then by request id). Each tick the `paths` layer first pays off any `debtNodes` from its `PATH_NODES_TICK`, then dequeues and solves requests whole while fewer than 6 solves have run and the expansions spent are under the tick's remaining units. A solve that overruns them still finishes (never sliced across ticks, so no open set lives in `$` state), and its excess becomes `debtNodes` for the next ticks. Its result is not applied at once: it waits in `nav.pending` and is delivered at `deliverTick = dequeueTick + max(1, ceil(expanded / PATH_NODES_TICK))`, so a big solve takes the ticks its cost would have spread over, and the order of delivery is a pure function of the state. The queue, the pending results and the debt are saved (section 1.10): a game saved in mid-request and loaded delivers the same paths on the same ticks as the unsaved run, which `game-determinism` checks.
- **Estimates** (COMBAT §19's 16 short path estimates a decision; PEOPLE's "is it reachable" checks) call `pathEstimate(area, cls, from, to, capNodes)`: a room-graph lookup when the two points are in different rooms, else an A* capped at `capNodes` (default 400) that returns a length or `far`. Every estimate counts its expansions against the same tick's `PATH_NODES_TICK` (TECH: one budget), and is answered at once because it is small; a decision that would exceed the tick's units waits a tick (COMBAT's decision staggering already spreads them, TECH §3.2).
- **Failures** carry a reason. A walker re-plans through the site graph (another door, another stair), and failing that waits 5 s and retries. "Pathfinding that works 100% of the time" (the user, tradecraft, 2026-10-26) is a test, not a hope: every authored template proves every spot reachable from every portal for all three classes (section 11).

### 2.3 The site graph and walkers off-map

- **Routes across areas**: Dijkstra over the site graph with the walker's conditions (an unsuited walker never routes through a zone below 50 kPa or above 1% CO: LONGHAUL's `reachable` rule; a walker without the armoury key never routes through the cage). Edge weights are seconds at the walker's speed (BODY's gait for the area's gravity) plus link times.
- **Long outdoor routes** (a walk to the KD range's 200 m line, 1.1 km; a sentry relieved at the far fence; an NPC walking in from 500 m; a waypoint the player sets across the base): Dijkstra over the ground waypoint graph (section 1.9) gives the polyline; the fine A* runs only from the walker's position toward the next waypoint (or the one after it, when both are inside built chunks), and replans at each waypoint and whenever a chunk on the leg is built or a dynamic blocker appears. A walker never needs the whole route's cells at once.
- **Nav grids for chunks are the sim's.** A chunk's nav grid (per clearance class) is a pure function of the ground's committed data for `(i, j)` and the site plan (section 9.5), built on the sim side without any render geometry. When a live route (a person in the live area, or one about to enter it) needs a chunk that is not built, the sim decodes that chunk's grids alone, lazily and counted in cells decoded (section 2.4), whether or not the render side has built its picture.
- **Where is X now?** For a persistent person walking a route off-map from `t0` at speed v, the position at t is the point at distance v·(t − t0) along the route's polyline (portal to portal and waypoint to waypoint, straight legs inside each area). When the area they are in loads, they are placed on the nearest free cell of the real A* path at that progress. PEOPLE uses this for "real destinations" (the user, tradecraft, 2026-10-26: passers-by need "a destination in mind").
- **No popping** (the hub): people come into a live area only through its portals; people already there when it loads are placed by schedule before the first frame is drawn.

### 2.4 Grounds and chunks

- **`CHUNK_M` 32 m**. Chunk `(i, j)` covers x from 32i to 32i + 32 and z likewise, in the ground's frame.
- **Near ring**: chunks whose rectangle lies within `REACH_M` 56 m of the focus are built; chunks beyond `DROP_M` 96 m are dropped (tradecraft's sections used 70 and 115 m for 45 m sections). A chunk holds its ground tiles (1 m material cells), dressing, blockers, cover objects, lamps, LOS walls binned every 8 m (tradecraft's `WALL_BIN_M`), and its nav grids. **Decoding is lazy and pure**: a chunk is decoded from the ground's committed data when a sim read first needs it, counted in cells decoded (TECH §8.1, rules 6 and 7), with no millisecond figure in the sim (CONTRACTS §6); the sim decodes a chunk's nav grids and blockers alone, without render geometry, whenever a live route needs them (section 2.3), and the render side spreads its own picture's work over frames (VIEWS, TECH §9.3).
- **The static index**: every authored macro-object of the site (building shells, fences, berms, the range's target line, towers, big rocks, vehicles parked by schedule) is held for the whole site at load in a 64 m bucket grid: a few thousand rectangles with heights and materials for Base Melas with its districts. It answers line-of-sight queries and the fog's reach out to 600 m (`FAR_LOAD_M`) without building far chunks.
- **The far window** (VIEWS §2.4) follows TECH §9.9: line of sight and the fog's reach come from the static index; the one chunk under the far point is built with priority (sim grids and render picture), and the window's 0.2 s dissolve waits for it. The range pre-builds its target line's chunks on entry. Nothing else is streamed toward 600 m (VIEWS's "streams outdoor chunks to `FAR_LOAD_M`" should read this way).
- **A chunk is read, never rolled.** Roads, paths, building footprints, fences and earthworks are clipped from the authored plan; the chunk's material tiles, relief, rocks and dressing are the ground's committed data for that chunk (section 9.5), laid with tools while the ground was authored and finished by hand, the same in every career. The only per-cell variation the stage adds itself is cosmetic and fixed: which painting of a tile kind a cell shows is a hash of the cell's coordinates (TECH §8.1, rule 3), never of the world's seed, so it too is the same in every career. Looks and geometry are separate data, so a change in looks never moves geometry (tradecraft's lesson, kept).
- **Relief** is objects, not a heightfield (my call for 0.1): `berm` (a prism with a crest height and side slopes), `trench` (a negative strip that hides a crouching body), `craterRim`, `boulder`, `wall`, `ramp` (slope with a cost). Each has `heightM`, `material` and, for cover, a stop share (COMBAT owns the cover maths; tradecraft's `cover.js` shares are the template).
- **Line of sight** between eye heights (standing 1.6 m, crouched 1.0, prone 0.3; BODY or COMBAT may refine) is blocked by an object if the sight line's height where it crosses the object is below the object's height. Walls and buildings are opaque to their full height; fences, rails and gratings are see-through; windows are open.
- **Saved per chunk**: only deltas (items, damage, marks), in the site's lists with their coordinates (section 1.10).
- **As built in v0.0.3** (`src/sim/places/nav.js`, `ground.js`, `sight.js`): Base Melas's ground is an area of its own, `melas.ground`, its nav grids built lazily by `CHUNK_M` chunk from its committed data (the masses with their doors' reveals as leaves, the fence, closed gates, blocking fixtures; paving and paths cost 10, regolith 13) and cached. The walker's window is `WINDOW_CHUNKS` 3 × 3 chunks (96 m) holding it at least `NAV_EDGE_M` 16 m from its edge, kept until it does not and then assembled again round its chunk; at most `NAV_CHUNKS_TICK` 1 chunk of the ring ahead is built a tick (work units, TECH correction 7), so the next window finds its chunks built. A path request on the ground solves on a window placed by its own start, never the player's, so its answer is a function of the state alone. The walk to all four gates is 4.2 km, the player's layer 0.006 ms a tick on average and at most 2.2 to 2.6 ms, never more than one chunk built a tick. The sight grid's window is `SIGHT_WINDOW_M` 192 m wide, held so the eye stays `SIGHT_EDGE_M` 56 m from its edge, past sight's 54 m reach, built by chunks with only the window's kept (PEOPLE §7.6). Neither the static index nor the far window is built yet (0.0.12).

### 2.5 Area changes

- **Through a portal**: the player crosses the portal band; the next frame is the other area, entered at the portal's arrival point and facing. The old area's runtime state is kept in `$areaCache` for 10 minutes of game time (two areas at most besides the live one), so going back is instant and nothing has moved that should not have.
- **Who comes along**: anyone walking with the player through the same portal in the same second (a squad in file) arrives with them, in order, a step apart.
- **Autosave on every area change** (tradecraft's rule; TECH owns saves).
- **Cutaway and fades** are VIEWS's: a door is a scene cut; a ship's deck change dissolves round the ladder shaft.
- **As built in v0.0.3** (`src/sim/places/portals.js`): a portal fires when the walker's centre is between `STEP_M` and `STEP_M` + `PORTAL_DEPTH_M` past its band, within `a`..`b` (section 1.6); its arrival lies at least `PORTAL_CLEAR_M` 0.6 m inside the other area from that area's band back, so a walker never bounces. A crossing is `area-leave` then `area-enter` (`{ site, area, from, portal }`), a log line and an autosave (`why: 'area'`), the actor placed with no glide and settled on the new grid. Echo's stairs: a link's stops lie at the flight's middle on both floors; floor 1's band is 1.1 m below the flight's top (z 14.2, out south; 0.8 m, z 14.5, until v0.0.6, section 4.4), floor 2's at the well's top (z 15.3, out north), and each arrival 0.7 m past the other floor's band (downstairs z 13.5, 13.8 until v0.0.6). The view keeps the ground and both floors built, so a door cuts in 3 to 11 ms once prepared and a stair is a dissolve, not a cut (VIEWS §2.9).

### 2.6 Queues and places to wait

- A **queue** is a polyline of standing spots 0.7 m apart behind a fixture's spot (the mess's serving line, the armoury window, S-1's counter, the shower room's door, a checkpoint's serpentine). Authored per fixture, or derived by rule from where the fixture stands, LONGHAUL-style (`counterSpots`: two side by side, then two per tile on the open floor nearest it), so either way the same in every career.
- **Stand-by spots**: every place where marines wait for an obligation has authored `standby` spots (the company street's formation marks, the range's ready line, Melas Field terminal's marshalling hall, the Loop's stops, the Tank's bench). TIME's "stand by" activity uses them.
- **Formation marks** are spots too: a company street has the company in three ranks per platoon, 1.0 m between files and 1.2 m between ranks, the guidon bearer and the first sergeant's spot (PEOPLE fills them by billet).

### 2.7 Surfaces BODY reads

Every cell or room can carry a surface for locomotion: `{ frictionMu, grip: 'none'|'handholds'|'magStrip'|'loops', ceilingM }`. Defaults (my calls, from published friction values): sintered paving or deck plate 0.6 dry, 0.3 wet; regolith 0.5; dust over smooth floor 0.35; ice at Europa's surface temperature (about 100 K) 0.30, because very cold ice has no melt film; ice at −10 °C (inside a town) 0.10; meltwater on ice 0.05. Handholds every 1.0 m along every wall in micro-g spaces; mag strips along ship passageways and around hatches; steel deck plates on every floor and wall face of the Pens. Ceilings are for BODY's head-strike check when bounding in low g.

**Surfaces are ids** (2026-11-08, TECH §1.4): a cell's or room's `surface` names a row of `SURFACES` (`src/data/places/env.js`): regolith, paving, concrete, tile, vinyl, deckPlate, grating, ice-100K, ice-263K, soil, grass, rock. A row carries `muDry` and `muWet` (the values above), `ferrous` (whether mag boots hold: a ship's metal plating, the Pens' steel, not a ceramic tile or ice), `grip` (`none`, `handholds`, `magStrip`, `loops`), `step` (the footstep recipe), `dust` and `soilWord` (the word for what gets on your hands: regolith, soil, grease, frost). `surfaceAt(state, area, x, z)` is the one reader (section 3.16); BODY's footing, the audio's steps and the soiling lines read it and nothing else.

**As built in v0.0.11**: `SURFACES` adds a `stairs` row (concrete treads: `model.js` `surfaceAt` names flights `stairs`) beside the twelve ids. Friction (dry, then wet) for tile 0.5/0.25, vinyl 0.55/0.3, concrete 0.6/0.3, grating 0.7/0.5, soil 0.6/0.4, grass 0.55/0.35 and rock 0.7/0.5 are my calls. `surfaceAt` returns `mu` as the dry value this round. A ground off its authored paths takes its body's ground (`BODIES[body].ground`), never regolith by default.

---

## 3. The environment

### 3.1 Cadence and layers

| Layer | What | Rate |
|---|---|---|
| Live area, fast | door and hatch motion; flows through openings whose time constant τ is under 5 s (a breach, a dump), sub-stepped at 50 ms | 20 Hz (the tick) |
| Live area | every zone's gas exchange, life support, temperature, fire cells, alarms, lighting state | 1 Hz |
| Rest of the current site | the same zone model with 60 s steps (exact for exponentials, limited for exchange) | per game minute (TIME's slow layer) |
| Other sites | nothing: their zones are at equilibrium by definition, and anything that happens to them (a ship hit while the player is elsewhere) is an outcome COMBAT writes into their deltas | none |
| Weather | a pure function of (site, ms, the world's seed), keyframed hourly and interpolated per minute; gusts per 10 s in the live ground only | hourly / per minute |

In a skip, TIME's `slowStep` calls `placesStep(state, t0, t1)` first, over intervals of at most a minute (TIME §5.4). Every process here is an exponential toward a set point, a limited exchange, or a linear accrual, so lived seconds and skipped minutes agree (TIME §5.5).

### 3.2 The gas model and the standard airs

Each zone holds the masses of O₂, N₂ (with argon), CO₂, H₂O, CO and soot, a temperature, a volume and a heat capacity. Partial pressure of a species is `p = (m / M) · R · T / V` with `R` 8.314 J/(mol·K); the total is the sum. The specific gas constant of a zone follows its mix (280.7 J/(kg·K) for Martian air, M = 29.62 g/mol).

| Air | Total kPa | pO₂ | pN₂ + Ar | pCO₂ | pH₂O | Set temperature | Where |
|---|---|---|---|---|---|---|---|
| Mars outdoors, Melas floor (−4.5 km) | 65.9 | 21.1 | 44.4 | 0.40 | 0.1–0.3 | weather | the hub's mix (N₂ 65.4, O₂ 32, Ar 2, CO₂ 0.6%) at 52 × e^(4.5/19) kPa |
| **Martian indoor standard** | 66.0 | 21.0 | 44.0 | 0.10 (scrubbed) | 0.94 (40% at 20 °C) | 20 °C | MCR buildings, MCRN ships, 2/4's forward operating base on Europa (my call: Martians carry their air with them) |
| **Ice standard** (SETTING §7.3, adopted here: this row is its one definition, and SETTING cites it) | 75.0 | 16.5 (22%) | 57.5 | 0.23 (0.3%, scrubbed; 0.5–1.0 in the poor low streets) | 0.8 (50% at 14 °C) | 14 °C (the towns' 12–16 °C) | Europa's towns and rigs: oxygen from the electrolysis of meltwater, metered and taxed (the air levy) |
| Belt station air (my call, a working name until SETTING names it) | 70.0 | 18.2 (26%) | 50.8 | 0.5 (lax) | 0.5 | 18 °C | OPA stations and Belter hulls off Europa: the relay stations, Hygiea, Ceres, the lairs and haulers of section 8 |
| Earth standard | 101.3 | 21.2 | 78.8 | 0.08 | 1.2 | 21 °C | UN ships and stations, Ganymede's domes |
| Condition Vac | 20 | 6.4 | 13.3 | 0.1 | 0.2 | as before | MCRN warships at battle stations, suits sealed (section 3.6) |

Three consequences worth playing. Martian standard air is 32% oxygen, so **fire runs about 2.3 times faster** than in Earth air (section 3.7). Its nitrogen is only 44 kPa, so the light vac suit at 34 kPa of oxygen (BODY §19) needs little or no prebreathe (a tissue ratio of 1.36 against NASA's 1.4 guide, BODY §11.7; BODY owns the decompression sickness model). And **Ice standard is the thinner breath at the higher pressure**: its inspired oxygen, (75 − 6.3) × 0.22 = 15.1 kPa, sits just above BODY's 15 kPa mountain-sickness line, so a Martian from Melas's 19.1 kPa of inspired O₂ feels the towns as a 2,000 m day (SETTING's "a Martian datum breath"), and the poor streets' CO₂ adds the headache; fire in it burns about as in Earth air (f_O₂ 1.10, section 3.7). Crossing from the forward operating base into a town is a step **up** in pressure, 66 to 75 kPa, and the ears pop (CP-A's air break, section 7.6).

**Alarms** a zone raises (PLACES raises them; BODY owns what the air does to a body): low oxygen when pO₂ falls below 85% of the zone's set point (17.9 kPa in Martian standard, 14.0 in Ice standard); high CO₂ pCO₂ > 1.0 kPa; CO > 50 ppm; decompression when P falls below 76% of the zone's set pressure (50 kPa in Martian standard, 57 kPa in Ice standard) or faster than 0.5 kPa/min; fire (section 3.7); radiation over 100 µSv/h in an occupied zone. An alarm sets the zone's `alarm`, sounds the room's horn, posts a priority-A event for TIME (§7.1, "fire, decompression or radiation alarm elsewhere in the site"), and drives automatic doors (section 1.6).

**As built in v0.0.11**: an `AIRS` row's `airC` is the air's set point and its default; a layer's `airC` overrides it. A live override's `airC` with no air re-reads the air under it at that temperature; a non-numeric `airC` throws. Molar masses where the table gives none are my calls: Ice standard 28.90 g/mol and belt station 29.16 (summed from their partial pressures), Condition Vac 29.62 (Martian air's mix). New rows: `earth-sea-level` (101.325 kPa, 15 °C, WEAPONS' Earth class) and `mars-datum` (52 kPa, -25 °C). Melas's valley air carries -10 °C as its temperature this round (the cool season, the 0.0.4 sheet's call) until the weather sets it.

### 3.3 Life support

A life-support unit serves a list of zones: `{ id, kind: 'hvac'|'plant'|'suitRack', zones, power, status, integrity, tl, ... }`.

- **People load the air.** Per person, BODY's metabolic rate sets the rates; the defaults (LONGHAUL's `life-support.js`, realistic) are O₂ 0.035 kg/h at rest (0.84 kg/day), CO₂ 0.042 kg/h (1.0 kg/day), water vapour 0.05 kg/h, heat 100 W; ×2 walking, ×4 at PT. Fires and engines load the air too.
- **`hvac`** (Mars buildings): fresh air from outside through dust filters at 10 m³/h per design occupant, recirculation through CO₂ scrubbers that hold pCO₂ at 0.10 kPa, heating to 20 °C. On Mars the burden is the **outside** air's CO₂ (0.40 kPa, four times what an indoor room wants): a building that breathed only outside air would sit at 0.4–0.5 kPa, stuffy, and the newcomer's headache the hub promises. Capacities per building in its template (Echo barracks east wing: fresh air 600 m³/h, scrub 4 kg/h of CO₂, heat 30 kW, cool 15 kW).
- **`plant`** (ships, towns, the forward operating base): a closed loop. O₂ from tanks or electrolysis, N₂ from tanks, regenerable CO₂ scrubbers, trace-contaminant and soot filters, humidity control. Each unit lists `o2AddKgH`, `n2AddKgH`, `co2ScrubKgH`, `heatW`, `coolW`, `tanks: { o2Kg, n2Kg }`. A Hellas frigate: scrub 3 kg/h of CO₂ (40 people at rest need 1.7), O₂ tanks 4,000 kg (about four months for 40), N₂ 6,000 kg (enough to repressurise a 700 m³ deck from vacuum 17 times).
- **Control law**: each species moves toward its set point at the unit's rate, `m(t+Δ) = m* + (m − m*) · e^(−Δ/τ)`, with τ = (the zone's distance from the set point) / (capacity), floored at 60 s. A unit's `status` (nominal 1, degraded 0.5, failed 0) and power multiply its capacities.
- **Failure** is a slow story. An Echo squad bay with its HVAC off overnight: 14 sleepers add 2.8 kg of CO₂ in 8 h, +0.61 kPa, so reveille comes at about 0.7–1.0 kPa with infiltration of outside air: thick heads in the morning (BODY's headache band). A ship with a failed scrubber reaches 2 kPa in a day.
- **Wear and faults** use LONGHAUL's `systems.js` model: integrity falls by `wear × load` a day; the fault hazard per minute is `stress × (0.4 + 3w²) / (mtbf × 1440)` with w = 1 − integrity/100; tech-level multipliers (MCR TL4 kit: wear ×0.55, mtbf ×2.4; Belter TL1 kit: wear ×1.5, mtbf ×0.5). Faults are drawn ahead as events (TIME's rule for hazards).

### 3.4 Flow between zones

Every connection (an open door, a door's leak, a hole, a vent, a duct, a lock's valve) has an effective area A (m²) and a discharge coefficient Cd (0.6 for holes and gaps, 0.8 for open doorways and ducts). Upstream u is the higher pressure, downstream d, and r = P_d / P_u. With γ = 1.4:

- subsonic (r ≥ 0.528): `ṁ = Cd · A · P_u · sqrt( (2γ / ((γ−1) · R_s · T_u)) · (r^(2/γ) − r^((γ+1)/γ)) )`
- choked (r < 0.528, which includes every hole to vacuum): `ṁ = Cd · A · P_u · sqrt(γ / (R_s · T_u)) · 0.5787`

Species leave in proportion to the upstream zone's mass fractions.

- **To vacuum** the solution is exact: the zone's gas decays as `m(t+Δ) = m · e^(−Δ/τ)` with `τ = V / (Cd · A · 0.5787 · sqrt(γ · R_s · T))`. For Martian air at 20 °C and Cd 0.6, **τ = 0.00849 · V / A** seconds (V in m³, A in m²).
- **Between zones**, one step of length Δ (50 ms, 1 s or 60 s, the same code) runs in four passes, so that no zone is overdrawn and the result does not depend on the order connections are visited (a passageway with five open doors, a lock with two valves):
  1. **Flows from the start of the step.** Every connection's ṁ is computed from the start-of-step pressures and temperatures, visiting connections in sorted id order (the float sums then come out the same on every run).
  2. **Pair limit.** Each connection's transfer is `m_c = min(ṁ_c · Δ, Δm_eq,c)`, where `Δm_eq,c` is the mass that would equalise that pair alone.
  3. **Zone limit (the flux limiter).** For each zone, its total outflow `O_z = Σ m_c` out of it is compared with `L_z`, the mass it can lose before its pressure falls to the highest start-of-step pressure among the zones it flows into; if `O_z > L_z`, every outflow of z is scaled by `L_z / O_z`. So no zone crosses a neighbour it is feeding within one step, and no flow reverses inside a step.
  4. **Apply** all transfers at once, each carrying the upstream zone's mass fractions.

  A step whose fastest connection has `τ < 2Δ` is sub-stepped at `min(τ) / 2`, up to 60 sub-steps a minute (more than that means a fast flow, which belongs to the fast layer at 50 ms, section 3.1). Mass is conserved exactly, since every pass moves mass and never makes it. `places-air` checks it on a 5-zone star and a 5-zone chain (total mass equal to the float's rounding; every zone's pressure inside its neighbours' range) and checks 1 s against 60 s steps within the 0.5% parity tolerance.
- **Fast blowdown chills.** A zone emptying with τ under 30 s cools as the gas expands, `T' = T · (P'/P)^0.286`; its walls warm it back with a 60 s time constant. If the chilled air drops below its dew point, fog fills the room for 10–30 s (visibility 2–5 m): real rapid decompressions fog over, and VIEWS draws it.
- **Outside reservoirs**: Mars's air (the weather's P, T and mix, infinite), vacuum, and very large neighbours (a Europa town level, 200,000 m³) as finite zones.
- **Small pressure steps between airs** (CP-A's air break, 75 kPa against 66) are subsonic: a 30 m³ lane chamber equalises 9 kPa to under the doors' 2 kPa limit in 24 s through a 20 cm² valve, 240 s through the standard 2 cm² valve (scratch run of this section's orifice equation). So an air break's valves are 20 cm² (section 7.6).
- **Doors' leaks matter only when closed**: an ordinary interior door's 8 mm undercut is 80 cm² of permanent connection, so ordinary doors never hold pressure; the pressure door's seal (0.1 cm²) holds it for days.

### 3.5 Leaks and breaches by hole size

Holes are records: `{ id, zone, to: 'vacuum'|zoneId, areaM2, x, z, cause, patched: null|patchKind }`. COMBAT and WEAPONS create them (a round through a hull, a breaching charge, a torpedo); faults and micrometeoroids create small ones.

| Class | Area | What makes one | τ in 40 m³ | τ in 100 m³ | τ in 300 m³ |
|---|---|---|---|---|---|
| `pin` | 1 mm² | a failing seal, a micrometeoroid | 94 h | 236 h | 707 h |
| `seal` | 10 mm² | a split gasket | 9.4 h | 24 h | 71 h |
| `bullet` | 30 mm² | a 5–6 mm round through a thin wall | 3.1 h | 7.9 h | 24 h |
| `heavy` | 1 cm² | a 20 mm round, a spall fragment | 57 min | 2.4 h | 7.1 h |
| `fist` | 100 cm² | a PDC round, a grenade's fragments through a bulkhead | 34 s | 85 s | 4.2 min |
| `hatch` | 0.5 m² | a hatch blown, a breaching charge | 0.68 s | 1.7 s | 5.1 s |
| `door` | 1 m² | a door blown open to space | 0.34 s | 0.85 s | 2.6 s |
| `gash` | 10 m² | a torpedo hit, a hull failure | 0.03 s | 0.08 s | 0.25 s |

From Martian standard (66 kPa) the times to each mark are fixed multiples of τ: the alarm at 50 kPa after 0.28 τ; 35 kPa after 0.63 τ; 20 kPa after 1.19 τ; **6.3 kPa, the Armstrong limit where body water boils at 37 °C, after 2.35 τ**; 1 kPa after 4.19 τ. So a fist-sized hole in a 100 m³ compartment gives 24 s to the alarm and 3 min 20 s to the Armstrong limit; a door blown out of the same room gives 2 s. A bullet hole is a nuisance measured in hours: a crew patches it and goes on.

**Patching** (times are base times at a middling skill; SKILLS's `tech` check moves them and decides failures):

| Hole | Tool | Base time | Notes |
|---|---|---|---|
| ≤ 30 mm² | sealant foam can (0.5 kg, three uses) | 5 s | |
| ≤ 100 cm² | adhesive patch, 30 × 30 cm | 15 s | the flow pulls the patch: at 66 kPa a 100 cm² hole pulls with 650 N, so it needs a check; at 20 kPa (Condition Vac) 200 N |
| ≤ 0.25 m² | rigid plate with sealant, 60 × 60 cm, 4 kg | 60 s | two hands, braced |
| ≤ 1 m² | bulkhead plate, bolted or welded | 15 min, two people | a damage-control job (COMBAT), suits on |
| > 1 m² | seal the compartment off | none | a yard repairs it (LONGHAUL's "a crew rigs, a yard rebuilds", the user, 2026-10-31) |

### 3.6 Venting, pump-down and cycles

- **Vent valves** to space on every ship deck (0.05 m²: a 700 m³ frigate deck in τ = 119 s) for starving a fire or clearing smoke (LONGHAUL's venting).
- **Pump-down** saves the air: compressors at S m³/s give `P(t) = P₀ · e^(−S t / V)`. Frigate decks have 1.0 m³/s each: to 20 kPa in 14 min.
- **Condition Vac** (MCRN warships at battle stations, my call): suits sealed, every deck pumped to 20 kPa over about 15 minutes into the tanks, repressurised after. No fire can live at pO₂ 6.4 kPa; holes lose air 3.3 times slower; a patch is held against a third of the force; blast overpressure and spall injuries fall; voices carry less (COMBAT and VIEWS use it). **Condition Seal** (troop transports and anything with more people than the tanks can hold at 20 kPa): every pressure door and hatch shut and dogged, suits worn with helmets clipped at the hip, pressure kept (my call).
- **Personnel airlocks**: section 1.6 (out 37 s, in 21 s).
- **The Tank** at Melas (section 4.10): 24 × 16 × 7 m, 2,688 m³; roots-pump stack 10 m³/s: **5 kPa in 11.6 min, 0.5 kPa in 22 min**; repressurised from the outside air through a 0.5 m² filtered inlet in **56 s** (choked inflow, then subsonic). On Mars repressurisation costs nothing but filters.
- **Vehicle lock**: pump to 10 kPa in 3 min 46 s at 3 m³/s, vent 15 s, repress 60 s.

### 3.7 Fire

LONGHAUL's per-deck fire (`fire.js`: growth, oxygen burn, smoke, spread, the 25 kPa and 12% limits) becomes a per-cell fire so a top-down marine can fight it.

| Constant | Value | Source or reason |
|---|---|---|
| `FIRE_CELL_M` | 0.5 m | |
| Fuel per cell | from fixtures' `fuel`: a rack's mattress and bedding 1.6 kg a cell; a locker's contents 4 kg; desk and paper 2; galley grease 3; an electrical cabinet 1; wall and deck linings 0.3 at wall-adjacent cells; ice 0 | my call |
| Heat of combustion | 20 MJ/kg (foam 25, paper 16, PVC 18, grease 40) | handbook values |
| Heat release per cell | 150 kW × intensity I (0–1) | a burning mattress peaks near 1 MW over 2 m² |
| Growth | dI/dt = 0.006 s⁻¹ × f_O₂, with f_O₂ = (x_O₂ / 0.21)² | t²-like growth to full in about 3 min in Earth air |
| Going out | dI/dt = −0.05 s⁻¹ when x_O₂ < 0.13 or pO₂ < 8 kPa | limiting oxygen near 13% (LONGHAUL used 12% and 25 kPa) |
| Spread | each second a cell with I > 0.4 lights each 4-neighbour holding fuel with probability 0.03 × I × f_O₂ | my call |
| Oxygen | 1 kg of O₂ per 13.1 MJ released (Thornton's rule); 0.9 mol CO₂ per mol O₂ | |
| CO and soot | CO 0.02 kg per kg of fuel, 0.2 when x_O₂ < 0.17 (under-ventilated); soot 0.05 kg/kg | handbook yields |
| Heat to the zone | 70% of the release | |
| Visibility | `V = 3 / (8.7 m²/g × soot g/m³)` m | Jin's relation for reflective signs |
| Detection | soot > 0.02 g/m³ (V ≈ 17 m) or gas over 57 °C | my call |
| Sprinklers (base buildings, water mist) | a head over a cell with I > 0.6 for 25 s opens and wets cells within 2 m: dI/dt −0.03 s⁻¹ there; 6 L/min a head | fusible links take tens of seconds |
| Extinguisher (CO₂ or foam, 9 kg, 15 s) | −0.15 s⁻¹ on cells within 2.5 m in a 60° cone ahead of the user, while discharging; SKILLS's check modifies | |
| Nitrogen flood (ship magazines, engine rooms, any compartment by the damage-control station) | a 30 s warning (strobe, horn, "flooding in thirty"), then x_O₂ below 0.10 within 60 s | deadly to anyone unsuited who stays (BODY) |

What the model gives (printed by the fire test; numbers from my scratch run of exactly this model on Echo's 254 m³ squad bay, one rack lit):

| Case | Peak | Out | Lowest O₂ | Highest CO | Lowest visibility | Burned |
|---|---|---|---|---|---|---|
| Martian air, door shut | 2.5–2.9 MW at 4.5–6 min | 6.5–7.5 min, smothered | 12.3% | ~9,000 ppm | under 0.1 m | 3–4 racks |
| Martian air, door open | 2.9–3.3 MW | may not go out | 12.8% | up to 27,000 ppm | under 0.1 m | up to the whole bay |
| Earth air, door shut | ~1.0 MW at 7–10 min | 10–11 min | 12.9% | ~6,700 ppm | 0.1 m | 2 racks |
| Martian air, sprinklers | 150–340 kW at 1 min | 2 min | 31.5% | 75 ppm | 2.5–4 m | 1–2 racks |

So the decision a marine meets is real: shut the door and lose whoever is inside to the CO, or leave it open and lose the bay. Scorch marks and burned fixtures stay until repaired (section 1.10).

### 3.8 Temperature

- Each zone balances `C · dT/dt = Σ sources − U · A_out · (T − T_out) − ventilation + HVAC`. People 100–600 W, lamps and machines by fixture, fires by their release.
- Life support holds 20 °C (Martian), 21 (ships), 14 (Ice standard), 18 (Belt station air). With it failed, a zone relaxes exponentially toward the passive balance with τ = C / (U·A): about 8–12 h for Melas's insulated buildings (U 0.3 W/(m²·K)), which on a −30 °C night means 5 °C by morning; 6 h toward 5 °C for a ship compartment whose thermal control has failed (my call).
- **Europa's liners** (SETTING's "felt": aerogel blankets): a town's warm air sits inside 0.25 m of felt and a membrane against ice that must stay below −20 °C. The liner's U is 0.1 W/(m²·K). A hole in the liner, or an overheated hall, warms the ice face; above −5 °C it drips (meltwater cells, friction 0.05) and the ice creeps faster than its depth's rate (SETTING §7.3: about 2 mm a year at 600 m, 5 mm at 1,100 m, 20 cm a year at Thera Lens). "The dripping street", SETTING's sweating wall, is a maintenance emergency and, for an insurgent, a weapon.
- Vacuum-exposed rooms cool slowly by radiation and their surfaces rime (VIEWS draws rime).

### 3.9 Lighting states

PLACES decides which state each room or compartment is in and where the lamps are; `src/sim/places/light.js` computes `lightLevel(state, x, z, ms)` and VIEWS gives each mood its numbers (VIEWS §2.7). The states:

| Where | States (VIEWS's moods) | Transitions |
|---|---|---|
| Base buildings | `day`, `evening`, `lightsOut` | `day` from reveille to 18:00, `evening` to taps, `lightsOut` from taps to reveille in berthing (hallways keep night lights at 0.3 m every 6 m; heads stay lit; offices by their switch) |
| Ships | `normal`, `shipNight`, `battle` | `normal` 06:00–22:00 UTC, `shipNight` otherwise; `battle` on general quarters (TIME and COMBAT) |
| Europa | `street`, `streetNight` (30% from 21:00 to 07:00 UTC), `works`, `home` | the town's own day on UTC |
| Anywhere | `emergency`, `blackout`, `dead` | `emergency` the instant a room's power bus drops (battery lamps for `EMERG_BATTERY_MIN` 90 min); `blackout` when those batteries are flat or the lamps destroyed (photoluminescent strips glow for about an hour); `dead` is blackout plus vacuum |
| Overlay | `fire` | while the room holds a burning cell |

Lamps are fixtures (`lightKind`: `panel`, `strip`, `nightLight`, `emergencyLamp`, `beacon`, `flood`, `sodium`, `task`, `exitSign`), each on a bus. Rooms with windows take the outdoor sky's share by day (light.js reads each room's window list). The hub's rule holds: the same light decides the picture and the dice.

**As built in v0.0.3** (`src/sim/places/light.js`, its tables in `src/data/places/sky.js`, the build sheet's lighting classes; my calls unless marked): a room's state comes from its lighting class by Melas civil time, `day` from reveille (05:30 on a weekday, 07:00 on Saturday and Sunday) to 18:00, `evening` to taps at 22:00, `lightsOut` from taps to reveille and through the slip, and the lamps flip exactly at 22:00:00 and 05:30:00. The classes: `berthing` (squad bays, rack rooms) at fills of 0.75, 0.65 and 0.04; `head` at `evening`'s 0.65 at every hour (heads stay lit); `hall` as berthing, with its night lights at lights out; `office` as berthing, off at lights out. `lightingOf` falls back by the room's kind where a room names no class. Indoors `lightLevel` is `min(1, max(fill, WINDOW_K 0.3 × the open air's level where the room has windows) + Σ pools)`; a point of a floor in no room (a porch past an outside door) reads the open air. Ceiling lamps carry `r` 0: they are the room's fill, never a pool (the look round's blotches). Pools `{ r, core, ring }`: night lights every 6 m at 0.3 m 0.8 m, 0.20, 0.08; the fire watch's red lamp 1.5 m, 0.25, 0.10 (its core 0.29 at 23:00); desk lamps 1.2 m, 0.35, 0.15; street lamps every 20 m 2.5 m, 0.45, 0.20 and floods every 40 m on the fence 3.0 m, 0.50, 0.20, lit while the sun is under 0°. A call costs 0.4 µs at p50 and 1.4 µs at p95 indoors at night, measured in macOS's background band (the ceiling 2 µs, scaled there).

**As built in v0.0.5: each light's S/P** (`sp` in `src/data/places/sky.js`, read by BODY §23.4's eyes through places' `spectrumAt`, TECH §9.6). The scotopic to photopic ratio, the rods' share of a light against the cones', so a red lamp spares the rods' adaptation:

| Light | S/P | Source |
|---|---|---|
| `day` overheads (neutral white) | 1.5 | published S/P of a neutral-white LED or fluorescent |
| `evening` overheads (warmer) | 1.25 | a warm-white LED's, about 1.2 |
| `lightsOut` fill (the hall's spill, the window's night sky, the exit signs) | 1.0 | my call |
| night lights (amber LED, 590 nm) | 0.2 | 2.489 × V'/V at the peak (CIE V(λ) and V'(λ)) |
| the fire watch's red lamp (red LED, 625 nm) | 0.04 | 2.489 × V'/V at the peak |
| desk lamp (warm) | 1.3 | incandescent at 2,856 K 1.41, a warm LED about 1.2 |
| street lamps (high-pressure sodium) | 0.62 | published |
| floods (cool white) | 1.9 | a cool-white LED's |
| Mars's open air (`SKY_SP`) | 2.0 | my call: a little under Earth's daylight's 2.5, for the dust's redder sky |

A windowed room's daylight (`WINDOW_K` 0.3 × the sky) can beat only the lights-out fill, never the day's 0.75 or the evening's 0.65, so a windowed room's eyes follow the sky only at lights out (BODY §2.6).

**As built in v0.0.11 (step 3)**: a room's state comes from the site's clock (`localTime`) and its lighting regime's hours (`LIGHT_REGIMES[...].hours`; `env.js` `lightHoursOf`). A base takes day from reveille and lights out from taps (its Plan of the Day), with evening from 18:00. A ship has day from 06:00 to 22:00 UTC and lights out otherwise; `normal` and `shipNight` are drawn with the day and lights-out moods until VIEWS gives a ship its own (my call). Town and emergency have no hours yet and throw. A site whose sky is none has `NO_SKY` (level 0, no sun), so its windows show nothing and its `dark` lamps burn.

### 3.10 Radiation fields: `doseAt`, the one helper

`doseAt(state, x, z, who)` in µSv/h is **the** dose rate of the game. BODY's ledgers, the dosimeter, the aid station's badge reader, COMBAT's dose rules and SETTING's tables all read it; no other section keeps a rate table (the hub: one quantity, one number, one helper). It sums the radiation fields the place lies in, each through its own shielding law, plus point sources (a reactor's shield face 10 µSv/h falling as 1/r², a damaged reactor, a source in a lab), plus a floor:

```
doseAt = Σ over fields  freeRate(field, place, ms) × law_field(shieldGcm2(area or room) + suitGcm2(who))  + Σ sources + floor
```

- **Shielding is areal density** in g/cm². Each area or room carries `shieldGcm2`: a deck program sets each deck's (hull, water walls, the decks between it and the sky); a town's or a camp's depth sets its own (ice 92 g/cm² a metre at 0.92 g/cm³; regolith and Phobos's rubble 190 a metre at 1.9). A person adds their suit's, with the values SETTING §7.3 gives the suits (BODY and WEAPONS own the suits): the light vac suit 1.5 g/cm², the hardshell with its liner 5, the Lorica 12.
- **The fields and their free rates:**

  | Field | Where | Free rate | Notes |
  |---|---|---|---|
  | `mars` | Mars's surface | by altitude (table below) | the air column is the shield; solar storms do not reach the ground (SETTING §4.3) |
  | `gcr` | interplanetary space, Phobos, Callisto | 75 µSv/h behind a light hull (Curiosity's RAD in cruise, 1.84 mSv/day); half the sky on an airless surface (37 at Phobos); Callisto's surface 4 µSv/h (SETTING §7.2: 0.1 mSv/day, Ringwald 2000) | inside Callisto's orbit Jupiter's field turns most galactic rays away (a Størmer cutoff near 25 GV at Europa's orbit, about 3.5 GV at Callisto's: my estimate from Jupiter's dipole), so at Europa the belts are everything |
  | `spe` | a solar particle event, off Mars | up to 1 Sv/h at its peak behind a light hull, 1 to 4 Sv over a 12 to 24 h event (August 1972 class) | TIME's world layer schedules them; ships call "storm shelter" |
  | `jovian` | Jupiter's belts | Europa's surface 225 mSv/h (5.4 Sv/day, the hub); Europa's parking orbit 450 (the full sky); Ganymede's surface 3.3 mSv/h (SETTING §8); Io's 1,500 mSv/h (36 Sv/day) | electrons, then their bremsstrahlung and the proton tail |

- **The laws** (log-linear between their points):

  | Law | Points: g/cm² → factor | Why |
  |---|---|---|
  | Jovian | 0 → 1; 1.5 → 0.40; 5 → 0.12; 8 → 0.044; 12 → 0.022; 25 → 0.0044; 40 → 4.6 × 10⁻⁴; 92 → 3.7 × 10⁻⁵; 275 → 1.85 × 10⁻⁶; beyond, × e^(−Δ/61) | fitted to pass exactly through SETTING §7.3's rows (it replaces my earlier two-term ice function, which disagreed with them by up to 70 times) |
  | GCR | ≤ 10 → 1.0; 25 → 0.80; 40 → 0.75; 90 → 0.60; 300 → 0.30; 600 → 0.10; 1,500 → 0.01; 5,000 → 10⁻⁴ | primaries make secondaries in the shield, so practical shielding cuts the dose equivalent by only 20 to 40% at 20 to 50 g/cm² (Durante and Cucinotta 2011, Rev. Mod. Phys. 83; NCRP 153); a storm shelter is for solar storms, not for cosmic rays |
  | SPE | ≤ 5 → 1; 20 → 0.12; 50 → 0.03; 90 → 0.01; 300 → 10⁻⁴ | solar protons stop well in water: BODY's 0.3 to 0.5 Sv behind 20 g/cm² and about 0.03 Sv behind 50 for an event of 1 to 4 Sv |

- **The floor** is 0.08 µSv/h wherever every field is shielded out: the body's own potassium and the walls' materials (SETTING's 0.002 mSv/day in Europa's towns).

What the helper gives (the `places-dose` test prints every row and fails if SETTING's rows move):

| Place | Field and shielding | Rate | Agrees with |
|---|---|---|---|
| Melas valley floor, indoors or out | `mars`, 1,768 g/cm² of air | 0.06 µSv/h (0.5 mSv a year: cosmic 0.02 under 70% more air than Earth's sea level, the ground's 0.04 from a basalt with about a fifth of Earth's crustal potassium, thorium and uranium) | BODY's 0.06; SETTING §4.3's "1–1.5 mSv a year" is high for so thick a column, and should cite this row |
| Mars datum / Tharsis +10 km / Olympus's summit | `mars`, 1,395 / 824 / 440 g/cm² | 0.07 / 0.2 / 1.4 µSv/h | BODY's |
| Interplanetary cruise: a craft's cabin / ordinary decks / troop and crew berthing behind the water walls / the storm shelter | `gcr`, 10 / 25 / 40 / 90 | 75 / 60 / 56 / 45 µSv/h | BODY's 75 in a craft; replaces BODY's 50 on other decks and 25 in the berthing, and my earlier 30 on decks and 19 in the shelter |
| A large solar particle event at its peak: ordinary decks / the shelter | `spe`, 20 / 90 | 120 / 10 mSv/h; over a 1–4 Sv event, 0.12–0.5 Sv on decks and 10–40 mSv in the shelter | BODY's event totals |
| Phobos's surface / the Pens and the yard's halls, dug in under about 4.5 m of rock and regolith | `gcr`, 0 (half sky) / 840 | 37 / 2 µSv/h | BODY's 37 / 2 |
| Callisto's surface / Camp Lofn and Naval Station Valhalla, under 3 m of regolith | `gcr` at Callisto, 0 / 510 | 4 / 0.56 µSv/h | SETTING's 0.1 mSv/day |
| Europa's parking orbit: a hull's decks / outboard compartments (the marshalling deck, the collars) / the storm shelter | `jovian` orbit, 40 / 25 / 90 | 0.21 mSv/h (5 mSv/day) / 2.0 mSv/h / 0.018 mSv/h | SETTING's 5 mSv/day; BODY's 0.2 and 2 mSv/h |
| Europa's surface: bare skin / light vac suit / hardshell / Lorica / a Simoom's cabin on the pad / a crawler cab or surface shelter (water jacket) | `jovian` surface, 0 / 1.5 / 5 / 12 / 8 / 25 | 225 / 90 / 27 / 5 / 10 / 1 mSv/h; 50 mSv in 13 min / 33 min / 1 h 51 min / 10 h / 5 h / 50 h | SETTING §7.3, row for row (BODY's light-suit ×0.6 and rover-cab ×0.1 become ×0.40 and, for a 10 g/cm² cab, ×0.031) |
| Europa under d metres of ice | `jovian` surface, 92 d | 1 m: 8.3 µSv/h (0.2 mSv/day); 2 m: 1.8; 3 m: 0.41 (0.01 mSv/day); 4 m: 0.09, the floor | SETTING's 1 m and 3 m rows |
| Europa's towns and 2/4's base (200 m and deeper) | the floor | 0.08 µSv/h (0.7 mSv a year) | SETTING's 0.002 mSv/day; BODY's 0.08 |
| Ganymede's surface / a farm dome | `jovian` at Ganymede, 0 / the dome's (SETTING gives it) | 3.3 mSv/h / by the dome | SETTING §8 |
| Io's surface / the lab's lock rooms behind its water shield / the bunker under 10 m of rock | `jovian` at Io, 0 / 57 / about 3,000 | 1,500 mSv/h / 0.3 mSv/h / the floor | section 8, setting 7 |

**The 6 m rule.** Under 4 m of ice the dose is the floor. Whatever stands near Europa's surface (rig camps, surface modules, the pads' shelters, CP-D's booth, the force's surface posts) has at least 6 m of ice blocks over every occupied room, a margin over the law for cracks and for the ice blocks' gaps (my call). The towns and 2/4's base lie hundreds of metres down (SETTING §7.4), where only the floor counts.

What this means for play (cross-references to TIME, COMBAT, CAREER and SETTING):
- **Parking at Europa** for a 3-hour drop costs a hull's company **0.6 mSv on its decks and 0.05 mSv in its shelter**: the ship works normally, and the shelter is for solar storms (my earlier 27 and 2.7 mSv came from a deck factor 45 times too weak: about 40 g/cm² of hull and water stops Jovian electrons, whose 10 MeV range in water is about 5 g/cm²).
- **The drop itself is the dose.** The Simoom's 8 g/cm² cabin takes 20 mSv/h in the orbit's full sky and 10 mSv/h on the pad, so a 0.9 to 2.3 h ride (SETTING §6.5) costs **18 to 46 mSv**, most of a rotation's 50 mSv planning limit. Flagged for SETTING (the craft) and COMBAT (the drop): a 25 g/cm² water jacket round the cabin would make it 2 to 5 mSv; otherwise the drop is the tour's biggest single dose, and the dosimeter says so at the shaft foot.
- **Voyages.** At 16 h a day in the berthing and 8 h on other decks, 1.4 mSv a day: the 6.9-day voyage out at 1 G costs about 9.5 mSv and the 12.5-day voyage home at 0.3 G about 17 mSv (CONTRACTS §14): every marine's record carries it.
- **Surface work** on Europa is timed in minutes by dosimeter (half an hour in a light vac suit is 45 mSv). An SPE warning sends a ship's company to the shelter.

### 3.11 Gravity fields

`gravityAt(state, area, x, z) → { regime, gG, gMs2, down, onsetGs, spin }`, with `down` a unit vector in the area frame (section 3.16).

| Regime | gG | Down | Where |
|---|---|---|---|
| `surface` | Mars 0.380, Europa 0.134, Callisto 0.126, Ganymede 0.146, Ceres 0.029 | −y | sites on a body |
| `thrust` | the hull's felt G (thrust, RCS and jinking; COMBAT and TIME's voyage give it), 0 when coasting | −y of the deck (aft) | ships |
| `free` | 0 | none | coasting ships, a tumbling wreck's centre |
| `micro` | Phobos 0.0006 (a dropped thing falls 1 m in 18.7 s) | toward the rock | Phobos, small rocks; locomotion as free fall, things settle over minutes |
| `spin` | ω²r (the Ring at Melas: 1.0 G felt with Mars's pull, section 4.9) | outward, tilted by any other pull | the Ring, ring stations; BODY applies Coriolis 2ω × v to movers |

Changes are events: a burn starting, a cut, a flip, the Ring spinning up. Loose things (`secured: false` fixtures and items) fall aft at a burn and float in free fall; BODY and TECH own their motion.

**Gravity is a vector with a regime, and a ship's is a profile** (the user, 2026-11-08: "gravity (can include high G maneuvers in some rare cases with alert 'brace' sirens on ships mid flight)"). The live value is `{ regime, gG, down, onsetGs, spin }` in `state.places.live.env`, with `down` a unit vector in the area's frame (−y for a floor; for a deck under thrust it points aft, which is −y once the deck is drawn as a floor; a lateral part, such as an RCS throw or a Ring car's tilt, is a push on whatever is not secured). A ship's gravity is not a constant: it follows a **profile**, a list of events `{ atMs, kind: burn | cut | flip | jink | brace, toG, onsetGs, holdS, warnS }`, given by the scene's spec or, for a voyage, by TIME §12's `feltAt`. Each event is posted to TIME's queue as `grav:*`. **A `brace` event sounds the siren and the 1MC's "Brace, brace, brace" `warnS` before `atMs`**: a change of 1.5 G or less that is announced is braced against and a surprise of 0.5 G or less is survived (BODY's `BRACE_G` and `SURPRISE_G`), and above them a marine is in a couch (the `couched` footing mode) or is thrown (COMBAT §14.8's feet-aft rule, `√(2·a·h)`). The regimes' effect on a body is BODY's `footingOf(state, pid)` (`src/sim/body/footing.js`: `walk` from 0.3 G, `bound` from 0.05, `heavy` above about 1.5 G, `couched` above about 2.5 G or in a seat, `magWalk` on a ferrous plate below 0.05 G with boots on, `handhold`, `braced`, `float`), whose anchor is WEAPONS §7.8's row: footing holds the recoil. The thresholds are my calls, BODY sets the numbers.

**As built in v0.0.11**: Europa's ballistic class is 0.134 G times G0, 1.31409 m/s² (it was a flat 1.314). The `ceres-drum` preset spins at 0.3 G (my call: belt stations' usual spin; BODY or SETTING may set it). The Wheel's floor is the `wheel` preset (section 3.16); its `spin` field is data only until BODY's Coriolis and WEAPONS §2.9's spin bias read it.

### 3.12 Water, power and utilities

- **Water at Melas** comes from wells into the canyon floor's aquifer. Main Side's plant (section 4.13) takes out salts and perchlorate (Mars's soil chemistry), makes 150 m³ a day, stores 2,000 m³, and recycles 85% of grey water. Main Side uses about 60 L per person a day, 110 m³ for its 1,800 people by day; the other districts have plants of their own (template).
- **Each site's water rule** is the one place a shower's or a ration's litres are set (BODY §6 and §4.4 and TIME §8.2 read it; neither keeps its own number). A shower is a number of presses of a push-button head, or a metered run:

  | Site | Head | Flow | One press | An ordinary shower | Hot | Water a person a sol | Recycled |
  |---|---|---|---|---|---|---|---|
  | Base Melas | push-button | 6 L/min | 1.5 min (9 L) | 2 presses: 3 min, 18 L (TIME's `WATER_MIN` 3 min); after PT 2 or 3 presses, 2.2 on average | 50 °C mixed down to 40 °C from 10 °C mains: 75% of the flow | 60 L | 85% of grey water |
  | MCRN *Testudo* and other hulls | Navy push-button | 6 L/min | 1 min (6 L) | 2 presses: 2 min, 12 L (LONGHAUL's head; TIME's 2 min) | the ship's loop | 25 L | 98% (a closed loop) |
  | Camp Lofn, Naval Station Valhalla | push-button | 6 L/min | 1 min | 2 presses: 2 min, 12 L | | 40 L | 95% |
  | 2/4's forward operating base, Europa | metered head on a card | 6 L/min | | 1.5 min, 9 L (TIME's 1.5 min) | the Kettle's waste heat; every litre is paid into Ice Control's ledgers at the levy rate (SETTING §7.6, clause 8) | 30 L: 4 drinking, 9 a shower, 7 the galley, 6 laundry, 4 the rest (BODY §4.4's ration) | 90% |
  | The Pens, Phobos | none (micro-g) | | | a no-rinse wash, 2 L | | 10 L | 98% |
  | The Steam (a town's bathhouse) | pools and taps | | | as long as you pay | | | |

  Ice is everywhere on Europa, but melted, cleaned and warmed water costs power and the levy, so the force's water is the tightest of a marine's career while the towns' bathhouses run hot for money (my call; it replaces my earlier "30 L a shower").
- **Hot water** is a tank per head: Echo's wing heads share 480 L at 50 °C with 300 L/h of recovery (a 14 kW heater, from 10 °C mains). After PT, 46 marines arriving over 30 minutes at Melas's 2.2 presses each leave **the last six with a cold shower** (my scratch run of this rule over 200 seeds: a median of 6, from 4 to 8; a 600 L tank would leave none). The shower's temperature falls toward 15 °C as the tank empties (BODY decides what a cold shower does). The tank's litres are a fixture state, refilled in closed form in a skip.
- **Toilets**: 1 L low-flow on Mars; vacuum toilets on ships and in micro-g.
- **Power**: every building or deck draws from a bus. Each bus has a battery for emergency lamps (90 min) and critical loads (life support, comms, the armoury's alarms) for 4 h. Main Side's plant is two 10 MW fusion units, a 40 MWh battery and a tie to the valley grid that Redwater and the base's other districts draw from (each district has its own substation and batteries, my call); Main Side draws about 6 MW by day and up to 12 MW (the Ring spinning up 2 MW, the Tank's pumps 1.5 MW, night heating 4 MW). A trip of both units sheds everything but critical loads: emergency lighting across Main Side, HVAC off (the CO₂ creeps), the Ring spins down (6 min, the riders seated), the Tank's pumps stop (the chamber holds its vacuum).

### 3.13 Grime and dust

- Every room's `grime` (0–100) rises per day by 0.5, plus 1 per 10 person-hours of use, plus 2 if it has an outside door (×3 in a dust storm), plus 4 for a head and 3 for a galley.
- **Field day** (TIME's activity, a check) sets it to `5 + 20 × (1 − quality)`. An inspection passes under 25 (PEOPLE's discipline reads it).
- Outdoors, each ground cell has a `dustLevel` 0–1: the weather lays 0.02 × τ a day (×10 in a storm); roads and the parade deck are swept daily to 0.1. Weapons and suits take dirt from it (WEAPONS, BODY); VIEWS draws it (`dustCover`). The Martian saying "Dust in Everything" is a rate.

### 3.14 Materials

For WEAPONS's penetration and COMBAT's cover. Every wall, fixture and earthwork names one.

| `material` | Construction | Thickness | Areal density | Where |
|---|---|---|---|---|
| `partition` | sinter board 2 × 12 mm on steel studs | 0.10 m | 22 kg/m² | inner walls of base buildings |
| `blockWallIns` | sintered regolith block 0.20 m + 0.15 m foam | 0.35 m | 365 kg/m² | outer walls of base buildings |
| `vaultWall` | reinforced sinter concrete | 0.30 m | 720 kg/m² | armoury vault, ASP, the Tank |
| `ballisticPanel` | steel 10 mm faced with 50 mm rubber | 0.06 m | 110 kg/m² | the shoot house, the ranges |
| `shipPartition` | aluminium honeycomb | 0.025 m | 8 kg/m² | cabins |
| `shipBulkhead` | aluminium 8 mm plus insulation | 0.06 m | 25 kg/m² | pressure bulkheads |
| `deckPlate` | aluminium sandwich | 0.04 m | 30 kg/m² | decks |
| `hull` | composite 30 mm, water and polymer 50 mm, two Whipple layers | 0.40 m | 140 kg/m² | outer hulls |
| `ice` | water ice | per metre | 920 kg/m² per metre | Europa |
| `liner` | 0.25 m foam and membrane (ice behind) | 0.30 m | 25 kg/m² | Europa town walls |
| `iceBag` | 1 m³ water bags frozen solid | 0.6–1.0 m | 550–920 kg/m² | Europa checkpoints |
| `sandbag` | regolith bags | 0.5 m | 800 kg/m² | Mars field positions |
| `berm` | compacted regolith | per metre | 1,800 kg/m² per metre | ranges, the ASP |
| `glass` | laminated | 0.012 m | 30 kg/m² | windows |

### 3.15 Mars weather

A pure function of the site, the time and the world's seed (tradecraft's `weather.js` pattern: "weather pinned to place and day"), so a skip samples it and a load never re-rolls it. The valley is authored; its weather is something that happens in it, so it is procedural and differs between worlds (the hub, 2026-11-05). It needs from TIME the season `Ls(ms)` and the local true solar hour. **Its rates, lengths, seasons and temperature bands are SETTING §4.4's** (SETTING owns the climate; this is its implementation, `places/weather-mars.js`, and the `places-weather` test fails if a printed rate leaves SETTING's numbers by more than chance).

- **Dust optical depth τ.** Background `τ_bg = 0.35 + 0.35 × (1 + cos(Ls − 250°)) / 2` (the clear aphelion season about 0.35, the dusty perihelion season about 0.7). Events are drawn per Mars year from `stream('weather', worldSeed, siteId, marsYear)` and placed in TIME's queue as they come due (my calls are the τ and wind columns; the rest is SETTING's):

  | Event | Chance, Ls 180–330° | Chance, other Ls | Length | Visibility | τ | Wind |
  |---|---|---|---|---|---|---|
  | Dust devils | 60% of sols (any warm afternoon) | 15% | minutes each, 12:00–17:00 | metres inside one | +0.1 for the afternoon | devils within 2 km, 0–3 an hour, 10–200 m across; one crosses Main Side with 0.02 an hour (a 15–20 m/s gust for 20 s, grit in everything) |
  | Local storm | 6% a sol | 1% | hours to 3 sols | 0.5–2 km, at the low end in the front's first 2 h | 1.5–3 | 12–20 m/s; ranges closed, masks, flights by instruments |
  | Regional storm | 0.8% a sol | 0.1% | 3–20 sols | 50–500 m | 3–6 | 15–25 m/s; flights grounded, outdoor training cancelled, suits or masks outdoors |
  | Planet-encircling storm | one roll a Mars year, 1 in 3, onset uniform in Ls 185–310° | none | 30–90 sols | 50–500 m for weeks | 5–9 | 10–20 m/s; supplies by crawler |

  At 0.1 the standby has Melas's clear sky only (the sun, the temperature, a fixed τ: SETTING §4.4, ROADMAP §3.4); from 0.2 the predeploy sols carry the table above, with the local storm (section 13).
- **Temperature** (°C), fitted to SETTING §4.4's bands (scratch fit, 2026-11-05):

  ```
  T(Ls, h, τ) = T_mean(Ls) + A(τ) · cos(2π (h − 14.5) / 24.66)
  T_mean(Ls)  = −9.5 + 5.5 cos(Ls − 300°) − 1.0 sin(2 Ls) − 0.5 cos(2 Ls)
  A(τ)        = 21.5 / (1 + 0.32 τ)
  ```

  with h the hours since local true solar midnight (0 to 24.66, the slip included). At the background τ the warmest afternoon is **+15.0 °C** at Ls 305° (the hub's "equatorial lowland days up to +15 °C") and the coldest night about −33 °C at Ls 97°. Its daily highs and lows fall inside SETTING's bands to within about a degree (the worst is spring's warmest night, 1.2 °C over its band; band edges excluded, where the seasons blend): autumn (Ls 0–90°) +6 to +10, −27 to −33; winter (90–180°) about +5, −31 to −33; spring (180–270°) +6 to +12, −23 to −30; summer (270–360°) +13 to +15, −21 to −25. At the start (Ls 316.4°) the day runs from −21 to +15 °C. A storm flattens the day: A is 11 °C at τ 3 and 7 °C at τ 6 (warmer nights, colder days). The single daily harmonic puts the coldest hour near 02:30 rather than just before dawn, a simplification (section 3.17).
- **Wind**: **the Fall** (SETTING §4.4), a katabatic wind of 5–12 m/s off the south wall from about 22:00 to dawn, drawn per night, strongest at the wall's foot; by day an upslope wind, gentle (2–5 m/s), with afternoon gusts to 15 m/s in spring and gusty summer afternoons; storms add their own. At 0.93 kg/m³ a 12 m/s wind pushes as hard as 10.5 m/s on Earth: on this terraformed Mars, wind is felt.
- **Fog, frost, snow grains** (my calls; SETTING's sky column agrees): valley fog of water ice on cold-season mornings (Ls 0–150°) after a night below −22 °C, with 0.15 a sol, visibility 30–150 m from an hour before sunrise to 09:30; a frost veil at dawn after nights below −20 °C until about 10:00 (VIEWS), on the fans in autumn; thin water-ice haze over the walls on winter dawns; snow grains on 1% of cold-season nights.
- **Rain** (SETTING §4.4): the valley sees it **a few afternoons a summer** when the sea's moisture carries this far, mostly as virga. In Ls 270–330°, 2% of sols bring a shower afternoon (13:00–17:00, about 3 a summer); one in four reaches the ground for 10 to 40 minutes (0.5–2 mm): paving turns wet (μ 0.3), the dust becomes a red paste on boots and rifles (WEAPONS), and the base talks about it for a week. "One Day Rain" stays the saying for the day rain falls everywhere (CAREER's home-town milestone).
- **Pressure** 65.9 kPa × (1 + 0.003 sin Ls + 0.01 × a synoptic wave) (my call: little CO₂ is left to freeze out at the caps, so the real Mars's ±12% swing is gone).
- **Visibility** for perception: in clear air `V = 3.9 × 8,000 m / τ` (45–89 km); storms, fronts and fog set their own bands (the table above). The stage's fog of awareness only feels it below about 60 m (PEOPLE and VIEWS own the sight caps).
- **The walls and the horizon.** This section owns the site (section 4.1; CONTRACTS §2, §19 item 11, settled 2026-11-06), and SETTING §3.8's `SITES.melas` carries its place: the base stands at **10.5° S, 287.2° E, −4,500 m**; Melas Chasma's **south wall rises 8 km, its crest about 45 km south** (SETTING §4.9); the north wall, 8 km, is about 150 km north; the canyon runs east–west. **The walls are this section's data**, `MELAS_WALLS = { southKm: 45, southRiseM: 8000, northKm: 150, northRiseM: 8000 }` in `src/data/places/melas.js`, named by the site record's `horizon`, and `src/sim/places/sun.js` reads them there, so the four numbers live in one place and TIME's sun, perception's light and VIEWS's sky all get them through `sunAt` (my call, 2026-11-06: it replaces my earlier ask that `SITES.melas` carry a `wall` record; SETTING §3.8 says so). **`horizonAt(az)`** (`sun.js`, built in v0.0.3) treats each wall as a straight crest line parallel to the canyon's axis and corrects for Mars's curvature (R 3,389.5 km):

  ```
  for a wall at perpendicular distance D and rise H, at azimuth az off its normal by θ (|θ| < 90°):
    s = D / cos θ;  h = atan((H − s² / (2R)) / s)
  horizonAt(az) = max(h_south, h_north, 1°)          // 1°: the far floor's mesas and fans, SETTING's "1–2°"
  ```

  It gives **9.71° due south**, 8.3° at 150°, 6.6° at 135°, 4.3° at 120°, 2.4° at 110°, 1° along the canyon's axis, and 1.79° due north (SETTING §4.9 once said 3° for the north wall; with the curvature it is 1.8°, which SETTING prints). The terrain delays sunrise and hastens sunset: at the start (Ls 316.4°) the sun rises near azimuth 107° and clears the horizon 7.3 minutes after the flat-horizon sunrise, so daylight is **12.53 h, 05:44 to 18:15, against the flat horizon's 12.78 h, 05:36 to 18:23** (noon 83.42° up; SETTING §3.7, TIME §2.5, CONTRACTS §3). The walls take 8 minutes of the day at Ls 0°, 9 at Ls 90°, 8 at Ls 174° and 31 at Ls 270° (as built: `places-light` prints `sunTimes` flat and over the walls; SETTING §3.7's table). TIME's `sunAt` takes this profile (it replaces VIEWS's 4° default).
- **The disc's share** (built in v0.0.3, my call): `sunAt` also gives `visible`, the share of the sun's disc over the horizon, the disc `SUN_DISC_DEG` 0.35° across as seen from Mars with a linear limb, so the canyon's sunrise takes the 87.3 s the disc needs to clear the rim; `eclipsed` means a share of 0, and `skyAt` scales the key light, the shadows and the open air's step by the share (VIEWS §2.7). `sunTimes` keeps the centre's crossing.

  I kept SETTING's profile and withdrew my earlier one (a crest 14 km away and 7 km up, 27° of sky due south): Highrim stands on the south rim at 11.3° S, about 47 km from the base (SETTING §4.7), which fits a crest at 45 km, and an 8 km rise over a wall about 15 km deep is a slope near 28°, as Valles Marineris's walls are, where mine needed 60°. The Talus does not need the wall near: it is the old landslide's lobe that runs out across the floor south of the base (section 4.12; SETTING §4.9's "flat outwash below an old landslide"). The walls are never in the stage's picture (the camera looks down); they are felt as late light, the night wind, the field's talus slopes, and in a scope or a terminal (VIEWS).
- **Europa and other airless places** have no weather; their light is the Sun at 5.2 AU (50 W/m²) and Jupiter's shine (on Europa's Jupiter-facing side about 30 lux at full phase, from Jupiter's 0.034 sr of sky at albedo 0.5, my estimate), with Jupiter eclipsing the Sun once an orbit (TIME's `sunAt`).

**As built in v0.0.11**: `sun.js` serves only Martian sites with a known geo and throws otherwise, with no Melas fallback; the sun by body waits for Europa. It reads Mars's obliquity and radius from `BODIES`. `BODIES.mars.dayH` is 24.65979 h, `SOL_MS` exactly (it said 24.6597, 0.36 s a sol short); Mars's day, obliquity and radius have one home in `BODIES`.

### 3.16 The environment in a skip, and the helpers

- `placesStep(state, t0, t1)` over at most 60 s: every zone of the current site (exact exponentials, limited exchange), fires (a skip is refused while any fire burns in the site: COMBAT's `threatKnown` counts alarms, CONTRACTS §13), hot water tanks (closed form), grime and dust (linear), machine wear (linear).
- `placesSteady(state)` is true when every zone is within 0.1% of its set point and no hole, fire, pump or vent is active: a `day` skip may then step whole hours, and a `world` skip go event to event (TECH §5.3, correction 19).
- Hazards are drawn ahead into TIME's queue from PLACES's streams: life-support and power faults (section 3.3), an electrical fire (1 in 20,000 hours per building, my call), the next weather event, a scheduled pressure test.
- **The environment record** (2026-11-08, the user's rule that the engine supports any surface by design; TECH §1.4). Every quantity of a place's environment comes from one record resolved from layers, the most specific winning: **body** (`BODIES` in `src/data/places/env.js`: surface gravity, day length, obliquity, radius, distance from the Sun, sky class, default palette and ground), **site** (section 1.2), **area** (section 1.3), **zone and room** (the gas and temperature; the surface, light state and noise), **live** (`state.places.live.env`: gravity now with its profile's cursor, the brace state, a forced light state, any scene override). Named presets (`ENV_PRESETS`) set bundles of overrides: `melas-ground`, `melas-indoor`, `ship-1g`, `ship-light`, `ship-coast`, `earth-temperate`, `europa-surface`, `ceres-drum`, `freefall-vacuum`; a new body or air is one row of data. The record covers **gravity** (a vector with a regime and a profile of events, section 3.11), **atmosphere** (`AIRS`: section 3.2's rows as data, none to Earth's thick wet air: pressure, partial pressures, molar mass, set temperature), **light** (the sky class, the clock and the lighting regime: base, ship, town, emergency), **surfaces** (`SURFACES`, section 2.7: friction, whether mag boots hold, grip, the footstep and the soiling word) and **temperature** (the air's and the radiative sink's). The Mars constants (`G_MELAS`, `FLOOR_KPA`, `GROUND_KPA`, `ROOM_C`, `OUTDOOR_C`) become the Melas site's and the `martian-indoor` row; `G0_MS2`, `R_GAS` and `GAMMA_AIR` live once in `src/core/phys.js`. `tests/syntax.test.mjs`'s `ENV_HOME` guard refuses, outside those homes, the literals 0.38, 3.727, 9.80665, 65.9, 66.0 and 322, any import of the old Melas constants and a default argument `gG =` in `src/sim`.
- Helpers, all in `src/sim/places/env.js`, the only place each quantity is computed (the hub: one quantity, one helper); each takes the area and is cached per (area, room, zone, `live.env.rev`), the rev bumped by a gravity event, a breach or a forced light state, so a tick does a lookup and not a recomputation:

```
envAt(state, area, x, z)      → the resolved record (all of the below)
gravityAt(state, area, x, z)  → { regime, gG, gMs2, down, onsetGs, spin }
airAt(state, area, x, z)      → { air, pKpa, o2Kpa, co2Kpa, airC, molarKgMol, vacuum, rhoKgM3, soundMs, sinkC, open, coPpm, rh, sootGM3, visM, zone }
surfaceAt(state, area, x, z)  → { id, mu, grip, ferrous, step, dust, soilWord, ceilingM, dustLevel }
skyOf(state, site)            → { cls: mars-air | earth-air | airless | none, sunBody }   (light.js and sun.js read it)
localTime(site, ms)           → { h, dayIndex, dayLabel, dayMs, face }                     (the one clock helper)
doseAt(state, x, z, who)      → µSv/h, the one dose rate (section 3.10); `who` adds their suit
horizonAt(site, az)           → degrees of terrain horizon (section 3.15); TIME's sunAt and VIEWS's sky read it (built in v0.0.3 in `sun.js`, not here)
lightStateAt(state, x, z)     → the room's state; light.js turns it into lightLevel
noiseAt(state, x, z)          → dB (the room's noiseDb by its use now, plus machines and fires)
```

  `airAt.open` is true only where the air is open and has weather (wind blows only there, not on a deck or indoors); `soundMs` 0 means no airborne path (the audio then uses a contact bus); `rhoKgM3` and `soundMs` come from the gas law in `src/core/phys.js`. Two derived readers mix the place with the person: `footingOf(state, pid)` (BODY, section 3.11) and `anchorOf(state, pid)` (WEAPONS §7.8's row, in `src/sim/arms/shot.js`, replacing the constant `'planted'`). **Who reads what**: ballistics, penetration and the shot read `airAt` and `gravityAt` (their Melas literals go; a missing air throws); the wind reads `airAt.open`; the body's ledgers and the gaits read `envAt` and `footingOf` (the low-g law is clamped at 1 G, with a `heavy` branch above it and a `float` mode at 0 G, and no stance change is ever Infinity ms); brass and the range's dust take `gMs2`; the audio takes the pressure, the speed of sound, the weight and the step recipe; light, sun and sky take `skyOf`, `localTime` and the lighting regime; clocks, jobs and the body clock take `localTime(site)` (a ship's clock is UTC, Melas's the sol, and `lonOf` throws for a site that is not on Mars); soiling lines take `soilWord`; palette and ground art take `area.palette ?? site.palette ?? body.palette`. An unknown site, geo, air, palette or surface **throws** (`env-fallback`).
- **What the player knows.** These helpers are the truth; the player reads it only through things in the world (the hub's "what they show is only what that screen could know"; tradecraft's "we only know what we know"): a door's or an airlock's panel gauge in view, a room's alarm horn and strobe, the suit's own sensor once worn, a dosimeter badge read at the aid station or a survey meter in the hand, a wall clock, a thermometer by the gate. A breach elsewhere is a sound, a draught toward a door, a pressure door slamming, an announcement. VIEWS draws only those readings; BODY gives the body's own signs (a headache, breathlessness, ears popping).

**As built in v0.0.11**, the helpers (`src/sim/places/env.js`; the code is the truth, and CONTRACTS §21 names them):

- `localTime(site, ms)` gives `{ face, hour, minute, second, civilMs, h, timeslip, slipMs, dayIndex, dayMs, dayLenMs, weekday (Monday 0), weekdayName, dayLabel, dateLabel, dayShort, mars }`. `timeAt(where, ms)` takes a site or a number read as a Mars east longitude. `msAtLocal(site, fromMs, hour, minute)`. `skyOf(state, site, area?)` gives `{ cls, outside, sunBody }`: `cls` is `'none'` where the area is under no sky, `outside` the body's class, `'none'` for deep space. `lonOfSite(site)` throws off Mars. Also `clockOf`, `routineOf`, `waterOf`, `siteAt` (the live site, or SETTING's start site), `lightHoursOf`, `soundMsAt`, `presetEnv`, `bodyPlaceOf` (what a body skipped along a plan breathes and weighs at a site), `setLiveEnv` and `upgradeEnv`. Each takes a site id or a record. `skyOf` and `localTime` were step 3's.
- **A live preset is scene-wide** (the audit's findings 1, 3 and 12; the lead to confirm the rule). It is meant for whole-scene overrides (ships, debug runs, the tests' matrix) and changes only gravity and air, never the sky or the sun; the sim (`envAt`'s sky, `skyOf`) and the light (`skyAt`) agree on that. An environment for one area is area data: `area.gravity`, `area.air`, `area.sky`, `area.surface`. The Wheel's 1 G belongs on the `melas.wheel.*` area records (`{ regime: 'spin', gG: 1, spin: { radiusM: 500, omegaRadS: 0.1347 } }`, air `martian-indoor`, sky `none`), authored with the shoot house's layout next round; `test-shoothouse`'s spec then becomes env `{ preset: 'site' }`. The brief's check "nothing Mars in the sky indoors on a ship preset" holds only for a scene hosted on a ship site, not for a preset over a Mars host.
- **Open, for the lead (no change made)**: under a live preset with sky none (`wheel`, `ship-1g`, `ship-coast`), `skyOf` gives `none` even on the open range ground, while step 3's note said `&env=ship-1g` on the range keeps Mars's sky; Europa's preset (sky open) shows Mars's sky (`mars-air`), because the sky is the host site's. Reconcile before a scene stands on an outdoor host under a ship preset. Also, `body.js` decides outdoors from `area.kind` while `envAt` takes it from the preset; the area-level rule above settles both.
- **Presets as built**: the nine named in CONTRACTS §21, plus `mars-datum` and `earth-ship` (WEAPONS §2.1's table classes) and `wheel` (the Wheel's floor under Base Melas: body mars, gravity spin 1 G, air martian-indoor, open false, sky none; it stands in for the Wheel's areas' own spin field until those are authored). `ENV_CLASS_PRESET` maps a class to its preset, so `ENV_CLASSES` is a view.
- **Wind**: `windBlowsAt(state, area, x, z)` is `airAt`'s open flag.

### 3.17 Where this bends reality

- **Gas**: ideal gas; argon counted as nitrogen; a zone's air and walls share one heat capacity; isothermal leaks except fast blowdowns, which cool by the adiabatic rule.
- **Holes**: one discharge coefficient (0.6) for every ragged hole; no jetting or recoil of the escaping gas on bodies (COMBAT may add a push near big breaches).
- **Fire**: a tuned cell model, not fluid dynamics; no flashover beyond the zone's heat; smoke mixes through its zone at once.
- **Radiation shielding**: three log-linear laws over areal density (Jovian belts, cosmic rays, solar protons) standing in for particle transport; the Jovian law is fitted to SETTING's order-of-magnitude rows, not to a transport code; Jupiter's shielding of cosmic rays at Europa is folded into its rows.
- **Weather**: a parametric model fitted to SETTING §4.4's bands and real Mars's dust seasons, not a climate model of a terraformed planet; one daily harmonic, so the coldest hour falls near 02:30 instead of at dawn.
- **The horizon**: each wall a straight crest line at one distance and height, with the planet's curvature; no relief of the walls' own spurs and alcoves.
- **The Ring**: nobody has built a 283 m train of swinging centrifuge cars; its physics is honest (ω, tilt, Coriolis), its engineering is a plausible invention for a Corps that must keep its marines fit for Earth (my call). It is modelled as ten car areas joined by portals, so its loop has seams the real train would not (the gangway doors), drawn as doors.
- **Path delivery**: a path is solved at once and delivered a few ticks later by its cost, so a walker may stand for up to 0.15 s before moving on a big solve, where a sliced solver would have moved sooner on a partial answer.
- **Times of doors, cycles and pumps** are chosen to be real-class machines and to keep play moving; none is faster than its physics allows.

---

## 4. Base Melas

The brief (the user, 2026-11-05): "There should always be a base where we go back to do things like eat and shower at the end of the day", and "You start as a marine on Mars, out of basic training and train on Mars on standby for a week or two, with the everyday training looking like what it should be". The hub settles the place: Marine Corps Base Melas, on the floor of Melas Chasma, about −4.5 km, about 66 kPa, breathable; Redwater is the nearest town. SETTING §4.9 settles what it is in the world: a **division base**, home of Headquarters 2nd Marine Division, the 4th Marines (1/4, 2/4, 3/4), part of the 11th Marines, the 1st Deep Reconnaissance Company and its school, the Raider school and the 1st Raider Battalion (SETTING §5.4), Melas Field with two assault lander squadrons, a Navy branch hospital and a brig: about 19,000 marines and sailors, 6,000 civilian staff and 9,000 dependents.

### 4.1 The site, in three rings

- **Where**: **10.5° S, 287.2° E, −4,500 m**, the south wall's crest 45 km south (section 3.15). This section owns the site's numbers (CONTRACTS §2; §19 item 11, settled 2026-11-06), and SETTING §3.8's `SITES.melas` (`src/data/setting/calendar.js`) carries its latitude, longitude and altitude for every reader; the canyon's walls are this section's own data, `MELAS_WALLS` in `src/data/places/melas.js` (section 3.15, my call). On the start's sol the sun is up over the walls from 05:44 to 18:15, 12.53 h (05:36 to 18:23 on a flat horizon; noon 83.42° up). The canyon floor here is the flat outwash below an old landslide (SETTING §4.9), whose lobe runs south toward the wall; Redwater lies 18 km east (SETTING §4.8).
- **Scale** (my call, the default of open question 2, for DESIGN.md's log): the base is drawn in three rings of detail, so the player lives a battalion's world inside a division's base.
  1. **The Two-Four lines**: 2/4's battalion area, about 360 × 180 m, every building enterable and the ones a marine lives in specified room by room. Its daily circuit (Echo's barracks, the battalion mess, the armoury window, the aid station, the battalion gym, the barracks' own lounges and laundries) lies **within 120 m of Echo's front door**, and the battalion field within 120 m, as real battalion areas are laid out (section 4.3). This is the sol.
  2. **Main Side**: the fenced core of 1,000 × 700 m round the lines, holding the base's shared buildings a marine uses weekly or for a block (the main gate, the Vac Bay, the G-house, the field house and track, Schools, the PX, the Rec, the chapel and the Grove, the parade deck, the motor pool, the plants). All enterable; the ones with story weight specified, the rest built from authored templates (section 9), each building placed and dressed once. Reached on foot, in formation (TIME's `march`) or by **the Loop**, the base shuttle (section 4.3).
  3. **The districts**: the rest of the division base on the same ground, outside Main Side's fence (the table in section 4.2): North Side (Division HQ, 1/4's and 3/4's lines, the 11th Marines, the Navy branch hospital), the Terraces (the married quarters), South Side (the training village, Little Conamara, the Deep Reconnaissance and Raider compounds), Melas Field, and the ranges east of the East gate. Their buildings stand in the static index (sight lines and silhouettes at any distance); their interiors are templates, peopled by PEOPLE's crowds and tier-3 staff, and the few with story weight (the hospital's medical board room, Melas Field's terminal, Little Conamara, the Grove) are specified. A marine goes there by the Loop, a march or a vehicle; nothing teleports.
- **The site frame**: origin at Main Side's north-west fence corner, x east, z south; the districts lie at negative z (north), negative x (west) and beyond (z > 700, x > 1,000). Main Side is fenced, **1,000 × 700 m**: a 3 m mesh fence on a sinter footing, lit, with a 15 m clear strip and a perimeter road inside it (a 3.4 km loop: the formation run). Gates: **the main gate** (west) on Valley Road at x 0; **the East gate** at x 1,000 to the ranges; **the North gate** at x 550 to North Side and Melas Field; **the South gate** at x 550 to South Side and the training areas.
- **Roads**: **Valley Road**, east–west at z 404–416 (12 m), from the main gate to the East gate; **1st, 2nd and 3rd Streets**, north–south at x 180, 392 and 776 (8 m), with 2nd and 3rd Streets bounding the Two-Four lines; **North Road** from the North gate to North Side and Melas Field, **South Road** from the South gate. Paths of sintered regolith slabs join every door to a road. All of it, with every door, gate and fence gap, is the ground waypoint graph (section 1.9).
- **Ground**: sintered paving on roads, the parade deck and the lines' company streets; compacted regolith elsewhere, dust drifts in the lee of buildings; a few irrigated beds of hardy grass and lichen on the track's infield ("the Green", watered with recycled grey water; my call, after the hub's "lichen and hardy grass grow where the water has come"), and the Grove's larch and pine (section 4.13).

### 4.2 The site plan

Every building, with its rectangle in the site frame (x0, z0, width, depth in metres), its storeys, and how it is built, as v0.0.2 builds the plan (`src/data/places/melas.js` holds the tables, `src/sim/places/siteplan.js` derives the doors' waypoints, spurs and edges: TECH §2.4). "Full" means specified room by room in this file; "template" means an authored plan used for several buildings of one use and dressed once for each (section 9), enterable, with its use's fixtures and posts but no story weight; "inset" means a small structure opened in place in the ground area; "shell" means a district building in the static index with a template interior. Every one is placed by hand and is the same in every career; what happens in it is procedural (section 8).

**The Two-Four lines** (x 410–764, z 182–360):

| # | Building | x0, z0 | w × d | Storeys | Plan | Section |
|---|---|---|---|---|---|---|
| 14 | **Echo Company barracks**; its company street 480–564 × 216–238 | 480, 190 | 84 × 18 (+14 × 6 lobby on the south front, front door at (522, 214)) | 2 | **full** | 4.4 |
| 13 | Fox Company barracks; street 580–664 × 216–238 | 580, 190 | 84 × 18 | 2 | Echo's template, variant B | |
| 15 | Battalion armoury (issue windows on the south front at (460, 212), 62 m from Echo's door); the cleaning canopy (inset, 446–472 × 216–238) | 444, 190 | 32 × 22 | 1 | full | 4.6 |
| 8 | Battalion headquarters, 2/4 (front door at (710, 214)) | 680, 182 | 60 × 32 | 2 | full | 4.7 |
| 17 | **Battalion mess hall** (north door at (521, 242), 27 m from Echo's) | 488, 242 | 66 × 34 | 1 | full | 4.5 |
| 16 | Battalion aid station (door on its east side at (460, 261)) | 420, 250 | 40 × 22 | 1 | full | 4.8 |
| 36 | **Battalion gym** ("the Annex", door on its west side at (564, 261)) | 564, 246 | 40 × 30 | 1 | full (summary) | 4.11 |
| 37 | **The battalion field**: PT and formation ground, a 300 m running loop, pull-up bars, the battalion's formation marks | 614, 242 | 120 × 60 | none | paved and marked | 4.11 |
| 12 | Golf Company barracks (mirrored: front door at (522, 330) facing north); street 480–564 × 306–328 | 480, 330 | 84 × 18 | 2 | variant A, mirrored | |
| 11 | Hotel Company (weapons) barracks; street 580–664 × 306–328 | 580, 330 | 84 × 18 | 2 | variant B, mirrored | |
| 10 | H&S Company barracks; street 680–764 × 306–328 | 680, 330 | 84 × 18 | 2 | variant C, mirrored | |
| 18 | Battalion supply and the company supply cages (counter door at (440, 330)) | 410, 330 | 60 × 30 | 1 | full (summary) | 4.13 |

**Drawn closer in v0.0.2** (CONTRACTS §19, item 2, settled 2026-11-06: BODY's 1.14 m/s walk stands, and the plan is compacted until the walk test passes; Claude's call, in the hub's decision log). Three buildings moved, each with its doors, aprons and spurs: the armoury from (420, 190) to (444, 190), 4 m off Echo's west wall, so its window is 62 m from Echo's door where it was 86; the cleaning canopy with it, from (420, 216) to (446, 216), across the walk from the window; the mess hall from (488, 246) to (488, 242), its apron 4 m deep where it was 8, its north door 27 m from Echo's where it was 31. The plan as first written is kept as `melas@0` (`MELAS_PLAN_AS_WRITTEN`, read only by the walk test); the game's plan is `melas@1` (`MELAS_PLAN`, `MELAS_COMPACTION` applied): 43 buildings, 47 doors, 150 waypoints and 166 edges, every ground edge within 0.17% of A*. Further calls the build made and this table now takes: buildings stand 4 m apart or more; a door's waypoint is 0.5 m outside it, with a 2 m spur of slab path straight out to the first road or walk; links cross paved ground (Echo's door, the street mark, the mess door, the armoury window); the Main Side buildings' doors face their nearest road; the perimeter road runs 6 m wide, 5 m inside the fence in its 15 m clear strip. The names Training Road, Village Road, the Lines Walk, the South Walk and the three lanes are working names until SETTING gives its own (section 9.6).

**Main Side** (the rest of the 1,000 × 700 m frame):

| # | Building | x0, z0 | w × d | Storeys | Plan | Section |
|---|---|---|---|---|---|---|
| 1 | Main gate: gatehouse, inspection canopy, turnstile | 8, 418 | 10 × 6 (canopy 30 × 8 over the inbound lane) | 1 | inset | 4.13 |
| 2 | Visitor centre (pass office) | 20, 360 | 24 × 20 | 1 | template | 4.13 |
| 3 | Military police station and brig | 20, 190 | 50 × 32 | 1 | full (summary) | 4.13 |
| 4 | Fire station | 90, 190 | 40 × 30 | 1 | template | |
| 5 | Melas headquarters (the base and the 4th Marines) | 20, 20 | 60 × 32 | 2 | template | |
| 7 | Chapel; **the Grove** (larch and pine, one tree and basalt marker for every 2nd Division marine dead in service since MY 180) with **the Memorial Wall** at its head | chapel 100, 30; the Grove 140–280 × 20–150 | 30 × 24; 140 × 130 | 1 | full | 4.13 |
| 9 | Parade deck, flagpole (400, 24), reviewing stand | 300, 20 | 200 × 120 | none | paved | 4.13 |
| 19 | Field house (the 4th Marines' gym) | 520, 20 | 60 × 40 | 1 | full | 4.11 |
| 20 | PT track (400 m oval) and the Green | 600, 20 | 177 × 93 | none | paved | 4.11 |
| 21 | Obstacle course | 800, 20 | 180 × 130 | none | fixtures | 4.11 |
| 22 | Staff NCO quarters (3 blocks), BOQ (2), visitor lodge | 150–380, 190–380 | 40 × 16 each | 2 | template | |
| 23 | Parking | 20, 440 | 160 × 120 | none | paved | |
| 24 | Schools (classroom building) | 200, 430 | 60 × 32 | 1 | full (summary) | 4.13 |
| 25 | PX (exchange, barber, food court, mail) | 270, 430 | 44 × 28 | 1 | full (summary) | 4.13 |
| 26 | Rec hall ("the Rec") | 324, 430 | 40 × 30 | 1 | full (summary) | 4.13 |
| 27 | Laundry and linen exchange | 270, 470 | 36 × 20 | 1 | full (summary) | 4.13 |
| 28 | **Vac Bay**: suit loft, locks, the Tank, vehicle lock, dust garage | 420, 430 | 100 × 60 | 1 (high bay 9 m) | full | 4.10 |
| 30 | Central issue facility and base warehouse | 420, 510 | 80 × 40 | 1 | template | |
| 29 | Motor pool: yard, shop, dispatch, wash rack, charging | 540, 430 | 170 × 120 | 1 | full (summary) | 4.10 |
| 31 | **The G-house**: the Ring, the Long Arm, control | 820, 430 (shell Ø 100 m) | 100 × 100 | 1 | full | 4.9 |
| 32 | Indoor pistol range | 930, 560 | 50 × 26 | 1 | full | 4.12 |
| 33 | Water plant (two 1,000 m³ tanks Ø 14 m) | 720, 600 | 60 × 60 | 1 | full (summary) | 4.13 |
| 34 | Power plant (two 10 MW units, 40 MWh battery) | 820, 600 | 80 × 80 | 1 | full (summary) | 4.13 |
| 35 | Comms tower (80 m mast) | 957, 640 | 6 × 6 | none | inset | |

**Outside Main Side** (the districts and the training grounds; positions in the same frame):

| # | Place | Where | Size | Plan | Section |
|---|---|---|---|---|---|
| X1 | Melas Halt (the Valley line) and its bus shelter | −120, 400 | 80 × 20 | inset | 4.13 |
| X2 | **Melas Field**: eight pads (Ø 60 m) for LS-21's and LS-22's Simooms, two hangars (120 × 60 m), **the terminal** (the marshalling hall, MOVCON), the tower, the crash-rescue station, the fuel farm, blast fences | 200 to 1,400, −2,600 to −1,300 (1.4 km up North Road from the North gate) | 1,200 × 1,300 | the terminal full (summary), the rest shells | 4.13 |
| X3 | **Known-distance rifle range** | 1,060, 280 | 580 × 140 | full | 4.12 |
| X4 | Shoot house (1 storey and a catwalk) and **the Hulk** (two corvette decks): **moved into the Wheel** (X13, §4.15) on 2026-11-08, so close quarters is trained at 1 G; the footprints here stay as built (`b:shoot-house`, `b:hulk` in `melas@1`) until the Wheel's round takes them off the plan (my call) | 1,100, 500 | 30 × 20 and 20 × 12 | full | 4.12 |
| X5 | Hand grenade range (6 pits) | 1,200, 520 | 60 × 40 | full (summary) | 4.12 |
| X6 | Ammunition supply point (4 earth-covered bunkers, issue shed) | 1,300, 640 | 80 × 60 | template | 4.12 |
| X7 | **Training village** ("Combat Town") and the gas chamber (750, 900, 10 × 6) | 400, 900 | 300 × 200 | full (summary) | 4.12 |
| X9 | **Little Conamara**: a pressurised mock-up of an under-ice street behind an air break | 760, 960 | 140 × 40 | full (summary) | 4.12 |
| X8 | **The Talus** training area (authored field ground) | z > 1,400, the landslide's lobe to about z 9,400 | | authored ground, laid with tools and committed (section 9.5) | 4.12 |
| X10 | **North Side**: Division HQ, 1/4's and 3/4's lines (the Two-Four lines' template, variants and mirror), the 11th Marines' lines and gun park, **the Navy branch hospital**, the Corporals' and Sergeants' Courses | −800 to 1,000, −900 to −60 | 1,800 × 840 | shells; the hospital template with its medical board room specified | 4.8 |
| X11 | **The Terraces** (married quarters): about 2,600 family homes in terraced rows, a school, shops, a clinic, a chapel | −3,000 to −800, 0 to 900 | 2,200 × 900 | shells and templates | |
| X12 | **South Side compounds**: the 1st Deep Reconnaissance Company and the Recon school; the 1st Raider Battalion and the Raider school (fenced, access by unit) | −800 to −200, 800 to 1,200 (south-west, clear of the KD range's danger zone) | 600 × 400 | shells; CAREER's selection fills them later | |
| X13 | **The Wheel**, buried: the 1 G training hall, a ring of R 500 m turning at 1.29 rpm in a vault 40 m deep under 10 m of cover (added 2026-11-08) | centre (500, 350), Main Side's middle; four stops: North (500, −150), East (1,000, 350), South (500, 850), West (−20, 350) | the vault Ø 1,044 m | full (its sectors); the stops insets | 4.15 |

### 4.3 Walking distances, and how a marine gets there

From Echo's front door (522, 214), along roads and paths, as Manhattan estimates (the nav test prints the true lengths on the waypoint graph and A*). Times are at **1.14 m/s**, BODY §16.1's walk on Mars (CONTRACTS §13), indoors and out: BODY's walk stands and this plan was compacted to it (CONTRACTS §19, item 2, settled 2026-11-06). BODY's gaits own the real speeds.

| To | m | min | How | | To | m | min | How |
|---|---|---|---|---|---|---|---|---|
| Echo's company street | 4 | 0.1 | walk | | Field house | 222 | 3.2 | walk |
| **Battalion mess hall** | 27 | 0.4 | walk | | Vac Bay | 263 | 3.8 | march or walk |
| **Armoury window** | 62 | 0.9 | walk | | Motor pool | 294 | 4.3 | walk |
| **Battalion gym** | 89 | 1.3 | walk | | Rec hall | 394 | 5.8 | walk or the Loop |
| **Aid station** | 109 | 1.6 | walk | | PX | 446 | 6.5 | walk or the Loop |
| **Battalion field** | 120 | 1.8 | walk, or the platoon at a run | | Schools | 508 | 7.4 | march or the Loop |
| Parade deck | 126 | 1.8 | march | | G-house | 564 | 8.2 | march or the Loop |
| PT track | 179 | 2.6 | march or run | | Training village | 758 | 11.1 | march or truck |
| Battalion HQ | 188 | 2.7 | walk | | Main gate | 712 | 10.4 | walk or the Loop |
| Battalion supply | 198 | 2.9 | walk | | KD range, 500 m line | 828 | 12.1 | march or the range bus |
| Melas Field's terminal | about 1,700 | 25 | march with sea bags, or the Loop | | KD range, 200 m line | 1,128 | 16.5 | march or the range bus |

- **The daily circuit is short on purpose** (after the review: the earlier 1,000 × 700 m cantonment put the mess 265 m and Schools 438 m from Echo's door, and a training sol cost about 4 km and an hour of real walking, against the hub's 40 to 70 minutes for the whole sol). **Measured in v0.0.2** (`places-walk-sol`, the `walker` bot over the site plan's waypoint graph and Echo's interior route, before any building is drawn): a training sol as TIME §9.2 plans it (three chow windows, six head visits, three formations, the armoury at maintenance, the evening in the barracks), 20 legs, walks **808.7 m: 11.82 real minutes at BODY's 1.14 m/s**, under ROADMAP §4.1's `SOL_WALK_MAX_MIN` 12; with an evening at the battalion gym in place of the lounge, 947.8 m and **13.86 minutes**, against a target of 15. Section 4.2's plan as first written (`melas@0`) walked 880.1 m, 12.87 minutes (the gym evening 1,019.2 m, 14.90), so the armoury, its canopy and the mess hall were moved (section 4.2): the compaction saves 71.4 m a sol, 1.04 real minutes. The test prints both plans leg by leg and fails above 12 minutes for the reference sol, and from 0.0.14 the `recruit` bot prints the same sol lived in full beside it (section 11).
- **The margin was small**: 0.18 minutes, about 12 m. **Measured again in v0.0.3**, with Echo's floors live and its interior route walked by A* on the real floor instead of v0.0.2's polylines: the training sol walks **793.3 m, 11.60 real minutes at 1.14 m/s**, 0.40 minutes under the limit. The next levers, if a later building takes the margin, are the street mark at (530, 224) and the armoury window's place on its south front (my call). The mess is walked door to door until its floor is built (0.0.9).
- **Further out, the Corps carries you.** A platoon going to a block at Schools, the G-house, the Vac Bay, the ranges or the training village goes **in formation** along an authored march route (TIME's `march`: falling in and the halt lived, the minutes between a ride-like skip with the squad's barks in the ticker, with "carry on" or live it as any block's body); or by the range bus or a truck (TIME's `ride`). That is the Corps moving you, not fast travel: you walked to the formation, and you get off where it halts.
- **The Loop**, the base shuttle (my call): a bus every 10 minutes from 05:00 to 24:00 round Valley Road and 2nd and 3rd Streets, stopping at the Two-Four lines (2nd Street at Valley Road), Schools and the PX, the main gate and Melas Halt, the Vac Bay, the G-house and the East gate; every 20 minutes a branch up North Road to North Side and Melas Field's terminal, and west to the Terraces. Waiting is TIME's `stand-by` at a stop; riding is `ride`, with boarding and getting off lived. Nothing is fast-travelled (the user, tradecraft, 2026-10-29: "we should not have the option to just fast travel to work, it would skip all the gameplay").

### 4.4 Echo Company barracks (in full)

Two storeys, 84 × 18 m with a 14 × 6 m lobby block on the south front; sintered block walls with 0.15 m of insulation (`blockWallIns`), a flat roof with the HVAC plant and its dust filters, small deep windows (two per bay, on the north wall), a dust vestibule at every outside door. **Building frame**: origin at its north-west outer corner; the west wing is x 0–35, the core 35–49, the east wing 49–84; the lobby block x 35–49, z 18–24.

**Ground floor, east wing: 2nd Platoon** (the player's). Hallway `hall-2` x 49.0–83.7, z 7.6–10.0 (2.4 m wide), joining the core's hallway. **A drinking fountain** stands on the hallway's south wall between Head A's door and the bin (`f:e1:hall-2:fountain-1`, `waterFountain`, make `wall`, at x 61, z 9.775, facing up; its one `drink` spot), and every wing's hallway has one in the same place, mirrored in the west wing (x 23), on both floors (built in v0.0.4, the integrator's call: the drink activity took one and none was placed; TIME §8.3). North side (z 0.3–7.6):

| Room | x | Size | Contents |
|---|---|---|---|
| `bay-2-1` 1st Squad | 49.0–60.6 | 11.6 × 7.3 | 15 berths in layout A (below: seven two-high racks and the squad leader's single), 15 wall lockers, a footlocker at each rack's foot, a study table with 4 stools, a wall clock (TIME), the squad's notice board with the Plan of the Day, two windows, the squad's stencil on the north wall |
| `bay-2-2` 2nd Squad | 60.6–72.2 | 11.6 × 7.3 | the same in layout B, with its own dressing |
| `bay-2-3` 3rd Squad | 72.2–83.7 | 11.5 × 7.3 | the same in layout C, with its own dressing |

South side (z 10.0–17.7):

| Room | x | Size | Contents |
|---|---|---|---|
| `plt-2-office` platoon office | 49.0–53.0 | 4.0 × 7.7 | the platoon commander's and platoon sergeant's desks, the platoon's whiteboard, a filing cabinet, a visitor spot in front of each desk (reporting, counselling) |
| `plt-2-hq` HQ rack room | 53.0–57.0 | 4.0 × 7.7 | 2 two-high racks (guide and corpsman, radio operator and a spare, as built in v0.0.3: PEOPLE §2.6's billets on the platoon; a messenger as first written), 4 wall lockers, the corpsman's aid bag shelf |
| `head-2a` | 57.0–64.6 | 7.6 × 7.7 | shower room 3.4 × 5.2 with 5 heads; drying area 3.4 × 2.5 with hooks and a bench; 5 basins with a mirror on the north wall; 4 toilet stalls on the east wall; 2 urinals; a privacy baffle 1.2 m inside the door (not authored in v0.0.3: no kit kind yet) |
| `head-2b` | 64.6–69.0 | 4.4 × 7.7 | 3 shower heads, drying area, 3 basins, 3 stalls |
| `laundry-2` | 69.0–72.6 | 3.6 × 7.7 | 3 washers, 3 dryers, a folding table, an ironing board, the iron |
| `closet-2` cleaning locker | 72.6–74.6 | 2.0 × 7.7 | mops, buckets, the floor buffer, field-day gear; the wing's 480 L hot-water tank and its 14 kW heater (section 3.12) |
| `lounge-2` | 74.6–80.0 | 5.4 × 7.7 | two sofas, a screen wall, a table with 4 chairs, a vending machine |
| `stair-e` | 80.0–83.7 | 3.7 × 7.7 | the east stair up; the east exit (a dust vestibule pair) to the outside at z 18. As built in v0.0.3: on the ground floor the stair room is z 10.0–15.7 and its dust vestibule `vest-e` z 15.7–17.7 (the pair 2.0 m apart), the exit door at z 17.7, x 81.45–82.55; upstairs the stair room is the whole 10.0–17.7; the flight (z 10.5 to 15.3) climbs south, its centre 0.95 m in from the room's west wall, its west side 0.35 m off it. **From v0.0.6 it is entered only at its foot** (section 1.5): it names `open: 'left'`, the room's side (east; the west wing's mirror turns it to `'right'`), and you step on through the gap in that side's rail over z 10.56 to 11.76; a rail closes the foot at z 10.5 to 10.56 (the foot stands 0.42 m from the north wall, too close to walk in front of), and the top is closed at z 15.3. Upstairs the well's landing, its open top, is its south metre, z 14.3 to 15.3: one steps on from the south and goes down walking north, and the guard closes its long sides and its north end (v0.0.5; v0.0.4 drew the landing at the north) and, from v0.0.6, runs on along the landing's two sides, so it is entered across its south edge only. The stair room's extinguisher stands on its east wall at (83.5, 12.0), facing west (from v0.0.6; v0.0.5's, on the north wall at (82.1, 10.3) beside the foot, left 0.70 m between it and the newel, too narrow for C2). A night light (`emergencyLight` 'night', y 0.3) stands on the room's north wall at z 10.14 over the stair (x 80.95, mirrored; 45.95 in the core), on both floors (from v0.0.6, my call: a stair is a way out, lit at night). The west stair is the same mirrored, and the main stair the same at x 45.95 with no extinguisher of its own |

Heads are split in two sides with their own doors (my call: berthing is mixed by squad behind rack curtains; heads and showers are separated by sex as in today's Corps; SETTING sets which side is which, and the share of women in a platoon sets side B's size: SETTING §4.7 makes women 30% of the Corps' infantry). Standards met (section 9.6): side A, for 31 of the platoon's 44 (as built in v0.0.3; about 32 as first written), has 1 shower per 6.2, 1 toilet per 5.2 counting urinals, 1 basin per 6.2; side B, for 13, 1 shower, toilet and basin per 4.3. A platoon with more women swaps the sides' signs (the heads are the same rooms either way).

**The core** (x 35–49):

| Room | Rect | Contents |
|---|---|---|
| `co` company commander's office | 35.0–39.6 × 0.3–7.6 | desk, two chairs before it, the company's colours in a stand, a wall screen; the door on the hallway with a knock spot (customs: PEOPLE) |
| `1sg` first sergeant's office | 39.6–44.2 × 0.3–7.6 | desk, a bench along the wall for those waiting, the company roster board |
| `xo` executive officer and company gunnery sergeant | 44.2–49.0 × 0.3–7.6 | two desks |
| `hall-core` | 35.0–49.0 × 7.6–10.0 | joins both wings' hallways |
| `admin` company clerks | 35.0–39.0 × 10.0–17.7 | two desks, files, a counter window onto the lobby |
| `lobby` the quarterdeck | 39.0–45.0 × 10.0–21.0 | the duty desk (duty NCO and runner, the logbook, the key box, the two-faced clock MELAS/UTC standing on it: wall clocks hang on full-height walls only, and the cutaway leaves the lobby no back wall), the guidon and the company's honours case, a bench |
| `vestibule` | 39.0–45.0 × 21.0–24.0 | the dust lock: two outside doors 2 m apart (as built, 1.1 m wide at x 41.45–42.55, on z 21.0 and the front at 23.7), an air curtain, a boot brush and grate |
| `stair-main` | 45.0–49.0 × 10.0–17.7 | stairs up |
| `duty-room` | 35.0–39.0 × 17.7–24.0 | the duty NCO's rack and desk (sleep in turns) |
| `mail` | 45.0–49.0 × 17.7–24.0 | mail lockers, the company notice board, a vending machine |

**Ground floor, west wing: 1st Platoon**: the east wing mirrored about the core's centre line (x 42), stair-w and the west exit at its far end.

**Upper floor** (level 2, `melas.echo.2`; "first floor" until v0.0.5): the west wing holds 3rd Platoon and the east wing Weapons Platoon on the same plan (each bay with its own authored layout and dressing); the core holds the **company classroom** (35.0–49.0 × 0.3–7.6: 14 two-person desks, a podium, a screen wall: weapons classes and briefs) and a **study room** (35.0–45.0 × 10.0–17.7: carrels, a bookshelf, two comm booths, not authored in v0.0.3 for want of a kit kind). The Weapons Platoon's bays are named for its sections (`2/4-E-4-mg`, `2/4-E-4-mortar`, `2/4-E-4-assault`; their stencils MG SECTION, MORTARS, ASSAULT), and their berths stand empty until the platoon is generated (PEOPLE §3.2).

**Squad bay layouts** (room-local frame: origin at the bay's north-west corner, the door on the south wall). Each bay's layout and dressing is authored once and is the same in every career: on 2nd Platoon's floor 1st Squad (the player's) has A, 2nd Squad B and 3rd Squad C, the hub's "three hand-made squad bays, not three rolls of one"; Echo's other bays and the other companies' take fixed mixes of the three, set in their templates (section 9.3; my call). Who sleeps in which rack is the roster's (PEOPLE), drawn with the people.

- **A, open bay** (my default). North row, heads to the north wall: four units, unit k at x = 0.15 + 2.45k: a `rack2` (0.95 wide, centred at x + 0.475, z 0 to 2.05), two `wallLocker`s beside it (x + 0.95 to x + 2.15, backs to the wall), a `footlocker` at the rack's foot (z 2.05–2.50). The north-east corner (x 9.95–11.6) is the squad leader's: a `rack1` along the east wall and two lockers. South row, heads to the south wall: three units at x = 0.15, 2.60, 5.05; the door at x 8.2–9.2 with its 0.9 m clear zone; the study table (1.6 × 0.8, four stools) in the south-east corner. The aisle between footlockers is 2.3 m. 15 racks: a squad of 13 plus 2 spare (an attachment, a new join).
- **B, cubicles**: three cubicles each side, 3.3 × 2.6 m, walled by back-to-back lockers 1.9 m tall; two `rack1` per cubicle; the squad leader's partitioned corner (2.6 × 3.2) with a desk; 2 spare singles by the door. 15 racks.
- **C, pods** (the rebuilt bays): 14 single pods of 1.6 × 2.4 m behind half-height partitions (rack, locker, shelf, reading lamp), seven a side, and the squad leader's pod with a desk. 15 racks.

**The layouts as built in v0.0.3** (`src/data/places/echo.js` `LAYOUT_A`, `_B`, `_C`; laid out with a scratch tool from the rules above, committed as literals and finished by hand; each 15 berths with a locker each, a study table and four stools, a wall clock with the Melas face, two windows and the squad's stencil). Every piece fits the bay's 11.5 × 7.22 m inside its walls (x 0.1 to 11.42; the hallway's wall stands astride z 7.3, 0.08 m into the bay), so:
- **A** keeps the rule above, but the squad leader's `rack1` stands in the north-east corner facing down with one locker and a footlocker, and the south row stands at z 6.195 in the room's frame, so **the aisle is 2.22 m** (z 2.5 to 4.72 in the room's frame, 2.8 to 5.02 in the floor's), not 2.3.
- **B** is three cubicles of 3.55 m along the north wall only, each two `rack2` (four berths) and four lockers, with a lane of 1.1 m before the lockers (the first two cubicles' back to back); the squad leader's `rack1`, locker and desk in the south-west; two spare `rack1` by the door.
- **C** is single pods (a `rack1` head to the wall, its locker at its foot): six on the west wall, five on the east (the sixth row is the door's clear zone), the last rifleman's and the squad leader's on the north wall, and the two spare berths in a `rack2` on the south wall; the study table in the middle. No partitions, shelves or reading lamps yet.

**bay-2-1's berths as built** (layout A, the floor's frame; ids `f:e1:bay-2-1:rack-…`, seats `#2` lower and `#3` upper; the billets are PEOPLE §2.6's, in `BERTH_ORDER`):

| Rack | Centre x, z; facing | Lower (#2), upper (#3) |
|---|---|---|
| `n0` rack2 | 49.625, 1.325; down | ft2-tl, ft2-ar |
| `n1` rack2 (the walk test's `w:echo:rack`) | 52.075, 1.325; down | **ft2-r (the player)**, ft2-aar |
| `n2` rack2 | 54.525, 1.325; down | ft1-tl, ft1-ar |
| `n3` rack2 | 56.975, 1.325; down | ft1-aar, ft1-r |
| `sl` rack1, the north-east corner | 59.945, 1.325; down; one locker | sl |
| `s0` rack2 | 49.625, 6.495; up | ft3-tl, ft3-ar |
| `s1` rack2 | 52.075, 6.495; up | ft3-aar, ft3-r |
| `s2` rack2 | 54.525, 6.495; up | spare, spare |

The aisle runs z 2.8 to 5.02 (2.22 m), the door x 57.2 to 58.2 on z 7.6. The study table stands at (59.3, 6.5), its four stools on its north side at z 5.75 (x 58.7 to 59.9); **the fire watch's post** (`fire-watch:2/4-E-2`) is the first stool, at (58.7, 5.75), under the red-lensed lamp at (59.3, 6.5), 0.85 m up. The wall clock hangs at (58.4, 0.325), 2.35 m up. The build sheet (`docs/build/0.0.3.md` §2.1) said the south row at z 6.575, the aisle z 2.8 to 5.1, the squad leader's rack at about (60.0, 1.4) along the east wall and the table at about (59.3, 6.8). The other bays' tables follow the same billet order on their layouts; 2nd Platoon's other bays are bay-2-2 (B) and bay-2-3 (C), and every wing takes every layout (`BAY_LAYOUTS`).

**Echo as built in v0.0.3**: the ground floor holds 36 rooms, 38 doors and doorways, 392 fixtures and 148 lamps; the upper floor 28 rooms, 28 openings, 413 fixtures and 135 lamps; every spot is reachable from every door and stair for C0, C1 and C2 (366 spots downstairs, 391 up). **v0.0.4** adds the hallways' four drinking fountains, two a floor: 394 fixtures and 368 spots downstairs, 415 and 393 up (`places-validate`, `places-reach`); `ECHO_1`'s golden moved from `08f56e69dfa150` to `11196730cf23f2`, `ECHO_2`'s from `1afda0fc95253b` to `0beba02edd957f`, and the ground floor's C0 grid from `14b1247ac344b4` to `1201fe98a1ceda`. Interior doors are 0.9 m with their west jamb at x mod 0.25 = 0.15, the bays' doors 1.0 m at 0.2, and the outside and vestibule doors 1.1 m (the front x 41.45–42.55, the east exit 81.45–82.55, the west exit 1.45–2.55), centred on the site plan's doors, so a 0.25 m cell centre lies 0.40 m or more from both jambs and the suited C2 passes every one (my calls). The side exits' vestibules are `vest-e` and `vest-w`, z 15.7 to 17.7. **Echo's street doors carry the company's plate**, ECHO in the Corps' red (`corps` style), on the street side, and the green exit signs hang inside over the doors out (my call, after the review: the front entrance read EXIT from the street). Every rack of a squad bay is treated as curtained (open: a `curtains` field on a rack, so a bay without curtains can be authored; rack curtains as saved state come at 0.0.9). **v0.0.5**: each floor carries `floorName` (`ground floor`, `upper floor`), what the HUD's place line and the log call it (VIEWS §7.1); the upper floor's name is "Echo Company barracks, upper floor" (was "first floor"; my call: a name that says where it is from the ground); `ECHO_1`'s golden moved from `11196730cf23f2` to `0784d8b14248b8` and `ECHO_2`'s from `0beba02edd957f` to `1127fea3c6e702`. Nothing in the sim moved: the landing upstairs is where it always was (the stair-e row above). **v0.0.6**: the flights are railed and closed at their tops, entered only at their feet, and the wells' landings railed along their sides (section 1.5; the stair-e row above), the stair rooms' extinguishers moved to their east walls and a night light hung over each stair, the up band moved 0.3 m down the flight and the down arrival with it (`STAIR_BANDS` below), and the doors' `openS` and `closeS` 0.4 s and 0.6 s (section 1.6); `ECHO_1`'s golden moved from `0784d8b14248b8` to `16a0991afd36f2` (by way of `1bfaeadda3e1a7`, the stairs alone), `ECHO_2`'s from `1127fea3c6e702` to `0d9c4e955d0e04` (by way of `1475eb634db564`), and the ground floor's C0 grid from `1201fe98a1ceda` to `0e95501282079e`.

**The stairs' bands as built in v0.0.6** (`src/data/places/echo.js` `STAIR_BANDS` { upBandZ 14.2, downBandZ 15.3, arriveUpZ 16.0, arriveDownZ 13.5 }; the user, 2026-11-07, playing v0.0.5: "when going up, the screen changes when we step on the first stair at the bottom and not when I reach the top of the stairs"). The way up's band moved from z 14.5 to 14.2, 1.1 m below the flight's top, so its firing zone is z 14.6 to 15.2, inside the flight's last `STAIR_TOP_M`: C0 reaches it 0.37 m deep, C1 0.31, C2 0.24 (v0.0.5's band at z 14.5: 0.07, 0.01, never). The floor changes at z 14.6, 0.7 m short of the top, and only up the lane. You arrive upstairs at z 16.0 facing south (unchanged), the well behind you; and coming down at z 13.5 in the lane facing north, toward the foot (13.8 until v0.0.6), still 0.7 m past the band. In v0.0.5 a ground-floor flight blocked nothing and its zone ran z 14.9 to 15.5, so walking north from south of the main flight changed the floor at z 15.5 before you touched it, and stepping in beside any flight's top changed it at once.

**Air and services**: the east wing's HVAC (`ls:echo-hvac-east`) serves its 12 zones (every room behind a door is its own); fresh air 600 m³/h, CO₂ scrub 4 kg/h, heating 30 kW, cooling 15 kW; sprinklers throughout (water mist); smoke detectors in every room; a fire extinguisher at each wing's stair (on the stair room's east wall from v0.0.6) and mid-hallway; the fire watch's route (hallways, both floors) at night.

**Noise** (`noiseDb`): bays 35 at night, 60 at reveille; hallway 55; head 60 with showers running; lounge 65.

**Lighting**: day, evening, lights out (night lights every 6 m along hallways and, from v0.0.6, one over each stair on both floors, the heads lit, the duty desk's lamp; VIEWS's lights-out mood).

### 4.5 The battalion mess hall

66 × 34 m, one storey, 4.0 m ceilings; its north door faces Echo's barracks across the company street, 27 m from Echo's front door, and its entry is the middle of its north wall (site door at (521, 242), since v0.0.2's compaction: section 4.2). Frame origin at the north-west corner.

| Room | Rect | Contents |
|---|---|---|
| `entry` | 26.0–40.0 × 0.3–8.0 | the north door's dust vestibule (30.0–36.0 × 0.3–2.5), 6 hand-wash basins on the west wall (a custom before chow), the **headcount desk** (x 33.0, z 6.5: the clerk reads your ID; the queue runs back out of the door and along the north wall outside) |
| `heads` | 40.0–48.0 × 0.3–8.0 | 2 + 2 stalls, basins |
| `mess-office` | 48.0–55.0 × 0.3–8.0 | the mess chief's desk, the menu board |
| `dining` | 0.3–55.0 × 8.0–21.0, with its north-west bay 0.3–26.0 × 0.3–8.0 and the strips beside the lines (0.3–8.0 and 34.0–55.0 × 21.0–25.2) | **240 seats**: 30 `messTable8` in 3 rows of 10 (aisles 1.5 m); in the bay the drinks bar ("the scuttlebutt": water, juice, brew) and the duty officer's table; screens on the walls (news) |
| `serving` | 8.0–34.0 × 21.0–25.2 | **two serving lines** along the galley wall, Line 1 x 8–20, Line 2 x 22–34, each a tray start, utensils, six `serveSeg` (mains, sides, vegetables, bread, salad, dessert) and drinks; servers stand behind (z 24.3–25.2), customers slide trays along z 23.0 eastward |
| `galley` | 0.3–40.0 × 25.2–33.7 | prep tables, 4 ranges, 2 kettles, 2 combi ovens, the bakery corner, hand sinks, the cooks' and servers' staff spots |
| `cold`, `freezer`, `dry` stores | 40.0–46.0, 46.0–52.0, 52.0–60.0 × 25.2–33.7 | shelving; the walk-in doors (a person can be locked in: the door opens from inside, my call) |
| `scullery` | 55.0–65.7 × 0.3–25.2 | **the dish-return window** and conveyor on the dining's east wall (x 55.0, z 10.0–16.0), the dish machine, pot sinks, the scullery crew's spots (a mess-duty job) |
| `dock` | 60.0–65.7 × 25.2–33.7 | the loading dock (a roller door 3 × 3 m in the east wall), bins |

- **Throughput**: each line serves a tray every 10 s, so both lines serve 12 a minute: a company of 191 is through in 16 minutes and 240 seats take a full sitting in 20; the battalion's 1,000 eat in the window by companies. The queue is a polyline from the headcount desk out of the door and along the north wall (section 2.6).
- **Hours** (TIME's Plan of the Day rules): the Plan of the Day's chow windows (CONTRACTS §4: 06:50–07:40, 11:30–12:30 with the line closing 12:20, 17:15–18:30; holiday brunch 08:00–11:00 and dinner 17:00–18:30), midnight rations 23:30–00:30 for watchstanders (the timeslip falls inside that window; TIME handles the clock).
- **Staff**: the mess chief and two cooks (PEOPLE's named staff), plus 4 cooks, 8 servers and 4 scullery hands from mess duty (a rotating detail of junior marines, which the player can be given).
- **Noise** 70 dB at peak; **grime** +3 a day in the galley.

### 4.6 The battalion armoury and the cleaning canopy

A hardened single-storey building, 32 × 22 m, `vaultWall` throughout. **Ammunition is never stored here**: it comes from the ASP for the day and goes back (section 4.12).

| Room | Rect | Contents |
|---|---|---|
| porch (outside, inset) | the front door at (460, 212), just west of the company street's end (since v0.0.2's compaction, section 4.2) | **two clearing barrels**; the sign "CLEAR YOUR WEAPON"; every weapon brought in is cleared into a barrel under the armourer's eye (WEAPONS's procedure) |
| `issue-hall` | 0.3–31.7 × 15.0–21.7 | the customers' side: the queue rail, **two issue windows** (Dutch doors in the wall at x 8 and x 20), a wall clock, the rules board |
| `cage-e`, `cage-f`, `cage-g`, `cage-h` | each 7.0 × 8.0 along z 0.3–8.3 at x 0.3, 7.3, 14.3, 21.3 | chain-link cages with locked gates; each 18 `rifleRack` (180 rifles), 2 `pistolCab`, machine-gun and launcher racks, an optics shelf; H&S's weapons share Hotel Company's (weapons) cage |
| `shop` armourers' shop | 0.3–16.0 × 8.3–15.0 | 2 `armourerBench`, parts drawers, a cleaning sink, a function-check booth with a sand barrel |
| `optics` optics and night-vision room | 16.0–24.0 × 8.3–15.0 | charging racks, a test bench |
| `arm-office` | 24.0–31.7 × 8.3–15.0 | the armoury chief's desk, the key box, the logbook, the weapons-card file, the CCTV screens |
| vault corridor | 28.3–31.7 × 0.3–8.3 | behind the **blast door** from the issue hall; logged |

- **The cleaning canopy** (inset, 26 × 22 m, open on three sides, a dust screen on the south): 8 `cleanTable`s (32 places), 2 solvent tanks, 4 compressed-air hoses ("blow it out": Mars dust in everything), a parts bin, lamps for evening cleaning. The armourer inspects at the window before a weapon goes back in the rack ("it's not clean, do it again" is WEAPONS's to rule).
- **Hours** 06:00–18:00, the duty armourer on call at night. Staff: the armoury chief (SSgt) and two armourers (PEOPLE).

### 4.7 Battalion headquarters, 2/4

Two storeys, 60 × 32 m, at the east end of the lines' north row, facing the battalion field (front door at (710, 214), 188 m from Echo's).

- **Ground floor**: the lobby with the **officer of the day's desk** (OOD and duty clerk, 24 h; the battalion's colours, the honours case); **S-1, admin** (a counter with two clerk windows and a queue; the records room; the pay clerk's desk: CAREER's check-in stop); **S-4, logistics**; the **legal office** (the NJP clerk); the **briefing room** (24 seats, a screen wall); heads; the stair and a lift.
- **First floor**: the **commanding officer's suite** (an anteroom with the adjutant's desk and a waiting bench; the CO's office, 6 × 5 m, where office hours and NJP are held: the CO's desk, the colours, a place marked on the floor to stand at attention; the executive officer's office; the sergeant major's office); **S-2, intelligence**; **S-3, operations** with the **operations centre** (four consoles and a wall-sized planetary instrument: Mars, Phobos and traffic as VIEWS draws instruments; only what the battalion's links could know); **S-6, communications** (the radio room, a crypto cage).
- **Access**: the CO's corridor is `rank>=E8 or staff` (marines do not walk through it uninvited; PEOPLE's customs make a story of it, the door does not stop them).

### 4.8 The battalion aid station (and the hospital)

40 × 22 m, one storey, west of the mess; its door and ambulance bay on the east side (109 m from Echo's door).

| Room | Contents |
|---|---|
| waiting room 12 × 8 | 16 chairs, the **sick-call desk** (a corpsman, a queue), the pharmacy window, the dosimetry cabinet (badges issued at check-in, read monthly) |
| 4 exam rooms, 3.0 × 3.5 each | `examBed`, desk, the corpsman's spot |
| treatment room 6 × 6 | 2 `traumaBay`s (an emergency room in small) |
| procedure room 4 × 4 | minor surgery |
| lab and imager 6 × 4 | a whole-body scanner (my call), the lab bench |
| dental 3 × 4 | one chair |
| holding ward 8 × 6 | 6 `wardBed`s, a head |
| offices | the medical officer (a Navy lieutenant), the senior chief corpsman, records |
| ambulance bay 8 × 6 | the field ambulance, a decontamination shower |

Sick call 06:30–08:00, appointments to 16:00, a duty corpsman round the clock. What the BAS cannot hold goes by ambulance to the **Navy branch hospital** in North Side (SETTING §4.9; template, 80 × 60 m, two storeys: an emergency room, two operating rooms, 60 beds, a scanner, physiotherapy, and the **medical board room** for CAREER's boards, specified), and what the hospital cannot hold goes to the Mariner Valley's city hospitals (SETTING; LONGHAUL gives Mars full hospitals).

### 4.9 The G-house: the Ring and the Long Arm

The Corps trains "at 1 G under thrust and in centrifuges to be fit to fight Earthers and to ride warships" (the hub), and CAREER takes the fitness test "at 1 G in the base's centrifuge … a treadmill and a bar in a gondola are enough". The G-house holds two machines in a round shell Ø 100 m.

**The Ring** (conditioning at 1 G for hours):
- A circular track of **radius 45 m** carrying a **train of ten cars**, each 24 m long on its outer arc with a 6 m wide interior, joined by 4.3 m gangways into a closed loop of **283 m**. Each car hangs in a gimbal so its floor stays square to the felt weight; all cars swing together, so the train is one tilted annulus and you can walk from car to car (my design; long-arm centrifuges use swinging gondolas for the same reason).
- **Spin**: for a felt 1.0 G with Mars's 0.38 G underneath, the centripetal part is 0.925 G: **ω 0.449 rad/s (4.29 rpm)**, the floor swung 67.7° from horizontal. Settings 1.2 G (0.498 rad/s, 4.76 rpm) and 1.5 G (0.562 rad/s, 5.37 rpm) for advanced conditioning. Spin-up and spin-down **6 minutes** each, everyone seated (fold-down seats along every car, 6 per car: **60 riders a session**).
- **Coriolis**: running at 3 m/s with the spin adds 2ωv = 2.7 m/s² (0.27 G heavier); against it, lighter. Turning the head early in a session makes the world lurch (BODY's adaptation). "Laps with the spin are heavy" is a thing marines say.
- **The areas** are **ten `craft` areas, one a car** (`melas.ring.c1` to `c10`), each 28.3 × 6 m: the car's 24 m and its forward gangway's 4.3 m, ceiling 2.6 m, gravity `spin` from the area's own field (section 3.11: ω, the radius, the tilt), with x along the track in the direction of spin. Each car's forward gangway door is a portal to the next car's after end, and car 10's leads back to car 1's: a loop of portals, not a wrapping grid (section 1.3). Crossing a gangway is VIEWS's deck-style dissolve; the car ahead and the car behind are the two areas `$areaCache` keeps (section 2.5), so a runner on the lane crosses without a build. BODY takes Coriolis from the walker's velocity in the car's frame (along the car: heavier or lighter; across it: a sideways push along the track). Cars from the boarding car:

| Car | Use |
|---|---|
| 1 | boarding car: the doors to the platform, 12 seats, the riding operator's console (intercom, emergency stop), first aid |
| 2–4 | **the lane**: a 1.5 m running lane along the outer side, continuous through every car and gangway (17 laps make the PFT's 4.8 km); car 3 holds the **PFT station** (a pull-up bar, a plank mat, the timer) |
| 5–6 | weight room at 1 G: 4 squat racks, benches, dumbbells (here a 20 kg dumbbell weighs what it would on Earth) |
| 7–8 | bunk cars: 24 two-high racks (48) for **heavy nights**, sleeping at 1 G |
| 9 | head: 4 toilets, 4 showers (300 L hot-water tank in the car), 4 basins |
| 10 | lounge and classroom: 12 seats, screens (study at 1 G) |

- **Outside the Ring** (not rotating): the platform annulus where the train stops (two boarding points, by cars 1 and 6); the **control room** in the hub (the operator's twin console, the flight physiologist's desk, a camera feed from every car: the only way to see in, LONGHAUL's honest views), changing rooms, a waiting room.
- **Power**: 2 MW at spin-up, 0.3 MW to hold.
- **Sessions** are scheduled blocks (TIME and BODY): the G-qualification's 2 h at 1.0 G; conditioning at 1.2 and 1.5 G; the remedial programme; heavy nights 22:00–05:30 on booking. Doors are locked while spinning: a session cannot be dropped into. (The PFT and the weekly conditioning blocks moved to the Wheel on 2026-11-08: its lane is 0.10 G of Coriolis at a run where the Ring's is 0.33 G, §4.15; car 3's station stays for the remedial programme.)
- **The heavy day** (added 2026-11-08, SETTING §5.11; **withdrawn the same day** for the user's "always train at 1G"): every training sol is now a heavy day in the Wheel (§4.15), so the Ring keeps (my call) the G-qualification's two hours before the Long Arm next door, conditioning above 1 G (1.2 and 1.5 G: the Raiders, the heavy landers' crews, a marine before a high-G voyage), the remedial programme for a marine too deconditioned for the Wheel's day (a G-3, a Callisto-born recruit: CAREER §7.3), and the laser lane.
- **What the Ring cannot do** (SETTING §5.11, [computed]). No live fire: a round flies straight while the floor turns, 6 cm low at 10 m along the spin and 23 cm at 20 m, and the sight line ends at about 21 m (WEAPONS §2.9). No fire and movement at Earth's weight: a 3 m/s run is 0.27 G heavier with the spin and lighter against it, a sprint 0.55 G. It trains the body's weight. **The laser lane** (my call): in cars 2 to 4, targets for the engagement harness's laser (COMBAT §2.3) stand at 5 to 20 m along the cars' centre line, the farthest a straight line runs inside the curved floor; a laser's light crosses 20 m in 67 ns and the Ring turns 30 nrad in that time, so the laser is exact where a round would not be. Dry fire with the issue rifle at Earth weight: the presentation, the hold, the trigger, the reload, getting up from prone and down again. At room range the Ring's offset is small (5.7 cm at 10 m for frangible), but its bodies lurch 19% at an entry's walk and its cars are 6 m wide: the shoot house is the Wheel's (§4.15, SETTING §5.11).

**The Long Arm** (acute G training), an annex 30 × 30 m:
- A human centrifuge, **arm radius 8 m**, a closed gondola 2.2 × 1.6 m with one seat that can be set eyeballs-in or eyeballs-down, **up to 9 G, onset up to 6 G/s**.
- The control room (the physiologist's console, the gondola camera, the emergency stop), a waiting room, a recovery bed.
- Used for G-tolerance and G-LOC training, juice trials, and **the baseline and G-qualification** (CAREER §7.3: "a stool in a small centrifuge": a gradual-onset profile from 1.5 to 3 G). The gondola is a seated activity with its own splash (TIME), not a walkable area.

### 4.10 The Vac Bay and the motor pool

**The Vac Bay** (Suit and Vacuum Training Facility), 100 × 60 m, a high bay 9 m tall:

| Room | Rect | Contents |
|---|---|---|
| `suit-loft` **the suit loft** | 0.3–40.0 × 0.3–30.0 | **962 `suitStand`s** in 13 double rows of 37 running north–south (each 2/4 marine's own fitted suit, charging, O₂ and water topped up; 1/4's and 3/4's lofts are in North Side, template); aisles 1.6 m; the loft clerk's counter by the door |
| `fitting` | 0.3–15.0 × 30.0–42.0 | the measuring frame, the suit tech's bench, two fitting booths (CAREER: "a suit-fitting appointment at the suit loft") |
| `suit-shop` | 15.0–40.0 × 30.0–42.0 | 4 repair benches, 2 `leakBell`s, the O₂ and water charging manifold |
| `vac-class` | 0.3–20.0 × 42.0–59.7 | 24 seats, a cutaway suit on a stand, a screen |
| changing rooms (two) | 20.0–40.0 × 42.0–59.7 | lockers, benches, 4 showers each (marines change to the liner) |
| `lock-a` personnel lock | 40.0–44.0 × 20.0–26.0 | a standard personnel lock (section 1.6) into the Tank, with a 4-person bench |
| **`tank` the Tank** | 44.0–68.0 × 10.0–26.0, 7 m tall | a vacuum chamber of 2,688 m³ in `vaultWall`: a mock hull section with a hatch and a ladder, a mock airlock, a handline course, and the **drill room** (a 4 × 4 × 2.5 m pressurised box, 40 m³, at x 60–64, z 12–16, whose breach panel the instructor pops to make a fist-sized hole: the breach drill). Pump-down 11.6 min to 5 kPa; repress 56 s from the outside air. It can be chilled toward −80 °C over 6 h ("Europa night", my call) |
| `vac-control` | 44.0–56.0 × 26.0–34.0 | a window into the Tank, the pump console, the instructor's panel (pop the panel, kill the lights, start a fire in the burn tray), cameras, the pressure plot |
| `pump-room` | 56.0–68.0 × 26.0–34.0 | the roots-pump stack, 10 m³/s, 1.5 MW |
| `veh-lock` vehicle lock | 68.0–80.0 × 14.0–20.0 | 12 × 6 × 5 m, from the dust garage into the Tank (a rover can be driven in for vehicle-in-vacuum drills) |
| `dust-garage` | 80.0–99.7 × 0.3–30.0 | two vehicle bays, the blow-down rack (air knives), a vehicle dust lock to the motor pool |

The suit loft is open 07:00–17:00; the Tank runs by the Plan of the Day (CAREER §5.4's career sol 3, the Thursday: "suit drill: the dust lock and the Tank, a breach drill"). Staff: the suit-drill instructor, two suit techs, the pump operator.

**The motor pool** (yard 170 × 120 m): vehicle rows by company (rovers, utility trucks, the range bus, armoured carriers), the **shop** (40 × 20 m, 4 bays with pits and lifts, a parts room), the **dispatch office** (inset, the dispatcher's window: vehicles are signed out), the **wash rack** (blow-down, then water), charging rows (all vehicles are electric). Hours 06:00–18:00.

### 4.11 The battalion gym and field, the field house, the track and the obstacle course

**The battalion gym** ("the Annex", 40 × 30 m, in the lines, 89 m from Echo's door): the daily gym of a marine's free time (TIME's `gym`). A weight room of 4 squat racks with flywheel loaders, 6 benches and dumbbells; 4 `gTreadmill`s; a mat corner of 48 tiles and two heavy bags; a small locker room with 4 showers; the duty gym NCO's desk. Open 04:30–23:00. **The battalion field** beside it (120 × 60 m) is the battalion's PT and formation ground: a 300 m loop marked round its edge, pull-up bars and dip stations at its west end, the battalion's formation marks (companies in line, platoons in three ranks, section 2.6). The company's PT opens here (a 120 m run from the street) and the formation runs go out from it onto the perimeter road.

**Field house** (the 4th Marines' gym in Main Side, 60 × 40 m, 8 m clear in the halls; the mat room for combatives classes and the court for sport):

| Room | Rect | Contents |
|---|---|---|
| weight room | 0.3–30.0 × 0.3–20.0 | 8 squat racks with flywheel loaders, 12 benches, dumbbell racks. At 0.38 G a plate weighs 38% of what it would on Earth, so the racks carry plates cast up to 2.6 times Earth's heaviest, and the flywheel and pneumatic machines load force without mass (my call) |
| treadmill row | 30.0–59.7 × 0.3–6.3 | 12 `gTreadmill`s whose harness pulls the runner down by 0.62 G, so running feels like 1 G (as the ISS's harnessed treadmill pulls its runners down) |
| mat room | 30.0–50.0 × 6.3–20.3 | 280 mat tiles (combatives, MCMAP), heavy bags, the instructor's spot |
| gym office | 50.0–59.7 × 6.3–14.0 | the gym staff and the combatives instructor; the PT gear issue counter |
| locker rooms (two) | 0.3–30.0 × 20.0–39.7 | lockers, benches, 6 and 4 showers |
| court | 30.0–59.7 × 20.3–39.7 | a games court (high hoops: at 0.38 G everyone can dunk) |

Open 04:30–23:00.

**PT track**: a 400 m oval (two 84.4 m straights, bends of radius 36.5 m, six lanes of 1.22 m) on rubberised sinter; the infield is the Green. **The perimeter road** (3.4 km) is the formation run.

**Obstacle course**: two parallel lanes of 300 m (a race), twelve obstacles sized for 0.38 G (a jump on Mars reaches about 2.6 times as high for the same push, so heights run about 1.6–2 times a terrestrial course's, my call):

| # | Obstacle | Mars size |
|---|---|---|
| 1 | log hurdles | 1.2 m |
| 2 | low wall | 1.8 m |
| 3 | high bar | 2.6 m |
| 4 | rope swing over the ditch | 6 m wide |
| 5 | the weaver | 1.0–2.4 m bars |
| 6 | balance logs | 0.3 m wide, 1.5 m up |
| 7 | high wall | 3.5 m |
| 8 | pipe crawl | 0.7 m Ø, 8 m |
| 9 | rope climb | 9 m |
| 10 | cargo net tower | 8 m |
| 11 | the Valles drop | 4 m onto sand: 5.5 m/s at landing, like 1.5 m on Earth |
| 12 | sprint to the finish | 40 m |

Each obstacle is a fixture with `use: 'obstacle'` and the numbers BODY and SKILLS need (height, width, length).

### 4.12 Ranges and training grounds

**Known-distance rifle range** (X3, outside the East gate). It fires **east** (my call: side-on figures read the aim best, tradecraft's gun rigs).

```
x:   1060   1100            1300        1400                  1594 1600 1612    1640
     ready  500 m line      300 m line  200 m line            parapet│pits│impact berm (8 m)
     line   (20 points)     (20)        (20)                         │    │
z 300 ─────────────────────────────────────────────────────────────────────────────── 
       lanes 1–20, 5 m apart (z 302.5 … 397.5); wind flags every 100 m; tower at (1080, 296)
z 400 ───────────────────────────────────────────────────────────────────────────────
```

- **Firing points**: 20 per line at z = 302.5 + 5k, on lines at x 1,100 (500 m), 1,300 (300 m) and 1,400 (200 m) from the targets at x 1,600: the Corps' known distances in metres.
- **The pits**: a concrete trench x 1,600–1,610, 2.5 m deep, behind a 3 m parapet; 20 `targetCarrier`s raise 1.8 × 1.8 m targets above it. **Pulling butts** is a lived detail (my call, after the real practice): one marine per target raises and lowers it, marks hits with a spotter disc and a miss with a red flag; the pit telephone to the tower.
- **The impact berm** (x 1,612–1,640, 8 m high) stops what hits; the **surface danger zone** runs 7 km east of the targets and 1 km either side, closed land ("the impact area"). For scale only (a scratch point-mass run with a crude drag curve; WEAPONS owns real ballistics): a 4 g, 5.7 mm bullet at 950 m/s drops about 0.7 m over 500 m here against 2.0 m on Earth, and its greatest range is about 1.5 times Earth's.
- **The tower** (inset, 4 × 4 m, 9 m tall; the range officer, the red flag flown when hot, the PA); **the range shack** (inset, 12 × 8 m: ready room, heads, water, shelter in a storm); **the ammunition point** (a canopy at (1,070, 420): the day's issue from the ASP, counted out and counted back).
- Wind is the weather's at the line (WEAPONS reads it; the flags show it). A dust front or fog closes the range.

**As built in v0.0.5: the 25 m bay and the tower** (`src/data/places/range.js` `KD_RANGE`, `RANGE_PIECES`, authored, part of `melas@1` and the same in every career; drawn by `src/art/kit/range.js`; the build sheet 0.0.5 §8 items 2 and 3, my calls unless marked). The part a new join fires on first, at its final place, so nothing placed now moves when the 200, 300 and 500 m lines and the pits come at 0.0.7:
- **The bay** is a zone of the ground (`melas.kd-25`) in X3's north strip, between the tower and the KD lanes (z 302.5 and south), firing east beside them, never across them: **six lanes 3 m apart** (z 283.5 to 298.5), **the firing line at x 1,100** (the 500 m line's), a sintered pad under it with a mat a lane; **the cards at x 1,125** on frames 1.0 × 1.2 m, the 30 cm card's centre 0.6 m up, drawn **three times life size** (VIEWS §2.12); **a 3 m earth berm in four 0.75 m steps** at x 1,128 to 1,134, which stops walkers, not eyes; a chain-link **fence** along its north side (z 280.5) and a **range rope** on the south and the west; lane boards behind the line, a distance board at the cards and a LIVE FIRE notice at the line's west end. Each lane has its firing point (`fp`), the box the range rules hold you in (fp.x − 1.4 to + 2.2, fp.z ± 1.0) and its target.
- **A red flag on a pole at each end of the line** (1,103.5, 281.2) and (1,103.5, 299.8), flown with the tower's while the line is hot (the stage's call: the tower is 20 m behind the line, out of the frame the weapon mode shows, so its flag could never be seen while firing).
- **The tower** at (1,080, 296), 4 × 4 m and 9 m tall, **its deck at 6.0 m open under a half shade**, so the range officer stands in sight, facing downrange; the PA on its roof and its red flag's pole at the north-east corner.
- **The coach's place** is one spot for every stance (my call, the fixer's), **at (fp.x − 0.9, fp.z − 1.4) facing downrange**: at your left shoulder, a step back and north of you, drawn behind you, so he covers nothing of you standing, kneeling or prone. The build sheet's x − 0.6, z + 1.0 facing up put his back over your legs and rifle at 16 px/m, and the stage's first x − 1.4, z + 1.2 put his head on your feet for the whole prone string.
- **The ground grows over X3's strip** (x 1,040 to 1,680, z 260 to 440), drawn over it, and is walked in **two rects**: `GROUND_AREA.walksM` holds the list, Main Side's and the bay's (x 1,086 to 1,124, z 281 to 300), while `GROUND_AREA.walkM` stays Main Side's alone so `validate.js` reads it unchanged. The four gates stay shut, so a career cannot reach the range yet; `test-handling` starts on the line.
- **The range pieces are `GROUND_AREA.pieces`, not catalogue fixtures** (the stage's call): `fixtures.js` imports `areas.js`, which imports the ground, so the ground cannot import the catalogue; their nav blockers are added in `src/sim/places/ground.js`, and `RANGE_KINDS` gives their sizes. The firing points are therefore not placed fixtures with spots, and the range session names its point by the fixture's name (`fp`), not a `spotId` (TECH §6.1). Moving them into the catalogue as `kdTower`, `kdMat`, `kdFrame`, `rangeSign`, `berm` and `rangeFence`, the mats' spots the lanes' points, would also need `validate.js` to read `walksM`.

**As built in v0.0.7: the KD range in full** (`src/data/places/range.js` `KD_RANGE.kd`, `KD_LINES`, `KD_FLAGS_MID`, `RANGE_PIECES`; drawn by `src/art/kit/range.js` and `src/render/range.js`; the build sheet 0.0.7 §8 item 21, my calls unless marked). Authored and the same in every career; what happens on it (the wind, the relay, their scores, the dummy, an incident) is procedural (the user, 2026-11-05). Beside the bay, at its final place, firing east:
- **The lines** at x 1,400 (200 m), 1,300 (300 m) and 1,100 (500 m) from the faces at x 1,600, each **twenty numbered points 5 m apart** (lane n at z 297.5 + 5n, 302.5 to 397.5), a sintered pad under each line, a stake numbered for its lane behind each point (as built in v0.0.8, below: on its own row, 2 m behind) and the line's distance board at its north end. Every point has the bay's shapes: its `fp`, its box (fp.x − 1.4 to + 2.2, fp.z ± 1.0) and the coach's place at your left shoulder (fp.x − 0.9, fp.z − 1.4) facing downrange. **Zones** `melas.kd-line-200`, `-300` and `-500` ("The 200 m line" and so on, 4 m deep along each line), inside `melas.kd-range` ("Known-distance rifle range", X3's rect), which is `KD.zone`.
- **The target line**: each lane's face on its carrier (`kdCarrier`, 1.8 × 0.3 × 2.0 m; the sim's carrier at x 1,603.5), its centre 1.9 m up when raised and 0.6 m below the ground pulled down; **the carriers' frames are drawn at `CARRIER_DRAWN_X` 1,601.1**, the middle of the face as drawn twice life size, so frame and face meet (the stage's); the puller's place behind it (x 1,605.5).
- **The pits**: the trench x 1,600 to 1,610, its floor 2.5 m down (a floor piece, not a blocker), behind **a parapet whose top stands 0.5 m over the ground**, so 3 m over the pits' floor (the plan's 3 m; x 1,597 to 1,600, concrete), its back wall and its two ends; the pits' walk x 1,600.4 to 1,609.6. The pits NCO's post at (1,607, 301.5), 2.5 m down. A body's height counts from the ground it stands on, so the pullers are under the parapet's shield (WEAPONS §6.5).
- **The impact berm** x 1,612 to 1,640, 8 m high.
- **The wind flags** every 100 m from x 1,100 to 1,600 on both sides of the lanes (z 299.0 and 401.0), **the north row's first at x 1,140**, past the bay's berm (its x 1,100 would stand on the bay's sixth point); and (the fixer's, as first built in v0.0.7; **replaced in v0.0.8 by the rows below**) a middle row of four sleeves at z 345, between lanes 9 and 10 where the relay fires, at x 1,310, 1,410, 1,510 and 1,595, so a sleeve stood in the picture on either line and in the far window (the design review found no flag within 33 m of a KD point). The sleeve's lift is `wind.js` `flagOf`'s.
- **The ready line at x 1,062** (the sheet's 1,060 is X3's own west edge, where the rope stands), the range shack (12 × 8 m, shut) west of the tower, and **the ammunition point's canopy** (6 × 4 m) at (1,070, 420), its piece's centre **2.5 m north** so all of it stands in X3.
- **The rope** round the lanes' ground (z 300.2 north, z 399.8 south, x 1,060.2 west), laid **in runs of at most `ROPE_RUN_M` 30 m** (the stage draws a piece with the chunk its middle is in, so a 537 m rope in one piece went undrawn wherever its middle's chunk was out of reach). The KD is walked in **its rect, x 1,060.4 to 1,597, z 300.5 to 399.5**, and the pits in theirs, nowhere else; the gates stay shut, so only a scene reaches it.
- **Goldens re-set on purpose** (CHANGELOG.md says so): `GROUND_AREA`, `KD_RANGE` and `RANGE_PIECES` (the KD's pieces after the bay's, the ropes in 30 m runs, the carriers at 1,601.1; the middle sleeves re-set them once more), and `MELAS_PLAN` and `MELAS_PLAN_AS_WRITTEN` with the line zones.

**As built in v0.0.8: the bay's turners and its 7 m and 10 m lines** (`src/data/places/range.js` `PAIRS`, `PAIRS_PIECES`, `PAIRS_PAD`; drawn by `src/art/kit/range.js`; the build sheet 0.0.8 §8 item 4, my calls). Authored and the same in every career; which turner turns when, which is the no-shoot and which the armoured, the gaps and the words are `test-pairs`' and procedural (COMBAT §25.10.3).
- **The turners**: a turning target's stand 1 m in front of each of the bay's six frames, on its lane's axis, at x 1,124.0 (`PAIRS.turnerX`; fixtures `f:kd:turner-<n>`): `kdTurner` pieces of make `'stand'` (0.5 × 0.3 × 1.75 m, block `'see'`), facing the line. Its face, 0.46 × 0.76 m with its centre 1.35 m up, is hung and turned by the scene (`src/sim/arms/turners.js`), so no face hangs in test-handling or test-range and the 25 m cards stay uncovered; the frames and cards are unchanged.
- **The lines** at 7 and 10 m from the turners, x 1,117.0 and 1,114.0, painted across **a sintered pad** (x 1,112.6 to 1,118.6, z 281.2 to 299.8, the bay's width; the path `s:kd:pairs`, the last entry of `KD_PADS`, so the ground reads it with no new reader): two `kdPaint` pieces of make `'line'` (18.6 × 0.1 m, block null), stencilled "7 M" and "10 M". Each lane has a point on each line with the bay's shapes: its `fp`, its box (fp.x − 1.4 to + 2.2, fp.z ± 1.0) and the coach's place at your left shoulder (fp.x − 0.9, fp.z − 1.4). From a 7 m point the neighbouring turners stand 23.2° off the muzzle on your lane, from a 10 m point 16.7°.
- **Goldens re-set on purpose** (CHANGELOG.md says so): `GROUND_AREA` `15e07adedbca73` (was `0db1458f268269`), `RANGE_PIECES` `1cc17c3caea7ac` (was `0387e9d07c1d12`), and a new golden `PAIRS` `1e36cce2a670a5`; `KD_RANGE` unchanged (these are the turners' alone; the range fixes below re-set them again in the merged tree). `places-validate` walks from the 25 m point to every 7 m and 10 m point and every coach's place, no stand walked through.

**As built in v0.0.8: the range fixes, the flags, the stakes and the sleeve** (`src/data/places/range.js` `KD_FLAG_AHEAD_M`, `KD_FLAGS_MID`, `KD_STAKE_DX_M`, `KD_STAKE_DZ_M`; `src/art/kit/range.js`, `src/render/range-items.js`; the user's reports of 2026-11-07 in DESIGN.md's log; the build sheet 0.0.8 §11):
- **The middle wind flags**: on each of the 500, 300 and 200 m lines, a row of four **18 m downrange** (`KD_FLAG_AHEAD_M`, x 1,118, 1,318 and 1,418) at z 340, 345, 350 and 355, between the relay's lanes 8 to 12 and never on a lane's row, piece ids `f:kd:wind-m<x>-<z>`. Two more stay down the middle: 10 m downrange of the 100 m mark (x 1,510) and 5 m short of the parapet (x 1,595), both at z 345. That makes **26 flags (was 16)**; v0.0.7's at x 1,310 and 1,410 are gone. The sock verifier's finding of 0.0.8 (on lanes 8 to 11 at 1280 × 720 and 1470 × 860 v0.0.7's one middle flag was hidden under the plaques, the step panel or the far window): the choice of 18 m is my call, the middle of the picture's clear column, 13 to 22 m ahead of you at every window shape and beside the far window when it sits at the top centre. The far window and its plates also keep clear of the flag you read (VIEWS §7.5). The flag at x 1,595 is not seen in the far window at 4× (it shows about 4.9 m round the face at x 1,601), only at 1× (19.75 m).
- **The stakes**: each KD point's numbered stake stands on **its point's own row, 2 m behind its firing point** (`KD_STAKE_DX_M` −2.0, `KD_STAKE_DZ_M` 0; was 1.6 m behind and 1.2 m south, between two rows, so the neighbour's looked like yours; the user's report, 2026-11-07: "did call me line 5 when I'm line 10 here"). **The 25 m bay's lane numbers are the same stake** (kdPoint `'stake'`, 0.6 m, the constants moved to the bay's section and apply to both): it was a 1.3 m board 1.6 m behind its point and 0.9 m north of its row, and the tower verifier found the bay had the same fault; the switch of the bay's board to the KD's stake is my call. The stakes no longer block walking (block null). **Your own stake is marked** on the stage with a brass frame round its plate and a 5-3-1 pixel caret over it (`range-items.js` `ownPointPixels`, from `rangeLook(state).own`). A known look point, left as is: the bay's stakes and the 500 m line's stakes share a column and a plate, with the fence between them.
- **The wind sleeve as drawn** (`wind.js` `FLAG_BAND_MS`; the user's report, 2026-11-07: "Also the wind hose doesn't match the wind instructions ? Visually it looks like this as we read and coach tells us 3m/s right"): a dark steel pole 4.5 m tall; a rigid hoop at the top, 0.15 m downwind on a swivel, square to the wind; **five red and white bands filled one per 1.5 m/s** (limp under 1.5, straight out from 7.5 m/s), the full ones wide and smooth, the slack ones narrow (0.4) and creased; the tail's open end shows when the sleeve is straight out toward the camera; **a shadow on the ground straight below**, from the foot downwind (VIEWS §3.5's rule). 2.8 m long and 0.5 m at the mouth, bigger than life (my calls). The cues: the mouth facing you means a wind from the right of a shooter facing east; the sleeve hanging in front of the pole, from the left (wide smooth bands and the open end when strong, narrow creased bands when slack); the bar and sleeve lying sideways, along the line; count the full bands for the speed. WEAPONS §7.4 has the numbers.
- **Left open for the user** (a look call, not changed): the sleeve's slack bands at 2 to 4 m/s from the right hang down the screen, about 30 px at 1600 × 900, longer than the two full bands standing up (about 15 px). A 45-degree sag would make a north-blowing slack band move the screen by sin 45 − cos 45 = 0, so the slack bands would shrink to a dot and the band count (the speed) would be lost; the side still reads from the open mouth and the ground shadow. If you want it changed, the option to offer is a darker or longer shadow at 2 to 4 m/s.
- **Goldens re-set on purpose** (CHANGELOG.md says so): with the flags and stakes merged in, the final values are `GROUND_AREA` `1682873bc5491e`, `KD_RANGE` `1bf6880e66d850` and `RANGE_PIECES` `143eb1aef84906`; `PAIRS` unchanged.

**Indoor pistol range** (#32, 50 × 26 m): tradecraft's range (`interiors/range.js`) scaled up: **12 lanes of 1.8 m** across the picture, the firing line on the west and the trap on the east, distances **7, 15 and 25 m**, booth dividers, a baffled ceiling, even strip light; the range office (the range NCO, the gun locker), a ready room, a cleaning room. Range safety every tick (tradecraft's rules: muzzle past 60° off downrange a warning, past 100° the session stops).

**Shoot house** (X4, 30 × 20 m; **moved into the Wheel's sector 4 on 2026-11-08**, §4.15, where four are built to this design at 1 G; the text below is the design they share): `ballisticPanel` walls in 8 rooms off a hallway, with three authored wall layouts set by moving panels (A, B, C; which one an exercise uses is the exercise's detail, procedural, as the instructors would choose it: my call); paper, steel and mannequin targets (some marked hostage); an instructors' **catwalk** of grating at 3 m over the rooms (a second level reached by a stair), from which the instructors see down; a control booth with cameras. Live fire with practice rounds. **For close quarters** (COMBAT §25.10.2): every door records its `swing`; the targets are range pieces (steel and paper man-targets and mannequins; hostile, no-shoot, unknown and hostage cards; turners facing in 0.3 s on the booth's seeded timer or when a door opens; pop-ups; a mover on a rail in the hall; armoured silhouettes whose torso plates ring and stay up until the head plate falls); each layout's room plans (stack points, thresholds, points of domination, sectors, dead space, paths) are authored data held by a golden hash, derived from the room polygons from 0.3. Layout A's lane, three rooms and the hall, is `test-shoothouse`'s.

**The Hulk** (X4, 20 × 12 m; **moved into the Wheel's sector 5 on 2026-11-08**, §4.15, where its decks are a ship under 1 G of thrust): **two decks of a Tharsis-class corvette** (its Quarters and Cargo decks, section 5.4) built at true size on the ground, stacked, joined by its ladder and hatch, with its pressure doors (not pressure-tight). Boarding drills: stack on the hatch, clear compartments, a flash-bang in a 9 × 7 m deck. Two `deck` areas with the site's gravity.

**Hand grenade range** (X5): six throwing pits behind 1.4 m walls, a safety officer's bunker, an impact area to the east with a crater field.

**Ammunition supply point** (X6): four earth-covered bunkers (8 × 12 m each, `vaultWall` under 1 m of berm), an issue shed, a fence, a sentry by day; a day's ammunition is drawn by a detail with a truck and signed for.

**Training village** (X7, "Combat Town", 300 × 200 m south of Main Side, through the South gate): 22 buildings built from the base's own templates in sinter: 14 one-storey houses (8 × 10 m, a Martian dome-district row), 4 two-storey (a shop row, an office, a clinic, a town hall), a market square with stalls, a water tower. Each house is furnished once, by hand (laid with the dressing tool while authoring and committed as data, section 9.2), the same in every career; role-players (civilian contractors) fill it for exercises (PEOPLE's crowd), and an exercise's scenario (who is where, what is hidden, which house the cell uses) is procedural (CAREER and COMBAT). Beside it, **the gas chamber** (10 × 6 m, a double-door entry, a hot plate for irritant capsules, a purge fan clearing it in 5 min): the CBRN class with the mask (CAREER). Its zone carries an irritant (`toxKg` with `kind: 'cs'`, added to the gas list; BODY rules the effect).

**Little Conamara** (X9, SETTING §4.9: "a pressurised mock-up of an under-ice town street for Europa training"), beside the village: a sinter vault 140 × 40 m and 10 m high, earth-banked, held at **Ice standard** (75 kPa, 14 °C) behind **a mock CP-A** at its west end (section 7.6: the serpentine, the search bay, the air break from the outside air's 66 kPa, the sangar), so a battalion trains its checkpoints, its ears and its breath before it deploys. Inside, one street of the shaft-town template at true size (section 7.2): housing stacks two high with catwalks, a market of eight stalls, a noodle counter, the front of a bathhouse, a works gate on CP-C's template, sodium lamps on a UTC day, felt-lined walls. Role-players fill it for exercises; its HVAC can be set to the poor streets' 1 kPa of CO₂. Used in the predeploy sols (CAREER) and by the Europa course at Schools.

**The Talus** (X8): authored field ground on the old landslide's lobe south of the base (SETTING §4.9's outwash), from z 1,400 about 8 km south across its hummocks; the wall's foot lies about 30 km south of Main Side, under the crest at 45 km (section 3.15), and is reached by vehicle for the cliff training SETTING gives the base. Boulder fields, landslide hummocks and their blocks, dry gullies, dust flats, a few ruins of the old construction camps (my call), patrol bases, observation posts, and an **unknown-distance range** with steel targets at 100–800 m. It is laid with the ground tool while authoring, committed as the ground's data and finished by hand (section 9.5), so every career patrols the same hummocks and learns the same gullies. What happens on it is procedural: an exercise's routes, objectives, opposition and where they wait come from CAREER and COMBAT, placed on the authored ground's waypoints.

### 4.13 Life and support buildings

- **Main gate and Melas Halt**: the gatehouse (inset: the sentry's window, two sentries of the base's military police, the barrier arm), the inspection canopy over the inbound lane (30 m), a pedestrian turnstile, a stop of the Loop; the **visitor centre** (pass counter, 12 chairs); 120 m outside, **Melas Halt** (an 80 m platform on the Valley line, a bus shelter where the base bus stops; CAREER's arrival). Sentries 24 h.
- **Military police station and brig** (50 × 32 m): the desk sergeant's counter (24 h), offices, an interview room, an arms locker, a sally port for vehicles, **six cells** (2.4 × 3.0 m) and a holding cell.
- **Chapel** (30 × 24 m): the nave with 24 pews of five (120 seats), the altar area with a screen for the faiths SETTING gives the Corps, the **chaplain's office** (confidential counselling), a meditation room, the vestry.
- **The Grove** (SETTING §4.9 and §5.8; 140 × 130 m beside the chapel): a stand of larch and pine, one tree for every 2nd Division marine dead in service since MY 180, each with its basalt marker, planted 3 m apart on watered ground (about 1,800 trees now, room for 2,000; the oldest 20 m tall). At its head, **the Memorial Wall** (40 m long, 2.4 m high, of basalt): the same names cut in panels in the pixel alphabet (CAREER §20's plaques, readable by walking up to them), so a marine can stand in front of a name or touch a tree's bark before a deployment. The Planting and the Muster of the Lost happen here (SETTING §5.8); the Grove's formation marks hold a battalion.
- **Parade deck** (200 × 120 m, swept daily): the flagpole, the reviewing stand, the 4th Marines' formation marks (battalions in line, companies in line, platoons in three ranks, section 2.6). Morning and evening colours at the flagpole (PEOPLE's customs, TIME's times).
- **Battalion supply** (60 × 30 m, in the lines, 198 m from Echo's door): the supply counter (CAREER's check-in stop: linen, a lock, the field gear), the company cages, the supply chief's office.
- **Schools** (60 × 32 m): six classrooms (9 × 8 m, 28 seats each, a podium, a screen wall), a **lander cabin trainer** (a Simoom cabin mock-up with its 44 couches on a motion base, my call), a library, offices, heads.
- **PX** (44 × 28 m): the retail floor (gondolas, a clothing rack, the "upgrades" counter for watches, socks and permitted gear: CAREER §12.7), two checkouts, the **barber** (three chairs; the regulation haircut), the **food court** (a noodle counter and a bakery, 40 seats), the **mail counter** (letters and parcels home), a pay terminal. 10:00–20:00.
  - **As built in v0.0.6, the barber's pole** (`src/data/places/ground.js` `BARBER`, `f:melas:px:barber`; the build sheet 0.0.6 §8 item 20; the user, 2026-11-06: "we should have to groom our hair the same way we will have to groom our beards"). The PX has no building yet, so its barber is a pole on its stand by the north door, at **(294.5, 425.6)** on the ground, facing north, **2.5 m east of the door (292, 430) and 4.4 m out from the wall**: this camera looks north, so anything on a north face hides behind the building's 4 m roof (a 4 m roof at z 430 covers the picture to z 426; the tube, 1.3 to 2.1 m up, is clear of it from z 427.3 north), and its spot at **(293.85, 425.6)**, facing it, stands clear of the roof's edge, so the view's see-through never cuts the pole away round you (the hair role's, my calls; on the wall it was invisible in the shots). R there: "haircut (your cut ▾) · 12 min", **10:00 to 20:00** (`BARBER_H`; struck "the barber opens at 10:00" or "the barber shut at 20:00" outside them, and "fresh from the barber" at the cut's first step), seated inside behind a splash with no vignette; you come out fresh-cut (TIME §8.2). **The interior, its three chairs, the queue and the price wait for the PX's building** (VIEWS §18, question 15). `GROUND_AREA` moved by the pole alone; `places-validate` holds its spot reachable and the roof's clearance.
- **Rec hall, "the Rec"** (40 × 30 m): a 12 m bar (beer and cider; SETTING rules the age and the hours), 30 tables of four, three pool tables, a dartboard (darts fly flatter at 0.38 G), a screen wall (news and sport, Earth's with its light lag), a small stage, **six comm booths** for messages home (light-lagged: TIME), a quiet corner of books. 16:00–23:00, weekends 12:00–01:00.
- **Laundry and linen exchange** (36 × 20 m): six industrial washers and dryers, the **linen exchange counter** (sheets turned in weekly, clean ones drawn: a two-minute lived errand), a field-gear wash for boots and packs, ten self-service machines. 07:00–19:00.
- **Water plant** (60 × 60 m): four wells 300 m deep into the canyon floor's aquifer, the treatment hall (reverse osmosis, perchlorate ion exchange, UV), two 1,000 m³ tanks, the pump room, the lab, the control room (two operators, 24 h). Its numbers are section 3.12.
- **Power plant** (80 × 80 m): two 10 MW fusion units (SETTING and TECH name the kind), the converter hall, the 40 MWh battery hall, the switchyard and the valley grid's tie, the control room (two operators, 24 h), its own fence.
- **Melas Field** (SETTING §4.9 and §5.4: assault lander squadrons LS-21 and LS-22 of the 1st Marine Assault Wing): eight pads of Ø 60 m behind 4 m blast fences, two hangars, the tower, the fuel farm, the crash-rescue station; and **the terminal** (60 × 30 m, specified): the marshalling hall (240 seats in company blocks, the stand-by spots of a lift, the sea-bag nets), the **MOVCON desks** (manifests checked; CAREER's "the move to the pad" is the move to Melas Field), heads, a canteen, the field's weather office, and the walk across the apron to the Simoom's ramp (lived, with the sea bag). The lift to Phobos (SETTING §6.5: about 5 minutes of ascent capped at 2.5 G, 2 to 3.5 h in all, docking at gantry tower A) and the landers' drills fly from here.

### 4.14 Posts and their hours

Defaults for PEOPLE's rosters and TIME's Plan of the Day (they may override). A post is a staff spot in a room.

| Post | Place | Hours | People |
|---|---|---|---|
| Sentries (the base's military police) | main gate; the North and South gates | 24 h | 2; 1 each |
| **The battalion guard** (PEOPLE §4.3: Echo, Fox, Golf and Hotel in turn, a sol in four, guarding the battalion area) | the Two-Four lines: the armoury's door sentry, the vehicle park, a roving patrol of the lines, the guard room in battalion HQ | 24 h, three reliefs | 1, 1, 2, and the sergeant and corporal of the guard |
| Pass clerk | visitor centre | 07:00–19:00 | 1 |
| Desk sergeant, patrol | MP station | 24 h | 1 + 2 |
| Officer of the day, duty clerk | battalion HQ lobby | 24 h | 2 |
| Duty NCO, runner | each barracks' quarterdeck | 24 h | 2 |
| Fire watch | barracks hallways | taps to reveille, 2 h shifts | 1 a floor |
| Clerks | S-1 counter; company admin; supply counter | 07:30–16:30 | 2; 1; 1 |
| Armourers | armoury windows | 06:00–18:00 | 2–3 |
| Headcount clerk, cooks, servers, scullery | mess hall | meals | 1, 6, 8, 4 |
| Sick-call corpsman, corpsmen, medical officer | aid station | 06:30–16:00; a duty corpsman 24 h | 1, 3, 1 |
| Range officer, range NCO, pit detail | KD range | while hot | 2 + 20 |
| Range NCO | pistol range | while booked | 1 |
| Ring operator, flight physiologist | G-house | sessions | 2 |
| Suit-drill instructor, suit techs, pump operator | Vac Bay | 07:00–17:00 and drills | 1, 2, 1 |
| Gym staff, combatives instructor | field house | 04:30–23:00 | 1, 1 |
| Duty gym NCO | the battalion gym | 04:30–23:00 | 1 |
| Clerks, barber | PX | 10:00–20:00 | 2, 1 |
| Bartender | the Rec | opening hours | 1 |
| Linen clerk | laundry | 07:00–19:00 | 1 |
| Dispatcher | motor pool | 06:00–18:00 | 1 |
| Operators | water plant; power plant | 24 h | 2; 2 |
| MOVCON clerks, crash crew | Melas Field's terminal | flights | 2, 3 |
| Driver | the Loop (each bus) | 05:00–24:00 | 1 |

### 4.15 The Wheel: the 1 G training hall

Added 2026-11-08 for the user's rule of that day: "Yes 1G martian marines always train at 1G except for basic weapons training which is what we have been doing here" (DESIGN.md's log; SETTING §5.11 holds the why, the table of offsets and the costs). The design, its size and its place are mine (my call); the numbers marked [computed] come from SETTING §5.11's scratch script. Authored, the same in every career; what is trained in it and who is where is procedural.

- **What**: a ring of **R 500 m** to its floor's mid-line, turning at **ω 0.1347 rad/s (1.29 rpm)**, so the felt weight is 1.0 G with Mars's 0.38 G underneath (0.925 G of spin), its floor banked **67.7°** from the horizontal as the Ring's cars swing. Rim speed **67.4 m/s**, a loop of **3,142 m**. It never stops. The radius is chosen so a room is nearly Earth's (my call, on SETTING §5.11's table [computed]; R 200 m would leave a marking round 8.7 cm off at 7 m and an entry's lurch at 9%): frangible within 1.7 cm of Earth's path at 10 m, a marking round within 2.8 cm at 5 m and 5.5 cm at 7 m along the spin, a body at the Assault walk 6% heavier or lighter, the floor 10 cm uphill over 10 m, the head's g 99.7% of the feet's. 1.29 rpm is under the 2 rpm at which the slow-rotation-room studies of the 1960s found most people untroubled (my reading of them; BODY §14.4's adaptation applies, and a turn of the head in the first sols is felt).
- **Where**: **buried under Base Melas**, centred on Main Side's middle (500, 350) in the site frame (X13, §4.2), so the loop runs under the main gate's road (x 0), the East gate (x 1,000), North Side's southern edge (z −150) and the ground between Main Side and the training village (z 850): a vault 40 m deep and 44 m wide under 10 m of cover, and nothing on the ground above it changes. **Four stops** at the compass points, each a small building with a lift down to the transfer platform: **North** at (500, −150), out of the North gate, about 400 m and 6 minutes' walk from Echo's door; **East** at (1,000, 350), by the East gate and the ranges; **South** at (500, 850), by the training village; **West** at (−20, 350), by the main gate.
- **The vault and the hull** [computed; my estimates of mass]: the rim is a pressurised hull (the Martian indoor standard inside) in a vault whose gap is pumped down to 1 kPa, so it drags 1.0 MW of skin friction where Melas's 66 kPa air would take 64 MW. It holds itself out by hoop tension (1.9 m² of steel at 300 MPa for its 127 t a metre at 67 m/s) and floats on a superconducting magnetic bearing under its keel (its weight on Mars, 471 kN a metre of loop, is a tesla's magnetic pressure over a 1.2 m strip). About **400 kt**; **251 MWh to spin up** (25 h at 10 MW, done once and kept), **about 2 MW to hold** (the drag, the bearing's cryogenics, the vault's pumps), from a 10 MW unit of its own beside the base's plant (§4.13). Unpowered it coasts for days. Stopping it for maintenance turns its floors back into 67.7° slopes at 0.38 G: everyone out first.
- **The transfer**: no spokes (eight spoke tubes in Melas's air would drag 56 MW more [computed]), so a marine boards by **a transfer car**: a pressurised car of 120 seats that lives in the vault's vacuum, docks at a stop's platform, runs on its own track beside the rim at 0.15 G for **46 s and 1.5 km** while its cabin swings to the banked floor and the weight grows from 0.38 to 1.0 G, matches the rim to a few centimetres a second, docks to one of the rim's 24 ports and opens onto the floor. Seated and belted, the Ring's spin-up in a minute. **Twelve cars** on a cycle of about 8 minutes carry 180 riders a minute: a battalion's 750 in about 4 minutes, the 3,500 of the line in 19, so the battalions board 10 minutes apart. From Echo's door to the floor, about **12 minutes** (the walk, the lift, the wait, the run); a ride the stage plays as a short splash with its opening lived (TIME §6), inside the training blocks (CONTRACTS §20).
- **The floor**: one main deck **36 m wide** across the band, 8 m clear (catwalks over the houses), and a service deck outboard of it; the felt g runs 0.986 to 1.014 G across the band. **113,000 m²**: 32 m² a marine for the 3,500 at once of the line at Melas (the 4th Marines' 3,100 and about 1,550 of the 11th Marines' battalion, the Raiders and the reconnaissance company: about 4,650, three in four at once; my estimates). The areas are a loop of `deck` areas joined by portals, as the Ring's cars are (§1.3, §4.9): **twelve sectors** of 262 × 36 m, each between two ports, with gravity `spin` from the area's own field (§3.11: ω, R, the tilt) and x along the spin. A sector's floor is drawn flat (it rises 0.9 m over its half-length along the spin, which the portals take as the Ring's gangways do).

| Sector | Use |
|---|---|
| 1 | the galley (1,200 seats, three sittings at noon), heads and showers, the medical post (a corpsman), the Wheel's control room |
| 2, 3 | PT halls and the weight rooms at Earth's weight; **the lane**, a 2 m running lane along the outboard edge through every sector, 3,142 m a lap (the PFT's 4.8 km in 1.53 laps: CAREER §7.1) |
| 4 | **the houses**: four shoot houses of X4's design (§4.12: 30 × 20 m of `ballisticPanel` walls, 8 rooms off a hall, layouts A, B and C, the catwalk at 3 m, the booth), live frangible and marking rounds; **each house's hall and its rooms' depths laid across the band, its rooms' widths along the spin**, so the long sight lines take 0.38 of the spin's offset (SETTING §5.11); house 1's layout A is `test-shoothouse`'s (COMBAT §25.10.4) and its rooms are `test-breach`'s |
| 5 | **the Hulk at 1 G**: the corvette's two decks at true size as §4.12 designed, here a ship under 1 G of thrust; boarding drills at weight |
| 6 | **the street**: eight two-storey buildings of the training village's templates along a 200 m street, for marking-round force on force at 1 G |
| 7, 8 | **the lanes**: two fire-and-movement lanes, 250 m along the spin, berms and cover; blanks and the engagement harness's laser (COMBAT §2.3: exact, light crosses 50 m in 0.17 µs), marking rounds at their short ends. A squad's bounds at Earth's weight, with the honest lurch of a run along the spin (10% at 3.6 m/s, 17% at a sprint) |
| 9 | the mats (MCMAP at 1 G, COMBAT §10), the obstacle course at 1 G, the rope, the wall |
| 10 | classrooms and the simulators |
| 11 | lockers, the issue cage (frangible, marking rounds and blanks counted out and back), stores; rifles are drawn at the battalions' armouries and carried in cased |
| 12 | the plant spaces; a reserve sector for a battalion in from the field |

- **Physics on the floor** (BODY and WEAPONS read the area's `spin`): a body's Coriolis `2ω × v` (along the spin, heavier with it and lighter against it, 4% at a walk, 6% at the Assault walk, 10% at a run; across, a third of that sideways), a dropped body's 4 cm drift over a 1 m fall; a round's offset by WEAPONS §2.9's `ω d² / v`, entered as its spin bias (1.7 cm at 10 m for frangible, 5.5 cm at 7 m for a marking round along the spin). The basic weapons training's ranges stay outdoors at Melas's 0.38 G (§4.12), by the user's rule.
- **Its people**: the Wheel's operators (control, 24 h, 3), the galley's crew, the houses' chief and cadre (COMBAT §25.10.2), the PT instructors, the corpsman; posts in §4.14's table when built.

**As built in v0.0.11**: the shoot house has its place and a stub spec, not a layout. `test-shoothouse` is `{ host: { site: 'melas', area: 'melas.wheel.s4' }, env: wheel, hour 10:00 (my call), outfit utilities until the combat EVA suit joins, sheets private/cpl/sgt/raider/tierone (default private), built: false }`. The Wheel is Base Melas's, so the shoot house runs on Melas's site and sol (areas `melas.wheel.s1` to `s12`). It is left out of the Tests menu and refused by `newGame` until its layout and fill are built; `?play=test-shoothouse` shows the title with a toast.

---

**As built in v0.0.12** (`src/data/places/wheel.js`, `x4-plans.js`; `src/sim/places/spin.js`). Area `melas.wheel.s4` holds only house 1 and its apron (40 x 28 m), 1 G on the area record, so the scene spec's environment is `{ preset: 'site' }` (the rest of the sector waits for the Wheel's join; sheet item 18). Frame: the hall runs along the spin and the rooms' depths across the band (the sentence of this section read as being about the rooms; item 17), +z outboard. Layout A is built as chunks: **11 rooms and 11 openings**, room 1 §25.5.1's room exactly (5 x 4 m, a 0.9 m door inward, the path in 2.72 m, the start mark 4.00 m from the stack), room 2 a pull door out into the hall with a locked closet (kick DC 14), room 3 an L, dim (0.40 fill) at every hour, with its far leg; the catwalk at 3 m, its stairs and the booth. The doors swing by their plans' swings: room 1 pushes in (leaf free edge at (28.55, 11.1)), room 2 pulls out into the hall (to (20.15, 13.5)), room 3 pushes in (to (17.05, 11.1)). Goldens: WHEEL_S4 `05f066607e544d`, HOUSE1 `04447e988e6958`, the nav grid `1dd12b42226e54`, X4_PLANS `122fbb741feb40`. **Not built**: X4's other five rooms (layouts B and C stand as solid voids between the lane's rooms). **The spin** is one module, `spin.js` (the one home of omega: a syntax rule `SPIN_HOME`, with `env.js` holding R and omega as data): R 500 m, omega 0.1347 rad/s from the `wheel` preset; `spinOf(state, area)` is null off a spin floor and `spinBiasCm` gives `{ cm, upCm, sideCm }`. A deck is roofed (`figure.js` `ROOFED_KINDS`: under the Wheel's roof no cap is drawn).

**As built in v0.0.14** (the doorway rule, COMBAT §25.19.3, §25.19.13): no-stop zones are place-plan data (`src/sim/places/zones.js`). A funnel (`FUNNEL_M` 0.5, `FUNNEL_SIDE_M` 0.3) comes from each door plan, live only while its door is open, and every leafed door has one; a layout's `noStop` list may add rectangle zones (hatches, stairheads, corridor crossings). Only a step that stands by choice (`STANDS_STILL`) leaves a body in a zone. `nav.js` `clearLine` stops at the segment's end.

## 5. Ships and Phobos

### 5.1 Shared conventions

- **A ship is a tower whose decks are floors under thrust** (LONGHAUL, `docs/SHIPS.md`): decks stack bow to stern along the thrust axis; under thrust "down" is aft; one deck shows at a time (the hub). Deck frame and numbering: section 1.1 (screen-up is dorsal, Deck 1 is the bow's).
- **Hull paint and liveries** (the user, 2026-11-08: "Martian Navy official colors are red and black (ship paint and liveries ...)"): an MCRN hull's outside, its craft and its tail numbers are painted **red and black**; a UN hull's blue and black; the interior finishes stay the working greys of §9.2 (my call). The Coprates, Hellas and Tharsis classes, the Simoom and the Mistral are drawn so wherever their outside shows.
- **Hulls are practical boxes** (the user, LONGHAUL, 2026-10-20: "make sure the shapes make sense and are practical and hard scifi not fantasy (meaning mostly box-like shapes meant for efficiency and not aerodynamism)"), and **no hull lands except carried craft** (the user, LONGHAUL, 2026-10-25: "no large hulls could enter atmo, even corvettes; every hull that can't must carry a shuttle").
- **One program builds the inside and the outside** (LONGHAUL's `ship-layout.js` and `hulls.js`): a class's deck program stacks named deck templates; the same program places the collars on the hull, so a collar on the outside opens onto an airlock inside. Collar sizes are LONGHAUL's `COLLARS`: S crew hatch 1.0 m, M docking collar 2.2 m, L cargo cradle 6 m.
- **Deck-to-deck 3.0 m, 2.4 m clear** (2.8 and 2.2 on the corvette); every deck is its own pressure zone behind its hatches, subdivided by pressure doors where the template says.
- **A secure seat for every soul** on any hull whose `maxG` is over 1.5 G (the user's line in LONGHAUL, 2026-03-27: "velocity kill at 1.5G (juice threshold)"; the brief: "health effects under G and not under G", 2026-11-05). Secure seats are berth couches (`couchRack`: on MCRN hulls every berth is a couch, so a marine sleeps in the seat he rides a burn in), crash couches, crash-rated stations, the brig's cell couches and sick bay's strap-down beds; their count covers the crew's maximum, the troops' maximum and the brig's capacity, and `planCouches` (LONGHAUL's, COMBAT §13.2) can seat everyone from anywhere aboard within 4 minutes, inside TIME §12.4's 5-minute lead on a secure call (my call). The validator checks both (section 9.6). Storm-shelter mats (`gMat`) are extra, for a solar storm only.
- **Every deck carries**: the main trunk's hatch (and the escape trunk's on larger hulls); a damage-control locker (two extinguishers, a patch kit with sealant cans, adhesive patches and two rigid plates, a pry bar, smoke hoods); a vent valve; fire suppression (water mist in living spaces, nitrogen flood in machinery spaces and magazines); handholds along every wall and round every hatch for free fall; mag strips along passageways; a bulkhead clock on UTC (TIME); a deck plaque with its number and name; emergency lamps every 4 m; stowage latches on every locker ("secure for sea": loose things are hazards at a burn).
- **Templates are ASCII at 0.5 m a character**, with a JSON sidecar listing rooms, openings, fixture makes, zones and lamps (LONGHAUL's authoring idea at OLYMPUS's metric scale). The legend (my call): `#` hull or outer wall · `-` `|` inner wall · `.` deck · `,` grating · `+` door · `=` pressure door · `D` dogged bulkhead door · `O` hatch and ladder · `L` lift · `b` two-high rack · `B` three-high rack · `u` two-high berth couch · `l` locker · `e` suit stand · `a` arms locker · `c` crash couch · `C` console · `t` table · `s` seat · `g` galley · `h` toilet · `w` shower · `k` basin · `M` autodoc · `m` medical bed · `x` cell door · `S` stores · `P` PDC well · `T` torpedo rack or tube · `K` keel railgun · `R` reactor · `E` engine machinery · `W` water tank · `A` airlock · `^` collar · `~` handhold line · `>` tow line.

### 5.2 The Coprates-class assault transport (MCRN *Testudo*, AP-33)

SETTING §6.3 owns the record (`mcrn-transport`) and carries this deck program's hull and its 352-marine wave (CONTRACTS §15; §19 item 9, settled): **240 × 40 × 36 m, 52,000 t, TL4, crew 60 to 90 (72 usual), 1,150 troops (a reinforced battalion), a brig of 30, cruise 1 G, rated 3.5 G, maximum 5 G, evasive, armour 2, 8 PDCs and no tubes (it sails escorted), eight Simoom assault landers and two pinnaces**; the Haboob heavy landers are not carried, they fly from the shore (SETTING §6.4). Three are in commission: *Coprates* (AP-31), *Halloran* (AP-32) and *Testudo* (AP-33), the player's first ride. PLACES builds the deck program SETTING asks for ("troop berthing decks by company, galley, the armoury, the lander bays along the hull, the G-proof couch decks for burns over 1.5 G, the brig, the hospital"). **Its felt G is the voyage's**: TIME §12's `feltAt` with the profile CAREER files from SETTING §6.5 (1 G out by default, SETTING §6.5; CONTRACTS §14). Nothing in the deck program assumes a cruise G; it only guarantees a secure seat for every soul for anything over 1.5 G (section 5.1).

Interior decks are **38.4 × 34.4 m** inside the 40 × 36 m hull (0.8 m of hull, armour and water jacket each side, my call). Two personnel trunks at x 11.2 and 27.2, z 17.2, each with two ladders (one up and one down at general quarters) and two lifts; a freight lift (6 × 4 m) on the centre line for decks 13–21; pressure hatches at every deck. Collars: nose M, port and starboard M on Deck 14, the L cargo cradle on Deck 15. **Eight PDC wells**: four at the corners of Deck 2, four at the corners of Deck 22, with their feeds. Length: the nose's 6 m, 23 decks of 3 m, about 120 m of tanks and 45 m of engineering and drive make the 240 m.

| Deck | Name | Contents |
|---|---|---|
| nose | | sensor dome, armour, the nose collar and its lock |
| 1 | Command | the bridge (12 crash-rated consoles), the CIC (8), the comms room, the captain's and executive officer's cabins |
| 2 | Wardroom | 16 two-berth cabins with berth couches (the ship's officers and the embarked battalion's senior officers), the wardroom (40 seats), the **embarked battalion's command post** (a 12 × 8 m planning room with a screen wall carrying the ship's tactical repeater: what the ship's sensors hold, VIEWS), S-1 and S-4 desks; PDC wells 1–4 |
| 3 | Crew | Navy berthing (**90 berth couches** in 45 two-high columns, three compartments: the crew's maximum), the crew mess and galley (60 seats), two heads, the crew lounge |
| 4 | Medical and brig | sick bay: 2 operating rooms, an ICU of 6, a ward of 40 (strap-down beds, secure seats for their patients), 4 autodocs, pharmacy, lab, scanner, a decontamination station, dental, the morgue (12 cold drawers); **the brig** (SETTING's 30: 15 double cells, each with two berth couches, and the master-at-arms's office) |
| 5–8 | Troop decks A–D | per deck: **two company compartments of 72 two-high berth couch columns** (each about 18 × 12 m and 144 couches; 288 a deck and **1,152 in all**, for SETTING's 1,150 troops), a reading lamp, a curtain and a pan locker per couch (the rack's curtain of the hub's splash); two heads (12 toilets, 12 showers, 12 basins each: 1 per 12, section 9.6), two company lounges, two company offices, a laundry (6 washers, 6 dryers), the deck's damage-control locker; a 2 m passage ring round the trunks |
| 9 | Troop mess | the main galley, **four serving lines**, the mess deck (**360 seats**, 45 eight-seat tables: a battalion eats in three sittings), the scullery, cold and frozen stores, the "geedunk" (snacks and sundries), a library and chapel nook |
| 10 | Shelter and gym | **the storm shelter**, wrapped above and below by the water decks (about 90 g/cm², section 3.10): in ordinary days the gym (24 harness treadmills, weights, mats), four classrooms (40 seats), the all-hands hall; in a solar particle event all 1,270 aboard lie on its **1,300 `gMat`s** (about 1,200 m² of floor at 0.9 m² each), strapped down, rated to the hull's 3.5 G lying flat |
| 11–12 | Water | reaction-mass water tanks (the shelter's shield), crawlways only |
| 13 | Armoury and suits | the battalion's armoury cages (rifles, machine guns, mortars; weapons travel cased, SETTING §6.1), the **magazine** behind armour with a nitrogen flood, **1,200 suit stands**, 20 cleaning tables, a **25 m indoor range** of 4 lanes (frangible rounds only: WEAPONS) |
| 14 | Marshalling | the ready rooms (**352 crash couches**: a wave, eight Simooms of 44), the doors of the eight Simoom silos round the hull, the hatches of the two pinnace bays, the hangar control room, the EVA prep room, the port and starboard collars and their locks |
| 15–23 | Silos and cargo | the eight **Simoom silos** (10 × 6 m in plan and 28 m tall, Deck 14 to Deck 23, two on each face of the hull; the craft stand tail-down under thrust) and the two **pinnace bays** (20 m); between them the vehicle deck (15: rovers and carriers, the L cradle, the freight lift), cargo holds (16–18: SETTING's "a month of stores"), life support and utility (19: O₂ and N₂ tanks, scrubbers, the water recycler, power distribution), the workshop (20), stores (21–23); PDC wells 5–8 on 22 |
| tanks | | about 120 m of reaction-mass tanks along a crawlway trunk, a hatch every 12 m |
| aft | Engineering | about 45 m: engineering control (a deck of its own, 6 crash-rated stations), reactor access, the drive |

**Secure seats** (section 5.1): 1,152 berth couches on the troop decks, 90 in Navy berthing, 32 in the officers' cabins and 2 on Deck 1, 30 in the brig, 46 strap-down beds in sick bay, 352 crash couches in the ready rooms and 26 crash-rated stations: **1,730 for at most 1,270 aboard** (90 crew, 1,150 troops, 30 in the brig). A secure call finds most marines a few steps from their own couch; the mess deck's 360 reach theirs one to four decks up the two trunks' four ladders in about 2 minutes, which the couch test prints (`planCouches`' worst walk) and holds under 4.

**The deck range** (Deck 13; added 2026-11-08, SETTING §5.11) is a live-fire range at a true 1 G (the Wheel's houses and lanes are the Corps' other, at room range in a spun hall: §4.15). Under the voyage's 1 G of thrust a round falls exactly as it would on Earth (equivalence), and the shooter lies, kneels, rises and carries at Earth's weight; at 25 m the Mars zero shoots the same 3 cm low under either gravity (WEAPONS §2.5's table), so the range trains the body at weight, not ballistics, and Earth's long-range dope is the card's (WEAPONS §2.5). Frangible only, four lanes, a 2 m steel trap behind armoured louvres, the ship's air; booked by platoon through the voyage's days (TIME's ship day), cold during secure-for-burn and the flip.

Troop decks are **Condition Seal** ships (section 3.6). Embarkation into the Simooms happens in free fall (the transport coasts in orbit), by gangway from Deck 14's silo doors to the craft's side hatch.

### 5.3 The Hellas-class frigate and its marine detachment

LONGHAUL's `mcrn-frigate`: **120 × 19 × 17 m, 12,000 t, TL4, crew 20–40 (26 usual), 1 G cruise and 10 G maximum, 12 PDCs, 4 tubes (12 HE, 12 nuclear), a keel railgun, a brig of 12, one pinnace, collars nose M, port M and starboard M**. OLYMPUS adds a **marine detachment of 15** (a gunnery sergeant in command, a rifle squad of 13 that is the boarding squad, and a corpsman: SETTING §6.2, CONTRACTS §15). Interior decks are **17.4 × 15.4 m**. **Secure seats** (section 5.1): 24 berth couches on the crew deck, 10 in the officers' cabins, 18 on the marine deck, 12 in the brig's cells and 8 crash-rated stations, **72 for at most 67 aboard** (40 crew, 15 marines, 12 in the brig).

- **The keel railgun** runs the length of the ship: an armoured tube Ø 1.4 m on the centre line at the keel side (x 8.7, z 13.5) on every deck from 1 to 17, its capacitor banks on Deck 16. On every deck plan it is a great steel cylinder at the bottom of the screen.
- **Trunks**: the main trunk on the axis (x 8.7, z 6.5), a ladder and a lift car 1.2 × 1.6 m; an escape trunk with a ladder in the north-west corner (x 2.0, z 2.0).
- **Condition Vac** at battle stations (section 3.6): every deck pumped to 20 kPa in about 14 minutes, suits sealed.

| Deck | Name | Contents |
|---|---|---|
| nose | | sensor dome, armour, the nose collar (M) and its lock |
| 1 | Ops | six crash-rated stations (captain, executive officer, helm, tactical, sensors, comms), the tactical wall, the captain's ready room; PDC wells 1–2 |
| 2 | Officers | the captain's and executive officer's cabins, four two-berth cabins (berth couches throughout), the wardroom (10 seats), the crypto and comms room |
| 3 | Crew | 24 berth couches in 12 two-high columns, lockers, a head (3 toilets, 3 showers, 4 basins), the crew lounge |
| 4 | Galley and mess | the galley, the mess (24 seats), a rec corner (screens, a harness treadmill), stores; PDC wells 3–4 |
| 5 | **Marines** | below |
| 6 | Collars | the port and starboard M collars and their airlocks (3.0 × 2.5 m each), the EVA prep room, the **boarding locker** (cutting torches, breaching charges, a boarding-tube kit), the suit bench |
| 7 | Medical and brig | sick bay (2 autodocs, 2 beds, a treatment bed), **the brig** (6 double cells, two berth couches each), the master-at-arms's office |
| 8 | Utility | the life-support plant, scrubbers, water recycler, the workshop (2 benches), stores |
| 9 | Pinnace | the side hatch of the pinnace's silo (a flank silo 20 m tall spanning decks 6–12), the hangar control |
| 10–11 | Magazines | PDC magazines and their feeds, the torpedo magazine (24 on racks), nitrogen flood |
| 12 | Torpedo | the four tubes' breeches and loaders |
| 13–15 | Tanks | reaction mass, a crawlway |
| 16 | Capacitors | the railgun's capacitor banks (hot, loud: 85 dB), PDC wells |
| 17 | Engineering | engineering control (2 stations), the reactor's shield wall, access aft |

**Deck 5, the marine deck** (deck frame, 17.4 × 15.4 m):

| Room | Rect | Contents |
|---|---|---|
| marine berthing | 0.4–8.0 × 0.4–6.0 | 8 two-high berth couch columns in two rows of four, heads to the walls, a 1.4 m aisle (16 couches for the squad of 13 and the corpsman, 2 spare), pan lockers, curtains |
| detachment commander's cabin | 0.4–3.4 × 6.0–9.0 | a two-high berth couch column (the gunnery sergeant's, and one for an attached officer or a rider), a desk, a locker |
| ready room | 10.4–17.0 × 0.4–6.0 | 16 seats, a screen, the planning table (the boarding brief) |
| passage and trunk room | 3.4–17.0 × 6.0–8.0 | the main trunk's hatch, mag strips, the deck's damage-control locker |
| arms cage | 10.4–15.0 × 8.0–12.5 | 16 rifles, 8 pistols, 2 support weapons, ready-use ammunition lockers, the breaching kit; a Dutch door onto the passage |
| suit room | 4.0–10.4 × 9.0–12.6 | 16 suit stands round the walls, the leak-check port |
| head | 0.4–4.0 × 9.0–15.0 | 2 toilets, 2 showers, 3 basins |
| keel | x 8.0–9.4, z 12.8–14.2 | the railgun's tube |

### 5.4 The Tharsis-class corvette

LONGHAUL's `mcrn-corvette`: **46 × 10 × 8 m, 2,800 t, TL4, crew 6–12 (9 usual), 1 G cruise and 12 G maximum, 6 PDCs, 2 tubes, a brig of 6, a pinnace, collars nose M ("boarding collar") and port M**. Its eight-deck program is LONGHAUL's, at real scale: interior decks **9.2 × 7.2 m**, deck-to-deck 2.8 m (2.2 clear), one spine ladder (no lift). **Secure seats** (section 5.1): 6 berth couches, 7 crash couches, 3 crash-rated consoles and 6 cell couches, 22 for at most 18 aboard (12 crew, 6 in the brig); the team room's 8 couches cover a team of 8.

| Deck | LONGHAUL template | OLYMPUS contents |
|---|---|---|
| 1 | command (nose M collar) | helm, ops, weapons consoles, radio, the transponder rack, a crash couch, the nose collar's lock |
| 2 | quarters-6 | 6 berth couches (three two-high `couchRack`s), lockers, a head, 2 crash couches, 6 suit stands |
| 3 | mess | galley, two tables, the rec rig, an autodoc, 2 couches |
| 4 | utility | life support, water recycler, a workbench, 2 couches |
| 5 | brig | 6 cells, each with a berth couch (SETTING §6.2: the brig deck's 4 berths for a fire team on special tasking are four of them), 2 suit stands |
| 6 | cargo (port M collar) | the hold; **for special operations it becomes the team room** (up to 8 operators: 8 couches, 8 suit stands, an arms locker, the breaching kit) |
| 7 | engineering | engineering console, the drive's machinery, PDC wells |
| 8 | reactor | the reactor behind its shield |

Deck 2, Quarters, as its template (0.5 m a character; dorsal at the top, the keel at the bottom):

```
####################
#uuluuluul...ee.ee.#
#uuluuluul...ee.ee.#
#uu.uu.uu..........#
#uu.uu.uu..........#
#..................#
#..................#
#........OO........#
#........OO........#
#---+--............#
#hh.ww|......cc.cc.#
#hh.ww|......cc.cc.#
#kk...|......cc.cc.#
#kk...|......cc.cc.#
#.....|............#
####################
```

The same decks, built on the ground at true size, are Melas's **Hulk** (section 4.12).

### 5.5 The Simoom-class assault lander and the Mistral-class insertion craft

SETTING §6.4 owns both records (TL4 relatives of LONGHAUL's pinnace, the only atmosphere-rated hull family: lifting body, belly tiles, skids); PLACES builds their cabins.

- **Simoom** ("the brick"): **26 m, 92 t loaded (58 t dry); 2 pilots and a crew chief; 44 crash couches (a reinforced platoon); 6 t of cargo; 1 G cruise, 4 G maximum, troop-rated 2.5 G**; lift-to-drag 1.2, β about 655 kg/m², tiles for 1.1 MW/m², a chin cannon (WEAPONS), a radiation-shielded cabin of about 8 g/cm². Its profiles are SETTING's and LONGHAUL's flown ones, capped at the troop rating: a Mars entry of about 38 minutes peaking near 2.2 G; the lift from Melas Field to Phobos with about 5 minutes of ascent at up to 2.5 G (SETTING §6.5); on Europa a braking burn of up to about 77 s at the troop-rated 2.5 G cap, then 90 s from the hover under 1 G (SETTING §6.4, CONTRACTS §14). TIME and COMBAT fly them; the cap is SETTING's, not a number of this file's.
- **Cabin** (a `craft` area, drawn belly-down in its landed attitude; free fall's "down" is a convention): **15.6 × 3.2 m, 2.0 m clear** (my call); two rows of 22 `troopCouch`es facing inward along the walls at 0.68 m pitch, gimballed so a burn presses through the chest (+Gx), with a 1.0 m aisle and gear racks over them; the crew chief's seat by the side hatch; the cabin's repeater screen (VIEWS's seat display); a vacuum toilet behind a curtain (a Europa drop lasts 0.9 to 2.3 h, SETTING §6.5); the cockpit forward behind a hatch (2 seats); a **two-person side airlock** (4.8 m³, cycles in about 20 s); the **rear ramp** (2.4 m wide), unpressurised. For a combat drop the cabin's 100 m³ is dumped before the ramp drops: through a 0.1 m² dump valve, τ 8.5 s, under 1 kPa in about 36 s (section 3.4), the air made good from the carrier.
- **Dose**: the cabin's 8 g/cm² takes 10 mSv/h on Europa's pads and 20 mSv/h in its parking orbit (section 3.10), which makes the drop the tour's biggest single dose unless SETTING gives the cabin a water jacket (flagged in section 14).
- **Mistral**: **15 m, 34 t; 2 pilots; 10 seats; 2 t of cargo; 1 / 5 / 3 G** (cruise, maximum, troop-rated); a signature lower again (radar-absorbent skin, a cold-gas final descent with no plume in the last 300 m). Its cabin (a `craft`, 6.0 × 2.4 m, 1.8 m clear) holds 10 crash couches in two rows of five, the team's racks, a two-person airlock and no ramp: a recon or Raider team gets out through the lock (CAREER's insertions).
- **The pinnace** (LONGHAUL's, 18 m, 12 seats) keeps LONGHAUL's numbers; its cabin is the Simoom's cabin template cut to 12 couches.
- In the transport they stand tail-down in their silos and nobody rides them under thrust; boarding is in free fall (section 5.2).

### 5.6 Phobos: the Pens

Phobos Naval Yard (LONGHAUL and SETTING §6.1: 60,000 people, works dug into the rock by Stickney, three yard sheds, a command block, gantry towers A and B with eight arms, naval cradles N1 and N2 for L hulls; the transport lies in cradle N1). **The Pens** are SETTING's transit halls cut in the rock, where a battalion waits **1 to 3 sols** between its lift from Melas Field and its voyage: its medical and G checks, suit fitting, weapons cased into the transport's armoury, last letters, Mars through the observation slot. A `hab` area, **220 × 60 m and 12 m high**, at **micro-g** (0.0006 G toward the rock: a dropped helmet takes 19 s to fall a metre, section 3.11), 2 µSv/h under about 4.5 m of rock and regolith (section 3.10), Martian standard air.

| Part | Rect (area frame) | Contents |
|---|---|---|
| arrival lock | 0–14 × 20–40 | the Simoom docks at **gantry tower A's low arms**; a 40 m arm tube with a tow line runs from its collar to this lock; handlines |
| MOVCON | 14–26 × 0–60 | six desks (manifests, orders, identity, the dosimeter check, the G check's queue), the **baggage-net station** (sea bags into cargo nets by unit) |
| muster hall | 26–86 × 0–60 | company bays marked on the rock-side surface, a handline grid at 1.5 m, **steel deck plates** on every floor and wall face for magnetic soles (BODY's mag boots: ferrous plates, section 2.7), screens with the movement table, the stand-by spots of each move |
| sleeping halls A and B | 86–126 × 0–60 (two halls of 40 × 30 m) | **132 `bagRack`s** (66 a hall, in rows 1.2 m apart, each 5 tiers of 2 elastic sleeping bags): **1,320 bags**, enough for SETTING's 1,150 for three sols with room for the movement staff; lights on a UTC day, quiet hours, a net bag at every berth |
| services | 126–166 × 0–30 | **48 vacuum toilets** in four blocks of 12 (one per 24 for three sols, a field ratio, my call), 24 hygiene stations (no-rinse wash, 2 L: no showers at micro-g), the canteen (sealed meals and squeeze bulbs, 240 tether points, four sittings an hour) |
| medical and chapel | 126–166 × 30–60 | the G-check station (a short-arm stool centrifuge and a corpsman's desk: SETTING's "medical and G checks"), the motion-sickness station (space sickness is BODY's), a chapel nook |
| security | 166–180 × 0–60 | Navy military police, scanners, the MSS liaison's desk |
| observation slot | north wall, 60–72 | **the observation slot**, 12 × 1.5 m of armoured glass onto cradle N1: the transport in its cradle under floodlights and Mars beyond, filling 42° of the sky (one of the few real windows: LONGHAUL's honest views) |
| boarding tube | 180–220 (and 52 m beyond the wall) | 92 m long, Ø 3 m, a **tow line** (a moving loop at 1.0 m/s with hand grips) and handholds, ending at the transport's port collar on Deck 14 |

Nobody walks here: people push off, pull along the grid, ride the tow line, and **walk on mag soles** across the steel plates (ROADMAP's moment-lift: "the first push-off into the Pens on mag soles"). The tow line runs along the hall's spine from the arrival lock to the tube.

### 5.7 Phobos: the Void Operations School, the Wells and the Wreck

Added 2026-11-08 for the user's lore of that day (DESIGN.md's log: "a lot of zero G combat training with very different guns ... and zero/low G specific techniques for ship battles when not under thrust (mag boots etc)"; SETTING §5.11 holds the cadences). Authored, the same in every career; who trains there and what an exercise sets are procedural. My calls throughout.

The **Void Operations School** sits on Stickney's south rim beside Marine Barracks Phobos (SETTING §6.1), joined to the Pens (5.6) by a 400 m tunnel with a tow line. It runs the companies' void weeks (three companies a week, one to a Well, about 190 each in two shifts; each company goes on to its field week in the Drum, §5.8), the School of Infantry's seventh week (its last until 2026-11-08: BODY §14.1), and the Void Operations and Breacher Courses (CAREER §9.3). Its places, all at **micro-g** (0.0006 G toward the rock, section 3.11: a body at rest drifts 1 m to the floor in 19 s and 12 m in 65 s, so a fight is a free-fall fight and only what is left alone for a minute settles):

| Place | Area | Size | What |
|---|---|---|---|
| **The Wells A, B and C** | `floor` areas `phobos.void.well-a` to `-c`, gravity `micro`, the Martian indoor standard air | **40 × 40 m, 12 m high** (low enough for the stage to show a body's height by its shadow, VIEWS's zero-g frames; a ship's compartments are lower still) | steel deck plate on all six faces (mag boots anywhere), `handhold`s on a 1.5 m grid and pad-eyes every 3 m for lanyards (COMBAT §14.8); **cover blocks**, about sixty steel-and-foam boxes and plates (1 × 1 × 2 m, 2 × 2 × 0.5 m) on cables from winches in the faces, which the cadre sets into a deck program (a passage, a cargo hold, an engineering space) between runs; **the live face**, the east wall, a 3 m bank of bagged regolith behind steel louvres that takes every round the school fires (outdoors on Phobos every round leaves the moon: WEAPONS §2.6); light from every face, no down; the cadre's gallery behind armoured glass in the north-west corner, at mid-height |
| **The Cold Well** | `floor` area `phobos.void.cold`, `micro`, held in vacuum | 60 × 40 m, 12 m high, behind a personnel lock of 12 | suited work: tethers, the two-tether rule, the combat pack's short hops, live fire with ball and the J-12 into its own live face, a holed panel to patch under fire |
| **The zero-g mat** | a padded 12 × 12 m cell inside Well A | | MCMAP in free fall (COMBAT §10.3): the mat is a padded box, every face a wall |
| **The Wreck** | the deck program of a Tharsis-class corvette (5.4), stripped of reactor and drive, moored in Yard Shed 3 | 46 m | boarding drills at true size: the collar, the outer hatch (override, torch, a charge on a practice plate), compartments to clear hold to hold, pressurised or vented on the cadre's order; its decks are `deck` areas with gravity `micro` |
| **The school's armoury** | | | the void kit: V-5s, J-12s and their practice loads (WEAPONS §3.9), the R-7 for the drills that teach why not, mag boots, lanyards, combat packs, frangible and marking rounds |

Nothing here is walked: as in the Pens, people push off, pull along the grid and walk on mag soles. A void week (CAREER §10.1) runs its days through these places: the mat and the anchors on the first, the void arms on the second and third, the Wreck on the fourth, the Cold Well on the fifth.

### 5.8 Phobos: the Drum

Added 2026-11-08 for the user's "always train at 1G" (SETTING §5.11; §18's question 8, whose default it is). My calls throughout; the numbers [computed] in SETTING §5.11's script.

The field cannot be had at 1 G on Mars: a company's ground is kilometres, and a spun hall on a planet holds a run's Coriolis at 10% of the weight only from a radius of about 1.4 km, banked at 67.7°. In free space a drum turns about a true axis, and **motion and fire along the axis feel no Coriolis at all**. So the Corps' field at 1 G is a drum, laid along its axis.
- **What**: a drum of **R 500 m and 1,500 m long**, turning at **ω 0.1400 rad/s (1.34 rpm)**, rim 70 m/s, 1.0 G on its floor; **4.71 km² of terrain**: 1.6 t/m² of Phobos's regolith over a 16 cm steel shell, 289 g/cm² of shield under the feet, the end caps banked with regolith the same way; the Martian indoor standard air; a day from the light spine on the axis (lamps and mirrors on a UTC day).
- **Where**: co-orbiting with Phobos 20 km ahead of the moon on its orbit, outside its pull, a tug's 20-minute hop from the Pens (§5.6) and the Void Operations School (§5.7). Boarded at the axis (a hub lock at nothing felt), then lifts down the north cap's spokes to the floor, the weight growing from nothing to 1 G over 500 m.
- **The ground**: relief within 20 m (a 20 m hilltop is at 96% of the floor's weight), the attack laid along the axis, from the south cap to the north: hummocks, a gully, a hamlet of six buildings, a wood of planted pine, a stream; across the spin the land rises out of a standing eye's sight at 39 m and the far side is overhead at 1 km. Laid with the ground tool and committed as data (§9.5), as the Talus is.
- **Fire**: live fire on **axis ranges** only (along the axis a round feels only its drop, Earth's; along the spin an R-7 is 11 cm off at 25 m and 44 cm at 50 m); force on force with blanks and the engagement harness's laser (exact), marking rounds at room range in the hamlet.
- **Who and how often**: three companies a week, as the Wells take three, so a company's **void week and its field week are one fortnight at Phobos**, once a quarter of a dwell (CAREER §10.1), the void week first so the company comes home at weight (BODY §14.1); the Blues' platoon from a battalion in turn; the cadre of the Field Training Group beside the Void Operations School.
- **Cost** [computed; my estimates of mass]: about **16 Mt** (the shell 8.1 Mt, the terrain 7.5 Mt of the moon's own regolith); **10.6 GWh to spin up** (4.4 days at 100 MW from the yard's reactors), nothing to hold in vacuum. Built by Phobos Naval Yard from the moon's rock: the mass of about 300 of the Corps' transports, most of it regolith.
- **Areas**: ground chunks of `phobos.drum` with gravity `spin` about the x axis (the field along x), built with the void week's chapter (ROADMAP §8, §9).

---

## 6. Callisto: Naval Station Valhalla and Camp Lofn

LONGHAUL: Callisto is "outside the worst of Jupiter's radiation: the safe moon to build on", under Martian ground control (Naval Air Control: Valhalla, Asgard, Adlinda, Heimdall), with "the MCRN's Jovian base and the dome towns round it", a clinic, and a security course at "the MCRN base's range". SETTING §7.2 makes it **two sites, 12 km apart** on the floor of the Valhalla basin: **Naval Station Valhalla** (the Navy's docks, MARFORJOV and Jovian Command) and **Camp Lofn** (the 3rd Marine Brigade's camp, where an arriving battalion is received and staged: SETTING §6.5's 2 to 4 sols of RSOI). Both: **0.126 G, vacuum, about −140 °C** (−110 °C at noon), a solar day of 402 h (16.75 Earth days), 4 µSv/h on the surface and **0.56 µSv/h** inside under 3 m of regolith (section 3.10), Jupiter 4.3° across in the sky (about 3.6 lux of Jupiter-light at full phase, my estimate). Air: Martian standard. Clocks: UTC. Both are **buried grids of streets**: tunnels 6 m wide and 4.5 m high, vaulted in sintered regolith, under 3 m of cover; their levels are `hab` areas. TIME §2.6's row reads "Naval Station Valhalla / Camp Lofn".

**Between them**: the **Valhalla tram**, a tunnel tram of 12 km at 20 m/s, a 10-minute ride lived seated (TIME's `ride`), and the crawler road on the surface beside it (40 minutes by crawler, the dose a little higher). Valhalla Town (SETTING: 900,000, the base's liberty town) lies by Naval Station Valhalla.

**Naval Station Valhalla** (the arrival, and the rear):

| Part | Size | Contents |
|---|---|---|
| **Valhalla Spaceport**'s military field | 6 pads, 2 km from the station | the pad terminal (arrivals, MOVCON): a battalion lands from its transport in the Simooms, and moves by tram to Camp Lofn |
| Jovian Command and MARFORJOV headquarters | 80 × 40 m | the stabilisation force's rear headquarters, an ops centre with the planetary instrument (Europa, Ganymede and traffic, light-lagged to Mars by 31–56 min) |
| The naval clinic (SETTING: "clinic grade") | 60 × 40 m | an operating room, 30 beds, a radiation ward, 6 autodocs, a hyperbaric chamber (decompression sickness); neural surgery goes to Phobos (LONGHAUL's care tiers) |
| The repair docks and the fuel farm | shells | the squadron's docks (an orbital collar ring and a surface yard), not walked by marines |
| The dome-town tunnel | 400 m, a military police checkpoint at the station end | **Valhalla Town**, built from Europa's rig-camp template and dressed once as Martian civilian (bars under lamps, black-market real coffee, shops, a market) |

**Camp Lofn** (the brigade's camp, and the battalion's staging):

| Part | Size | Contents |
|---|---|---|
| **The Transit** (SETTING's RSOI halls) | 8 bays × 144 three-high racks (**1,152**, for a battalion of 1,150) | transit barracks for a battalion staging through (2 to 4 sols by SETTING §6.5, up to 10 when the drop waits), 8 heads, lounges, a laundry; the reception desks (dosimeter issue, the Accord classes' rooms) |
| The galley | 400 seats | three serving lines |
| **The Spin** (SETTING's centrifuge hall: mandatory sessions in 0.126 G) | a ring of 6 cars, radius 30 m (188 m loop) | 1 G felt at 0.126 G: ω 0.569 rad/s (5.43 rpm, Coriolis heavier than Melas's Ring); modelled as Melas's Ring is, six car areas joined by portals (section 4.9); weights, treadmills, mats |
| The range | indoor 100 m, 8 lanes; outside, **the Flats**: SETTING's surface range in vacuum, 1 km with steel targets | shooting in vacuum (no sound but through the ground and the suit; WEAPONS's vacuum ballistics); where rifles are zeroed on arrival (SETTING §6.5) |
| Armoury, suit loft (1,200 stands), four personnel locks, a vehicle lock | | |
| PX, chapel, a bar (SETTING names it), the comms centre (message booths to Mars) | | |
| The surface training ground | craters, a mock wreck, a vacuum obstacle course at 0.126 G | EVA drills |
| The 3rd Marine Brigade's lines | shells and templates | 2/7's and 3/7's barracks, the 2nd Deep Reconnaissance Company, the 2nd Raider Battalion (SETTING §5.4), peopled by crowds and tier 3 |

---

## 7. Europa

### 7.1 Common rules

- **The towns are SETTING's** (§7.4: nine towns of 2.95 million and some forty rigs, 200 to 2,900 m under the ice). This section's three templates are forms, and each instance carries its SETTING name, airspace and depth: **the shaft town** is Pwyll Deep's spaceport quarter (section 7.2), **the gallery town** is Thera Lens's form and the streets of the older towns (7.3), **the rig camp** is a quarry rig's (7.4). 2/4's sector is SETTING's Pwyll airspace (Pwyll Deep, the Tyre Works, Manannán: SETTING §7.7); MSF-E's headquarters is **Camp Halloran** in Conamara Under-Ice (SETTING §5.4), 1/7's ground.
- **Gravity 0.134 G**; surface vacuum at about 100 K; **225 mSv/h** on the surface (5.4 Sv/day, the hub). The towns lie hundreds of metres down, where the dose is the floor (section 3.10); whatever stands near the surface (the shaft heads, the pads' shelters, rig camps, CP-D's booth) keeps at least 6 m of ice blocks over every occupied room.
- **Air**: the towns and rigs breathe **Ice standard** (section 3.2: 75 kPa, 16.5 kPa O₂ at 22%, CO₂ scrubbed to 0.3% and 0.5–1.0 kPa in the poor low streets, 12–16 °C); 2/4's base breathes Martian standard (66 kPa). Every crossing between them is CP-A's air break (section 7.6), with the town on the higher side.
- **Ice and liners**: town walls are ice behind a liner of felt (section 3.8); the ice face is kept below −20 °C; a damaged liner drips; the galleries creep closed at SETTING's rates (2 mm a year at 600 m, 5 mm at 1,100 m, 20 cm a year at Thera Lens), and the reamers recut them for ever.
- **Ceilings** 2.4–3.2 m with padded strips on corridor ceilings: a casual lope at 0.134 G lifts a body 0.3–0.5 m, and Belters walk low and flat (BODY's gait); an off-world marine bangs his head.
- **Friction**: section 2.7 (warm town ice 0.10, meltwater 0.05, surface ice at 100 K 0.30).
- **Water**: ice is everywhere, but melted, cleaned and warmed water costs power and the levy (section 3.12): the force's showers are metered, the towns' bathhouses run hot for money, heating and light are rationed.
- **Clocks and light**: UTC, the three shifts (SETTING §3.6: first shift, swing, graveyard); VIEWS's under-ice moods (sodium streets on a UTC day).
- **Look**: Belter (hand-painted signs in Lang Belta and the Belt's creole, patched panels, union red, OPA colours, children's drawings in the stacks).
- **Jupiter** stands fixed in each town's sky, seen from the surface only. SETTING places the towns in LONGHAUL's three airspace arcs (Conamara 0–120° E, Pwyll 120–240° E, Thera 240–360° E), not at the real features' coordinates, so Jupiter's place comes from the arcs, not from Europa's real map: `jupiterAt(site)` gives its altitude, 90° − acos(cos φ · cos λ), from the site's east longitude λ and latitude φ (SETTING's to give for each town; until then the arc's middle and the equator). If LONGHAUL's longitudes face Jupiter at 0° (TECH confirms the frame when it ports `worlds.js`), Jupiter stands about 30° up over the middle of the Conamara and Thera arcs and never rises over Pwyll's: 2/4's sector never sees it.

### 7.2 The shaft town: Pwyll Deep's spaceport quarter

**Pwyll Deep** (SETTING §7.4): a crater town of 610,000 under Pwyll's bright rays, **600 to 1,400 m down**, the Ice Haulers' Union's town, with the Pwyll catapult on the surface. The shaft-town template is the form of its **spaceport quarter**, about 25,000 people round the spaceport shaft's foot, where 2/4's base and its checkpoints stand. The rest of the town is drawn in the same three rings as Base Melas (section 4.1): the quarter in full, the next districts from the template's levels in their authored variants, each district laid out and dressed once (tool-assisted while authoring, committed and finished by hand: section 9), and the far districts off the player's map with crowds and tier-3 notables. Every career walks the same Pwyll Deep; what happens in it (the incidents, the strikes, the cells, who lives in which pod) is procedural.

| Level | Depth | Area | Contents |
|---|---|---|---|
| 0 **Shaft head** | the surface, rooms 6 to 12 m under the ice-block berm | `floor` | the spaceport's pads (300 m off along a buried tube walkway under 6 m of blocks, a lived 4-minute walk), the shaft head's hall, the surface lock (CP-D), the cage hall, Ice Control's surface office, the force's crawler garage and Rad Control's surface desk |
| **The shaft** | Ø 14 m, 600 m deep | link | four passenger cages (3 × 4 m, 40 people, 8 m/s: 75 s from head to foot plus doors), the skip hoist (20 t skips of cut ice for the catapult), a ladderway, ducts; pressurised at Ice standard from the head's lock to the foot (ROADMAP's moment-drop: "the lift down hundreds of metres of ice into Pwyll Deep") |
| 1 **The Foot** | −600 m | `hab`, 160 × 160 m | the arrivals hall with Ice Control's customs, the **market hall** (60 × 20 × 8 m), the Ice Haulers' Union's hall, offices, **the clinic**, **checkpoints** into the town proper (CP-B) and **CP-A to 2/4's base** (section 7.5), the station of **the corridor**'s tram to the Tyre Works (SETTING §7.6: the Works and the trunk tunnels are the force's) |
| 2 **Rings** | −620 to −660 m | `hab`, three concentric ring galleries round the shaft's foot at radii 30, 50 and 70 m, 5 m wide, joined by radial cross-cuts | **housing**: family pods in two storeys along both walls (stack streets with catwalks), managers' flats, schools, a Belter chapel, noodle stalls, pocket squares |
| 3 **The quarter's plant** | −680 m | `hab`, 120 × 60 m section | the quarter's own air and water plant (the melt line, electrolysis, scrubbers) behind CP-C, smaller than the Works and guarded by Star Helix |
| 4 **Mine Head** | −700 m | `floor` | ice handling, the **cold lock** to the mine, the miners' changing rooms and suit racks, the miners' bar |
| 5+ **Cold mine** | −720 to −1,400 m | `hab`, vacuum, about 110 K | drifts, ice cutters, block haulage up the skip shaft; incidents and special operations |

### 7.3 The gallery town: Thera Lens, and the old towns' streets

**Thera Lens** (SETTING §7.4): 290,000, **2,300 to 2,900 m down**, deep, warm and squeezed over a lens of liquid water at 3 km; the poorest town, devout, the Ceres Free Belt's heartland; Star Helix alone; past the Thera line, outside the force's zones, so a marine goes there only on a special task (CAREER and section 8). The same template draws the tight galleries of Murias and the raft-cut galleries of Conamara Under-Ice, each at its own depth and creep.

A long vault: **the gallery** is 480 m long, 16 m wide and 10 m high, cut in the ice at the town's depth. It suits the stage: a long street across the picture. At Thera's depth it closes by about **20 cm a year** (SETTING §7.3): a reaming crew and its machine work a stretch of the street every few days (a lived obstacle and a crowd), the felt is re-hung behind them, and a sweating wall is an emergency.

- **Housing stacks** cut into the north and south walls: family pods three high (4 × 3 × 2.4 m each), reached by ladders and grating catwalks.
- **The Square** at mid-length (a widening 60 × 30 m): the market (section 7.8), a tea house, the union notice wall, the bathhouse ("the Steam").
- **Cross-cuts**: north to the town's plant (CP-C), south to the clinic and the school, east to the shaft and its cages, west the **adit**, an inclined tunnel down to the cold mine.
- Under the lowest gallery, about 100 m of warm ice to the lens: the special operations' Thera station (section 8, setting 8).

### 7.4 The rig camp

SETTING's rigs (§7.4: some forty camps at quarries, shafts and relay masts, 50 to 300 m down, about 200,000 people in all). The template is the newest and poorest kind, a **quarry rig** of about 2,500 (working name Rig Pwyll-9 until SETTING names it): **24 surface modules** (cylinders 8 m Ø × 30 m, one floor at a third of their height, 7 m wide) in four rows of six, joined by node cubes of 8 m, all under a **6 m berm of quarried ice blocks** and regolith, holding the rig's pad, its surface lock, the crawler garage, a market node of six stalls, capsule dormitories and a one-module clinic; and below it the rig's shaft and its working galleries at 50 to 300 m. Belter refit kit throughout (TL1: it breaks, and it is fixed with a wrench). The same template, dressed once as Martian civilian, draws Valhalla Town's streets on Callisto (section 6).

### 7.5 2/4's forward operating base: FOB Pwyll

2/4's base in its sector (SETTING §7.7: 2/4 takes the Pwyll airspace), at **Pwyll Deep's Foot, −600 m**, beside the foot of the spaceport shaft (about 2 km from the town's main shaft head: SETTING §7.4's "2 km from the main shaft's head") and behind CP-A: the base the marines go back to at the end of the day, as Melas was. SETTING names it **FOB Pwyll**, 2/4's base beside the Pwyll spaceport (SETTING §1.4, §7.4; CONTRACTS §17); MSF-E's headquarters, **Camp Halloran** in Conamara Under-Ice, is built from the same template (1/7's, a variant). Four galleries ("the spines", 10 m wide, 6 m high, 120 m long) were cut for the force in the ice beside the shaft's foot and lined with felt; their rooms are built of prefabricated panels inside them, joined by a hub gallery: about 160 × 80 m. Martian standard air at 66 kPa from its own plant (oxygen by electrolysis of Europa's water); the dose is the floor, 0.08 µSv/h (section 3.10).

- **Layout**: the four spines and the hub gallery, the air break (CP-A) at the hub's north end onto the Foot's street, a service way to the shaft's foot for the force's own cage (by contract with Ice Control).
- **Rooms**: barracks along the spines (20 rooms of 24 racks, two-high, a suit stand between each pair: 480 racks for battalion HQ, two rifle companies and the weapons and headquarters elements; the third rifle company holds the company outposts at the Tyre Works and Manannán); 2 heads (12 showers on metered heads, 1.5 minutes and 9 L a shower: section 3.12; 12 toilets, 16 basins each); 2 messes (a galley and 120 seats each); the **TOC** (the ops floor with the Europa instrument and the towns' camera feeds, the radio room, the S-2 cell); the armoury; the **Role 2 hospital** (an operating room, 10 beds, a radiation ward, 2 autodocs) and the aid station; the gym with **the Hamster** (a short-arm, pedal-driven human centrifuge, radius 2.2 m, two cabs, up to 1.2 G at the feet: my call, after the human-powered centrifuges tested for spaceflight); a laundry, a PX outlet, a chapel and rec room; the **detention facility** (6 cells, an interview room: SETTING's six-hour handover clock, §7.6 clause 5); **Rad Control** at the shaft's foot (every trip to the surface and back read off the dosimeters into the dose record); the comms room (cables up the shaft to the surface masts).
- **Up top**, at the shaft head (section 7.2, under its 6 m berm): the force's vehicle lock and garage (4 ice crawlers), the pads' guard post (CP-D), the surface masts.
- **Power**: bought from the Tyre Works by cable down the corridor (politically sensitive: the Water Workers' Federation can cut it, and Hecate Jovian Power bills it), a 2 MW fission module of the base's own ("the Kettle", my call), batteries for 10 MWh.
- **Company outposts** (COPs) in the Tyre Works and Manannán are smaller copies: a spine or rented space inside a town, for a reinforced platoon.

### 7.6 Checkpoints

Four templates, each in at least three authored variants (section 9). Each checkpoint in the world is one authored instance of one variant, placed by hand and the same in every career; who queues at it, what they carry and what happens there is procedural (COMBAT, PEOPLE):

| | Where | Size | Layout |
|---|---|---|---|
| **CP-A tunnel ECP** | where 2/4's base meets the town (the Foot), on the corridors, and between town sections | 40 × 12 m in a 6 m tunnel | town side: a serpentine queue (4 lanes × 10 m); the search bay (2 lanes, scanners, a search table, a searcher's spot for each sex: SETTING's customs); **the air break** (per lane a pressure-door pair 6 m apart, a 30 m³ chamber holding the town's 75 against the base's 66 kPa, with 20 cm² equalising valves: a crossing equalises in about 24 s, section 3.4, and the ears pop); base side: an `iceBag` sangar (2 × 2 m, firing ports), the guard room (4 racks, comms, a heater), a detention cell (2 × 2.5 m). Between two Ice standard sections the air break is a fire and breach break only |
| **CP-B market checkpoint** | inside a gallery or market hall | 30 × 16 m | ice-bag or barrier lines forming two lanes, a search tent (3 × 3 m), an ice-bag sangar (2.5 × 2.5 × 1.6 m with a plate roof), signs in Lang Belta, Martian and UN English |
| **CP-C works gate** | the works' cross-cut | 24 × 10 m | a blast door, a sangar inside, the staff turnstile with an ID reader, a vehicle bay for ice carts (6 m), the works' corporate security's own booth (PEOPLE) |
| **CP-D surface lock** | at a vehicle or personnel lock | the lock plus 12 × 8 m | crawlers inspected inside the vehicle lock; a dosimeter reader at the inner door; the guard inside a shielded booth under 6 m of ice watching the surface cameras (nobody stands guard on the surface at 225 mSv/h) |

### 7.7 The water and power works

The towns' life, and what the force guards (the hub; SETTING §7.6, clause 1: "the Tyre waterworks, the Pwyll catapult, the Conamara reactor hall"). The template is the core hall of **the Tyre Works** (SETTING §7.4: the waterworks town of 380,000 at 400 to 1,000 m in Pwyll, its reactors run by Hecate Jovian Power under contract; 2/4's to guard), 120 × 60 m at −700 m, reached from Pwyll Deep's Foot by the corridor's tram (a trunk tunnel: its length is SETTING's to give; working value 30 km at 25 m/s, a 20-minute ride lived seated). A variant of it is Conamara's reactor hall (1/7's):

- **The melt hall** (40 × 20 m): four melters taking the mine's ice, heated by the reactor's waste heat.
- **The treatment hall**: filtration of Europa's salts (sulphates and chlorides), UV, the town's 30-day reserve tanks and their pumping station.
- **The electrolysis hall**: 24 cell stacks; oxygen for the town's air and for sale, hydrogen for the ships.
- **The reactor hall**: a 200 MW fusion plant of Hecate Jovian Power's (TL4 Martian kit, its engineers HAD's contractors, the CUC's question in the Congress), behind its shield wall; **the control room** (6 consoles and the works' screens).
- **The heat sink and the melt pit**: waste heat is dumped into ice, which becomes the melters' water. If the sink fails, the works overheat; if the pit freezes, the water stops. Either is a story the force will be blamed for.
- Behind CP-C; patrolled by the force inside, by the works' security (Hecate Jovian Power's guards and the Water Workers' Federation's stewards) at the gate.

### 7.8 Markets, housing and clinics

- **Markets** (the Square, 60 × 30 m; the market hall, 60 × 20 m; a node market, 8 × 8 m): stalls of 2 × 2 m (a counter, crates, an awning, hanging lamps), each stall's trade authored with its place: noodles of yeast and algae, food grown in the towns' tanks, Ganymede's vegetables (dear), tea, knock-off gear, suit parts, water filters; a tea house (12 seats); a betting den; **the Steam**, a public bathhouse (30 × 15 m: pools, a steam room, lockers), where warm water is sold by the hour, because the ice is everywhere and the warmth is the luxury (my call).
- **Housing**: family pods (4 × 3 × 2.4 m, four sleeping places, a door, stored goods), stacked three high; capsule dormitories for single miners (capsules of 1 × 2 × 1 m in racks of three, 60 to a 20 × 10 m hall, a curtain and a shelf each); managers' flats in the Rings (three rooms, 8 × 6 m). Every home is dressed once, by hand, for the kind of household it is authored for (a miner's family of four, two single haulers), and PEOPLE moves into it a generated household that fits that kind (my call; PEOPLE §12.4), so a home's things and its people agree. Every Europa town has homes a family can be given: the shaft town's Rings (family pods and managers' flats, section 7.2) and the gallery towns' housing stacks (family pods, section 7.3); a rig camp holds capsule dormitories only (section 7.4), so its households are single haulers. The same rule holds for every authored home in the game: the Terraces' married quarters at Melas (section 4.1), and the houses of Redwater and the Mars home towns when they are built (Redwater at 0.2, the home towns for leave at 0.4: ROADMAP §6, §8), where CAREER §13 gives a career's family one of its home town's authored houses of the kind it fits.
- **The union clinic** (20 × 12 m): a waiting room (10 chairs), three exam bays behind curtains, a treatment room, a 6-bed ward with two beds for radiation sickness (miners who stayed out too long), the pharmacy counter (anti-radiation drugs, dear), the doctor's office (PEOPLE's notable).

### 7.9 The surface

Europa's ice at 100 K: ridged plains (double ridges 100–300 m wide and 100–200 m high), chaos terrain of tilted ice rafts (Conamara's), crater ejecta; the pads, comms masts, crawler roads marked by poles. A `ground` area of chunks, authored as section 9.5's grounds are. Work outside is a dose budget measured in minutes (section 3.10). There is no weather; there is the black sky, the small Sun, and, over the Conamara and Thera arcs, Jupiter fixed in the sky (never over Pwyll's: section 7.1).

---

## 8. Special-operations settings

The brief (the user, 2026-11-05): "the player can also become part of special operations teams and while still having to manage their own bodily needs and their weapon, will be dropped in much different special forces settings"; the hub's examples are "a station boarded in vacuum, a derelict, a dome on Ganymede". Each setting is at least three authored places of its kind (three relay stations, three derelicts, three lairs), each laid out and dressed once and the same in every career (section 9), so a recon marine can learn a station class as a Raider learns a ship class. What happens in them is procedural: CAREER deals the missions into them, and a mission's details (its objective, the opposition and its numbers, the intel the team is given and how wrong it is, the timing, and where inside the authored place the hostages, the cache or the cell are, among the spots its author tagged: section 9.8) come from the world's seed and the career's choices, with COMBAT and PEOPLE the opposition.

| # | Setting | Where and what | Air | Gravity | Dose | What makes it different |
|---|---|---|---|---|---|---|
| 1 | **Relay station in vacuum** | an OPA traffic and comms relay: four modules (8 × 20 m) on a truss round a docking hub, crew 8–20; layouts cross, line, ring | Belt station air, or pumped down by the defenders | micro-g | interplanetary | boarding by collar or by EVA and a breaching charge; both sides may run it at Condition Vac; handholds and tethers, no floors |
| 2 | **Derelict warship** | a gutted UNN Danube-class frigate (125 m), LONGHAUL's deck program at real scale | vacuum, with sealed pockets still at 101 kPa (a door opened blows) | a slow tumble of 0.5–2 rpm about the short axis: up to 0.22 G toward the ends, nothing amidships | 100–1,000 µSv/h near a cracked reactor shield | dead lighting, bodies, debris adrift; "down" changes along the corridor |
| 3 | **Ganymede agricultural dome** | a Ganymede Agricultural Concord farm dome (300 m across): terraced hydroponics, mirrors, the workers' village, irrigation tunnels, the pump house | Earth standard, 101 kPa, humid | 0.146 G | dome-shielded | dense crops (tradecraft's `foliage()`), a huge air volume (a 1 m² hole has τ ≈ 16 h), neutral ground claimed by both Earth and Mars |
| 4 | **Hungry Dark lair** | a captured rock of 2–4 km among Jupiter's outer moons: tunnels and caverns, a docking cave with a raider | Belt station air, poor (CO₂ 1.0 kPa, smoky) | about 0.001 G | low | they "run cold": low power, dim lamps, booby traps, stolen goods, the rock at −150 °C beyond the living caverns |
| 5 | **Ice hauler interdiction** | a 1.4 km ice hauler (Pur'n'Kleen's kind): four crew decks of 12 × 10 m at the bow, a 1.2 km spine of ice blocks in cradles | crew decks Belt station air; the spine vacuum | 0.3 G under thrust, or free fall | interplanetary | the search is a long suit walk along the spine against air and dose, for a cache hollowed into one block: walked, section by section, never rolled (section 12) |
| 6 | **Spun ring station** | Hygiea Ring (LONGHAUL: a 900 m spin ring): the rim's residential sector as `hab` sectors of 60 m joined by portals, as the Ring's cars are (section 1.3; true wrapping waits for this setting at 0.7, if still wanted), the zero-g hub, spoke lifts | Belt station air | 0.3 G on the rim (ω 0.081 rad/s), falling to zero up the spokes | low | Coriolis on the long fall up a spoke; crowds of a living station |
| 7 | **Io laboratory** | a corporate lab in Io's belts: a pad, 60 m of open ground, a bunker under 10 m of rock and a water shield | lab Earth standard | 0.183 G | 1.5 Sv/h outside, 0.3 mSv/h in the lock rooms behind the water shield, the floor in the bunker (section 3.10) | the dosimeter is the clock: two minutes in the open is 50 mSv; sulphur frost, plumes on the horizon |
| 8 | **Thera lake station** | a bore from Thera Lens's lowest gallery (about 2,900 m, section 7.3) through the last 100 m of warm ice to the lens at 3 km (SETTING §7.3): the bore's lift (a 2-minute ride), pressurised caverns in warm ice, the pumping hall, a hyperbaric lock to the lake (the brine is under 3.6 MPa of ice: 920 kg/m³ × 1.315 m/s² × 3,000 m) | Ice standard | 0.134 G | the floor | a CFB cell threatens the water supply; meltwater, creeping ice, and one way out |
| 9 | **Tharsis high dome** | a Martian dome district at +10 km: tiered streets, the air plant, the dome's ring; outside, the thin air | inside Martian standard; outside 30.7 kPa, pO₂ 9.8 kPa (masks or suits) | 0.38 G | 0.25 µSv/h outside | domestic and political (with Martian Security); also the mountain-warfare school's ground |
| 10 | **Torch raider** | a disabled pirate torch raider (35 m, LONGHAUL's class), coasting: five decks of 6 × 5 m, crew 6–10 | Belt station air or vacuum | free fall | interplanetary | EVA approach within 2 km at 2 m/s (LONGHAUL's limits), a breaching charge, traps, and a reactor that may need scramming within 90 minutes (LONGHAUL's containment clock) |
| 11 | **Callisto crash site** | a downed lander in a crater: a pressurised section leaking through a fist-sized hole, survivors, wreckage | vacuum; the section's air falling over minutes to hours | 0.126 G | 0.1 mSv/day in the open (4 µSv/h, section 3.10) | a race against τ, the cold (−140 °C) and a salvage crew; Jupiter fixed in the sky |
| 12 | **Ceres consulate** | the MCR consulate in a concourse district of Ceres Station (LONGHAUL: a spun-up rock, the OPA's capital, 1.8 million people): a three-storey compound, the street, the port's collars | Belt station air in the street, Martian standard in the compound | 0.3 G of spin (SETTING §8) plus 0.029 G | low | an evacuation or a siege: crowds, Lang Belta, politics; marines guarding their own embassy (tradecraft's embassy marine, whom the user wanted to "count for something", 2026-11-04) |

---

## 9. Authored places and variety

The user, tradecraft, 2026-10-27: "environments reuse exactly the same elements, please generate at least three more kinds of everything", and "make sure appartments are generated to a point, meaning that colors, decorations, ambiance, layouts needs variability". The user, for OLYMPUS, 2026-11-05: "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural". So the variety tradecraft rolled for each flat is authored here, once for each place: "at least three kinds of everything" (the hub's carried-over taste) holds as **authored variety across the buildings**, "three hand-made squad bays, not three rolls of one" (the hub), and nothing in a layout or its dressing is rolled per world or per career. Every place in this file is the same in every career, so the player learns Base Melas, *Testudo*'s decks and Pwyll Deep as places.

**Tools help the author, never the game** (the hub's method, my call): a layout tool, a dressing tool or a ground tool may propose a plan, a room's dressing or a stretch of ground while it is authored, but what it proposes is written into the repository as fixed data (TECH §2.4's frozen literals), looked at in shots, and finished by hand (TECH §14 lists the tools). The game only reads that data. tradecraft's measure (178 distinct looks in 180 generated flats, every spot reachable from the door in 360) becomes a measure of the authored set (section 9.4).

What is not authored is what happens in these places: events and incidents, weather (section 3.15), assignments and orders, opportunities, the people (all generated: the hub, 2026-11-05, "All people generated") and **mission details**, which CAREER, COMBAT and PEOPLE draw from the world's seed and the career's choices and place inside the handcrafted places (section 8): the objective, the opposition, the intel, the timing, and where in the place the cache, the hostages or the cell are.

### 9.1 Templates

- A template is an **authored layout**: a pure data module of frozen literals (TECH §2.4; v0.0.2 keeps Base Melas's tables and the test rooms in `src/data/places/`, and a template only PLACES reads may sit in `src/sim/places/templates/`), exporting `{ id, version, kind, sizeM, rooms, openings, fixtures, rules, zones, lamps, portals, variants }`. The logic that reads it lives in `src/sim/places/` (v0.0.2's `siteplan.js` derives Base Melas's door waypoints, spurs and edges from its tables).
- **Each place is authored once.** A building is its template, its variant, its mirror flag and its dressing, all named in its record (section 1.3: `plan: { template, variant, mirror, dress }`); a site is its plan (section 4.2) and its areas. There is no seed in any of them.
- **Fixtures** are placed by position (`{ kind, x, z, face }`) or by **rule** (the squad bay's unit rule of section 4.4, a mess hall's table grid, a suit loft's rows). A rule is a pure function of the template's own numbers, never of a seed, so a variant changes counts and spacing without hand-placing every piece and gives the same pieces every time.
- **Variants** (at least three per kind) are authored: layout variants (A, B, C), the east–west mirror, and room permutations (which bay holds which squad, which side of a head is which). Which variant each building uses is written in its record by hand (section 4.2's Plan column).
- **Ship decks** are ASCII at 0.5 m a character with a JSON sidecar (section 5.1); a deck program is the ordered list of deck template ids with each deck's options (which ports are cut, which wells hold PDCs: LONGHAUL's trimming rules). Each named hull (*Coprates*, *Halloran*, *Testudo*) has its own fixed program and dressing.
- A template carries a `version`; a site instance pins `template@version`, and a changed template is a new version so old saves rebuild their own (my call; TECH §7.7 owns migrations). A golden hash pins each authored place (TECH §13.5), so a change to one is always on purpose and said in CHANGELOG.md.

### 9.2 Dressing

Dressing is **authored per place**: each building, deck and room carries its dressing as data (the makes of its fixtures, its finishes, its wear, its culture, its clutter), laid with the dressing tool while authoring and finished by hand, the same in every career. It never moves geometry: it is a layer of its own in the data, so a change in looks never moves a wall, a fixture or a spot (tradecraft's separate streams, kept as separate data). A detail too fine to author (which of a tile's three paintings a cell shows, the turn of a pebble, a scuff's place on a locker door) comes from a hash of the piece's own id or the cell's coordinates with the authored constant in its data (a fixture's `seed`, as v0.0.2's test rooms carry one): fixed, the same in every career, and never the world's seed (TECH §8.1, rule 3).

| What | How |
|---|---|
| **Makes** | each fixture kind has at least three makes (a rack in steel tube, welded box or composite; a locker in grey, olive or rust enamel; a mess table in laminate, sinter or steel), chosen by the author per room or per building |
| **Finishes** | at least four wall finishes and five floors per culture (Martian: cream and rust paint, sinter tile, rubber matting, stained concrete, grating; Navy: grey panels, numbered frames, non-slip deck; Belter: patched panels, painted liners, foam, ice-faced) |
| **Wear** | a building's age and care, authored: scuffs, dents, patches, faded stencils, dust in the corners; its `grime` changes in play (section 3.13) and shows over it |
| **Culture palette** | Martian military (clean, cream and rust, stencils with SETTING's sayings, "MIND THE SEALS" by every pressure door); MCRN shipboard (grey, hazard yellow and black, deck numbers; the hull's outside and liveries red and black, §5.1); Belter (hand-painted, Lang Belta graffiti, union red, children's drawings); UN (white, blue and black, a generation old); corporate (Hecate Arms & Drive's clean glass and logos); Ganymede farm (green, wood-look panels) |
| **Personal things** | the occupant's, not the room's: drawn from the person's PEOPLE record (photos, a plant (on Mars a potted plant is a status item), a flag of home, unit memorabilia, a guitar, books, a pin-up board), so they follow a generated person, move with them and change with the career; a rack of a new join is bare. The room's dressing leaves the places they go (a locker door, a shelf, the rack's head) |
| **Clutter** | authored: drink bulbs, boots, a towel on a hook, a field manual, cleaning gear; never on a spot, never before a door or a plaque. What play drops (a glove, a magazine) is an item on the site's lying list (section 1.10) |
| **Lamps and mood** | lamp makes (at least three per kind), and a room's light mood within its state (VIEWS) |

### 9.3 At least three kinds of everything

Every row is a count of authored layouts or dressings, each placed once in the world.

| Kind | Authored variety (minimum) |
|---|---|
| Barracks buildings | 3 variants (A, B, C) × mirror, as section 4.2's Plan column places them, each company's barracks dressed once |
| Squad bays | 3 layouts (open bay, cubicles, pods), placed bay by bay (2nd Platoon's A, B and C: section 4.4), each bay dressed once |
| Heads | 3 layouts per size |
| Mess halls | 3 (Melas's battalion mess, *Testudo*'s mess deck, the galleys of 2/4's base and Camp Lofn), each with 3 table makes |
| Armouries | 3 (battalion, shipboard cage, the forward base's) |
| Offices, classrooms, clinics | 3 layouts each |
| Ship decks | 2–3 variants of each deck template per class, each named hull's program fixed; 3 dressings per navy |
| Europa towns | 3 templates (shaft town, gallery town, rig camp), each with 3 layouts of each level or block, laid out once as SETTING's towns at their depths |
| Checkpoints | 4 templates × 3 variants, each checkpoint in the world one of them |
| Markets and stalls | 3 market forms; 12 stall kinds by trade |
| Housing | 3 pod forms, 3 dormitory forms, each home dressed for the kind of household it is authored for (section 7.8) |
| Special-operations settings | 12, each with 3 authored places (section 8) |
| Operation spots | at least 3 candidates of each kind a large place offers: danger areas on each patrol route, objective, barricade and hostage spots in each hull and setting (section 9.8) |
| Field ground | 4 biomes on Mars (boulder field, talus, dust flat, gully), 3 on Europa (ridged plain, chaos, ejecta), 3 airless rock, laid as authored grounds (section 9.5) |
| Rocks and debris | 6 shapes × 3 sizes per body, placed in the grounds' data |

### 9.4 Measured variety, over the authored set

`places-variety` hashes each authored room's dressing (makes, finishes, layout, wear, clutter) into a look key and counts distinct keys across **every authored room of a kind** in every site built so far: **at least 95% distinct** (my target, beside tradecraft's 178 in 180), and **no two rooms of a kind seen on one walk** (the same floor, the same deck, neighbours in a street) share a key. It prints the counts by kind and every pair that clashes, so the author redresses them. Personal things are left out of the key, being the people's. The measure runs over committed data: it fails the build, never a player's world, and gives the same answer in every career.

### 9.5 Authored grounds

Large grounds are authored as places are: **laid with a ground tool while authoring, committed as fixed data, then finished by hand** (the hub, 2026-11-05). The rules below are how the tool proposes a ground; the game never runs them, so a world's seed never touches a ground.

- **Mars field** (the Talus): the tool lays a biome per chunk from a low-frequency field of the distance to the wall (talus and landslide lobes near the wall, boulder fields and gullies mid-way, dust flats toward the base); boulders as objects with heights (cover), gullies as trench strips, dust depth as a cost. The author then places the ruins of the construction camps, the patrol bases, the observation posts and the unknown-distance range by hand, and fixes what reads wrong in a shot. CAREER and COMBAT place an exercise's objectives and routes on the committed ground's waypoints, per exercise.
- **Europa surface**: ridged plains (ridge pairs every 1–5 km, 100–200 m high, as ramps and walls), chaos rafts (tilted blocks of 50–500 m as walls and ramps), crater ejecta; the poles marking crawler roads, placed by hand along the authored roads.
- **Airless rock** (Callisto, Phobos's outside, a lair's rock): crater rims, regolith, boulders.
- **The committed data** (my call): one frozen data module per ground area, holding per 32 m chunk its biome, its relief and dressing objects (rocks, gullies, ruins, poles), its blockers and its waypoints. The 1 m material cells are expanded from the chunk's biome when it is decoded, by a fixed rule of the cell's coordinates (a hash, never the world's seed), so the data stays small and every career walks the same cells. A chunk is decoded lazily when a sim read first needs it (section 2.4; TECH §8.1, rule 7), counted in cells decoded; `places-perf` prints each ground module's bytes and the decode's cost, and a golden pins each ground (TECH §13.5).
- Ground features too big for a 32 m chunk (a ridge, the range's berm) are site-plan objects in the static index.

### 9.6 Validation

Every authored place, each template and variant as it is placed, before it ships (a test, section 11). There are no seeds to sweep: each place is checked once, exactly as every career will meet it.

- **No seed in a place**: no site, area, room or ground record carries a `seed`, `siteSeed` or `dressSeed` (a fixture's look may carry its authored constant `seed`, section 9.2), and nothing in a layout or its dressing reads the world's seed (a lint over `src/data/places/` and `src/sim/places/`, where only the weather and the hazards, which are events, read it; from the places change that drops v0.0.2's site `seed`, section 1.10).

- Every spot is reachable from every portal for C0, C1 and C2, except spots marked `suitOnly` or `noSuit`.
- Every opening joins two rooms, or a room and the outside; every room has at least one opening; every area at least one portal.
- No blocking fixture within 0.9 m in front of a door, a hatch, an airlock door or an exit plaque; nothing in front of a plaque.
- **Signs at portals** (built in v0.0.3, `src/sim/places/validate.js`): every portal of a floor has an exit sign within 1.5 m of its band (`exit-sign`); every portal of a ground has a sign within 1.5 m (`door-sign`), the building's plate where it leads into one (Echo's ECHO plates, section 4.4).
- **Portals' arrivals and stairs** (built in v0.0.5, `src/sim/places/validate.js`): every portal's arrival faces the way its band is crossed (out n arrives facing up, s down, e right, w left: `arrive-face`; all 12 of Echo's and the ground's portals passed as they stood: upstairs you arrive facing south with the well behind you, downstairs on the flight facing north as you walk down), and every `stairsWell` has a link's portal whose firing zone, `STEP_M` to `STEP_M` + `PORTAL_DEPTH_M` past its band, lies wholly on the well's open top (`stair-top`: the way down fires at z 14.3 to 14.9, inside the landing's z 14.3 to 15.3). **From v0.0.6, `stair-foot`**: every flight has a link's portal across it; its firing zone meets the flight only in its top `STAIR_TOP_M` (`flightFarOf`); no walker of any class can stand in that zone outside the lane (`flightLaneOf`); and a C0 walker that steps on within `FLIGHT_FOOT_M` of the foot walks the lane's middle straight up into the zone. Broken on purpose by moving the band to z 11.0, at the foot.
- Every room lies in exactly one zone; every zone has a life-support unit or an explicit `unsupported` flag; every airlock has its interlock and both panels.
- Heads meet their standard (barracks: 1 toilet per 8, 1 shower per 8, 1 basin per 8; ships: 1 of each per 12; a micro-g transit hall: 1 toilet per 25); seats cover the planned sitting; racks cover the unit plus two.
- **Secure seats**: for every hull whose `maxG` is over 1.5 G, secure seats (section 5.1) ≥ the crew's maximum + the troops' maximum + the brig's capacity, read from SETTING's hull record; `planCouches` seats everyone from every spot aboard within 4 minutes (the worst walk is printed).
- **Names**: every name a template, a plaque or a stencil prints (sites, areas, rooms that carry a proper name, hull classes and ships, craft, units) is found in SETTING's data (`setting/*.js`) or is a generic noun ("Head", "S-1", "Deck 5"); a working name is allowed only if it is marked as one in the template, and the test lists them.
- **Operation spots** (section 9.8): every tagged danger area lies on its patrol route, and every objective, barricade, hostage, insertion and extraction spot is reachable from the place's entries; the counts of each kind per place are printed.
- **The ground waypoint graph** joins every building door, gate and muster area of a ground; its edge lengths agree with A* on built chunks within 5%.
- Ladders and trunks line up through a ship's stack (the same x and z on every stop); collars on the hull meet airlocks inside.
- At least one lamp per 12 m² of room; every room has at least one emergency lamp within 6 m of its door.
- No fixture overlaps another or a wall (at the 1/16 m grid the art draws on).

### 9.7 Arrival: the orientation route and the briefed map

Every site template carries an **orientation route** and a **briefing set** (my call, after the review: four orientation days in a career's first twenty hours would repeat the check-in's shape).

- **The orientation route** is an ordered list of waypoints a guide walks a newcomer through in about 20 minutes of game time: the berth, the head, the mess, the muster point, the secure seat or shelter, the armoury window, the aid station, the exits and the locks. TIME §10.4's forced first day at a new site becomes, after Base Melas, **this walk with a guide plus one thing that happens**, drawn from the site's arrival beats: aboard *Testudo*, a general-quarters drill on the first day; at Camp Lofn, a dust-off of a suit team at the lock; at 2/4's base, an incident at CP-A. Melas keeps CAREER's full check-in day (its stops are this file's rooms).
- **The briefing set** is the list of areas and rooms the site's arrival brief covers (all of a small site; for Base Melas the Two-Four lines and Main Side; for a town the quarter round the force's base). On arrival they are marked **briefed** on the mind's MAP (VIEWS: known by plan, not yet seen), so the rest of the site is learnt in play without a day of walking it.

### 9.8 Operation spots: where a mission may put things

An operation never rolls a layout (my call, in the hub's decision log of 2026-11-06: "Operations place objectives, barricades, hostages and danger areas on spots tagged in the authored hulls, settings and patrol routes, so no layout is rolled"; COMBAT §1, §23; CAREER §11.3). It chooses among **candidates the author tagged** in the place, and the candidates are part of the authored place, the same in every career; which of them a mission uses, and what it puts there, is the mission's detail, drawn from the world's seed and the career's choices.

- **Danger areas on patrol routes.** Every authored patrol route (the Talus's and the training village's, Little Conamara's street, the towns' galleries and market halls, the Works' passages, the corridor's trunk tunnel, the surface's crawler roads) is an ordered list of ground waypoints or portals, and carries its **candidate danger areas** as tagged zones along it: a gallery mouth, a market, a cross-cut, a culvert or choke point, a stretch of a known IED route. The patrol order marks them (COMBAT §21), and the day's operation draws which hold a cell's ambush, an IED or a watcher, and which are quiet.
- **Objective, barricade and hostage spots in hulls and settings.** Every authored hull's deck program (section 5; the target hulls of each class COMBAT §14 boards) and every special-operations setting (section 8) tags rooms, compartments and fixtures with the parts an operation may give them: **objective** (a bridge, an engineering space, a brig, a cargo hold, a safe, a data core, a cache's block on a hauler's spine), **barricade** (the ladder shaft, before the bridge and engineering, a hatch or a corridor to hold: COMBAT §14.4), **hostages** (a room or compartment that can hold people under guard), and the **insertion** and **extraction** points CAREER §11.3 places. The tags are a list on the record (`ops: ['objective', 'barricade']`), plain data like the rest of the place.
- **How many.** Where the place is large enough, at least three candidates of each kind it offers (my call, the hub's "at least three kinds of everything" applied to a mission's places), so two careers seldom meet the same arrangement in one place; a small place (a relay module, a torch raider's five decks) may offer fewer, and says so in its record.
- **Checked.** Section 9.6's validation proves every tagged spot reachable from the place's entries for the clearance classes that must reach it (a hostage room by C1 in fighting load and by C2 suited; a barricade from both sides), and prints the count of each kind per place; `places-variety` (section 9.4) leaves the tags out of the look key.

### 9.9 Mission scenes from authored chunks, by rules

Added 2026-11-08 for the user's standing rule (DESIGN.md's log): "We will play in predefined chunks (scenes) that will be generated using basic rules like atmosphere levels, gravity ..., whether we can use mag boots (metal plating on ships for instance), light levels, etc.. All that to say that the engine needs to support any surface on any part of the system by design". The design is mine (my call), from the audit's plan; it **reconciles** the hub's 2026-11-05 rule that the world is handcrafted and mission details are procedural:

- **Handcrafted places stay handcrafted.** Melas, *Testudo*'s decks, Pwyll Deep and every place a career lives in or returns to is authored (sections 4 to 8). A mission at one of them uses that place, with its own environment, and the occupants are rolled (section 9.8).
- **A mission somewhere the career never lives** (a derelict, a station section under Ceres, an Earth town block, a hostile hull, a section of Ganymede's domes) is a **scene** generated from authored chunks: its layout is assembled by rules, and its environment is set by rules. Both are mission details, which the hub already makes procedural. Earth is much later, and nothing here waits for it: the engine is built so that Earth, Europa, Ganymede and a station under Ceres are scenes of the same machinery.
- **A scene spec** (`src/data/scenes.js`, extended; one place) names the host (`{ site }` for a handcrafted place, `{ generate: 'chunkset-id' }` for an assembled one), the environment (`preset` or overrides of gravity with its profile of events, air, plating `ferrous` or `none`, light state and level, clock), the hour (`face: local | utc`), the rules, the aspects, the outfit, the kit (`magBoots`) and what ends it. `newGame` writes `state.places.live.env` from it, posts the gravity profile to TIME's queue and converts the hour through `localTime(site)`. Every shipped scene is a spec with `env: { preset: 'site' }` and no other change.
- **A chunk** (`src/data/chunks/<set>.js`; "scene chunk", not the ground's 32 m chunk of section 2.4) is an authored piece in the same shape as an authored area's plan (cells, rooms, openings, fixtures, surfaces): a shoot-house room, a ship passage segment with a hatch, a deck section with couches, a drum sector, an Earth street block. It carries its **sockets** (the door or hatch positions on its edges, with kind and width), **tags** (`ship`, `ferrous`, `pressurised`, `hab`, `street`, `cqb-room`, `objective`), **needs** (the environment it is valid in: a gravity range, a ferrous floor so mag boots are possible) and **weights**.
- **The assembler** (`src/sim/scenes/assemble.js`, pure) draws on `stream(seed, 'scene', missionId)`: the rules name the set, the counts (rooms 3 to 6, one objective room), the connectivity (a single lane, a loop, two entries) and the environment rolls by kind (a derelict's air `vacuum` or `thin`, its gravity `free` or `spin`, its light `dead` or `emergency`; the weights are my calls). It joins compatible sockets, caps the unjoined with a wall or a sealed hatch, and outputs ordinary `area` and `room` records, so navigation, sight, collision, the renderer and the cutaways need nothing new. Section 9.6's validation runs on the result (everything reachable, every socket closed, every room's needs met by the rolled environment); a failed draw is redrawn on the same stream at most 8 times, then it throws.
- **What is saved**: only `{ spec, seed, gen: 'assemble@1' }`; the layout is rebuilt on load, as `template@version` is. The seed belongs to the mission, not to a place, so `places:no-site-seed` stays honest.
- **The shoot house is the first chunk set**, authored as chunks from the start: layout A is four chunks and a hall, and layouts B and C are then assemblies rather than new maps. It **stands in the Wheel** (section 4.15, sector 4), not on *Testudo*'s deck and not at X4 (the audit's question 0, settled by §4.15 on 2026-11-08), at the `spin` regime of 1 G.

---

**As built in v0.0.12**: the chunks of house 1 live in `wheel.js` (`X4_CHUNKS`, `LAYOUT_A`), hand-joined, until `src/sim/scenes/assemble.js` and `src/data/chunks/` exist; the assembler is still a later round.

## 10. What is ported, adapted or only referenced

| Source | Verdict | What changes |
|---|---|---|
| `tradecraft/src/sim/interiors/plan.js` (rooms, openings, `walls()`, `wallRect()`, `roomAt()`, `mirror()`, `STEP_M`, cutaway heights) | **adapt** | rooms gain zones, access, capacity, grime and noise; openings gain kinds, seals, leaks, times and locks; areas gain levels and portals; `WALL_H` becomes the room's own height |
| `tradecraft/src/sim/interiors/furniture.js` (`FURNITURE`, `footprint()`, `seatsOf()`) | **adapt** | the military, ship, suit, range, medical and Europa catalogue of section 1.5; `uses`, `make`, `secured`, `fuel`, `material`, `power`, `lightKind`, `state` |
| `tradecraft/src/sim/interiors/path.js` (`wayAcross`) | **rewrite on its rules** | a binary heap, clearance classes, cached grids with incremental door updates, costs, a node cap, reasons for failure (section 2.2) |
| `tradecraft/src/sim/interiors/use.js` (`spotNear`, `exitHere`, `walkTo`) | **reuse** | booking added; `exitHere` keeps the 0.4 m step |
| `tradecraft/src/sim/interiors/range.js` | **adapt** | Melas's pistol range (12 lanes) and the shipboard range |
| `tradecraft/src/sim/interiors/flat.js` | **reference, for the authoring tools only** | its layout-plus-dressing rules (layout first, then dressing on its own stream, so looks never move geometry) are how the layout and dressing tools propose a place while it is authored (section 9); the game never rolls a flat: what the tool proposes is committed as data and finished by hand |
| `tradecraft/src/sim/interiors/staffing.js` | **reference** (PEOPLE ports it) | posts are PLACES's staff spots |
| `tradecraft/src/sim/world.js` (bucket grids, `move()`, `near()`, `rehash()`, line of sight in 8 m bins) | **adapt** | 2D chunks instead of street sections; heights in line of sight; the static index |
| `tradecraft/src/sim/weather.js` | **reference** | the pure-function-of-place-and-day pattern for `places/weather-mars.js`, keyed by the world's seed (weather is procedural, section 3.15) |
| `tradecraft/src/sim/light.js` | **adapt** (VIEWS owns the moods) | as `src/sim/places/light.js`'s `lightLevel(state, x, z, ms)` (TECH correction 14); PLACES feeds it room states, lamps and windows |
| `tradecraft/src/sim/cover.js` | **reference** (COMBAT ports it) | stop shares for my objects |
| `longhaul/js/sim/ship-layout.js` (ASCII deck templates, deck programs, trimming rules, fixtures with access and facing, `tableSpots`, `counterSpots`, cached trees) | **adapt** | real metric scale (0.5 m a character), multi-room decks, z-stacked decks with explicit heights, a site graph instead of one strip |
| `longhaul/js/sim/tiles.js` | **reference** | names and masses as a seed for the catalogue |
| `longhaul/js/sim/life-support.js` | **adapt the architecture, redo the physics** | masses to partial pressures; the orifice equation by hole area instead of 20%/min; temperature, humidity and CO; zones per room instead of per deck; seconds-scale effects (the research note's own verdict); keep tanks, scrubbers, shaft exchange, pressure doors, the SUITS order and breach jobs |
| `longhaul/js/sim/fire.js` | **adapt** | per-cell fire with fuel, suppression, CO and visibility; keep its limits and its spread through a shaft |
| `longhaul/js/sim/systems.js` | **adapt** | the wear and fault-hazard formula and tech-level multipliers for places' machinery |
| `longhaul/js/sim/hulls.js` (`COLLARS`, the tower builder's principle) | **reuse data, reference code** | one program for the inside and the hull |
| `longhaul/js/sim/ship-classes.js` | **reuse data** | the Hellas, Tharsis, pinnace, Danube and raider numbers; SETTING's Coprates transport, Simoom and Mistral records (SETTING §6.3, §6.4) are new, and their deck programs and cabins are this file's |
| `longhaul/js/sim/stations.js`, `worlds.js`, `bodyfacts.js` | **reuse data** | Phobos Naval Yard's layout, Callisto's and Europa's facts, airspace names |
| `longhaul/js/ui/roomcam.js` header | **reference** | its lighting states, worst first, which VIEWS remade as moods |

---

## 11. Tests (they print the numbers)

`tests/places-*.test.mjs`, run by `node tests/run.mjs places`. QUICK leaves out the whole-site sweeps (every authored area of every site). v0.0.2 built `places-nav`, `places-reach`, `places-validate`, `places-move` and `places-walk-sol` (with `places-validate`'s rules for a floor and for a site plan); the rest come with their systems.

| Test | Prints | Fails when |
|---|---|---|
| `places-nav` | A* µs (p50, p95) and expansions over 1,000 random pairs on a troop deck, Echo's ground floor and a ground leg between waypoints (v0.0.2, in the test rooms: 145 µs at the median and 690 µs at p95; 393 µs at p95 on a 64 m window of ground, with no allocation per solve); how many legs the room and waypoint graphs keep under 8,000 expansions; the Melas distance table from Echo's door (true lengths beside section 4.3's estimates); the waypoint graph's edge lengths against A* on built chunks; delivery ticks against expansions | p95 over 2 ms on a troop deck; more than 1% of legs over `PATH_NODES_TICK`; a waypoint edge off A* by more than 5%; a result delivered on any tick but `dequeueTick + max(1, ceil(expanded / PATH_NODES_TICK))` |
| `places-reach` | per authored area × class: spots, portals, unreachable pairs, and the `walker` bot reaching each spot through the movement layer (v0.0.2: every spot of the test rooms, all three classes) | any unreachable pair |
| `places-move` | the walker's circle against every wall face (the stand-off at each, exactly its class's radius), a door closed on the walker (settled at once on the nearest free spot), the office's 0.9 m door missed by its middle (passed by the door assist, `NUDGE_M` 0.3 m) | a stand-off off the radius; a walker left inside a wall or off the area; a door missed by its middle that stops the walk |
| `places-validate` | every rule of section 9.6, per template, with each hull's secure seats against its souls and `planCouches`' worst walk | any rule broken; secure seats under crew + troops + brig on any hull over 1.5 G; a worst walk over 4 minutes |
| `places-names` | every name a template, plaque or stencil prints, with its source in SETTING's data, and the list of working names | a name SETTING's data does not hold that is not marked a working name (the user's rule from tradecraft rc21 to rc30: "the station is London, and we get thrown to Moscow ... consistency") |
| `places-air` | the leak table (8 hole classes × 40, 100 and 300 m³) and the times to 50, 35, 20, 6.3 and 1 kPa; the same breach stepped at 50 ms, 1 s and 60 s; airlock cycles; the Tank's pump-down and repressurisation; CP-A's air break equalising 75 to 66 kPa; a frigate deck breached by a fist-sized hole with its neighbours' lowest pressure as the pressure doors shut; Condition Vac's pump-down; a squad bay's CO₂ after a night without HVAC; **a 5-zone star and a 5-zone chain** (total mass, each zone's pressure against its neighbours' range, 1 s against 60 s) | step results differ by more than 0.5%; a cycle off section 1.6 by more than 10%; total mass changes by more than the float's rounding; any zone leaves its neighbours' pressure range; visiting connections in another order changes a result |
| `places-fire` | the four cases of section 3.7 over 10 seeds (peak, time out, lowest O₂, highest CO, lowest visibility, racks burned); the nitrogen flood's time to 10% O₂ | sprinklers let more than 3 racks burn in more than 1 seed in 10 |
| `places-water` | the platoon's cold showers after PT over 200 seeds (median, spread); each site's water rule in litres per shower and per person a sol; the water plant's balance over 30 sols | the median of cold showers outside 4 to 8 |
| `places-weather` | a Mars year at Melas over 20 seeds: dust-devil sols, local, regional and global storms by season beside SETTING §4.4's rates, rain afternoons, fog mornings, the warmest and coldest hours by Ls band beside SETTING's bands, sols the KD range closes (visibility under 300 m or wind over 15 m/s, my rule), mean τ by season; `horizonAt` by azimuth, and sunrise, sunset and daylight at Ls 90, 270 and 316.4 with and without the terrain | a rate outside SETTING's by more than three standard errors; the warmest hour over +15.5 °C; a band's mean high or low outside SETTING's by more than 1 °C |
| `places-dose` | every row of section 3.10's table from `doseAt`; Europa's dose by depth; a 3 h parking in Europa orbit by deck and in the shelter; the Simoom drop's dose; a 15-minute surface walk in each suit; the 6.9-day 1 G voyage out and the 12.5-day 0.3 G voyage home (CONTRACTS §14); a year at Melas | a row of SETTING §7.3 off by more than 2%; any section other than PLACES holding a rate table (a lint over the docs' data modules) |
| `places-ring` | ω and rpm for 1.0, 1.2 and 1.5 G; a lap of the ten cars through their portals (time, dissolves, the area cache's hits); Coriolis at 3 m/s with and against the spin | a lap that rebuilds an area |
| `places-variety` | distinct look keys over every authored room of a kind (section 9.4), by kind, and the pairs of rooms seen on one walk that share a key | under 95% distinct for a kind; any pair seen on one walk sharing a key |
| `places-determinism` | two builds of every site give identical JSON; a save and load in the middle of a breach and a fire, then 2,000 ticks, give identical state; a save and load with path requests queued and pending, then 200 ticks, deliver the same paths on the same ticks | any difference |
| `places-perf` | chunk decodes in cells decoded and in ms (p50, p95), with and without render geometry, each ground module's bytes, site-graph build ms, the 1 Hz zone step in µs for 100 zones, the worst tick with a breach in fast mode; bytes allocated per 1,000 path solves (the `walker` bot, on decks, floors and ground routes) | a lived tick over CONTRACTS §7's sim budget, chunk builds included (measured by the test, never a budget inside the sim: TECH correction 7); any allocation per solve after warm-up |
| `places-walk-sol` (ROADMAP's walk test: the `walker` bot over the site plan from 0.0.3; the `recruit` bot's lived sol beside it from 0.0.14) | real walking minutes per sol on TIME §9.2's training sol, leg by leg, at BODY's gait, and the same sol with an evening at the battalion gym, over the plan as built (`melas@1`) and as first written (`melas@0`) side by side (v0.0.2: 808.7 m in 11.82 minutes and 947.8 m in 13.86; as written 880.1 m in 12.87 and 1,019.2 m in 14.90) | the reference sol over 12 minutes; the gym evening over 15 |
| `soak` (TECH, heavy) | heap at start and end of the 10-minute recruit run, with path solving's share | heap growth from paths (TECH's 20 MB limit for the whole) |

---

## 12. Fun

**What places give the player to decide and to tell.**

- **The base is the sol's rhythm.** The walk to chow, the queue at the headcount desk, the race for the showers after PT (the last six get a cold one), the armoury line before the range, the cleaning tables at dusk, the Rec at night. Each is small and real: hurry and be first under hot water but last to formation, help a buddy finish his rifle and miss your seat, take the long way past the Green.
- **Places you learn.** Base Melas, *Testudo*'s decks and Pwyll Deep's Foot are the same in every career (the hub, 2026-11-05): the short way behind the mess, which head's hot water lasts, where the fire watch cannot see the bay door. A second career walks a base it knows, among people it has never met and a war that went another way.
- **Places remember.** A dirty bay fails the inspection; a magazine lies where it was dropped; a scorch mark stays until it is repaired; brass collects on the line; the Grove gets a sapling and the Memorial Wall a name.
- **Air makes stories.** The bay's HVAC dies overnight and everyone wakes with a headache. In the Tank the instructor pops the drill-room panel and you patch the hole against the clock. On a ship a body lies in a pressure door's way and the next compartment keeps bleeding air: clear it or not. A fire in a bay: shut the door and lose whoever is in there to the CO, or leave it open and lose the bay.
- **Gravity makes places feel different.** Heavy laps with the Ring's spin, the first push-off into the Pens on mag soles, the flip aboard *Testudo* with the couch a step from where you sleep, the Belter's low walk under a padded ceiling.
- **Europa is a social place.** A checkpoint is a queue of people with lives, a searcher, a crowd that remembers the last search; the works are the town's life and the force's liability; the air break is a door between Martian and Ice standard air, and your ears pop going into town; the bathhouse is where the rumours are; outside, the dosimeter counts.
- **Special operations each change one rule**: no floors; "down" sliding along a tumbling hull; a dose clock in the open; a lake under 36 atmospheres; a ship's reactor that must be scrammed; a crowd that is the mission.

**Where it would turn into chores, and what removes them.**

- **Long walks repeated every sol.** The daily circuit lies within 120 m of Echo's door (section 4.3): 11.8 real minutes of walking in a training sol at BODY's 1.14 m/s (808.7 m, measured), carrying chatter and customs, and the walk test fails the build above 12. Blocks further out are reached in formation (TIME's `march`) or by the range bus and the Loop (TIME's `ride`), whose minutes are skipped while falling in, boarding and getting off are lived. Nothing teleports.
- **The air break and the locks every day on Europa.** CP-A's air break equalises in about 24 s and a lock cycles in 21–37 s; from the second time on, "cycle through" is a short activity on TIME's fast-forward (under 120 s the real world runs fast, with the gauges and the suit check on screen), never an abstraction.
- **Cleaning, laundry and linen.** Field day is an activity with a roll (CAREER); laundry and the linen exchange are activities at their machines and counters.
- **Queues.** Waiting is an activity (CAREER's S-1 queue is skipped with a splash).
- **Searching big places** (an ice hauler's 1.2 km spine, a derelict's twenty decks; ship boarding and the derelict are the brief's named set pieces, 2026-11-05): **searches are walked** (the user, tradecraft, 2026-10-27: "doing the things like going out the back should be a thing we do when inside and not abstracted"). Perception, the feel, the fog's memory and the squad's contact board do the finding, and the squad clears in parallel by its drills (COMBAT), so the player walks one route while the teams take the others. Big places are divided into **sections** (each room carries a `section` id: a deck, a 100 m block of a hauler's spine), and for a section that is long, already cleared and quiet, the agenda offers **"sweep this section"**: a real-sim fast-forward of the squad's drill (TIME's fast-forward, never an outcome skip) that stops at any perception event. A discovery is never resolved by a roll in a space the player has not entered.
- **Empty buildings.** Templated buildings are dressed but quiet; places come alive at their hours with their posts, so the base's busy places are where the player's business is.

---

## 13. Build order

ROADMAP owns the milestones (its §3.4 puts the site plan at 0.0.3 and 0.0.4, the Vac Bay, the G-house, the training village, the gas chamber and the Talus at 0.1.x with their scenes, fire and Mars weather at 0.2, the frigate and corvette at 0.5 and the special-operations settings over 0.5 to 0.7; this list follows it); this is what PLACES needs built when. A patch number names ROADMAP's row, not a release (CONTRACTS §18).

- **0.0.3 (the skeleton; shipped as v0.0.2, CONTRACTS §18)**: the data model (sites, areas, rooms, fixtures, openings, links, zones); `plan.js` and the cutaway heights ported; the catalogue's core kinds; the nav grid with its reused scratch, the heap A*, string-pulling, the room graph, the site graph and the ground waypoint graph; atomic solves with deterministic delivery on TECH's budget; the validator; a test room; `places-nav`, `places-reach`, `places-validate`, `places-names`; **the Melas site plan as data** (section 4.2's footprints with their doors, the roads and paths, the gates, the ground waypoints), so the walk test (`places-walk-sol`) measures the sol before a building is drawn. v0.0.2 built all of it except the room graph's use as a corridor and `places-names`, added the walker's circle collision with its door assist and settle (section 2.1, `places-move`), and compacted the plan until the walk test passed (section 4.2).
- **0.0.4 (a walkable barracks on a laid-out base)**: **the site plan laid out as footprints** (every building of section 4.2 as massing with its doors, no interiors yet but Echo's; the roads, paths and the parade deck; the ground waypoint graph; `places-walk-sol` rerun on Echo's interior by A*, section 4.3); the dressing tool (section 9.2; TECH §14), with Echo's bays dressed by hand from its proposals; Echo Company's barracks in full on both floors and the company street (section 4.4); the interior lighting states and `lightLevel` in `src/sim/places/light.js` (correction 14). **Shipped as v0.0.3** (CONTRACTS §18): Echo on both floors (`src/data/places/echo.js`, built by `src/sim/places/echo.js`), the ground (`melas.ground`: 37 buildings as massing, 41 doors, 71 paved roads, paths and decks, the fence and its four gates closed, 179 fixtures and 173 lamps; `ground.js`), the sun and the horizon (`sun.js`), the light (`light.js`), doors and R (`doors.js`, `hand.js`), portals and stairs (`portals.js`), the sight grid (`sight.js`), wall clocks (`clocks.js`), the ground's nav windows, the seats, posts and berths of the fixtures; the walker bot reached all 757 spots of both floors (2,345 m, 44 doors opened by R), and the walk test passed on A* (793.3 m). The dressing tool stayed a scratch tool (its literals committed), and the gates stay closed until their posts (0.0.12).
- **0.0.6 to 0.0.12**: each scene's building as its final `melas@1` template at its final place, with that scene (the KD range's 25 m line and tower with `test-handling`, the bay's 7 m and 10 m lines and its turning targets with `test-pairs` (COMBAT §25.10.3), the rest of its ground, firing lines and pits with `test-range`, the armoury and its canopy with `test-armoury`, the mess hall with `test-bay`), so no scene is re-authored at its join; the rest of the core week's buildings, the ground chunks, the static index and Mars's clear sky at 0.0.12 (ROADMAP §4.2, §4.3).
- **0.1.0 (the core career: a standby week at Base Melas)**:
  - The Melas site plan in its three rings, the ground chunks of the Two-Four lines and Main Side (and the KD range, the training village's apron, the North Road), the districts as shells in the static index.
  - In full: the Two-Four lines (Echo barracks on both floors, the battalion mess, the armoury and its canopy, battalion HQ with the lobby, S-1 and the CO's office, the aid station, the battalion gym and field, battalion supply); in Main Side the field house, the track, the pistol range, Schools, the PX, the Rec, the chapel, the Grove and the Memorial Wall, the laundry, the parade deck, the main gate and Melas Halt, the MP station; the KD range with its pits; the Loop.
  - Templates for the rest (the other barracks from Echo's template, quarters, the hospital with its board room, HQ, warehouses, the plants).
  - Orientation routes and briefing sets.
  - Environment: zones holding Martian indoor standard air and HVAC with the flux-limited exchange (the gas model's state shape, still until the Tank moves it), doors and dust vestibules, lighting (day, evening, lights out, emergency on a power cut), the site water rule and hot water, grime and field day, dust, a clear sky (the sun, the temperature, a fixed τ) with `horizonAt`, `doseAt`'s Mars rows, Mars gravity.
  - Tests: all of section 11 that apply.
- **0.1.x (the rest of the week, ROADMAP §5.8)**, each with its scene, as CAREER's standby blocks need them (the mission rehearsal exercise on career sols 7 and 8, the MOUT and CBRN blocks in the slipped weekdays: CAREER §5.4, CONTRACTS §3):
  - (moved forward to 0.0.7d and 0.0.7e on 2026-11-08, ROADMAP §4.2) the Wheel's sector 4, house 1 of X4's design (layout A first: its doors with `swing`, its targets, its authored room plans, the catwalk and the booth), gravity `spin`, with `test-shoothouse` (COMBAT §25.14), and its rooms for `test-breach`; then the Wreck's decks at Phobos (§5.7: `micro`, ferrous faces for mag boots), with `test-zerocqb`;
  - the rest of the Wheel (its stops, the transfer, the other sectors) with the training sol's join, as CAREER's standby blocks need it; the Hulk at 1 G stays at 0.5;
  - the Vac Bay (the suit loft, the personnel lock, the Tank and its drill room: the first place where air matters) and the gas chamber, with `test-tank`;
  - the G-house (the Ring's ten cars and their spin, the Long Arm), the obstacle course and the training tower, with `test-ghouse`;
  - the training village and a first slice of the Talus (the ground tool, section 9.5; TECH §14), with `test-patrol` and `test-roe-lane`.
- **0.2 (the voyage)**: at Melas for the predeploy sols, fire with sprinklers (a fire drill) and Mars weather on SETTING's table (dust devils, a local storm, fog, the summer's virga), as the ship brings its nitrogen flood (ROADMAP §3.4); Melas Field and its terminal, Little Conamara (for the predeploy sols), the Pens (micro-g, mag soles, the sleeping halls), every deck of MCRN *Testudo* with its secure seats, the Simoom's cabin; ship lighting, Condition Seal, the storm shelter and its mats, `doseAt`'s cruise and solar-storm rows, thrust and free fall, the flip; ship fire with the nitrogen flood; breaches by hole size aboard.
- **0.3 (Europa)**: Naval Station Valhalla and Camp Lofn (the Transit, the Spin, the Flats, the tram between them); 2/4's forward operating base at Pwyll Deep's Foot; Pwyll Deep's spaceport quarter from the shaft-town template (the shaft head, the shaft, the Foot, the Rings, the quarter's plant, the Mine Head); the checkpoints' four templates; the Tyre Works and the corridor's tram; markets, housing, the clinic, the Steam; the surface and `doseAt`'s Jovian rows; Ice standard air, liners and drips; then the gallery template (Thera Lens's form), the rig camp and the company outposts; Camp Halloran as a variant.
- **0.5 (ships at war and the first boardings)**: the Hellas frigate with its marine deck, Condition Vac, the keel railgun, boarding through its collars; the Tharsis corvette; the Hulk's drills match its decks; settings 5 (the ice hauler) and 10 (the torch raider) as boarding targets, with walked searches and "sweep this section".
- **0.6 and 0.7 (special operations)**: settings 1 (the relay station), 2 (the derelict), 9 (the Tharsis dome) and 11 (the Callisto crash) at 0.6; the other six at 0.7 (the Ganymede dome, the lair, the ring station with its sectors, Io, Thera's lake, the Ceres consulate).
- **1.0**: every kind in three authored variants or more, measured variety over the authored set at 95% or more, the validator green on every authored place.

---

## 14. Cross-references

What this section relies on, and what it asks of the others (the asks from the 2026-11-05 review are marked **ask**):

- **SETTING**: the names and the lore of every place this file maps (Base Melas as a division base §4.9, the Pens §6.1, the hulls and craft §6.3–6.4, Naval Station Valhalla and Camp Lofn §7.2, the towns and their depths §7.4), the customs that shape rooms (heads by sex, berthing by squad, the CO's corridor, colours), the faiths for the chapel, Europa's foods for the stalls, the Rec's drinking rules, the start date, the sayings stencilled on walls. *Answered*: the walls stay this file's data (`MELAS_WALLS` in `src/data/places/melas.js`, read by `sun.js`: one record, my call, so `SITES.melas` carries no `wall`), §3.7 prints the terrain's times beside the flat ones (05:44 to 18:15, 12.53 h at the start, and the seasons' table), and §4.9's north wall is 1.8° with the curvature; **ask**: replace §7.3's dose table with a citation of `doseAt` (section 3.10, whose rows reproduce it) and §4.3's "1–1.5 mSv a year" at Melas with this file's 0.5; **ask**: cite this file's Ice standard row (section 3.2) as the one definition; **ask**: give the Simoom's cabin its shielding with the drop's dose in mind (8 g/cm² makes a Europa drop cost 18 to 46 mSv; 25 g/cm² would make it 2 to 5); *answered*: §6.3's `mcrn-transport` record carries section 5.2's hull and the 352 wave, and §6.2 the frigate's detachment of 15 (CONTRACTS §15, §19 item 9); **ask**: names for the Melas plan's working names (Training Road, Village Road, the Lines Walk, the South Walk, the three lanes, section 4.2), and say in §7.4 that FOB Pwyll's "2 km from the main shaft's head" is the spaceport shaft's foot, 600 m down (section 7.5); the quarry rig (Rig Pwyll-9), Belt station air, and each town's longitude and latitude in its arc (for `jupiterAt`); the corridor's length from Pwyll Deep to the Tyre Works.
- **TIME**: `Ls(ms)` and local true solar time; `sunAt` with `horizonAt` (it replaces VIEWS's 4° default); the activities table and their spots (shower, chow, sleep, field day, linen, laundry, stand by, cycling a lock, the Ring's session); the skip contract calling `placesStep` and reading `placesSteady`; the event queue for PLACES's hazards and scheduled tests; alarms as interrupts; the voyage's felt-G samples. **Ask**: add **`march`**, the platoon moving in formation along an authored march route (falling in and the halt lived, the minutes between a ride-like skip with the squad's barks in the ticker, mask `D A O B`, "carry on" or live it); *answered*: `MELAS_LAT_DEG` is −10.5, this section's (CONTRACTS §2); read `WATER_MIN` and the litres from section 3.12's site rules (Melas 3 min, ships 2, the forward base 1.5); name the Callisto row of §2.6 "Naval Station Valhalla / Camp Lofn"; fly the Melas lift from **Melas Field** by Simoom as SETTING §6.5 gives it (about 5 minutes of ascent capped at 2.5 G, 2 to 3.5 h in all, docking at gantry tower A), not from "the Mariner Valley spaceport" at 3.4 G; cap every troop-carrying profile at SETTING §6.4's troop-rated 2.5 G (SETTING owns the craft) and drop "a cap COMBAT sets"; make §10.4's forced first day at a new site, after Melas, the orientation walk plus one beat (section 9.7).
- **BODY**: what air, CO, smoke, heat, dose and gravity do to a body; locomotion in each regime on this file's surfaces (friction, handholds, mag strips, tow lines, ceilings, the Pens' steel plates); suits, prebreathe and decompression sickness; the metabolic rates that load the zones; what a cold shower does; Coriolis in a Ring car's frame. **Ask**: delete §12.1's rate table and read `doseAt`, keeping only the suits' shielding as areal density (the light vac suit 1.5 g/cm², ×0.40 on Europa's surface; the hardshell 5; the Lorica 12); correct §26's "68 mSv for half an hour in a light suit" to **45 mSv**, and the rover cab's ×0.1 to the law's ×0.031 at 10 g/cm²; read §6's shower litres from section 3.12 (a Melas shower 18 L, a Navy shower 12 L). *Settled*: the walk is §16.1's 1.14 m/s indoors and out, and this plan was compacted to it (CONTRACTS §19, item 2, 2026-11-06).
- **SKILLS**: the checks for patching, forcing a hatch, fighting a fire, the obstacle course and airlock emergencies; modifiers read from `envAt`.
- **WEAPONS**: penetration by this file's `material` ids; the ballistics that confirm the 7 km danger zone; range procedures (the pits, the flags, the ammunition point); the armoury's accountability (the logbook, weapons cards, clearing barrels); frangible rounds aboard; mud in a rifle after the summer's rain.
- **COMBAT**: cover from this file's objects; holes from hits by size class; breaching charges and jammed doors; the Condition Vac and Seal orders; damage-control jobs; the threat check that refuses skips; `planCouches` over this file's secure seats; *answered*: COMBAT §23's candidate danger areas on the authored patrol routes and the objective, barricade and hostage spots on every authored hull and setting are section 9.8's operation spots. **Ask**: count §19's 16 path estimates a decision as `pathEstimate` calls against TECH's `PATH_NODES_TICK` (section 2.2); clear big places by drills while the player walks one route, with "sweep this section" as a real-sim fast-forward (section 12), never a discovery rolled in an unentered space; the drop's dose (above) in the drop's scene.
- **PEOPLE**: rosters for the posts of section 4.14, the battalion guard of the Two-Four lines among Echo, Fox, Golf and Hotel (§4.3); bookings and queues; crowd budgets by room capacity (the mess's 240 seats at peak are more than `mess-noon`'s 160 live agents and 180 drawn, CONTRACTS §8, so PEOPLE's levels of detail decide who is live; everyone live in view is drawn, TECH correction 20); the districts' crowds and tier-3 staff; perception reading `lightLevel` and this file's line of sight; walkers off-map along the site and waypoint graphs; the customs played in places. **Ask**: take §13.2's path requests as a share of TECH's work units, not "0.3 ms each".
- **CAREER**: the check-in stops (S-1, the company office, the platoon, the squad bay, battalion supply, the armoury, the aid station) in the Two-Four lines; the standby blocks' places (the suit loft, the Tank, the G-house, the KD range, the mat room, Schools, the training village, the gas chamber); the Grove and the Memorial Wall; Little Conamara in the predeploy; "the move to the pad" is the move to Melas Field's terminal; deployments to these sites; the medical boards in the Navy branch hospital; special-operations missions choosing these settings.
- **VIEWS**: an area change and a scene cut at every building's door, small structures opened in place; the moods for each lighting state; plaques over exits; the briefed map; the far window by TECH §9.9's rule (section 2.4; VIEWS §2.4 now says so); a deck-style dissolve at each Ring car's gangway; rime, fog after a blowdown, dust cover, smoke; the art for the ASCII deck templates (`u` the berth couch); Jupiter over the Conamara and Thera arcs, never over Pwyll's.
- **TECH**: the module layout (`src/sim/places/`: built in v0.0.2 `model.js`, `plan.js`, `fixtures.js`, `nav.js`, `heap.js`, `graph.js`, `collide.js`, `move.js`, `siteplan.js`, `validate.js`, `light.js`, `domain.js`; in v0.0.3 `areas.js`, `echo.js`, `ground.js`, `sun.js`, `doors.js`, `hand.js`, `portals.js`, `sight.js`, `clocks.js`; to come `chunks.js`, `air.js`, `fire.js`, `thermal.js`, `utilities.js`, `weather-mars.js`, `dose.js`, `env.js`, `templates/`); the layout, dressing and ground tools that propose authored data (section 9; TECH §14); goldens over the authored places (TECH §13.5); the tick order (the fast layer at 20 Hz, zones at 1 Hz, the slow layer per minute); **the one path budget** (§3.1's `PATH_SOLVES_TICK` 6 and `PATH_NODES_TICK` 8,000, in work units: this file adds none, and PEOPLE's and COMBAT's shares come out of it); `state.places.nav` saved for determinism; saves as deltas; the performance budgets; chunk nav grids built on the sim side without render geometry; the `walker` and `recruit` bots' printouts of section 11; debug commands (`__olympus.places`: teleport to an area for tests only, open a hole, light a fire, set a weather event, print a zone, print a dose).
- **ROADMAP**: its §3.4 name row is settled here (the Coprates class, *Testudo*, the Simoom, 2/4's sector in Pwyll, Camp Halloran); the moments that read this file: moment 2, "Five minutes early is on time" (the walk to breakfast and on to the 07:50 formation is 89.5 m, 1.3 real minutes, on the plan as built: section 4.3; done, ROADMAP §5.3), moment 1, "Reporting as ordered" (the arrival's walks: the bus, the gate, Echo's barracks and the three stops), moment-lift (Melas Field, gantry tower A, the Pens on mag soles), moment-drop (the Simoom, the shaft, Pwyll Deep, Ice standard, the base).

---

## 15. Open questions for the user

1. **Berthing.** Mixed by squad behind rack curtains, with heads split by sex (my default), or separate rooms for women as in today's Corps? It decides where a woman player sleeps and how the squad bay feels.
2. **Base size.** SETTING makes Melas a division base (about 19,000 marines and sailors, 6,000 civilians, 9,000 dependents). My default, for DESIGN.md's log: the player lives in 2/4's compact battalion area (the Two-Four lines, the daily circuit within 120 m of the barracks door), with Main Side's shared buildings round it in full and the rest of the division base as templated districts with crowds, reached by the Loop or in formation. The alternative is SETTING moving the other battalions, the recon company and the Raiders to other camps, leaving Melas a battalion's base.
3. **The Ring.** A 283 m train of cars spinning at 1 G for hours, with heavy nights and the PFT at 1 G (my default), or only short sessions in a small centrifuge? (Overtaken on 2026-11-08 by the user's "always train at 1G": the Wheel, §4.15, takes the training day and the PFT, and the Ring keeps the G-qualification, conditioning above 1 G and the remedial programme.)
4. **The drop at Europa.** The transport parks in Europa's orbit for about 3 hours (my default: 0.6 mSv on its decks, 0.05 mSv in its shelter), or it stays at Callisto and the marines ride the Simooms for six hours each way through the belts? Either way the Simoom's cabin is the dose that matters (18 to 46 mSv a drop at its 8 g/cm²): should the Corps give its landers a water jacket (2 to 5 mSv a drop), or should the drop stay the tour's biggest dose?
5. **Walking aboard ship.** Every deck physically reachable, with consequences for going where a marine should not be (my default), or only the decks a marine is allowed on?
