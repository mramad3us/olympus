# TRADECRAFT design, part 3, and its playtests: a research note for OLYMPUS

Sources read in full: `/Users/deaumas/lab/vibe/claudecode/tradecraft/docs/DESIGN.md` lines 453 to 864 (Presentation, World size and maps, Saves and losing a character, The first playable, Road to 0.1.0, The tutorial, The campaign, Firearms, Stations and countries, Look, Stack, Controls, Balancing objectives, Next, Queued, 0.2, Later, Open questions) and `/Users/deaumas/lab/vibe/claudecode/tradecraft/docs/PLAYTESTS.md` (61 lines). I checked a few constants against the code (read-only): `src/sim/firearms.js`, `src/sim/shooting.js`, `src/sim/cover.js`, `src/sim/health.js`, `src/sim/checks.js`, `src/art/pixelart.js`, `src/art/sprites.js`, `src/art/doll.js`, `src/render/view.js`, `src/render/cutaway.js`, `src/sim/interiors/plan.js`, `src/ui/input.js`, `src/ui/plaque.js`, `src/ui/style.css`, plus `CLAUDE.md` and `CHANGELOG.md` for dates. "DESIGN:NNN" means a line of tradecraft's DESIGN.md. Tradecraft paths are relative to `/Users/deaumas/lab/vibe/claudecode/tradecraft/`.

Tradecraft is a top-down pixel-art Cold-War-style spy game (CIA officer in Moscow, London, Beirut, Cairo) in the browser. Timeline from the docs: look samples 2026-10-25, look picked and skeleton built 2026-10-26 (v0.0.19), campaign begun 2026-10-27 (0.1.0-rc2), 0.1.0 validated by the user 2026-11-03 after rc56 ("promote the current version as 0.1.0, this is Alpha 1 worthy", CHANGELOG.md:500), firearms the same day, 0.2.0-rc1 (deep postings) 2026-11-05. That is about ten days from first sample to Alpha 1, and 56 release candidates in about seven days. The user plays fast and reports a lot.

Throughout, "the user" is the person who also commissions OLYMPUS. Their decisions are their tastes and carry over. "My call" in tradecraft's docs means Claude's own decision within the user's frame.

---

## 1. Presentation (DESIGN:453-458)

- **Language and reading:** English. "Medium reading": most information is abstracted, but there is plenty of text in the interface and in flavour.
- **No portraits.** Persistent characters already have a face, their sprite. A discreet app shows only an initial.
- **HUD is diegetic and minimal.** A clock appears only if the character carries something that tells the time. The "instinct" (the character's tradecraft sense) gives prompts when relevant, with the key that does it.
- **Light is continuous**, driven by the clock, and the weather veils it. Sound comes "much later".

For OLYMPUS: the clock-only-if-you-carry-a-watch rule maps naturally to a Martian marine's hand terminal or suit HUD. The "instinct" line is a good model for an NCO's or veteran's sense ("muzzle's on your squadmate"). No portraits: sprites are the faces.

---

## 2. The Look (DESIGN:716-763), with code checks

### 2.1 What the references were for
Disco Elysium (local copies in `ref/`, gitignored) was used only for the **angle** (a high, near-isometric camera looking down into streets and rooms, with cutaways so interiors read from above) and the **level of realism** (grounded people and places, small on screen, readable by silhouette and light). It was explicitly "not its painted style … the look is ours to find" (DESIGN:718).

### 2.2 How the look was found
The method was many small look samples (a street corner, a room, a few people, different treatments of light, material and colour), and **the user picks the ones that land** (DESIGN:720). Samples:
- 000-004 **Realistic**: MPFB people, CC0 photo materials, PBR light, Mixamo motion. Rejected.
- 005 **Cartoonish 3D iso** (after a pixel-art reference from the user, 2026-10-25): one street in four renderers (`samples/lib/looks.js`): `pixel` (3D pixel art: low res, orthographic, toon light, outlines, quantised colour), `pixel-chunky`, `toon`, `flat`, each with a chibi option (heads 1.5×). "The pixel family reads best." Toon and flat showed people as dark silhouettes. Lesson: stylised people need their own palette, not averaged photo textures.
- 006 **Chibi town** (2026-10-25). Nothing so far had passed the user's **"sniff test"**. The user asked to simplify: **"pixel art 100%, but simple, almost 2D"**, a handheld RPG (Pokémon-like) with big heads and almost invisible, barely modelled legs. Their reasoning: few animations, lots of freedom, scales very easily. The references were a top-down pixel RPG camp and close-ups of its 32 px characters: heavy dark outlines, faces of a few pixels, beards, boots.
- **Stoneshard** (Q3, Q155) was named by the user as the target art and animation style, "if possible". Claude first described its people wrongly (taller, head a fifth of the body). Measured on screenshots they are about 33 px tall with a 14 px head (2.4 heads), close to the chibi. What sets Stoneshard apart is the **finish**.
- 007 **Fine town** (2026-10-26): sample 006's street in Stoneshard's finish.

**The user's scores** (DESIGN:744). First build, with box people (2026-10-25): camera angle **95/100**, night colour shift **90**, environment **80** ("tree needs work, things lack flair"), characters **35**. The head-to-body ratio was good, the front views "too boxy", some profiles good. After the sprites and trees: "trees are fixed, characters are now a solid 70", the approach is right, "objectively, this would be a 90-95%". The kid's run was off and was redrawn (v0.0.15).

**The pick** (2026-10-26, DESIGN:757): **"I like the smaller figures, but the new environment"**. So the game is chibi people (sample 006's sprites) in the fine town (sample 007's finish).

### 2.3 The look's parameters (as built)
| Parameter | Value | Where |
|---|---|---|
| Internal frame | **640 × 360** (sample 006 was 480 × 270; `pixelart.js` RES still 480 × 270, `zoom` divides it) | `render/view.js:116` RES |
| Window fill | scaled by any amount, **sharp-bilinear** (every pixel the same size; a seam between two pixels is blended over one screen pixel). On a window of another shape, more street on the longer side up to **736 × 430**, then a border. CSS `image-rendering: pixelated` on the canvas | DESIGN:757; `ui/style.css:22` |
| Camera | looks **straight north and 45° down, orthographic**. One metre is **16 px** on the ground, up a wall and across, so tiles and fronts come out square. It snaps to the pixel grid, so nothing shimmers | `pixelart.js:6-8, 42` PX_PER_M = 16 |
| Camera lean | leads where the eyes go: walking 1 m east-west and 2.5 m north-south; looking (E held) 1.5 m and 8 m; eased over about 0.35 s; in a tail, toward the quarry; never past the crowd's no-pop rule (24 m east-west, 22 m north-south) | DESIGN:463; `view.js` LEAD_M, LEAD_S |
| Palette | sample 006: **one 50-colour palette**, every pixel snapped. Game: the **116-colour FINE_PALETTE** (14 families of muted, warm-leaning hue × 8 tones, generated in OKLCH, hue-shifted with shadows toward violet 285° and lights toward yellow 85°, chroma easing at the ends; plus ink, paper, two glows) and a **warm grade** | `pixelart.js:44-101, 146` |
| Light model | toon light from the **upper left**, calibrated so a front shows exactly its painted colour (a top about 17% brighter, a face turned from the sun 0.69, a cast shadow about half, tinted by a cool sky); hard pixel shadows. The sun's height, colour and strength follow the real sun over the city (`sim/light.js sky(ms, geo)`), but its direction stays the art's upper left, because the sprites are shaded that way | `pixelart.js:9-11`; DESIGN:762 |
| Outlines | inked where parts meet: dark at a silhouette, lighter between touching parts, from a part-ID pass (every mesh's `userData.part`) and depth jumps | `pixelart.js:12-14` |
| Detail | painted, not modelled: `paint()` draws a texture pixel by pixel at 16 px/m, and `box()` maps it so one texel is one screen pixel | `pixelart.js:17-18` |
| Night | moonlit sky fill. Painted glow colours (lit windows, shops, signs, headlights) light up. Lamps throw **hard-edged pools** (bright core, dimmer ring, as pixel art draws them, not a smooth falloff the palette would band). A sprite takes the light of the pool it stands in. `LAMP_SLOTS` 10 spotlight pairs are moved to the nearest lamps, so the light count never changes (no shader rebuilds). Windows light house by house through dusk, lamps come on as the sun goes, shops are lit at night only | `pixelart.js:19-22`; `view.js:117` |
| Weather | on every lit surface (wet darkens up-facing surfaces, puddles mirror the sky and the lamps, snow lies in world-space noise, frost glints) and in the composite (slanted two-layer rain, snow flakes of 1-2 px, sleet, sideways dust, splashes, haze by distance from the eyes, halos round lamps) | `pixelart.js:23-33` |
| Occluders | a tree or post box in front of the player is seen through (every other pixel left out) | DESIGN:763 |
| Asphalt | one tone with sparse grain (fine mottling snapped into blotches under the palette, worst at night) | DESIGN:759 |
| Surfaces | bevelled brick by brick and slab by slab, plaster weathered to brick, ivy, puddles, weeds, litter, moss in joints | DESIGN:754 |

### 2.4 People sprites
- Chibi people about **28 px tall** (DESIGN:736). The cell in `src/art/sprites.js` is **24 × 34**, feet at the bottom, PAD pixels either side for things held out. Sample 007's finer people use a 24 × 40 cell with a 12 × 12 head, faces with glinting eyes, brows, nose shadow, cheeks, mouth, a blink, legs, boots and hands that show, six hue-shifted tones per colour, the outline softened on the lit side, an 8-frame walk, a 6-frame run and a breathing idle.
- **Parts are templates** (head, face, hair, hat, beard, glasses, torso by kind of top, arms, legs, feet, things carried) in three views (down, up, right; left is right mirrored). The letters in a template are **roles, not colours** (s skin, h hair, t top, p legs, f shoes, a hat, r beard, y trim, w white shirt, x thing carried, ø body armour, plus fixed e eye, k ink, b brow, g gold, l lens glint, m frame, z mouth). A spec maps each role to a palette ramp.
- **Shading by rule**, as a pixel artist does it: a part's top edge takes the light tone, its right or bottom edge the shade; a pixel under another part is in that part's shadow; where parts overlap, the edge takes the role's darkest tone (a line inside the figure, softer than the outline); an ink outline goes round the silhouette.
- **Frames are poses of the parts** at **8 fps** (bob, arm swing, step, stride, run, sit; fight poses side-on: guard, swings, hook, elbow, knee, kicks, grab, throw, sweep, parry, slip, reel, stagger, dazed). So **a new hat or coat animates for free**. One sheet is 37 frames × 4 directions. Lying down is not a frame: the view lays the card flat.
- In the street a person is an **upright card**. At 16 px/m both up and across, a card shows its sprite one texel to one pixel.
- **Guns in the hands** (the user, 2026-11-03: "when aiming, the sprites should show us aiming, there should be aiming, carrying and shooting animations with muzzle flash etc"): the arms become the gun's rig (`gunRig()`).
- **The close figure** (`src/art/doll.js`; the user, 2026-10-31: "improve the character outline, it's not as good as it should be"): for the inventory and first-aid screens the game uses a separate figure, not a sprite blown up. It is drawn at **half the size of the picture's pixels** (so twice the resolution), **six and a half heads tall** (real proportions), lit from the upper left, inked, and drawn as shapes and clusters, not a per-row formula ("shading each span like a cylinder is what made its first arms and legs look turned on a lathe"). It stands easy, weight on one leg. Coats hang open so every pocket can be shown. Wounds are marked and numbered on it.
- **For OLYMPUS:** this two-tier approach (small chibi-ish sprites in the world, a high-resolution "close figure" for body, kit and wounds) is a ready answer to the user's "high-resolution pixel art for close-up gameplay". The user liked the *smaller* figures and the *finer* environment.

### 2.5 Cutaway "dollhouse" interiors
- Flats and the embassy are maps of their own (`src/sim/map/interior.js`, drawn by `src/render/interior.js`). **The back wall and the sides stand to the ceiling; every other wall is cut to a metre**, so no wall hides a room (DESIGN:602). `src/sim/interiors/plan.js:23`: `WALL_H = 2.8, CUT_H = 1.0, WALL_T = 0.16, OUTER_T = 0.3`. Indoors, the light is the flat's (its lamps, plus the windows' share by day: `sim/light.js indoors()`), and the whole interior is seen.
- **Shops on the street** are opened by a dollhouse cut (`src/render/cutaway.js`): the street's building is replaced by the same building with a slot taken out the shop's width, from pavement to roof and back to the shop's back wall. The façades either side keep their pixels. Down the slot is the shop floor, the cut faces are hatched like a section drawing, and the floors above are marked by their slabs (`STOREY_M = WALL_H + 0.3`).
- **Exits are marked in the room** (the user, rc28: "where is the door out of the flat"): a plaque on the back wall over the front door ("FRONT DOOR" and an arrow; the embassy's "THE STREET"). A test makes sure nothing stands in front of it, and the instinct says so by the door.
- **Interiors are generated to a point** (the user: "make sure appartments are generated to a point, meaning that colors, decorations, ambiance, layouts needs variability"). Layouts by seed: two bands, a corridor flat, or a studio, mirrored or not. Walls in paint or paper, floors by room, light moods (warm, soft, a kitchen's cool tube), each city's way of keeping house. Furniture is a **kit of 67 pieces** with looks of their own (`src/sim/interiors/furniture.js`, `src/art/furniture.js`). Measured: every spot reachable from the front door in 360 flats, 178 looks in 180.
- **For OLYMPUS:** ship decks, habitat modules and barracks are exactly this kind of cutaway room. A ship's back wall plus 1 m cut walls reads well from a high camera.

### 2.6 UI typography and chrome
- `ui/style.css:1-3`: "The picture is pixel art (the canvas, filling the window); the interface around it is type: a watch, a log, and paper (the menu and the title are typed sheets, **Papers, Please-cold**)." Fonts: `--mono: ui-monospace, "SF Mono", Menlo, Consolas` for the HUD and `--type: "Courier New", Courier` (typewriter) for papers. Colours: ink `#1a1214`, ink-2 `#23252f`, paper `#f4efe6`, paper-2 `#e2dac6`, rule `#c4bba9`, brass `#e7b84a`, typewriter red `#9e3c36`, muted `#8f96a6`, HUD glass `rgba(20,21,28,0.78)`. UI scale is set by a `--ui` variable.
- **Plaques in the picture** (`src/ui/plaque.js`; the user, 2026-10-27, of the old browser-text labels: "infocards need to be revamped, they feel low quality, low tech too sharp and practical"). Labels are now drawn in the game's own **pixel alphabet** (the one the shop signs are painted in), at the picture's scale and grid, as small enamelled plaques: an ink outline, a face in the kind's colour with a lit top edge and a shaded foot, a **5 × 5 glyph** (a star for the embassy, a house for home, a key for a safe house, an eye for a face, an arrow for the way), the name, a quieter second part (the distance), and a notch pointing at what it names.
- **The HUD's dark glass versus paper** (DESIGN:828, rc36-37; the user: "most menus need revamping, the generic paper isn't adapted to inventory for instance"). What isn't a paper (the mind, inventory, first aid, choices, the menu, the log, the character sheet, the read of someone) is on the dark glass, each card headed by a plaque. **Papers stay paper:** briefs, cables, a call's notes, results.
- **Signs in languages you read** (0.1.16; the user: "if the character understands the language, the shop names should periodically animate into english (not straight up but animate into english to keep the fact that it's not english but that we understand it)"): 9 s in the original, a 0.45 s dithered wipe in reading direction, 3.4 s in English, then back, each sign on its own phase. An 8-frame overlay.
- **Arabic** is a pixel script of its own (`src/art/arabic.js`): contextual letter forms, lam-alef, right to left, distinguished at 3-5 px (DESIGN:476). For OLYMPUS this is a model for Belter creole or Martian signage if wanted.
- **HUD icons**: the emergency services' two pixel logos (a police light, an ambulance) sit top right by the time, flashing while inbound with the ETA under them (the user, 2026-11-04). The hunt's three icons (head, coat, pin) are red, green or grey with "?" (the user: "red if burned, green if not"). They had to be moved after the user complained of "overlapping UI elements".

---

## 3. World size and maps (DESIGN:460-501)

### 3.1 The principle
- **No city simulation.** What's simulated is geopolitics and the persistent characters. The places a mission needs are generated pieces of city ("points of interest with the city's flavour, generated from a base plus variation where that serves, fixed where that serves"). **A building you can enter is its own map**, and only the relevant ones exist.
- **Maps are compact but larger than a screen.** The camera follows the player (Q153). **About 50 people on screen** at the busiest. A tail that reaches a map's edge continues into a newly generated similar section, "so we need solid procedural variety".
- **Engine needs** (DESIGN:496-501; "smaller than first proposed", 2026-10-25): one sprite sheet and one draw for a crowd of 50, a dozen or two lights per map, a following camera, a section generator from kits plus variation, and a store for a few hundred persistent characters.

### 3.2 The street generator
- The city is **rows of east-west streets, each its own map**, generated in **sections of 45 m** from (city seed, row, section index), so a map can grow at either end as someone walks on. North to south: a terrace cut by **side streets (10 m)** and **alleys (3 m)** running north to the next street; a wide pavement with lamps; the road with parked cars and a zebra; the near pavement and a railing; **the south band** (a boulevard or a park, four sections at a time); a hedge with gaps where the next row's lanes come up. A row's ways north are the next row's ways south, so a way out of one map is a way into the next. An **autosave marks each change**.
- Every side leads somewhere (since v0.0.22, at the user's request).
- **"No two stretches alike"** (the user: **"environments reuse exactly the same elements, please generate at least three more kinds of everything"**). Every element comes in makes drawn from **separate rng streams**, so the street's geometry never moves when looks change. Per stretch of four sections a scheme (pavements, kerbs, asphalt, lamps: lantern, crook, twin, modern, globe, three-globe torch; railings, benches, bins, trees), changing only at a crossing's line. Per crossing a zebra type; per lane its surfaces; per building a dress of its style, doors, arches, shopfronts, signs, awnings, balconies, pipes, posters, scaffolding, roof; per car a make; per park one feature in four or five versions. Puddles, manholes, litter and leaves fall where each section's dice put them.
- **Season follows the clock's month** (November: bare broadleaves, an oak keeping brown leaves, fountains off, flower beds put to bed).
- Four cities (2026-10-27; `sim/cities/`) share **one cross-section**, so the city graph is one for all; only what stands on it changes (each with a dense, researched architectural vocabulary, DESIGN:473-475).
- **"Not a grid"** (the user): within the rows-and-lanes model, doglegs (with a low walled lot at the turn so a north-facing camera sees it), courts, set-back squares, crescents, lanes of other widths. `tests/cities.test.mjs` proves every way of the graph clear at full width, routes across 10+ streets, and nobody vanishing in the open.
- **Light per city**: the real sun for the game's local time and place (`sim/light.js sky(ms, geo)`).

### 3.3 The crowd and the bubble
- **Passers-by are agents going somewhere real** (v0.0.31, `sim/crowd.js`): a door 2-5 streets and 120-600 m away (the user: "a destination in mind… where the tail would end if it were an actual mission"), by a route of their own, with civilian habits on the way (a shop window, a bench, a call). Up to **40 per 100 m** at the busiest hours, a handful in the small hours, fewer in heavy weather. **They never appear or vanish where the player would see it.**
- **The bubble** (the user): passers-by live on the player's street and the streets either side, within 45 m. Whoever was on your street when you crossed is still behind you. Crossing again lets go of the street two back. Only a scenario's, the posting's and the character's people are kept beyond.
- **Time skipped recycles the crowd** (0.1.0-rc55; the user, 2026-11-03: "time passing (like during a judo class) doesn't seem to recycle the NPCs on the map?"). For a skip of **two minutes or more** (`RECYCLE_S 120`: a class, a book, a meal, a ride), the passers-by are let go and the streets refill anywhere with the new hour's count. Under two minutes, the same people stay where they were.
- **Casualties are not recycled** (0.1.36; the user: "shot and down NPCs get recycled out when we skip time or move away and come back"). The fallen are kept on their street (`state.fallen`) through skips and map changes until a call takes them.
- **Benches** (the user): two seats 1.65 m apart (2.65 m long; figures drawn 1.25 m wide), a third of the time three (4.3 m). Two people meeting take the ends.

### 3.4 The background game (agents off-screen)
The user, 2026-10-26: **"formalize where NPCs are going, pathfinding that works 100% of the time"** (DESIGN:490-495).
- **City graph** (`sim/city.js`): every street's walking lines joined by the lines the generator keeps clear (zebras, railing gaps, park paths, lanes). Routes are planned with **A\***, so every step is walkable by construction, and tests prove the corridors clear.
- **Routes are randomised per walker** (each sees the costs a little differently). A careful walker plans a roundabout route (detours, doubling back, alleys, parks, stops at windows).
- **Off the loaded street, an agent walks its route in the background, by the clock**; when its street loads, it is where it would be. The loaded street follows the focus.
- **Two behaviours for anyone:** a *target* walks a route and makes checks; a *follower* (`sim/agents.js`) follows by what it sees: in their footsteps, never further back than 60% of the eye's reach (31 m by day, 11 m at night), looking away when they stop to check, walking on ahead when they come its way, cutting across loops. Out of sight it hurries to the last-seen point and guesses (up the lane, into the door, waits 2 min, watches shopfronts). The first 20 s of a chase it has them "as if seen" whatever the dark. In autoplay the player's own character can be either, so **tests are AI against AI**.
- **Reliability**: 960 of 960 chases on empty streets (v0.0.30), 959 of 960 through the living crowd (v0.0.31), never blocked, never more than 41 m behind.
- **For OLYMPUS:** the same split (a few hundred persistent agents with routes on a graph, walked off-screen by the clock; a surface crowd in a bubble round the player, recycled on time skips) fits a Martian base, a ship's decks or a Europa outpost. The user's own OLYMPUS brief asks for exactly "fully fledged and permanent" NPCs plus "crowds more surface level".

---

## 4. Saves and losing a character (DESIGN:503-509, 858)

- **Autosaves** on every map change, on major events, every 30 in-game minutes, and on exit. **"They're for continuing, not for undoing."**
- **Losing:** death, capture or being fired loses the character. You pick a new one from generated candidates; reaching a higher rank offers candidates past the recruit stage (Q132, Q51).
- **Debug mode** (settings) allows manual saves and loading a save after a loss.
- **No difficulty settings.**
- Saves can be **exported and imported as JSON from day one**, so any bug can be replayed (CLAUDE.md). `window.__tradecraft` is the debug handle (state, step(n), start(state)).
- **After a lost character** (settled 0.1.26; the user: **"a campaign is the same until we start a new one (geopolitics and date/time continue on the same timeline when we die or retire an officer and pick the next one"**): the world carries on, and the next officer starts their own career in it (`SUCCESSOR_WEEKS 8` on, a Monday; `RETIRE_AGE 60`). Still open: whether the lost officer's network is inherited.
- **The ladder** (rc26; the user: "we unlock more and more advanced starters after a game over if we made it to the level +1 basically, the most advanced posting is illegal postings, which would unlock the level below as a restart character, with the option to start with lower postings still"). Rungs are kept in the browser (`tradecraft.career`); debug mode opens every rung.
- **Legends** (the user, 2026-10-31, then 2026-11-03: "remove the debug character, we should replace this section to read Legends and it should be available even with debug mode off"): twelve special pre-made characters with backstories for being exceptional ("maybe we 'retired' and came back, maybe we were burned and dust has settled"). What a backstory gives, the character has mastered (skill 20). Bug the user caught: "legends now start with close to 0 CQC and Weapons Handling skill, that's a bug these skills should be very high" (fixed to at least 18).
- **For OLYMPUS:** permadeath-ish career with autosave-only, a world that persists past a character, and unlockable higher-rank starts (e.g. start as a special-forces veteran once a run reached it) all match the user's tastes.

---

## 5. Scoping the first playable and the road to it (DESIGN:511-567)

### 5.1 The first playable (0.1.0), as scoped
- **One posting:** a CIA Handler at the US embassy in Moscow, with cover; **a few weeks of the posting, 5-10 hours of play** (Q159). The full game's start (end of basic training, then a scripted tutorial assignment) was deferred.
- **Places** (Q154): embassy (lobby, offices, secure room), the flat, generated streets, a metro station and its train, a park with dead-drop sites, a café and a restaurant, a market, a reception hall, a hotel lobby, a target's office.
- **Assignments** (Q158): surveillance detection run, brush pass, dead drop, asset meeting, spotting at a reception, developing a candidate, the pitch, surveilling and photographing, an emergency exfiltration (Gordievsky 1985).
- **Three moments it must have** (Q160), the experiential acceptance test: "The grey coat" (notice the same man twice, lose him naturally); "Two seconds on the platform" (a brush pass under surveillance); "The pitch" (recruit with the hook you spent weeks earning; "the roll lands in the log").

### 5.2 The road (Claude's call from Q161)
**Each mechanic is built first as a small playable test the user scores (like the look samples), and the mechanics are joined only after.**
1. **The look**, picked by the user (2026-10-26).
2. **The skeleton** (v0.0.19), played as a free walk: a pure sim (clock and calendar, tick order, seeded rng, saves with export/import, `window.__tradecraft`), input by physical keys, the check helper and the log, character sheets with skills and weights, gauges, heat, a map renderer (following camera, crowd of 50 sprites, light from the clock), one generated street.
3. **Mechanic tests, one map each, scored by the user**: tailing (v0.0.20, rebuilt on perception v0.0.21, across the city v0.0.30); being tailed (v0.0.24; metro rc39, cabs rc43); watching and photographing (rc11); a conversation; brush pass and dead drop (rc15); the umbrella assassination (rc19; the user: "full creative license on assassination mission"); a fight (CQC v0.0.35 with its dojo tutorial, then guns); a police stop (rc40); blown/hunted (rc3); the desk and the mind map.
4. **Joining** (the user, 2026-10-27: "Start working on campaign mode … the onion that is Character life > Posting > Assignment generation with the mission types that we tested"): the day (schedule, cover job, travel, needs), a minimal geopolitics, the posting generator, assignments, agency services.
5. **The content of 0.1.0**, then a release candidate when the user declares one.

The mechanic-test scenes later became the tutorial. Each test had measured numbers from scripted bots (e.g. 5a brush pass: no team clean 6/7, overt pair burned 5/7, covert team 1/10).

**For OLYMPUS:** this is the template for "functional test versions" the user asked for. Build each mechanic (weapon handling at a range, a shower and hygiene loop, a drop-ship ride under G, a boarding action) as a small scored test scene reachable from the title, then join them into the career.

---

## 6. The tutorial (DESIGN:569-588)

The user (2026-10-27): **"the test assignments on the right hand side should be consolidated as tutorials, rewritten to really hold the hand of the player so they really understand the game mechanics … a tutor on these missions, make it make sense … roleplay the instructions, maybe a radio and an earpiece that supplement the instinct … all grouped in a directory under a tutorial title"**.
- **The fiction:** your first month at the station. Hale, your old instructor, runs exercises with station staff playing the parts. Briefs are framed as exercises "written as if it weren't, because that's how they'll come". Mistakes cost his opinion; afterwards he tells you what really happened.
- **Gated behind the campaign** (the user, 2026-10-27: "gate the tutorial behind the campaign, to make it linked to the character we pick"). Hale phones the flat on day one.
- **Booked, not teleported** (0.1.20; the user, 2026-11-04: "…instead of teleporting us into the tutorials, should book the tutorial as an assignment we have to move to during a day we're not working … asking for an other tutorial later on should populate it a day that is free … at least two hours before an assignment"; "every tutorial should be rewritten to make sense as part of the campaign, and should implement all the tools and elements from the campaign like regular assignments"). Lessons are booked one a day at fixed hours (tailing 16:30, being tailed 19:00, photograph 13:00, brush pass 18:30, drop 15:00, Blown 18:45, umbrella 18:00, range 19:30), walked to, begun with T in their window, with `LESSON_GAP_H` 2 h clear of any assignment. They give XP (`LESSON_XP_K` 0.4) and no heat. Missed: "he waited and went home".
- **Consistency complaint** (rc30; the user: **"the station is London, and we get thrown to Moscow, besides, we don't even get to play our picked character, the point of bringing the tutorials in the career was to have consistency"**). Fixed: lessons run in the posting's own city with the picked officer (`asOfficer()`), with words localised.
- **The earpiece** (`src/sim/tutorial/earpiece.js`): Hale's lines go to the log (kind 'radio') and their own HUD box ("◉ HALE · EARPIECE"; in person "◉ HALE · BESIDE YOU"), one line at a time, each given **3.5 s + 1/3 s a word**, so nothing piles up. A script is *beats* (a condition on scene state and a line; once or repeating; urgent ones jump the queue; stale after 25 s; a `keep` condition rechecked at its turn) and *steps* (a checklist under the watch, ticked with his word on it). "The instinct goes on saying what's at hand; Hale says why." In stop-motion shooting his lines run on their own clock, so they don't back up.
- **Hale** (the user, 2026-10-27: "more flavor about Hale's background, hearsay about him/her having been deep under as an illegal superagent during the war … make it make sense it's just flavor"): canteen hearsay told in pieces, some of it wrong, never confirmed by him.
- **Later idea** (DESIGN:854; the user): the tutorial target in the trope grey coat and fedora changes into ordinary clothes at the end and jokes that spies look like everyone else.

### 6.1 The range lesson (lesson 8, 0.1.22), most relevant to OLYMPUS
The user, 2026-11-03: "a firearms training lesson", alongside "ranges where legal".
- **Place:** one room across the picture: club room (desk, staff, lockers, ammo shelf), range door, gallery, **five booths 1.8 m wide**, a bench at each firing line, concrete lanes, a red firing line, yellow lines at **7, 15 and 25 m**, a stepped steel trap, even strip lighting. No windows, no passers-by.
- **The club's gun** is handed over **empty and unchecked**, with two empty magazines and a box of 30. Your own guns go into the club's locker. It must be handed back clear (no magazine, nothing in the chamber).
- **The paper target** (`sim/paper.js`) is an actor of its own kind. A hit's ring comes from the roll's margin (13+ the X, 10 the ten, then 9, 8, 7 every three, under 2 the six; `RING_CM` 5 per ring on a silhouette, 1.25 on a bull's-eye card, whose precision adds +6 DC). Holes stay on the paper. A group is the first five rounds: score out of 50, Xs, hits, extreme spread in cm.
- **Range safety, every tick a gun is in your hand:** the muzzle is your heading. Past 60° off downrange, a warning; past 100° (up-range), the session is stopped. Aimed at a person, stopped. Aimed down another lane, a warning; fired there, stopped. Out of the booth with it, a warning and 8 s to put it away. An unintended discharge, stopped. Stopped means the gun is taken off you and Hale explains in the debrief. Dropped guns lie for 3 s and are picked up for you ("nobody grabs for a falling gun").
- **The steps** (the lesson's checklist): gun from the desk, checked clear at the line; both magazines filled at the bench, one in and a round chambered; a group of five at 7 m; a reload; **a stoppage cleared** (Hale slips a dummy round 2-4 rounds down a spare magazine: it looks live, it clicks, tap and rack clears it); five at 15 m; five at 25 m; unloaded, shown clear, handed back.
- **Measured:** Makarov at Weapon handling 6: 95/75/18% on paper at 7/15/25 m, groups at 7 m 21 cm; at skill 18: 90/100/98%, 3 cm groups. A scripted shooter (`tests/rangebot.mjs`) completes all eight steps, 15 rounds and a stoppage in about 2.5 game minutes.
- **Booked** at the range nearest the flat, 19:30 on a working day or afternoons on a day off; the window opens 15 min before and stays 10 after.
- **For OLYMPUS:** this is almost a ready-made design for marine basic-training range qualification and daily weapons drill, including muzzle discipline enforcement.

---

## 7. The campaign: systems relevant to OLYMPUS (DESIGN:590-635)

Only the parts that transfer are summarised here; the spy-specific content is skipped.
- **The way in** (rc22; the user, 2026-10-27: "landing page should be character selection landing you in the campaign, giving you your appartment, where we get a phone call or a text giving us the option to do the tutorials … or skip and begin the campaign proper"; "when we start the campaign, it should be in the appartment of the starter character"). New game: three generated characters. Day one starts in the flat at seven, moving boxes not unpacked. Twelve seconds in, the phone rings (45 s). **T walks you to whatever the instinct offers**, round the furniture (`sim/interiors/path.js`), and does it.
- **Backgrounds lift skills** (rc21; the user, 2026-10-27: "background should impact starting skills by up to +4 points (an ex marine would know how to fight)"): a Marine starts with CQC 12 and weapons 12 where others have 7-8. The sheet shows background points as ◆ and practice as •. Tradecraft by rung (the user: "beginners (tradecraft around 20 …), officers (… around 40)").
- **Time is a currency** (rc23; the user: **"pass the time things should be natural and time should feel like a currency, meaning gym (trains fitness), karate class or other martial arts, bed (nap, sleep, rest), read a book (can buy books in bookstores to learn specific things), take a language class"**). After "the game is real time": no bare waiting, and every hour spent buys something. A skill's trained base rises a point every **4 + 0.8 × base hours** of training (8 h at 5, 12 h at 10), capped by the teacher. Gym 1.5 h, $8, fitness to 14, hungry after; martial arts 2 h, $12, CQC to 14; language school 90 min, $15 (25 h to basic, 70 more to working, 160 to fluent). The user, 2026-11-04: "it seems like we can only work on our russian ?" (fixed: all languages real schools teach).
- **Reading in chunks** (rc54; the user, 2026-10-31: "a way when sitting on a bench, to just read a book we bought (which is in inventory) for as long as we want (one way to pass time, in chunks of 10min)…"). Ten minutes at a time, the clock skipped, hours counted as training. Not on a dark bench or in rain. In a live scene nothing is skipped (the book is cover).
- **Actions that take time skip the clock**: the embassy desk ("the day's cables till six (the clock skipped, as any action that takes time)"), meals 20 min, sleep till seven, a change of clothes 4 min, bank counter 4 min. **No fast travel to work or home** (rc50; the user: **"we should not have the option to just fast travel to work, it would skip all the gameplay like shaking watchers etc., same with going back home"**), and no fast travel to missions (rc51; the user: "we should be able to go to our mission without using the fast travel shortcut in TAB"). Only a trip abroad is flown via the menu.
- **The embassy lives** (rc33; the user: "NPCs should move around (not much but still) leave the office at 6pm … some turnover in the visas room, and nobody at 6pm since these tend to close earlier"). `src/sim/interiors/staffing.js`: a Marine guard round the clock; staff arriving 08:30-09:15 and leaving 17:40-18:20 (one in five working late, one in twelve off); the consular window open 09:00-13:00; errands (water cooler, cabinets); applicants arriving every 5 min, waiting 5-18 min. After a skip it is "put right at once". **For OLYMPUS:** this is the model for a barracks, mess hall or ops centre with shifts.
- **Wardrobe and items** (rc31; the user: "is there a way to change in the flat ? … buy objects and clothes in stores and bring them home"): slots for top, hat and glasses; wardrobe and drawer at home; items have size and volume (a book is 18 cm, 0.35 L: it fits a coat pocket, not jeans); hand, pockets or carried bag. Umbrella and hood logic (the user, rc35: "how do i use my umbrella, it's raining"; "no hood for clothes that don't have a hood though"). Coats and umbrellas are checked at the flat's door with an out-going checklist (0.1.18; the user). **Limited groceries** (the user: "the flat should have limited groceries"): the larder holds 6 meals on moving in; a grocer sells 3 or 7.
- **Money** (rc34; the user: "we should get paid monthly and start with some money in our accounts, and also be able to withdraw and deposit money there in banks"): cash on you ($300), salary on the 1st, bank counters. "Implement clubs with subscriptions".
- **The mind on Tab** (rc35; the user: "The TAB key for desk should be the mindmap, the character's knowledge not the desk…"; "a section with an actual map (known only again, it's our mind) where we can select waypoints"). Four leaves: Ahead, The city (only streets walked on foot within 40 m are known), People, Where you stand. Zoomed window (0.1.4; the user, 2026-11-03: "the map should be zoomed in our position, showing 2 streets around us maximum, and a zooming and arrows control to navigate … otherwise the map is too crushed"): about 350 m across, five zooms 240-790 m, arrow keys, +/-, C to recentre.
- **What your character believes** (rc35; the user: **"The heat level and the cover health should be reworded to be more roleplay, what we see is what our character evaluates as being true (we can't know for sure we're not about to be burned, especially if we're not very experienced)"**). The truth plus an error whose spread shrinks with skill and familiarity (a junior on day one ±18 points, a few weeks on ±10; a Handler ±9, soon ±4). It is shown as words, never a number, with a confidence (a guess / you think so / you're sure). Official papers say it plainly. **For OLYMPUS:** this is a strong fit for a soldier's sense of their own health, fatigue, suit oxygen ("you've maybe twenty minutes of air"), or enemy positions.
- **Variety in briefs** (rc52; the user, on a tail's brief: **"are all tails reading like this ?? … there should be insane variety in mission descriptions and specifics"**). `src/sim/dossier.js`: each target's file made once and kept; a brief written paragraph by paragraph, each paragraph one of several phrasings dealt per person so the same man's next brief never repeats until each pool runs out. Tests: 1,013 briefs, 2,331 different paragraphs.
- **Place consistency** (rc21; the user, in Cairo: "took a taxi there, but there is no embassy?", "I can't find my flat"): the posting's places are chosen once from its seed and marked on the map with brass plates and pointers.
- **Fatigue**: 16 hours awake costs every skill 1, 20 hours costs 3. Hunger and stress were added in rc9.
- **Fitness and rust** (0.1.17; the user: "fitness should remain a skill, but there should be a shadow skill called effective fitness, that goes down the longer we go without exercising"; "skills higher than 15 but unused for over four weeks become 'rusty'"). Effective fitness = base + offset (−3…+3). The weekly load (gym 10, club class 7, 1 km walked 0.6, 1 km run 2.5) is compared with the base b: ≥4.5b gives +1, <2.2b+2 per point over 12 gives −1. Two weeks at the edge moves the base. **Rust:** a skill over 15 with fewer than two practice sessions in 28 days goes a level rustier (to 3), each level costing a sixth of what's over 15. Clubs keep skills up (the user, 2026-11-04: "since we got this rusty system we should add activities and clubs to work on each one (stuff like theater club etc)"). "Fieldwork keeps the craft" (the user: any assignment clears rust on the four core spy skills). **For OLYMPUS:** directly relevant to daily PT, drill and qualification currency.

---

## 8. Firearms (DESIGN:637-700), in full detail

The user, 2026-11-03, after Alpha 1: **"start working on firearms (which will finally use weapons handling skill). The goal isn't to make this a third person shooter or similar. Shooting is going to be integrated in a stop motion way, heavily relying on the weapons skill."** It was built in steps, one patch release each.

### 8.1 The gun as a stateful object (`src/sim/firearms.js`, 487 lines; built 0.1.1)
- Each gun has its own state (`state.arms`, id `model#n`). A gun dropped is the same gun, loaded or not, safety on or off.
- **Parts and state:** the magazine (a thing too, `mag#n`, rounds counted, made for one model or family); the chamber (live round, dud, spent case caught in the port, or empty; a round can be chambered with no magazine); a jam (a double feed, cleared only by the drill); slide locked back on empty; safety (lever, none, or selector); **condition** (worn by each round, `WEAR 0.0008`, and by neglect; under `COND_SERVICE 0.6` misfires and jams rise sharply; under `BROKEN 0.25` it won't fire until serviced, stripped and cleaned at a table for 30 min); and **whether its holder knows what's in it** (their own gun; a picked-up gun is a question until checked).
- **Calibres by name** (0.1.7; the user: **"ammunition shouldn't be 'rounds' it should be very specific calibers based on specific caliber magazines used on specific weapons"**). Boxes hold 20 rounds of one calibre (`BOX 20`, 9 cm, 0.12 L); a magazine is its gun's and its calibre's (12 cm, 0.06 L). A box can be put down or stored.
- **Calibre damage multipliers** (`firearms.js:66-74`): .380 ACP 0.8; 9×18 Makarov 0.9; 9×19 Parabellum 1.0; 7.62×25 Tokarev 1.05; .38 Special 0.95; .45 ACP 1.15; .357 Magnum 1.25; 10×28 T rubber 0.2 (less-lethal); 4.6×30 1.05; 9×39 subsonic 1.45; 5.45×39 1.5; 5.56×45 1.5; 7.62×39 1.7; 7.62×51 2.0; 7.62×54R 2.05; 12-gauge buckshot 2.2; .22 LR 0.35.
- **The arsenal** (0.1.2; 44 MODELS; the user, 2026-11-03: "implement many kinds of firearms right away (many kinds of assault rifles, many kinds of handguns etc)"): pistols (Makarov PM, PL-15K, Yarygin, GSh-18, Glock 17/19/26, SIG P229/P226, Beretta 92, CZ 75, Hi-Power, Helwan, Tokarev, 1911, PPK, Canik TP9, a converted blank-firer with 4× misfires and jams, a traumatic pistol), revolvers (Model 10, 686), SMGs (MP5, MP5SD, Uzi, Bizon, PP-2000, Skorpion, MP7), carbines and rifles (AK-74M, AK-12, AKS-74U, AKM, AS Val, M4, M16A4, HK416, MCX, G36C, FAL), the SVD, a bolt hunting rifle, the Anschütz .22, the Remington 870 and the Saiga-12.
- **How each works:** its kind (table below); its feed (a box magazine of its family, e.g. AK-74 magazines fit AK-74M, AKS-74U, AK-12 and STANAG fits M4, M16, 416; a tube loaded one round at a time; a revolver cylinder swung out, emptied, loaded, shut, where a dud just clicks on to the next); its cycling (self-loading, or a pump or bolt worked after each shot, the case staying in the chamber till then); its safety in the lever's real order (AK: safe, auto, semi; M16: safe, semi, burst 3; AK-12: burst 2); whether it locks back on the last round (an AK doesn't); its loudness (AS Val heard 0.15 as far, MP5SD 0.2, rifles 1.4-1.6× a pistol). Long guns go on a sling (always visible) or in the hand, never in a pocket; their actions are 15% slower (`LONG_K 1.15`), their sight picture 1.15-1.35× and their turn 0.7-0.85× a pistol's.

**KINDS** (`firearms.js:54-62`): the shot's DC grows as `perM × d + perM2 × d²`.
| Kind | perM | perM2 | sight × | turn × | hands | max m |
|---|---|---|---|---|---|---|
| pistol / revolver | 0.45 | 0.01 | 1 | 1 | 1 | 60 |
| SMG | 0.30 | 0.004 | 1.05 | 0.95 | 2 | 100 |
| carbine | 0.18 | 0.0018 | 1.15 | 0.85 | 2 | 250 |
| rifle | 0.14 | 0.001 | 1.2 | 0.8 | 2 | 400 |
| DMR | 0.08 | 0.0004 | 1.35 | 0.7 | 2 | 600 |
| shotgun | 0.30 | 0.02 | 1.1 | 0.85 | 2 | 50 (−3 DC inside 12 m) |

**Reach, as an expert's hit chance aimed at 5/25/50/100 m:** Glock 95/90/5/5%; MP5 95/95/60/5%; M4 95/95/95/10%; AK-74M 95/95/95/60%; SVD 95% at all four; 870 95/80/5/5%. On auto a pull is a burst of 4 (`AUTO_ROUNDS`; a burst-mode gun 2 or 3), each round its own roll, with the muzzle climbing (−2 × recoil per round after the first; `BURST_K 2`).

### 8.2 Malfunctions (`firearms.js:161-169`)
- Misfire: `MISFIRE 0.002` (about 1 pull in 500 on a new gun) + `MISFIRE_WORN 0.05` × wear fraction. Stoppage while cycling: `JAM 0.004` (about 1 in 300 with rounding) + `JAM_WORN 0.12` × wear², plus `JAM_LIMP 0.03` for a pistol in a weak grip (Weapon handling under `LIMP_BELOW 6`). The doc's figures: at condition 0.6, 2.6% misfire and 4% jam; at 0.35, 3.4% and 10%.
- Of stoppages, **3 in 10 are double feeds** (`DOUBLE_SHARE 0.3`; the jam drill, 4 s), the rest stovepipes (tap and rack).
- Magazines: `MAG_FRESH 0.95`; a bent lip (`MAG_JAM 0.3`) feeds badly; dropping one on the ground wears it by `MAG_DROP_WEAR 0.04`.

### 8.3 Every action takes time and a roll (`firearms.js:183-204`)
Each action is a check of Weapon handling against its DC. Its time is the base × the **pace**: `pace = clamp(1.6 − WeaponHandling/30, 0.5, 1.6)` (`PACE`, `firearms.js:178, 262`), so the untrained (1) are 1.6×, a Handler (7) 1.4×, an expert (21) 0.9× and a master (31+) about half. "Instant" thumb actions (safety, selector, decock) take base × pace², so the skilled do them as the gun comes up (expert 0.13 s, Handler 0.6 s, untrained 1 s).

| Action | base s | DC |
|---|---|---|
| Draw (generic) | 1.2 | 8 |
| Draw from beltline holster / inside pocket / coat pocket / trouser pocket / sling / bag | 1.0 / 1.7 / 1.6 / 2.3 / 1.6 / 4 | 8 / 10 / 10 / 12 / 9 / 12 |
| Put it away | 1.3 | 6 |
| Safety, selector | 0.4 | 6 |
| Decock (hammer down) | 0.4 | 5 |
| Rack the slide | 0.8 | 8 |
| Drop the magazine | 0.5 | 5 |
| Magazine out into a pocket (retained) | 1.4 | 7 |
| A magazine in | 1.4 | 9 |
| Slide release | 0.3 | 6 |
| Clear the jam (double feed drill) | 4 | 12 |
| Check it (press-check) | 1.6 | 6 |
| A round in the chamber by hand | 3 | 10 |
| A round in (tube or cylinder) | 0.9 | 6 |
| Swing cylinder out / eject / close | 0.6 / 0.7 / 0.4 | 5 |
| Fill a magazine | 2.2 per round | 4 |

**Fumbles** (0.1.7; the user: **"fumbling should have consequences … depend on weapons handling skill … accidental discharge and the bullet should potentially actually hit something depending on what we're facing"**; `FUMBLE_K 0.6, DROP_BY 6, DISCHARGE_BY 10`). Failing by under 6 is a fumble (+60% time). Failing by 6 or more drops the gun or the magazine at your feet. Failing by 10 or more with the gun ready to fire, **it goes off**. A natural 1 has its own die: under skill 10, a drop 2 times in 5 (`NAT1_DROP_BELOW 10, NAT1_DROP 0.4`); under 5, a shot 2 in 5 if ready (`NAT1_SHOT_BELOW 5`). The discharge (`shooting.js` discharge()): drawing, a third of the time into your own leg (`SELF_SHOT.draw 0.35`); holstering, near half (`0.45`); otherwise where the gun pointed, into whoever is in line, or the ground. Measured over 2000 draws of a chambered Glock from the belt: the untrained fumbled 475, dropped 56, discharged 28; a Handler fumbled 62, dropped 34, never discharged; an expert only fumbled (96). Draw times measured: untrained 1.9 s (6% mishaps), Handler 1.4 s, expert 0.9 s, master 0.6 s. Stress and darkness make every action harder.

**Decockers** (0.1.11): SIG P229/P226 have no safety but a decocker. Carried hammer down, the first pull is double-action (+0.15 s, −1); a fumble with the hammer down must be 5 worse before it fires (`DA_GUARD 5`). Guns with neither say "no manual safety".

**Muzzle discipline** (0.1.11; the user: **"high weapons skill should at least protect in ways of muzzle discipline allowing us not to shoot some random civilian in the head"**). An accidental discharge was pointed somewhere safe (ground or floor) with probability `clamp((WH − 4)/(28 − 4), 0, 0.97)` (`shooting.js:112-113`): never when untrained, 29% at 10, 71% at 20, 97% from 28.

### 8.4 Gun work at a table (`src/sim/gunwork.js`, 0.1.11)
At the flat's kitchen table (or a range bench), each job is a roll at the hand's pace: unload (magazine out, chamber cleared into the calibre's box); load (fullest magazine, chamber, safety on or hammer down); **strip and clean (20 min, condition restored)**; fill a magazine (2.2 s a round) or empty one (1 s a round); recondition a magazine (spring and lips, 10 min). Bad fumbles (8 under, or a natural 1 untrained): a round fired into the table while unloading (muzzle discipline decides where; the building hears it, +4 heat), rounds lost under furniture, a gun reassembled with a spring wrong (condition 0.5), a magazine lip bent. In 400 tries the untrained fired 25 into the table, lost 138 rounds and bent 21 magazines; an expert did none of it. Magazine filling is lived in real time when it takes `LIVE_MAX_S 180` s or less, skipped beyond (0.1.27).

### 8.5 Shooting is stop motion (`src/sim/shooting.js`, 637 lines; built 0.1.1)
- **A mode entered on purpose** (X, and X to leave). Only it stops time for your shots. Each step of readying the gun (out, safety off, chamber, magazine in, jam cleared, aim, shot) is **chosen by the player with a digit**; the panel shows each step's time. The world moves on by that step's time as it's taken, your feet held, then stops again.
- **G with a gun means intent** (0.1.7; the user: **"we shouldn't be able to draw a firearm out by pressing G … taking it out should imply we intend on using it, meaning that time stops and we enter the weapon ready sequence"**). G enters the mode with the draw as its first step. A knife's G is unchanged.
- **Targeting:** left and right pick the target across the picture (people and things in view, within 60 m, `MAX_M`); up and down pick the head, body or legs; a plaque over the target gives the part, the odds of a hit now and the distance. **Aim by pointing** (0.1.13; the user: **"Make aiming more natural … but no list"**; **"we should only be able to aim at things in the current frame"**): mouse over a figure puts pale brackets on them with the aim's time; a click aims; a click on the aimed-at fires; arrows step the brackets; Enter aims. Only what is in view and in the picture's frame can be aimed at (`state.$frame`; default `FRAME_M [20, 11]` half-extents). The aimed-at keeps red brackets.
- **No aim, no shot** (0.1.11; the user: **"aiming should be necessary to be able to shoot something … if you're not aiming you can't shoot"**).
- **Aim timing** (`shooting.js:71`, `AIM`): sight picture 0.6 s × pace; turn at 90 + 6 × WH °/s; past the arms' arc (30° + 2°/point, max 100°) the feet come round too (0.4 s × pace). Measured (front / 45° / 90° / behind): untrained 0.9/2.0/2.5/3.4 s; Handler 0.8/1.7/2.1/2.7; expert 0.5/0.8/1.3/1.7; master 0.3/0.5/0.7/1.2. A held aim follows a moving target within the arc and steadies by +3 DC per second, up to +4 (`HELD 3, HELD_MAX 4`).
- **The shot:** the trigger (a click on an empty chamber, a dud, a stoppage), then **d20 + Weapon handling + modifiers vs DC = 6 + (perM × d + perM2 × d²) × the gun's accuracy**, with +6 for the head, +3 for the legs, +4 for a thing (`PART_DC`). Modifiers: target walking −2, running −5; dark −4, poor light −2; being shot at −4; your own body (a hurt arm, blood loss). A natural 1 always fails and a natural 20 always succeeds (`sim/checks.js`). Then 0.15 s trigger (`TRIGGER_S`) and recoil recovery 0.35 s × recoil × pace (`RECOVER_S`).
- **Measured hit rates** (body, daylight, standing, aimed 1.5 s; 3/7/15/25/40 m): Handler 94/89/60/16/6%; expert 96/94/95/85/5%; master 94/94/94/95/41%. A Handler's point shot: 61/49/20% at 3/7/15 m. Real-world numbers checked against: draw from concealment and fire in 1.25-1.5 s trained, under 1 s elite, officers 1.5-1.8 s, novices 2.5-3 s; police in real gunfights hit with 18% of shots (30% when not fired back at; 37% within 7 yards, 23% beyond: RAND 2008, NYPD). "The game's ranges are calmer than gunfights: being shot at, the target moving, the dark, the body hurt are what bring it down to those."
- **Taps** (0.1.27; the user: **"double tap instead of fire when pressing 1 while the time is unfrozen after the first shot, and when skilled enough up to triple tap"**): fire again during recovery at the same aim. Double taps from WH 8, triple from 18 (`TAP_SKILL`); each follow-up −BURST_K × its place × recoil × climb, where `climb = clamp(1.4 − WH/25, 0.35, 1.4)`; split `TAP_SPLIT_S 0.25` s. Semi-autos and revolvers only.
- **Stop motion ends when you can't act** (0.1.37; the user, 2026-11-04: **"world is still frozen, it should cancel all of the stop motion mode when I get arrested or otherwise am unable to immediately do the shooting steps"**; "it's saying I complied when I was trying to draw on him"). It ends at death, being knocked down, being pinned, a fist fight, or being in a car.
- **Down with a gun** (the user, 2026-11-04: **"being brought down with a gun half the world is frozen"**; **"make a hard pass at this logic to debug these half frozen scenes"**): you can't raise a gun lying on the pavement. The bug: input set you 'idle' before the look, so perception used a standing cone while the picture drew a lying one, and everyone behind you froze.
- **Nobody shoots from the ground** (0.1.13; from the user's save, where two downed officers kept firing at the player, who was down and unarmed): downed officers don't fire; with you down or empty-handed, they cover you (finger off the trigger) and the nearest walks in to cuff you.
- **NPCs do the same steps in real time** (0.1.9, `sim/armed.js`): draw, safety or selector, chamber, stoppage, aim, shot at the same DC, recovery, each at their own skill's pace. When they shoot at you, time does not stop unless you're in the mode. Being shot at costs your rolls (−4 a shot's, −3 an action's, for 5 s). A Moscow patrolman (WH 8) fired 3.8 s after his order. NPCs carry and **use real magazines** (the user, 2026-11-04: "Armed npcs should also always carry ammunition (and use it, in such ways that they can run out)"; "when an npc gets taken down and was carrying a rifle, they should drop it"): a patrol has two full magazines, the armed response four plus one pistol magazine.

### 8.6 Cover (`src/sim/cover.js`, 0.1.38)
The user, 2026-11-04: **"Build a cover system, where being behind objects that can provide cover move the needle in the dice rolls when a shot is computed. Being at the corner of a wall should be better than behind shallow cover. There should also be a hide behind cover action when in gun mode and close to cover"**.
- For every shot, the code looks at what is on the line of fire in its last 3 m before the target (`COVER_M 3`); cover nearer the shooter is the shooter's own and they shoot over it. A hit roll made, the share of the aimed part behind cover takes the round, and the cover stops it (by its `stop` share) or it goes through. The odds and the brackets say what the target is behind.
- **Stop shares** (`cover.js:32-55`): building 1, monument 1, post box 1, fountain rim 1, lamp post 1 but 0.15 m wide, tree trunk 0.9 at 0.35 m, generator 0.8, parked car 0.6 (engine block and wheels, not the doors), phone box 0.35, bin 0.35, cart/scooter/furniture 0.3, bench 0.25, stall/notices 0.2, railings 0.1, bus-shelter glass 0.05, shop glass 0.05, hedge 0 (concealment only). A tall narrow thing counts by its width against a body (`BODY_W 0.55`).
- **Stance shares kept off:** behind a car standing, legs 0.6 and torso 0.5, head none; down behind it, 0.6 of everything; up over it to fire, chest 0.45, head 0.18; at a wall's corner leaning out 0.65 (`LEAN`), round it fully hidden; down behind a bench 0.23. Body spans: standing legs 0-0.85 m, torso 0.85-1.5 m, head 1.5-1.75 m; crouched 0-0.4, 0.4-0.9, 0.9-1.15 m.
- **Get down behind it** (X in the mode): the nearest cover within 1.8 m (`HIDE_M`), on the side away from the threat, a crouching run (0.45 s plus steps). Aiming from there brings you up over it. A fully hidden target makes an officer hold fire with sights on where you'll come up. Queued: police using cover themselves.

### 8.7 Wounds from bullets (DESIGN:653; `sim/health.js`, `sim/medicine.js`, `sim/wounded.js`)
- **Damage** = 7 points (`BULLET 7`) × calibre × gun (0.8-1.25). A deep wound bleeds (2.4× in the body) and sometimes opens an artery (`ARTERY_CHANCE 0.15`). Aimed at the body, one in eight takes an arm. **Head:** dead 60% (`HEAD_KILL`); of the rest a third grazed (dazed 15-35 s, scalp-bleeding), the others out cold with a bullet in the skull, bleeding inside 1.2%/min (past first aid; needs a hospital or dead within the hour).
- **Bleeding:** outside bleed is a deep cut's × 0.6 in the body, × 0.9 on a limb (about 3% of blood a minute from a chest wound; two untreated chest wounds mean down at 8 min, dead at 10). A chest wound also bleeds inside for 3 h (+0.25%/min a bullet, max 1%). Blood thresholds (`BLOOD`): pale 85, shock 70, collapse 55, dead 45.
- **Scalp grazes look worse than they are** (the user: "even if hair bleed profusely, it looks bad without being that bad, definetly not minutes away from death like it was the femoral artery"): at most 0.8%/min, clots within 20 min (max 16% of blood lost).
- **Knockdown** (the user, 2026-11-04: **"being knocked down is a logical result of getting shot. Staying down should be justified (pain level, shot in legs, blood loss, loss of consciousness)"**). `KNOCK_S`: arm 4-12 s, leg 10-30, body 20-60, head graze 15-35; ×1.3 in pain, ×2 bad pain, ×3 agony; ×1.3 pale, ×2 shock; trained ×0.4; clamped 2 s-3 min. After that only the body keeps someone down (out cold, chest gone, both legs gone). Down for the legs but awake, they crawl at 0.25 m/s (×0.6 one-armed).
- **Pain, adrenaline, shock** (the user, 2026-11-04: **"wounds should have effects (pain, blood loss, shock, dizziness) and these effects should trigger reactions like sitting down when dizzy and feeling safe rather than running away. If we're still there with a gun out, they would run for their lives of course. If profusely bleeding out from arteries, they might end up in shock very quicly especially when fleeing. Adrenaline should be modelled as a short term pain reduction thing. Pain resistance should be linked to fitness level, over a certain pain threshold, people just lit up against a wall or lie down"**). Pain points: a bullet through a limb 28, a break 50, two in the body 50+. Adrenaline (`ADRENALINE`) takes 60% off for 40 s, fading over 80 s, renewed while in danger. Pain tolerance = 30 + 2 × Fitness. In shock or past 1.4× tolerance: down where they are; past tolerance: against the nearest wall (3 m) or down. Behaviour each second: flee the shooter if he's in sight within 40 m with a gun (walk × 2.4 × mobility), sit if dizzy and safe, phone for help when out of his sight, crawl to a wall with the legs gone.
- **Moving bleeds more** (the user: "Moving away should increase blood loss if realistic"): ×1.25 crawling, ×1.5 walking, ×2.5 running (`EXERTION`). **Mobility:** legs hurt 0.85, wounded 0.55, out 0.3; torso 0.9/0.65; pale 0.85, shock 0.6; a gunshot under 3 days old 0.8; no running under 0.7 or in shock.
- **Strays:** a miss goes on, and the first person within 0.7 m of its line out to 80 m takes it a quarter of the time (`STRAY`). A gunshot is heard at 70 m (`HEAR_M`): passers-by run; in the campaign +8 heat once a minute.

### 8.8 Body armour (`src/sim/armour.js`, 0.1.21-0.1.24)
The user, 2026-11-04: **"heavy worn as outside clothes for military grade and used by soldiers and armed police, light is concealable but noticeable when inspected from up close and worn under clothing. It should protect realistically from bullets, and a little from knives and other cutting implements (realistically)"**.
- **Soft vest** (NIJ IIIA-like aramid, 2.5 kg, under the top, not drawn): covers 3 torso hits in 4; aimed shots land nearer the middle (`centreOf()`: margin m pulls it in 0.2 × min(1, m/10)). This was fixed after the user's complaint, "my soft vest didn't seem to stop the two bullets from the police officer shooting at me". It stops .380, Makarov, .38 and .45 almost always, 9 mm 98%, .357 95%, buckshot 95%, Tokarev 45% to 10 m and 80% from 40 m, 4.6×30 10-30%, 9×39 10%, and no rifle round. Rounds past the edge are named ("Past the vest's edge.").
- **Plate carrier** (steel, NIJ III/IV-like, 11 kg, over the top, drawn): plates cover half the torso hits, soft panels a quarter, a quarter bare. Plates stop every handgun round, 5.45 95%, 7.62×39 96%, 5.56 92%, 7.62×51 90%, 7.62×54R 85%, 9×39 85%. Each stop wears the layer (soft −2%, plate −3%, max −30%). A round that gets through keeps 85% of its damage (soft) or 60% (plate).
- **Blunt trauma behind armour:** 22% of the bullet's points through a vest, 30% on a plate; a cracked rib 5-6% × calibre²; winded 1-3 s × calibre; knocked down 10-15% × calibre.
- **Helmet:** covers 0.55 of head hits (the face bare); stops 9 mm 0.95, rifles 0.02-0.15; a stop is a 2-6 s daze.
- **Blades:** a plate stops them; a soft vest turns 70% of slashes, 25% of thrusts, 10% of points.
- **Costs:** a carrier ×0.92 on walk and run; heat +0.5 (vest) or +1 (carrier) on clothing warmth; a km in a carrier is 1.5× the training load. Stripping armour off the downed takes 60 s (carrier), 120 s (vest) or 15 s (helmet). A soft vest is seen only up close (Awareness vs 15, +2 a metre, by the garment over it).
- **For OLYMPUS:** Martian marine armour, helmets and suits slot straight into this layered model. Add pressure integrity, a suit breach and its leak rate.

### 8.9 The reflex (`src/sim/reflex.js`, 0.1.10)
Time stops when something wants a sudden reaction, **if you're quick enough to see it coming** (an Awareness roll). A card offers what you can do; each choice takes its time, and **"nothing" is always an option** (closing the card is nothing). Uses: a quarry's tell, a hand reaching for you (step back, run, meet it, your gun, nothing), an officer going for his gun (DC 8 + 1 per 5 m). The user complained it was "spammed" (2026-11-04: "the reflex window is spammed on us too, there should be a way to remember our choice for a while"): R keeps the answer for the same kind of moment for 2 minutes without stopping the clock.

### 8.10 Guns are rare, law by country, black market, ranges
- **Guns are rare** (0.1.6; the user: **"don't give a firearm to officers by default, firearms need to be rare and illegal in most places, acquiring one should be a whole thing"**). No campaign starts with one. The free walk always gives a SIG P229 (the user: "give us a gun in free walk so i can test these things"). Debug guns need `?gun`.
- **The embassy's metal detector** (the user: **"EMBASSY METAL DETECTOR SHOULD RING"**): a gun, magazine or rounds ring it, go to the safe, and cost −25 cover.
- **The law by country** was researched (2026-11-03) and cited (DESIGN:672-677), with ranges by city (DESIGN:657) and a black market whose odds and prices scale with the country's ease (DESIGN:656).

### 8.11 Police, arrest, hunt (DESIGN:679-692), in brief
Civil-police content, so reference only for OLYMPUS (MPs, habitat security). The user's complaints here are the clearest signals of what annoys them:
- 2026-11-04: **"I got arrested instantly without a splashscreen that explains what happened, without a reflex action to try to resist or fight off the cop, without an animation of the cop nailing me to the ground"**; "the police doesn't reset clean after arrest". Fixed: only able officers act, a reflex card at 1.3 m, a 6 s takedown pose, and an arrest **paper** (what for, how, costs, hours).
- Also: "police struggles to arrest us when we're not stopping…"; "police tends to spawn on top of us if we're close to their corners"; "we still get ghosts shouting at us…"; "cop I laid down and cops that interrogated me all ignore me now ?"; "going back and forth"; "stuck aiming".
- Hunts are sized by incident (fist fight 3 streets for 1 h, up to a killing city-wide for 48 h; the user: "24h-36h for a gunshot and a wounded or dead"), with three markers (face, clothes, last place) read by a Tradecraft roll.
- Emergency calls, ETA logos, cordons and onlookers (the user: "they would either steer wide away, or pool around the bodies with their phones out…"; "gunshots with no victims seem to not trigger a police call ? It should").
- **Hospitals:** treatment hours by injury (`TREAT_H`), skipped; kept "in a bed till you can walk" (the user: "we should stay in hospital long enough to be able to move"); clinics on the street plus one big hospital ("A big structure"). **For OLYMPUS:** the medical pipeline (first aid, medic, infirmary, hospital with hours skipped while healing) carries straight over.

---

## 9. Stations and countries as data (DESIGN:702-714)

The user, 2026-11-03: **"make sure countries are implemented in a way that is scalable because we will be adding more playable stations down the line and it's better to refactor now if needed than after we've added a million new features"**.
- A station is a city in a country, and each is **one data file**. `src/sim/cities/<city>.js` holds streets, people, dress, look, station (risk, how closely watched, embassy, opposition names, subjects), transit, rooms and career. `src/sim/countries/<id>.js` holds language, currency, police (patrol odds, Awareness, uniforms, arms, response unit and minutes), gun law, black market and ranges. Everything is read through accessors (`cityById()`, `countryById()`, `countryOfCity()`, `policeOf(map)`). Adding a station means adding its city file and, if needed, its country file. The remaining exceptions (weather climate, a few drawing flags by city id) are listed honestly.
- **For OLYMPUS:** bases, ships, moons and factions (MCRN, UNN, OPA, belters) should be data profiles from the start. The user explicitly prefers refactoring early for scalability.

---

## 10. Stack (DESIGN:765-774)

- **In the browser "if it stays the most convenient, like longhaul"**: the same save logic (IndexedDB, a save schema, additive upgrades on load) and the same method (CLAUDE.md).
- **three.js 0.186.1**, vendored as ES modules in `vendor/three/` (`tools/vendor-three.mjs`), loaded via an import map: no build step, no network, no install to play. This was a departure from longhaul's hand-written WebGL2, made for skinned characters, glTF, shadows and post-processing. In practice the pixel look ended up rendering simple boxes and cards through an orthographic camera with a custom pixel stage (part-ID outlines, palette snap). The skinned/glTF reasons stopped mattering once the user chose "pixel art 100%, almost 2D".
- **Content is made by scripts** (docs/PIPELINE.md). The pixel look needs no Blender or MPFB: sprites and textures are drawn by code.
- **Code layout:** `index.html`, `src/main.js` (the loop); `src/sim/` is the pure sim (time is whole ms since 2026-01-01 00:00 Moscow time; **tick 50 ms, 20 Hz**, in a fixed order in `sim/game.js`; light; weather; skills; checks; people; heat; street; world; crowd; scenarios); `src/render/` is the view, meshes and one instanced crowd draw; `src/ui/` has keys, screens and saves (IndexedDB and files); `src/art/` has the painters and sprites.
- **For OLYMPUS:** the user said "not necessarily the same tech". A top-down game at several scales (close-up pixel art, ship tactical, system telescope) may be better served by a 2D canvas or WebGL2 sprite renderer, since tradecraft's 3D is only a means to a 45° pixel look. Keep the browser, no-build, IndexedDB, pure-sim, and JSON-export rules.

---

## 11. Controls (DESIGN:776-802; `src/ui/input.js:17-20`)

**Keyboard first. Keys are read by physical position (`KeyboardEvent.code`)**, so they work on any layout, and on-screen labels show the player's layout (`navigator.keyboard.getLayoutMap()`). The doc names keys as the **user's AZERTY keyboard** prints them. The user is on a Mac (Option key) with AZERTY, and has also tested on Windows. **"The mouse is for menus"**, plus aiming by pointing since 0.1.13.

| AZERTY label | Physical code | Does |
|---|---|---|
| Z Q S D | KeyW KeyA KeyS KeyD | Move |
| Shift | ShiftLeft | Run |
| Alt / Option (held) | AltLeft | Stroll: a slower walk, to keep a pace without stopping |
| F | KeyF | Interact (a menu when there are several options); in a fight, F → Read the opponent |
| I | KeyI | Inventory (what you carry, pockets drawn on your clothes) |
| H | KeyH | First aid |
| T | KeyT | Do what the instinct's line says (sit with him, call it off, the pass, answer the phone); also walks you there |
| R | KeyR | Use what's at hand (a book sat somewhere, shop window, bench, zebra, kiosk, bus shelter, taxi, door, counter, basin, back door, item within reach); in a reflex card, keep the answer for 2 min |
| E (hold) | KeyE | Stop and look: move keys turn your eyes; at a shop's glass, slant along it (70°/s, to 60°) to see the street behind |
| E (tap) | KeyE | Glance back over your shoulder, walking on |
| C | KeyC | Character sheet (body as the read shows it, skills, file) |
| P | KeyP | Camera (was C) |
| K, L, M | KeyK, KeyL, Semicolon | Hit, grapple, guard; Shift + one spends an "edge" |
| G | KeyG | Draw a gun (enters the stop-motion weapon-ready sequence) |
| X | KeyX | Shooting mode on/off; in mode, get down behind cover |
| 1-9, 0 | Digits | Choose a stop-motion step; choose list options; 1 again in recovery = tap |
| Arrows / mouse / Enter | | Step brackets across targets / point to aim, click to aim and fire / Enter aims |
| Tab | Tab | The mind: Ahead, The city (map, waypoints), People, Where you stand |
| J | KeyJ | The log |
| Space | Space | Pause |
| ? | Shift + comma on AZERTY | The keys table on screen (folded to "? keys"; the user, 2026-10-27: "put the keybinds behind '?' key instead of always in the bar at the bottom") |
| Esc | Escape | Menu |

Decisions behind the table:
- R was split from T (rc29; the user, 2026-10-28: **"'T' as a universal key interferes when several things can be done with it ... when the option to call of the meeting for a brush pass is available, we can't look in a shop"**).
- E-tap glance back (the user, 2026-10-26). The glass slant was fixed after the user: "tends to slant the wrong direction (up instead of left)".
- The character sheet is on C (the user, 2026-10-26), moved onto the dark glass and refactored to match the health "read" (the user, 2026-11-03: "the char sheet should also be refactored to match the 'read' sheet for health representation … it should be black and show more information like character CV").
- "Reload" was planned for R but R was taken. Reloading lives in the stop-motion digits instead.

**For OLYMPUS:** keep physical-key reading, AZERTY-labelled docs, a context key (T) separate from a "use at hand" key (R), a hold-to-look key, a deliberate weapon-ready mode, digits for discrete handling steps, `?` for the key table, Tab for a knowledge/map screen, C for the body/sheet, H for first aid.

---

## 12. Balancing objectives (DESIGN:804-806)
"Following alone is harder than spotting a tail" (the user, 2026-10-26: "it may make sense"). Guiding rule: **"the player's choices should count for more than the dice."** At equal skill the watcher wins three evenings in four. The lever held in reserve: count a second sighting only some time after the first.

## 13. Next, Queued, 0.2, Later, Open (DESIGN:808-864)
- **"The campaign is the game"** (the user, 2026-10-27). Order (Claude's): interiors (the user: "let's build a lot of interiors, like appartments … supermarkets etc, bakeries … going out the back should be a thing we do when inside and not abstracted"); landing = campaign; junior first tour; starters unlocked; **taxis hailed for real** (the user: "hailing a taxi should be fully animated, and only available when a taxi is close ? and they could be already busy and ignore us"); out of the window; **transit networks** (the user: "buses and trains would not drop you off anywhere, they would have a city network and stations"); time as currency.
- Then (the user, 2026-10-28): the embassy lives; money; clubs; telephones; the mind on Tab; belief; the Underground's map (the user: "The underground selection should be graphical with points of interest drawn on the map"); menus made for what they hold.
- **Queued** (2026-11-03 → 11-04): body armour; ranges and a firearms lesson; **years** (career time between postings, language school by FSI weeks, ageing, geopolitics timelines 2025-2075); disguises; **the investigation** (the user: "for hard crimes like murder, CSI will work in the background … (all of this investigation will be background chatter)"), deferred; support actions.
- **0.2: the deep postings** (the user, 2026-11-04): heavy kinetic missions (assassinations, extractions, abductions, sabotage, infiltration). The user: **"Obviously these missions I talked about are HEAVY changes, so queue that to the very end of your list and tell me before starting to work on it because it'll be staged as 0.2.x stuff, which I'll trigger only after we go through 0.2.0-RC validation."** Then: "split the work so you can move to 0.2.x work on a branch we will merge later". Then: "let's integrate kinetic missions to .2.0-RCs". Long rivalries (the user: "these postings should link to long running geopolitics … like decades long rivalry with a country").
- **Open questions** Claude left standing "till the user says otherwise": legend scrutiny on a brawl, the reach of disguises, who makes disguises. Also a failing heavy test ("a master feels them 4 times in 6, not every time"), documented honestly.

---

## 14. PLAYTESTS.md, in full

The file's own description: "What was played, how, what turned up and what was done about it: a dated log, newest first. **Claude plays as the player while the user's away** (scripted followers driving the real game in headless Chrome, and the sim at speed for the numbers); the user's own scores and notes go here too when they come." How to replay: `node tests/run.mjs tail` (`TAIL_N=100`), `node tests/run.mjs sdr` (bots in `tests/bots.mjs`), or the browser with `window.__tradecraft` (`?play=tail&seed=7`, `&autoplay`). The log stops at 2026-10-26; later user feedback lives in DESIGN.md and CHANGELOG.md quotes.

**2026-10-26, v0.0.30-31 (background game, follower, living crowd).** Played: 960 chases; a skill-vs-skill grid of 30 evenings per cell, bases 5-20 (**the user's ask**); being tailed 30 evenings per bot; a dozen browser evenings with pictures. Follower bugs fixed: stood still while he walked off; went back up a lane it had just come down; gave up on a man in a shop after 8 s; hung back a lamp's reach at night and lost him in the dark; dithered at zebras; overtook on a stale plan; closed on his face; stared through his checks; crawled behind strollers. World: **passers-by vanished mid-street (the user, on Windows)**; seated people sat beside their seats; a bench clipped a way. Being tailed: a crowd sharing lanes made every third civilian "a tail"; now only copied moves count. Open: the watcher wins 3 in 4 at equal skill; a covert team shows itself only to a player who tests it.

**2026-10-26, v0.0.24 (being tailed).** About 200 evenings at speed with three scripted players (oblivious, checker, pro), a handful in the browser. Fixed: watchers started too far back and lost walkers at night; they queued politely behind slow walkers (now they go round); repeated false "recognitions" of the same sitters (a face counts again only when both have moved); bots stalled at waypoints (0.4 m vs 0.6 m tolerance) and walked into lamp posts; T while sitting re-sat you. Still rough: a covert team is hard to spot on purpose (a hint added v0.0.25); no metro or cabs yet; watchers walk through lawns and cross anywhere.

**2026-10-26, v0.0.21-23 (perception, tail rebuilt, four sides).** About 400 evenings at speed plus a dozen in the browser. Fixed: a dimmed view drew a black street (a `clear()` name clash); night eye reach was too short, now **18 m + 34 m × light** (22 m dark, 34 m in a lamp pool, 50 m by day); shop-window reflection widened from 60° to 170°; the keep-sight roll every 4 s lost him to natural 1s on empty streets (now only with people round him); tying a shoelace mid-look was rewarded (now worse than nothing); the instinct flickered (lines now hold by tone, calm 7 s … urgent 2 s); lookalikes appeared from thin air (now from off-screen, about one run in three); the target stood in a bin; the instinct knew what you hadn't seen; leaving without him gave an unexplained "lost"; a statue crashed the page; bots had "no feet". Numbers: a naive tail is made 79-91 times in 100; a careful one sees the meeting 47-52; a trained one 53-63; lunch is hardest (about 4 in 10), dusk and night easiest (6-7 in 10). Still rough: he only turns north; shops not enterable for you; no traffic; the meeting is always on the same bench with the contact from the east; the free walk's lessons repeat.

**What the playtests teach:** most bugs were found by Claude playing the real game with bots and pictures, before the user saw them. Tests count numbers, not passes. "The instinct knows only what you saw" (no omniscient UI) is a recurring rule.

---

## 15. The user's decisions and complaints, by date (this slice)

| Date | Quote or decision (closely paraphrased where not quoted) | Area |
|---|---|---|
| 2026-10-25 | Rejected realistic and 3D-iso samples ("sniff test"). "pixel art 100%, but simple, almost 2D", Pokémon-like handheld RPG, big heads, near-invisible legs (few animations, freedom, scales easily) | Look |
| 2026-10-25 | Scores: camera 95, night 90, environment 80 ("tree needs work, things lack flair"), characters 35, front views "too boxy". Then "trees are fixed, characters are now a solid 70", "objectively, this would be a 90-95%" | Look |
| (Q3, Q155) | Stoneshard as the art and animation target, "if possible" | Look |
| 2026-10-26 | "I like the smaller figures, but the new environment" | Look |
| 2026-10-26 | "formalize where NPCs are going, pathfinding that works 100% of the time" | NPCs |
| 2026-10-26 | Following alone harder than spotting a tail: "it may make sense"; asked for the skill-grid sweep | Balance |
| 2026-10-26 | E tap = glance back; C = character sheet; stop killing screen brightness; old saves only "where it comes naturally" before 1.0 | Controls / method |
| v0.0.22 | Every side of the street leads somewhere | World |
| v0.0.33 | "why is the game not taking the whole window" | Presentation |
| v0.0.39 | "the top-down view is shorter than the left right … targets up and down are out of the field of view" (so the user calls the 45° view "top-down") | Camera |
| undated | "environments reuse exactly the same elements, please generate at least three more kinds of everything"; "Not a grid"; passers-by with "a destination in mind…"; the bubble; benches | World |
| 2026-10-27 | Campaign: "the onion that is Character life > Posting > Assignment generation with the mission types that we tested" | Structure |
| 2026-10-27 | Tests become hand-holding tutorials with a tutor, roleplayed instructions, earpiece, a directory; gate the tutorial behind the campaign; landing = character selection → apartment → phone call | Tutorial |
| 2026-10-27 | Hale's hearsay backstory; backgrounds give up to +4 ("an ex marine would know how to fight"); keybinds behind "?"; infocards "feel low quality, low tech too sharp and practical" | Flavour / UI |
| 2026-10-27 | Interiors: "a lot of multiroom interiors … going out the back should be a thing we do when inside and not abstracted"; real taxis; transit networks; "time should feel like a currency" | Scope |
| 2026-10-28 | T interfering as a universal key; asked for embassy life, money, clubs, phones, the Tab mind map, roleplay belief, a graphical metro map, menus made for their content | Controls / UI |
| rc21-rc30 | "took a taxi there, but there is no embassy?", "I can't find my flat", "I can't get inside the embassy?", "where is the door out of the flat", "the station is London, and we get thrown to Moscow … consistency" | Consistency |
| rc50-rc52 | No fast travel to work, home or missions ("it would skip all the gameplay"); "insane variety in mission descriptions" | Pacing / variety |
| 2026-10-31 | Read a book in 10-minute chunks; a dev-mode Tradecraft-95 character; "improve the character outline" | Time / art |
| 2026-11-03 | 0.1.0 validated: "this is Alpha 1 worthy". Then firearms in stop motion, "not a third person shooter"; many guns right away; scalable countries; ranges where legal; a firearms lesson; black market via dead drops; police heat; zoomed mind map; Legends replace the debug character; legend skills bug; "time passing … doesn't seem to recycle the NPCs"; aiming animations; char sheet refactor | Firearms / campaign |
| 0.1.6-0.1.13 | Guns rare ("acquiring one should be a whole thing"); specific calibres; G = intent; fumbles with consequences; muzzle discipline; "aiming should be necessary"; "EMBASSY METAL DETECTOR SHOULD RING"; free-walk gun to test; aim "more natural … but no list", only in the current frame | Firearms |
| 2026-11-04 | Booked tutorials; cover system; double/triple tap; knockdown and wound effects with adrenaline and fitness-based pain tolerance; moving bleeds more; scalp grazes; body armour spec; "my soft vest didn't seem to stop…"; reflex "spammed"; emergency calls, ETA logos, onlookers, shots with no victims; police stations, hospitals, clinics vs one big hospital, parked police cars; arrests without splash screen or reflex; half-frozen scenes; ghosts; spawning on top; hunts sized by incident; disguises; investigation as background chatter; phone services and burners; black market costs a LOT and can be a trap; support as a function of how "easy" the station is; clubs against rust; "it seems like we can only work on our russian ?"; 0.2 deep postings ("tell me before starting"), branch, then fold kinetic missions into the 0.2.0 RCs | Everything |

---

## 16. Lessons for running OLYMPUS's development with this user

1. **Find the look by samples the user scores.** Several small samples, numeric scores per aspect (camera, night, environment, characters), iterate on the lowest. The user knows what they like when they see it ("sniff test") and chose simplicity in figures with richness in environments. For OLYMPUS, start with 3-5 small samples of a Martian barracks interior, a Mars surface patch and a ship deck at different pixel densities, before the skeleton.
2. **Build each mechanic as a small scored test, then join.** Tradecraft's Q161 rule gave the user something to play every day, and the tests became the tutorial. The user's OLYMPUS brief asks for "functional test versions and a promotion script", which is this exact method.
3. **Use a play copy and promotion.** The user plays `.play/`, pinned to a release tag, and changes only through `tools/promote.sh` on their go. Claude owns PATCH numbers. The user declares RCs, validates minors, and owns 1.0. Mid-play patch requests are folded into the next patch. Never promote unasked. This carries straight over (with new ports, not 8090/8100/8101).
4. **Expect a stream of terse, quoted complaints and treat each as a design rule.** The user's playtest notes are short and often rhetorical ("I can't get inside the embassy?", "are all tails reading like this ??"). Each became a rule in DESIGN.md with the quote, the date and the version. Keep that habit: every system section opens with the user's words.
5. **Recurring dislikes:** abstraction where an action could be lived ("going out the back … not abstracted"); fast travel that skips gameplay; repetition ("three more kinds of everything", "insane variety"); inconsistency between modes; frozen or half-frozen states; NPCs popping in, vanishing, "ghosts", or being recycled when they shouldn't; omniscient UI; overlapping UI; UI that looks "low tech"; menus not made for their content; missing feedback such as a splash screen or a reflex chance before something happens to you.
6. **Recurring likes:** realism researched and cited (laws by country, RAND hit rates, NIJ armour levels, FSI language weeks); time as a currency where every skipped hour buys something; the character's subjective read instead of numbers; deep, stateful equipment (calibres, magazines, chambers, conditions); NPCs with real destinations and schedules; consequences scaled to skill (fumbles, muzzle discipline); rare, hard-to-get weapons.
7. **"My calls" are welcome inside the user's shape.** The user gives the shape and Claude fills in numbers and order, writing "my call" so they can be overruled. Explicit creative licence happens ("full creative license on assassination mission"). Big structural changes need asking first ("tell me before starting to work on it").
8. **Scale early.** "better to refactor now if needed than after we've added a million new features". Make content (factions, bases, ships, weapons, calibres) data-driven from the first version.
9. **Bots play the game.** AI-vs-AI autoplay through the real game in headless Chrome, plus sim sweeps, with tests that print the numbers. A PLAYTESTS.md log, newest first. The user expects Claude to have played before they do.
10. **Debug affordances from day one:** JSON save export and import, `window.__<game>`, a debug mode, a sandbox free-play with test gear ("give us a gun in free walk so i can test these things"), URL flags (`?gun`, `?armour=heavy`, `&city=`, `&autoplay`).
11. **The user uses AZERTY on a Mac** (also Windows). Read physical keys, document in AZERTY labels, keep `?` for keys.
12. **Cadence:** expect very fast iteration (tradecraft went from samples to Alpha 1 in about ten days, 56 RCs). Keep CHANGELOG entries player-facing, with numbers that moved.

---

## 17. Reuse assessment (tradecraft → OLYMPUS)

| Module | Verdict | Why |
|---|---|---|
| `src/sim/checks.js` (d20 + skill + mods vs DC; nat 1/20; opposed rolls, ties to player; every modifier carries a `why`) | **reuse as-is** | Pure, tiny, matches "RPG-like resolution of challenges". The log readability (`checkText()`) is what the user liked ("the roll lands in the log") |
| `src/sim/firearms.js` (gun state, magazines, chamber, condition, ACTIONS with times and DCs, pace, malfunctions, fumbles) | **adapt** | Pure sim and the best fit in the codebase for "guns played in detail". Swap the arsenal and calibres for Expanse-era and Martian weapons. Add low-G and vacuum effects (recoil reaction in micro-G, no sound in vacuum, suit gloves raising DCs and times) |
| `src/sim/shooting.js` (stop motion, aim timing, shot DC formula, taps, bursts, wounds, strays, muzzle discipline) | **adapt** | The user explicitly wants shooting "as in tradecraft". It is coupled to street perception, crowd and police, so extract the core |
| `src/sim/cover.js` (cover table, stance shares, get-down action) | **adapt** | Generic geometry plus a table. Re-table for bulkheads, crates, consoles, rover hulls |
| `src/sim/gunwork.js` (table work: clean, load, unload, fill, recondition, fumble consequences) | **adapt** | Maps directly to armoury and barracks weapon maintenance |
| `src/sim/paper.js` + `scenarios/range.js` + `tutorial/range.js` (range lesson, range safety, scoring groups) | **adapt** | Near-ready basic-training qualification range and muzzle-discipline enforcement |
| `src/sim/armour.js` | **adapt** | Layered model is sound. Add powered and EVA armour, pressure integrity and breach |
| `src/sim/health.js`, `medicine.js`, `wounded.js` (parts, bleeding, blood thresholds, pain, adrenaline, knockdown, mobility, exertion) | **adapt** | Strong base for "medical aid and healing". Add hypoxia, decompression, G-LOC, low-G atrophy and radiation. Other notes cover these modules in depth |
| `src/sim/reflex.js` (time stops for sudden reactions, answers remembered for 2 min) | **adapt** | Good pattern for ambushes and breaches. Keep the anti-spam memory |
| `src/sim/tutorial/earpiece.js` (beats and steps queue, read-time pacing 3.5 s + 1/3 s a word) | **reuse/adapt** | A drill instructor or squad lead on comms. Generic and pure |
| `src/sim/training.js`, `rust.js`, `fitness.js` (hours to a point, rust, effective fitness) | **adapt** | Directly serves daily training, PT, "time as a currency". Re-tune for military drill |
| `src/sim/reading.js` (time skip in 10-minute chunks) | **reference** | The pattern for skippable activities (showers, meals, sleep) with a splash and fast-forward |
| `src/sim/interiors/staffing.js` (NPC shift schedules in a building) | **adapt** | Barracks, mess and ops-room routines |
| `src/sim/crowd.js` (bubble, never pop in view, recycle after 120 s skips, keep casualties) | **adapt** | The surface-crowd layer the brief asks for. Concourse or hab-ring geometry differs |
| `src/sim/city.js`, `agents.js` (A* on a walk graph, off-screen agents by the clock, follower) | **adapt pattern** | The "background game" is exactly OLYMPUS's need (NPCs with lives off-screen). The street-row graph is specific; rebuild for decks, levels, airlocks |
| `src/sim/belief.js` (the character's read in words with confidence) | **adapt** | The user wants roleplayed uncertainty. Fits air, suit, health and enemy estimates |
| `src/sim/dossier.js` (brief variety: paragraph pools dealt per person) | **adapt pattern** | Orders and briefings variety ("insane variety") |
| `src/sim/cities/*`, `src/sim/countries/*` (data profiles, accessors) | **reference pattern** | Rebuild as factions, bases, ships and bodies. Keep "one file per thing" |
| `src/sim/emergency.js`, `onlookers.js`, `services.js` (calls, ETAs, cordons, medical facilities) | **reference** | Civilian content. The medical pipeline and hours-in-bed logic are worth copying |
| `src/sim/armed.js`, `police.js`, `hunt.js` | **reference only** | Civil policing. OLYMPUS might need MPs or habitat security; borrow "only able NPCs act" and "never spawn in view" |
| `src/sim/geopolitics.js` (procedural timelines) | **reference** | Possibly for the Mars-Earth-Belt political backdrop; others cover it |
| `src/art/pixelart.js` (pixel stage: ortho 45°, 16 px/m, palette snap, part-ID outlines, toon light, lamp pools, weather) | **adapt** | The look the user scored 95 for the camera. Depends on three.js. OLYMPUS is "mostly top-down at different scales", so the projection may change. The OKLCH palette generator with hue shift and the palette snap are reusable as methods |
| `src/art/sprites.js` (role-letter templates, ramps, rule shading, poses at 8 fps, gun rig) | **adapt** | The best asset pipeline for many soldiers in varied kit (a new helmet animates for free). Needs new parts (helmets, armour, EVA suits, packs, rifles), possibly larger cells for "high-resolution" |
| `src/art/doll.js` (close figure at 2× resolution, wounds, pockets on clothes) | **adapt** | The high-res close-up for body, kit and wounds. Fits hygiene, wounds and loadout screens |
| `src/art/furniture.js`, `src/sim/interiors/*` (67-piece furniture kit, seeded layouts), `src/render/cutaway.js` (dollhouse cut, `CUT_H 1.0`) | **adapt** | Cutaway interiors are the right read for ship decks and habs. Needs a new kit (bunks, lockers, galley, showers, consoles, airlocks) |
| `src/render/view.js`, `town.js`, `crowd.js` | **reference** | Street-specific. Instanced crowd and "light slots never change count" are good performance patterns |
| `src/art/arabic.js` | **skip** (or reference for a constructed script) | Not needed unless Belter creole or Martian signage gets its own script |
| `src/ui/input.js` (physical keys, layout map, AZERTY labels) | **reuse as-is** | Generic, small, the user's keyboard |
| `src/ui/plaque.js` (pixel-alphabet enamel plaques, 5×5 glyphs) | **adapt** | The user rejected browser-text labels. Re-icon for military markings |
| `src/ui/mind.js`, `pockets.js`, `body.js`, `style.css` (dark glass vs paper, mono and typewriter type) | **adapt** | Art direction the user asked to match. Paper becomes orders and forms; dark glass becomes the suit or terminal HUD |
| `tools/release.sh`, `tools/promote.sh`, `play.sh`, `tools/serve.py` | **adapt** | The user named the promotion script explicitly. Copy the logic with new ports and names; never run tradecraft's copies |
| three.js vendored stack | **decide** | Useful only if OLYMPUS keeps a 3D-to-pixel pipeline. The user allows other tech |

---

## 18. Open questions this slice raises for OLYMPUS
- Pixel density: is "high-resolution pixel art for close-up gameplay" more pixels per metre than tradecraft's 16 px/m and 28 px people (e.g. 24-32 px/m), or tradecraft's density plus a 2× close figure? The user liked the *smaller* figures in tradecraft.
- Projection: tradecraft's "top-down" is a 45° orthographic three-quarter view that the user called top-down. Does OLYMPUS keep that oblique for close-up, with true top-down for tactical and telescope scales?
- Shooting: stop motion as in tradecraft (X mode, digit steps, pointing to aim), with NPCs in real time? Or should OLYMPUS's military ground combat need squad commands in the same pause?
- Muzzle discipline: should OLYMPUS enforce it everywhere (barracks, transport, squad) the way the range lesson does, with consequences such as an NCO's reprimand or loss of weapon?
- Saves: autosave-only "for continuing, not undoing", no difficulty settings, debug manual saves. Is permadeath still wanted for a career soldier, with a world that carries on to the next character?
- Mars sol clock: tradecraft's time is ms since 2026-01-01 Moscow at 20 Hz. OLYMPUS needs a sol calendar (24 h 39 m 35 s) and possibly ship time. How are they shown on the HUD under the "clock only if you carry one" rule?
