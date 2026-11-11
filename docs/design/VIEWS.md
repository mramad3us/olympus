# VIEWS: what the player sees, hears and presses

Section of the OLYMPUS design, written 2026-11-05; revised 2026-11-06 for v0.0.2 as built (the camera's held axis and pixel-snapped lead, the people atlas's budget shared with TECH, the log's `LOG_MAX` 1,500, the perf test on CONTRACTS §7's rows), for v0.0.3 as built (the barracks and the base on the stage: the look at 16 px/m, light, the fog on 0.25 m cells and the view's memory, the see-through, the HUD, the sound; the build sheet `docs/build/0.0.3.md`), for v0.0.4 as built (the frames, the towel and the body's cues on the sprite, the doll's first cut, the splash and its vignettes, the outcome strip, the instinct line and the folded strip, PERSONNEL, the new glyphs, R and T as press keys, the world's sounds; the build sheet `docs/build/0.0.4.md`) for v0.0.7 as built (2026-11-07, the build sheet `docs/build/0.0.7.md`: the far window §2.4, the KD faces and blood §2.12, the sitting, hurt and aid frames §3.6, the plaque at distance, the terms plate and the weapon card's turrets §7.4, the far states and PAPER on the KD §7.5, the dial keys §10.2, the range's sounds §11.3) and for the user's rules of 2026-11-05: places are handcrafted and the same in every career, and every person is generated, so the names in this section's examples (Okafor, Reyes) stand for whoever the roster drew. It obeys `docs/DESIGN.md` (the hub wins where they disagree). Sources: the research notes in `docs/research/` (chiefly `tradecraft-art-render.md`, `tradecraft-design-3.md`, `longhaul-visuals.md`, `tradecraft-sim-world.md`) and the screenshots in `docs/research/shots/`. Paths into the two older games are relative to `../tradecraft/` and `../longhaul/`, both read-only. Revised 2026-11-07 for COMBAT §5's suppression and hardening (DESIGN.md's log of that day): four pose sets (§3.4), the hit marks' one helper (§4.2), the chaos and the flash in the picture (§7.3), the FROZE stamp and the marked rows (§7.4), the hit card (§7.7), hardening on C (§8.2), the mix under the chaos (§11.2), reduce flashes (§12), and §18's question 20 restated, 21 and 22 new.

This section owns: the pixel stage (density, camera, light, palettes, cutaways, occluders, the fog of awareness), figures and their frames, the close figure and the weapon card, the splash's look (TIME owns its behaviour and every duration), instruments as in-world screens, the HUD and its layout, the body strip, sheets and cards, inventory by load-bearing gear, the mind, the log, papers and the chapter's day card, menus, plaques and fonts, the full controls table, audio direction with the sound gallery, and accessibility. It does not own what these show: the data comes from the other sections (cross-references in section 17).

---

## 1. The model in one page

- **One world picture, one look.** Close play is tradecraft's pixel stage, ported: an orthographic camera looking north and 45° down, simple 3D geometry (boxes, ground planes, upright cards) painted by code at a fixed density, outlined from a part-ID pass, toon-lit from the upper left, every pixel snapped to one generated palette, scaled to fill the window with sharp-bilinear upscaling. The user scored this camera 95/100 and its night 90/100 (tradecraft, 2026-10-25).
- **Density is one constant.** `PX_PER_M` is 16 (candidate A, picture 640×360) or 24 (candidate B, 960×540). Both show the same 40 m × 22.5 m of ground, so gameplay distances do not change with the pick; only the grain does. A forces chibi figures (taller figures would have 8 px heads, or be giants beside the doors); B carries either chibi or life-proportioned figures at life size and makes a magazine, an optic and a face readable on a sprite. The user picks by scored samples (section 2.3).
- **Figures are paper-doll templates** composed per frame from parts in role letters (tradecraft's `sprites.js`), so a new helmet, suit or pouch animates in every frame for free. OLYMPUS adds about 170 frames to tradecraft's 38 (each painted only for whichever look needs it): carry postures, reloads, stances, drill, PT, low-g bounds, zero-g floating and tumbling, couches, racks, the shower curtain, casualties. Frames follow the sim, never a clock of their own. Bodies are painted as role indices and shared by everyone dressed alike; colours and heads are per person (section 3.7), and every member of your squad differs from the others in at least two ways that read at sprite size (section 3.9).
- **The close figure** (the doll) is drawn at double density (its pixel is half the stage's on screen) and shows the body, the kit on it by container, wounds, care and the suit. The **weapon card** draws the gun at the same density, so the selector, the magazine and the ejection port read, as far as the character knows them.
- **Light is the sim's light.** One helper gives both the picture and the dice their light. Moods: Mars day, golden hour, the canyon-rim dusk, a long twilight, a moonless night, dust storms by optical depth, ship normal and ship's night, battle red, emergency amber, blackout, a dead compartment in vacuum, fire, Europa's under-ice towns, Europa's surface, airless rock.
- **The fog of awareness** dims and freezes what the character does not perceive, drawn from the same visibility function the rules read. Helmets, vacuum, smoke and darkness change it.
- **Time skips show as a splash**, in TIME's two forms, timing and engine (TIME §6): the stage itself zooms close on you at the appliance, an iris closes round the scene, the action's vignette plays, the clock runs fast and the light moves with it, outcomes accrue as the clock runs, the outcome strip lands and the world opens again. Interrupts stop it at their second. Big outcomes (an arrest, a knockdown) get an outcome splash with a reflex card first.
- **Higher scales are honest instruments**: LONGHAUL's Canvas2D displays (tactical, planetary, system, threat board, telescope), drawn crisp at device resolution inside pixel-art bezels, on screens that exist in the world, showing only what that screen could know, live (they do not pause the game). Each one informs a decision the marine makes, in the milestone it arrives (section 6.10).
- **The HUD is diegetic and minimal**: a watch only if you carry a terminal, three log toasts, the instinct line with the NCO's radio box above it, `? keys`, and, with a helmet sealed, the suit's readouts in the watch's place. Every element owns a reserved rectangle per state, and nothing is drawn over another (section 7.5). The body shows as a strip of pictograms filled to their felt bands, never as numbers (section 7.6). Everything else is a card on dark glass (which pauses) or a paper.
- **Controls** are tradecraft's, read by physical key and labelled for the user's AZERTY keyboard, plus eight new keys: stance up, stance down, carry posture, the suit, the light, the radio, orders and signals, and the terminal.
- **Sound** is synthesised in WebAudio from nothing: footsteps by surface and gravity, gunshots shaped by the air's pressure and muted to body conduction in vacuum, the ship's hum and its silence when coasting, alarms, bugle calls, radio clicks, the platoon's cadence calls. Every meaningful sound is also captioned. Sounds are scored by the user in a sound gallery, as the look is (section 11.5).

---

## 2. The pixel stage

### 2.1 Projection and picture

Ported from `tradecraft/src/art/pixelart.js` `pixelStage()` (lines 177-483), with the constants below.

| Constant | Value | Meaning |
|---|---|---|
| `PX_PER_M` | 16 (A) or 24 (B) | pixels per metre along the ground, up a wall and across. The only density constant; everything reads it |
| `RES` | `[640, 360]` (A) or `[960, 540]` (B) | the picture at 16:9 |
| `VIEW_HALF_M` | `[20, 11.25]` at 16:9; at most `[24, 13.5]` | half the ground the picture shows. On a window of another shape the longer side grows up to the maximum, then borders appear |
| `RES_MAX` | `2 × VIEW_HALF_MAX_M × PX_PER_M`: `[768, 432]` (A), `[1152, 648]` (B) | |
| Camera | orthographic, looking straight north, tilted 45° down | `left/right = ∓RES[0] / PX_PER_M / 2`, `top/bottom = ±RES[1] / PX_PER_M · √½ / 2`, near 1, far 200, placed at `target + (0, 60√½, 60√½)` |
| Pixel snap | `x = round(x × PX_PER_M) / PX_PER_M`, same for z | nothing shimmers as the camera moves |
| Blit | sharp-bilinear to any window size | every picture pixel a solid square, the edge between two blended over one device pixel (`pixelart.js` L401-414). The user (tradecraft v0.0.33): "why is the game not taking the whole window" |

Because a metre of ground and a metre of wall both project to `PX_PER_M` pixels, tiles and walls come out square, as in a 2D game, while the renderer keeps real depth for outlines, shadows and the fog. The camera never rotates: north is up, the sun's art direction is the upper left, and every sprite and texture is shaded for that.

On common displays the stage pixel measures (device pixels per stage pixel):

| Display | A (640×360) | B (960×540) |
|---|---|---|
| 1920×1080 | 3.0 | 2.0 |
| 2560×1440 | 4.0 | 2.67 |
| MacBook Pro 16″ at default scaling, 3456×2234 | 5.4 | 3.6 |
| MacBook Air 15″, 2940×1912 | 4.59 | 3.06 |

### 2.2 The two density candidates, and what each means

Both candidates show the same 40 m × 22.5 m. What changes is how many pixels a metre gets, and therefore what can be drawn on a person.

| Thing (real size) | A: px at 16 px/m | B: px at 24 px/m | What reads |
|---|---|---|---|
| A marine standing, 1.80 m | 29 | 43 | both |
| Door, 2.0 m | 32 | 48 | |
| Deck height, 2.4 m | 38 | 58 | |
| Rack, 0.9 × 2.0 m | 14 × 32 | 22 × 48 | |
| Rifle, 0.85 m | 14 | 20 | both: carry posture and muzzle direction |
| Carbine, 0.70 m | 11 | 17 | |
| Pistol, 0.20 m | 3 | 5 | A: a dark tick. B: a pistol |
| Rifle magazine, 0.19 m | 3 | 5 | A: present or absent only if drawn bigger than life. B: in or out at a glance |
| Optic, 0.15 m | 2 | 4 | B only |
| Helmet, 0.28 m | 4.5 (chibi heads are oversized anyway) | 7 | both |
| Plate, 0.30 m | 5 | 7 | A: a slab. B: slab plus three separate pouches |
| Suit life-support pack, 0.50 m | 8 | 12 | both |
| Grenade, 0.10 m | 2 (drawn 3) | 2.4 (drawn 3) | both, drawn bigger than life |
| 5.56-class case, 0.057 m | under 1 (drawn 1 px glint) | 1.4 (drawn 2) | both as glints |
| Selector lever, 0.015 m | 0.2 | 0.4 | neither: the weapon card only |

**The proportion coupling.** Tradecraft's chibi figure is life-size in height (28 px at 16 px/m is 1.75 m) with a 12 px head, so it fits doors, beds and benches drawn to scale. A figure with taller proportions at life size under A would have an 8 px head: eyes of one pixel, no expression, a helmet that reads as a cap. Making it readable means drawing it about 1.4 times life size (40 px, like tradecraft's sample 007), and then it stands 2.5 m tall beside a 2.0 m hatch and overflows a 2.0 m rack. Under B, life size is 43 px, which carries either a chibi (18 px head, 2.4 heads tall) or a realistic 3.6-heads figure with a 12 px head and two-pixel eyes. So:

| Variant | Figure | Head | Heads tall | Cell (w × h px) | Fits the world at life size |
|---|---|---|---|---|---|
| A-chibi (tradecraft's pick) | 29-31 px with helmet | 12 × 12 | 2.4 | 32 × 36 | yes |
| A-tall | 29 px | 8 × 8 | 3.6 | 32 × 36 | yes, but faces are two pixels |
| B-chibi | 43-45 px with helmet | 18 × 18 | 2.4 | 48 × 54 | yes |
| B-tall | 43-45 px with helmet | 12 × 12 | 3.6 | 48 × 54 | yes |

A long cell for lying and floating frames is `[1.5 × cell width, 0.66 × cell height]`: 48 × 24 (A), 72 × 36 (B). Cells carry 2 px of padding each side (tradecraft's `PAD`), for a muzzle or a held-out arm.

**Cost.** The post shader runs on 230,400 pixels (A) or 518,400 (B). Tradecraft's palette snap is a loop over the palette in the fragment shader: 26.7 M colour distances a frame at A, 60.1 M at B. OLYMPUS replaces it with a lookup texture (section 2.5) under both. Draw calls depend on what is in view, not on density, so they are the same. Texture memory for painted surfaces grows 2.25× under B; the sprite atlas grows 2.25× per look and per head (section 3.7). Under B, a 1080p screen shows each stage pixel as 2 device pixels, which is fine-grained but still unmistakably pixel art.

**The user's pick: A, with chibi figures** (the look round, scored 2026-11-06: every star on 16 px/m chibi, 80 for it against 65, 55 and 30 in the squad bay; §2.3). So the table's A column is the game: a magazine, a pistol and a grenade are drawn bigger than life where they must read at a glance, and the weapon card carries the optic and the selector. **Bigger than life, as built in v0.0.3**: a wall clock's dial is drawn `DIAL_PX_MIN` 9 px across (`src/art/kit/structure.js` `dialPx`: 0.56 m at 16 px/m, where a real 0.30 m dial is 5 px and its hands were a smudge, the review), a wall dial keeping the life-size dial's middle, with a three-pixel hour hand and a four-pixel minute hand. What follows is the recommendation the round overruled, kept for the record. **My recommendation** (my call, the user decides): B, because the user's brief asks for "High Resolution Pixel Art for close up gameplay" (2026-11-05), and because under B a sprite tells you whether a rifle has its magazine and where its optic is, which serves pillar 2 ("the gun is a machine") without a single extra UI line. A keeps tradecraft's proven art and twice the performance headroom.

### 2.3 Choosing: the look round

Tradecraft's method, which the user used to pick its look (2026-10-25 to 10-26): numbered samples in a gallery, scored per aspect, with ★ picks and "Copy my picks" (`tradecraft/tools/gallery.mjs`, `samples/index.html`, `sample.json`). OLYMPUS's first art round scores density and proportion with the least that answers the question. It shipped with the engine in v0.0.1 (CHANGELOG; `samples/look/`), and the round below is what shipped, which replaces my first plan of three Mars scenes and two swatches (CONTRACTS §19, item 6). Five scenes, each a **2 × 2 of density by figure**: 16 px/m (A) or 24 px/m (B) by row, chibi or soldier figures by column (the soldier is §2.2's tall figure; the gallery's own labels letter the figures A and B), the four pictures of a scene differing in nothing else:

| Scene | What it tests |
|---|---|
| L1 The squad bay at reveille | 13 marines getting up: racks, wall lockers, footlockers, the overheads on before the sky is light, the fire watch at his desk |
| L2 The head in the evening | a shower behind its drawn curtain, the wet head above it, steam, the fogged mirror (zoom 2, the shower's splash) |
| L3 The mess hall at noon | 25 people: the queue to the serving line, cooks in whites, diners at the tables |
| L4 The valley floor in vac suits | a walk and the low-g bound, by day and again in a τ 4 dust storm with the fog of awareness (two 2 × 2s) |
| L5 A frigate's deck 5 at battle stations | strapped into a crash couch under battle red (zoom 2, the couch's splash) |

That is 24 views: four for each scene and eight for L4. Each is shot at 3× and brought back with point sampling, kept as PNG at 2× (tradecraft lesson: JPEG thumbnails blur pixel art). The user stars views, scores each out of 100 and writes a note for each scene; "Copy my picks" tallies the stars and mean scores by density and by figures. Until the pick, code takes `PX_PER_M` from one module, `src/render/scale.js` (TECH §1.3; `?ppm=16 | 24` in the URL, `?density=` accepted as an alias), and the cell size beside it, so the pick is an edit of one line plus the template set it selects.

**After the pick** the variants not chosen survive only as the gallery's PNGs and their scores, and their templates are deleted (git keeps them), so no sprite is drawn four times after the round (my call; it replaces "every template is kept per variant").

**The pick** (the user, 2026-11-06): **A-chibi, 16 px/m at 640 × 360 with tradecraft's 2.4-heads figure.** The user starred the 16 px/m chibi view of every scene (six of six) and no other; the squad bay's scores were 80 (16 px/m chibi), 65 (24 px/m chibi), 55 (24 px/m soldier) and 30 (16 px/m soldier); by row 16 px/m took 6 ★ and 24 px/m none, by column chibi took 6 ★ (mean 73) and the soldier none (mean 43). `DEFAULT_PPM` is 16 and the soldier's templates go; `?ppm=24` stays a test parameter while it costs nothing (figures and surfaces are painted by code at either density), and nothing is made or tuned for it from now on (my call).

**Built in v0.0.3**: `DEFAULT_PPM` is 16 (`src/render/scale.js`, its header citing the pick), and New career, `./play.sh` and `?bench=` open at it. The soldier figure is deleted (`src/art/figures/body.js` exports the chibi, `bodyOf(ppm)`), and `?prop=` with it; the live sample pages draw the chibi only. `samples/look/sample.json` carries `frozen`, a key `tools/gallery.mjs` respects by never reshooting the sample, so the round's PNGs of both figures and the user's scores stay as they were scored (my call).

### 2.4 Camera

**Follow and the eye-lead.** The camera follows the player's interpolated position and leans where the eyes go. The user (tradecraft v0.0.39): "the top-down view is shorter than the left right … targets up and down are out of the field of view". The frame is 40 m wide but only 22.5 m deep, so the lean is larger north and south.

| Situation | Lead east-west, north-south (m) | Notes |
|---|---|---|
| Standing | 0, 0 | |
| Walking | 1.0, 2.5 | toward the heading (tradecraft `LEAD_M`) |
| Running or bounding | 1.5, 3.5 | (my call) |
| Looking (E held) | 1.5, 8.0 | toward the eyes' heading |
| Weapon mode, a target aimed or bracketed | centre at 0.55 of the way from the player to the target | clamped so the player stays at least `EDGE_KEEP_M` 2.5 m inside the frame's edge (my call) |
| A conversation | centre on the midpoint of the speakers | |
| Interior or deck that fits the frame with 1 m to spare, on an axis | held on that axis, centred on the area's extent on screen, its north wall standing above its line included (tradecraft `INTERIOR_CAM_M`; per axis and the wall counted as v0.0.2 builds it, my call) | the test rooms fit north to south and are followed east to west |
| Interior or deck larger than the frame, on an axis | followed on that axis with lead, clamped so the frame stays within the area's extent on screen plus 2 m | the darkness beyond shows little |

The lead eases with a time constant `LEAD_S` 0.35 s, critically damped. The lead is snapped to the pixel grid before it is added and the position after it, so once the lead settles you stay on one screen pixel (v0.0.2: you flipped between two each frame before). While time stands still everyone is drawn where the sim has them, so the figure, its stride and the camera stand still too (v0.0.2's fix: they shook by a step at 20 Hz). People are never interpolated across a jump of more than `JUMP_M` 1.5 m (tradecraft; the user, 2026-11-04: "NPCs streak accross the screen when they spawn").

**Zoom.** Play is always at zoom 1. The splash zooms to 3 (one stage pixel becomes three; 13.3 m × 7.5 m in view). A zoom is a crop of the picture, still rendered at zoom 1, blitted larger through the same sharp-bilinear filter, so it can ease continuously and the art stays square pixels at every step (my call: cheaper than re-rendering, and rendering a smaller area would only magnify the same texels). The stage never zooms out: art painted at `PX_PER_M` would alias, and things further away do not get smaller in a top-down picture anyway.

**The far window** (my call). Marines fight and qualify at 100 to 500 m; the frame reaches 20 m east-west and 11 m north-south of its centre. When the player aims at, brackets or looks (E held) at a point that is in sight (the fog says so) but outside the frame, a round inset opens at the frame's edge along the bearing: a second orthographic view of the stage centred on that point, at the same density, through the same post pass and the same fog.

| Constant | Value |
|---|---|
| `FAR_R_PX` | 0.22 × `RES[1]`: 79 px (A), 119 px (B) radius, about 4.9 m of ground either way at 4× (19.75 m at 1×: v0.0.8, below) |
| Anchor | on the frame's edge along the bearing from the player, inset 4 px; the player stays in the main frame. Placed by the labels pass against the HUD's rectangles (section 7.5): where the bearing meets a rectangle, the window slides along the edge to the nearest free place and a 3 px tick on its ring points along the true bearing |
| Frame | a 1 px ink ring and a 3 px pixel bezel; with an optic, the optic's reticle in its colours (WEAPONS gives the reticle) and the optic's field instead of 4.9 m when narrower |
| Fog | its own 24 × 24 cells of 0.5 m round the far point (2 m at 1×, from v0.0.8), from the same perception function |
| Plaque | what and how far: "TARGET 6 · 200 M" or "MOVEMENT · 340 M" |
| Opens and closes | a 0.2 s Bayer dissolve, never a pop |
| Max distance | the eye's reach from perception (PEOPLE), out to `FAR_LOAD_M` 600 m: line of sight and the fog's reach come from PLACES's static index, and the one chunk under the far point is built with priority before the dissolve starts (PLACES §2.4, TECH §9.9); nothing else is streamed toward 600 m |

Magnification in a top-down picture does not change pixel size: **this sentence is overruled by the user (2026-11-07: "when at 300m, with the scope at 1x, the view still shows the target zoomed in, just without the haircross"); the SO-4's lever is a real magnification in the window, as built in v0.0.8 below.** As first written, an optic changed what the eye resolves there, so it lifted the fog inside the window (perception's reach with the optic's factor) and narrowed the window's field (the fog's lift and the field still follow the lever, now through the scale). Tradecraft's rule (the user, 2026-11-03: "we should only be able to aim at things in the current frame") holds with the far window counted as part of the frame while open.

**As built in v0.0.8: the lever is a real magnification in the window** (`src/render/far.js` `farSpanPx`, `farPpm`, `farRadiusM`, `farLensK`, `farReticleK`, `farBracketPx`, `OPTIC_S` read through `sim/arms/look.js`; the user's report above; TECH §9.9 has the cost and the pass). At 4× the window is drawn at the stage's density (16 px/m: the face resolved, the holes, the spotter and the disk, the reticle). At 1× it is drawn at a quarter of it (4 px/m, the magnification's ratio), covering four times the ground across (`farRadiusM`: 4.94 m either way at 4×, 19.75 m at 1×). The face is 8 px with its holes and the disk's digit not resolved (an arcminute at 300 m is 0.7 px); the neighbours' faces and the berm are in view; there is no reticle; the fog is lifted only by the eye's reach. **The lever sets the window's scale, not the range**: a KD face (drawn `FACE_K` times life size) is 32 px at 4× and 8 at 1× at 200 m as at 300 m; range changes only the fog, the field and the reticle's mil spacing. **Moving the lever eases the whole window between the two over `OPTIC_S` 0.5 s** (smoothstep in the log of the scale: 4.00, 3.27, 2.26, 1.50, 1.26, 1.00 every 60 ms), never a pop; a window that opens takes its scale at once. Every part follows the scale while it eases: the fog's lift mixes the eye's reach and the scope's by `farLensK` (0 at 1×, 1 at 4×), refilled in `FAR_LENS_STEPS` 32 steps; the reticle fades in from 2× to 4× (`farReticleK`), dithered through the dissolve's Bayer threshold; the field and the mil spacing follow the window's density; the fog box follows too (24 cells of 0.5 m at 4×, of 2 m at 1×, 8 px a cell either way, swapped to 0.5 m cells at the ease's end). **A far face's brackets** are the face's size plus a margin growing to `FAR_BRACKET_PAD_PX` 4 at 1× (`farBracketPx`: 32 px at 4×, 12 round the 8 px face at 1×). **How the 1× picture is drawn** (my call): rendered at the stage's density over the wider ground, each window pixel the average of the 4 × 4 under it, the point snapped to 0.25 m (TECH §9.9). The fog, the reticle and the brackets easing with the scale is the verifier's finding of 0.0.8 (at night the fog went black or lit in one frame, as in v0.0.7), my call. The wind flag at x 1,595 is seen in the 1× window but not in the 4× one (about 4.9 m round the face at x 1,601: PLACES §4.12).

**Shake.** Tradecraft's fight jolt (1-3 px for 4 ticks) stays. OLYMPUS adds: your own rifle shot 2 px for 2 ticks (1 px as first written; 2 from v0.0.5, below); an explosion within 30 m, 2-4 px decaying over 0.5 s; a hit on the hull you are in, by the hit's energy (COMBAT gives it), 1-6 px over up to 1 s. G onset never shakes the camera (the body tells it, section 7.3). Shake can be turned off (section 12).

**As built in v0.0.5** (`src/render/lead.js`, pure; `aimLead`, `fxMsOf`, `SHOT_SHAKE_PX`; the constants `AIM_LEAD_K` 0.55, `EDGE_KEEP_M` 2.5, `FRAME_HALF_M` 20 × 11.25 in `src/sim/arms/look.js`, shared with the shot role's `targetsOf`). **The weapon mode's lead**: with a target bracketed or aimed, the frame's centre goes 0.55 of the way from you to it, each axis clamped so you stay 2.5 m inside the frame's edge, eased as the walk's lead is (`LEAD_S`); so the card at 25 m comes into the picture at 16 px/m and you stay in it. **A target is in the frame when bracketing it would show it** (the build sheet 0.0.5 §8 item 26): that is the frame `targetsOf` counts, so the card is aimable from the line; at `?ppm=24` it waits for the far window. **Your own shot shakes the picture 2 px** for 2 ticks of game time, back along the bore (my call, the design review's: 1 px at 16 px/m did not read as a shot), on the game's clock, so stop motion holds it. The arms' effects are drawn at the positions' own time (`fxMsOf`: a tick behind the clock, so a shot stamped at its tick's start is seen; the runtime review's, where the flash fell in a tick never drawn).

**As built in v0.0.7: the far window** (`src/render/far.js`, drawn by the stage; `src/ui/hud/layout.js` `placeFar`, `farTick`, placed by the hud; `shooting.js` `farPointOf`; the build sheet 0.0.7 §8 items 20 and 25, the fixer's 38 and 39; my calls unless marked). It opens **on aim, on bracket, and with E held on a KD line** (your own face), on a far point in sight outside the frame.
- **The place** (`placeFar(w, h, state, { bearingRad, rCss, k, frame, from, label })`): a disc of `FAR_R_PX` 79 px at 640 × 360, inset 4 px on the frame's edge along the bearing, **slid along the edge round every HUD rectangle** (in 2 CSS px steps) with its stack, the label ("TARGET 8 · 300 M") and the plaque and terms plate, kept free (below it, above it or beside it on the frame's side); hidden when nowhere is free. When slid, `farTick` puts a 3 px tick on its ring along the true bearing. 432 placements at four window sizes, none meeting.
- **The picture**: a second orthographic camera of the stage's, the same 45° and density, centred on the far point, into a target of its own through the stage's own post program (the same outlines, eye, grade and palette snap), with **chunks of its own** round the point (the stage's are built round the camera only), the pieces that reach into it included, and **prebuilt** at the range's entry for the KD's target line (TECH §9.9).
- **Its fog**: 24 × 24 cells of 0.5 m round the point, from perception's visibility as far as perception reaches (about 54 m by day), and **beyond 54 m by the open air's law** (my call: perception stops at 54 m, which the range's 300 m outruns): a daylight eye sees `FAR_LOAD_M` 600 m on the open valley floor, at night the light's share of it, **×4 at the SO-4's 4×** (`OPTIC_FOG_K`: the optic lifts the fog inside the window).
- **The frame**: a 1 px ink ring and a 3 px bezel; with the SO-4 up, **its reticle at the face's scale**, centred on the face as drawn and offset by the hold, so the point held is where the wires cross (0.5 mrad ticks; a mil at 300 m is 0.3 m, 9.6 px at 16 px/m with the face twice life size), and the optic's 6.5° field at 4× where it is narrower than the window, black beyond.
- **It opens never a pop**: only once every chunk under the point is up, then a **0.2 s** Bayer dissolve in, and out the same way.
- **A target outside the frame leads the camera at most `FAR_LEAD_M` 3 m** (`render/lead.js`; the fixer's): the far window is its frame. **After a rapid string the window holds on your own face** until its holes have been up `FAR_MARK_HOLD_S` 6 s, so the string's marks are seen (the design review found them marked with the window closed).
- **Cost**: nothing in frame time at 1600 × 900 (16.7 ms median and 16.8 ms p95 with the window open on the 300 m string; the `range-far` bench, ROADMAP §2.2); it adds one shader program, its composite.

### 2.5 The frame, pass by pass

`src/render/stage.js` (port of `pixelStage`), with three changes: part IDs written by multiple render targets in the colour pass, the palette snap by lookup texture, and the body veils.

1. **Shadow map**, only when flagged: the shadow camera steps in whole-texel steps of about 2 m, and nothing that moves casts a sun shadow (people have blobs). Tradecraft took draw calls from 962 to 333 with this.
2. **Scene pass** into a render target with two colour attachments (three.js `WebGLRenderTarget` with `count: 2`) and a depth texture: attachment 0 the lit colour (HalfFloat), attachment 1 the part ID (`(id × 2654435761 >>> 8) & 0xffffff`). This drops tradecraft's separate ID pass, which doubled every opaque mesh's draw calls (my call; the research note proposed it). Meshes flagged `noId` (blobs, glass, thin rails) write ID 0 with depth off. The crowd's instanced cards write their ID from the same alpha-tested shader.
3. **Post pass** on a fullscreen quad, in this order:
   1. sample the colour at the pixel centre, gamma-encode;
   2. **fog of awareness** (section 2.11): world position from depth, a cell's visibility from the fog texture, `dim(col)` below a 4×4 Bayer threshold, the felt tint above it;
   3. **outline** over the 4 neighbours: a different part more than 0.35 m behind, or a depth jump over 0.6 m, multiplies by `DARK_K` 0.12; a different part between `SOFT_MIN_M` and 0.35 m behind multiplies by `SOFT_K` 0.4. `SOFT_MIN_M = 0.5 × √½ / PX_PER_M` (0.022 m at A, 0.015 m at B): half the depth step between neighbouring pixels on a wall or the ground;
   4. **air**: haze, dust and smoke by distance from the eyes, steam patches, falls (dust streaks, ice fog, sparks), halos round lamps where the air is wet or dusty (section 2.8);
   5. **body veils** (section 7.3): blood loss, grey-out, tunnel, hypoxia;
   6. **grade** of the place (section 2.6);
   7. **palette snap by lookup**: a 64×64×64 RGBA8 3D texture (1 MB) whose texel holds the palette colour nearest to that RGB under tradecraft's metric `e = 0.30dr² + 0.59dg² + 0.11db² + 0.25(dr² + dg² + db²)`. Baked on the GPU in one 512 × 512 pass whenever the palette changes (TECH §1.3, correction 4, built; it replaces the CPU bake of 262,144 cells × 126 colours I first proposed), read with one `texelFetch` after Bayer-dithering the input by ±0.5/64 so gradients do not band. Smooth gradients still get the 4×4 Bayer dither before the snap (tradecraft lesson, 2026-10-27).
4. **Blit**, sharp-bilinear, to the window.
5. **The far window**, when open: steps 2 and 3 again for the inset's camera into a small target, composited over the picture before the blit.

The light calibration stays exactly tradecraft's: `HemisphereLight(sky, ground, 0.6π)` plus `DirectionalLight(sun, 0.79π)` and the toon ramp `[0.55, 0.55, 1, 1, 1]`, so a front face shows exactly its painted colour, a top about 1.17, a face turned from the sun 0.69, a shadow 0.3-0.5. "What is painted is what shows" (tradecraft PIPELINE, 2026-10-25). Each mood in section 2.7 is written against that calibration.

### 2.6 Palettes per place

The palette is generated in OKLCH as tradecraft's `FINE_PALETTE` (`pixelart.js` L93-149): each family is a hue and a chroma, with eight lightness steps `[0.20, 0.29, 0.38, 0.47, 0.56, 0.66, 0.76, 0.86]`, chroma eased toward the ends (`× (1 − 0.9 |L − 0.55|)`), darker tones turned toward violet 285° and lighter toward yellow 85° (`shiftHue`). The array is padded to 128 (three uploads arrays at their declared size).

OLYMPUS splits the palette into a **core** that is the same everywhere, so people and kit look the same on Mars, aboard and on Europa, and a **place set** swapped when you change site (my call). 8 core families + 7 place families = 120 colours, plus 6 fixed = 126.

| Core family | Hue° | Chroma | Used for |
|---|---|---|---|
| night ink | 265 | 0.022 | night greys, dark steel, ink-side shades |
| warm grey | 60 | 0.016 | concrete, canvas, dust in shade |
| skin light | 55 | 0.06 | skin from fair to medium, light hair |
| skin deep | 40 | 0.055 | skin from medium to deep, brown hair |
| drab | 115 | 0.05 | webbing, carriers, pouches, packs (tradecraft's olive ramp) |
| corps | set by SETTING's utilities; default 40 | default 0.07 | the Corps' utilities and PT kit (default a red-tan field pattern) |
| red | 22 | 0.13 | blood, MCRN red (the livery's and the dress uniform's), battle-red light |
| steel | 250 | 0.03 | weapons, fittings, glass, ship metal |

Fixed colours: ink `0x1a1214`, paper `0xf4efe6`, warm glow `0xe7b84a`, pale glow `0xf8e08a`, cool glow `0xeaf2f6`, phosphor `0x9fe0b0` (exit signs, blackout strips, old consoles).

| Place set | Families (hue°, chroma) |
|---|---|
| Mars (Base Melas, Redwater, the surface) | regolith ochre (45, 0.10); rust (32, 0.12); basalt (285, 0.025); dust rose (25, 0.05); lichen (110, 0.065); sea and sky (230, 0.05); hazard yellow (90, 0.13) |
| MCRN and civil hulls | MCRN livery red (22, 0.13) and livery black (the ink ramp), for hull paint, craft and tail numbers (the user, 2026-11-08: red and black); UN livery blue (255, 0.09) with the same black; bulkhead (245, 0.012); deck green-grey (165, 0.02); hazard yellow (90, 0.13); padding blue (255, 0.07); console cyan (205, 0.08); amber (70, 0.13); cable orange (50, 0.12) |
| Europa under the ice | ice (215, 0.035); chaos brown (50, 0.06); sodium (75, 0.13); insulation orange (55, 0.13); algae (150, 0.07); worn teal paint (190, 0.05); rust-steel (40, 0.05) |
| Airless rock (Phobos, Callisto, derelicts) | carbon regolith (60, 0.012); Callisto dark (40, 0.025); frost (220, 0.02); hazard yellow (90, 0.13); bulkhead (245, 0.012); console cyan (205, 0.08); amber (70, 0.13) |

A place set changes only with the area, behind the scene cut (section 5.5), and rebuilds the lookup texture then. **Check what a colour snaps to in the game by sampling a screenshot, not in the painter** (tradecraft lesson, 2026-10-26); the palette test does it (section 14).

**Grade per place**, after the air and before the snap: mix 18% toward luma, then multiply, then push shadows under luma 0.35 by a tint.

| Place | Multiply | Shadow tint |
|---|---|---|
| Mars | (1.05, 1.00, 0.90) (tradecraft's warm grade) | (0.03, −0.01, 0.05) violet |
| Hulls | (1.00, 1.00, 1.00) | (0.02, 0.00, 0.04) |
| Europa | (0.96, 1.00, 1.06) | (0.00, 0.01, 0.05) blue |
| Airless rock | (1.00, 1.00, 1.00), luma mix 25% | none: shadows are black |

### 2.7 Light and colour moods

**One helper.** `src/sim/places/light.js` (`lightLevel(state, x, z, ms)`, adapted from `tradecraft/src/sim/light.js`; TECH §9.6) is the only place light is computed. The view copies its numbers into three.js; perception reads the light level from it for sight reach (tradecraft: reach = 10 m + 42 m × light; PEOPLE owns that formula). "So what you see is what's rolled." Each mood below gives the sky and ground fill (hemisphere), the key light (directional), the sprite tint (the crowd's per-instance light), lamps and glows, shadow strength and the open-air `lightLevel`. Lamp pools stay tradecraft's hard two-ring discs: core to r at `core`, ring to 1.5 r at `ring`, because a smooth falloff would band under the palette. **Static lamps** (ceiling panels, desk and reading lamps, night lights, sodium street lamps, emergency lamps) are TECH §9.6's tiled pools: a per-area table of up to 256 lamps and a 4 m grid of up to four lamps per cell, so every fixture on a 100 m troop deck lights and the count never touches a shader. **Moving lights** (a muzzle flash's 3 m, the fire watch's torch, helmet and weapon lights, vehicle lights, a flickering tube) take the 10 dynamic slot pairs, moved to the nearest each frame, so the light count never changes and no shader rebuilds (TECH §1.3, correction 5, replacing my first `LAMP_SLOTS` 16).

**The sun on Mars: one sun for everyone.** The sun's elevation and azimuth come only from TIME's `sunAt(site, ms) → { elevDeg, azDeg, eclipsed }` (TIME §1, §2.5): mean solar time from the clock (the sun crosses the meridian at exactly civil 12:00), the declination from the ephemeris' Ls, and the horizon profile applied (`eclipsed` true when terrain or a body hides the disc). The picture, perception's light and the sky view all call it, so the dusk on screen, the dusk in the dice and the clock's sunset are one number (the user's rule, tradecraft debrief 2026-10-26: "every number means the same thing everywhere"; the hub: "Everything the screen shows is what the sim says"). I first proposed Mars24's true solar time, which runs up to about 50 minutes off the mean; that would have given two suns, so it is dropped (my call). If the equation of time is wanted for realism, TIME adds it to `sunAt` for every caller at once and SETTING's table of sunrises is recomputed. Three honest consequences:
- Mars receives 586 W/m² at its mean distance, 43% of Earth's 1,361. The calibration keeps "painted = shown" at Martian noon, as eyes adapt; what the player notices is the softness of the shadows and the length of the twilight.
- The air column over the valley floor (66 kPa at 0.38 G, about 17,800 kg/m²) is 1.7 times Earth's, so Rayleigh scattering is stronger than at home: a deeper blue overhead, a redder and dimmer low sun. Background dust adds a rose band near the horizon.
- Melas Chasma's walls cut the sky: SETTING §4.9 gives the profile at Base Melas (10.5° S, 287.2° E, CONTRACTS §2): the south wall 7 to 10° of sky about 45 km off (9.71° due south), the north wall 1.8°, east and west 1 to 2°; PLACES carries it (`MELAS_WALLS`, PLACES §3.15) and `sunAt` applies it. While `eclipsed` is true the key light is off and shadows are 0, whatever the row below says, while the sky follows the row: the sky brightens before the sun clears the rim.

The sun's screen direction stays the art's upper left whatever its azimuth (tradecraft rule: a sun swinging round the sprites would contradict their drawing). Height, colour and strength move. So at dawn the long shadows run up and to the right while the sun stands at 106°; whether cast shadows should follow its real azimuth at dawn and dusk is the user's call (§18, question 10).

**As built in v0.0.3** (`src/render/lights.js`, `lighting.js`, `light-maps.js`; places' `light.js` and `sun.js`):
- **The key light**: its elevation from `sunAt` in whole degrees, at least `SUN_MIN_ELEV_DEG` 10 (a lower sun's shadows would outrun the shadow camera), so the shadow map is redrawn once a degree, not every frame of a dawn; `SUN_BACK_M` 90 and the shadow camera's far plane `SHADOW_FAR_M` 220 m; off, with no shadows, while `eclipsed`.
- **The sunrise over the rim** (my call): `sunAt` also gives `visible`, the disc's share over the horizon (`SUN_DISC_DEG` 0.35°, the disc as seen from Mars, with a linear limb), and `eclipsed` means a share of 0. `skyAt` scales the key light, the shadows and the open-air level's and tint's step by it, so the canyon's sunrise comes in over the 87.3 s the disc takes to clear the wall (the biggest step in a 50 ms tick 0.0013 of the key light, 0.0007 of the street's level), not in a frame (v0.0.3's review: 0 to 0.62 between two frames). `sunTimes` (the centre's crossing) is unchanged.
- **The eye's adaptation** (the stage's call, unscored: the user's eye judges it): the picture shows `lightLevel` L through `exposure(L) = min(1, (L / 0.75)^0.6)`, so a bay at its day fill shows its painted colours and at lights out (0.04) about a sixth of them; outdoors the rig's gain lifts the night sky to match (up to 37 times the night row's strength). A fixed exposure until v0.0.5, whose eye multiplies it by the eye's gains (below).
- **Lamps**: ceiling lamps are a room's fill, not pools (they carry r 0; the look round's blotches in L1 and L3); pools are the night lights, the fire watch's red lamp, desk lamps, street lamps and floods, each its core inside r and its ring from r to 1.5 r. Windows glow by the glow class `LAMP`. The fire watch's lamp is a fixed red-lensed lamp at the post (r 1.5 m; its core lights to 0.29 at 23:00); the torch as a moving pool comes with AI.

**As built in v0.0.5: the eye's adaptation** (`src/render/post.js`, `view.js`; BODY §23.4; the user's ask of 2026-11-06, scoring `test-night`). `exposure(L)` stays the per-place curve, and the post pass multiplies it by the eye's gains (people's `eyeViewOf`, the same number perception's reach reads), eased over `EYE_EASE_S` 0.15 s:
- **Two gains, mixed per pixel.** The rods' gain is (Y_ref / Y_a)^0.2, where Y_ref is the field's luminance or `REF_LOG`'s 1.4 cd/m²; the cones' is (Y_ref / Y_c)^0.2. They are mixed per pixel in log by the rods' share of the pixel: its dimness (its brightest channel from `CONE_LO` 0.10 up, over a band at least as wide as the two gains' ratio, so a brighter pixel never shows darker) times its scotopic over photopic luminance (a saturated red 0.16). Calibrated so five minutes in from the lit head is v0.0.4's picture: 0.47 times it just in, 1.90 at twenty minutes, 2.48 fully adapted for the rods and 1.07 for the cones. The fire watch's red pool shows at 1.27 times v0.0.4's brightness through a fully dark-adapted eye, the surfaces round it 1.19 times lighter (one gain had taken the pool to 1.61 times and toward salmon: the review of the eyes, my call).
- **The Purkinje shift.** By the rods' share of vision (`rod`: 0 at five minutes, 0.59 at twenty, 0.87 fully adapted), the dim pixels go up to `ROD_MIX` 0.5 of the way to their scotopic grey (`SCOTOPIC_RGB` 0.033, 0.766, 0.202, from Larson, Rushmeier and Piatko 1997 on the sRGB primaries), tinted `ROD_TINT` 0.88, 1.0, 1.08: deep in the dark the picture loses some colour and leans a little blue-green, and reds darken (the rods barely see red). Pixels over `CONE_LO` 0.10 to `CONE_HI` 0.24 (the lamps' pools) keep their colour.
- **The glare.** In a glare (the eye's `glare` over 0: the field over its adapted level) a pixel past white washes toward white by the excess, scaled by min(1, glare), settling in 3 to 5 s; at rest the clamp is v0.0.4's. Reveille's overheads over a dark-adapted eye: the lit room 2.5, 1.4 and 1.05 times at 0, 1 and 3 s (the cones'), the dim corners 4, 2.1 and 1.1 (the rods'), settled by 5 s; Head A's door opened from the dark hall does the same. Perception keeps the lit room's reach throughout (PEOPLE §7.2). The fogged memory takes the cones' gain only under 1, so a dark-adapted eye never lights rooms behind walls. While the eyes are shut, and with night vision on (§16), the gains are 1.
- **A splash holds the eye as it began**, through its lapse, beat and strip, and eases to the live eye over its zoom out: the night's lapse holds at 1.000 throughout (the first build pulsed 0.88, 1.13 and 1.0 within a second of real time as the eyes adapted, the review), and the klaxon's 0.5 s zoom out brings in the woken eye, 1.0 to 2.8.
- **Open.** The red pool's hue still leans toward orange at the higher brightness (19 degrees of hue against v0.0.4's 11); the full fix is the light maps carrying each light's S/P per pixel. And the klaxon: the woken eye is fully dark-adapted, so the bay in sight is 1.34 times as light as the picture the user scored 80 (§18, question 12).

**Mars, open air, by the sun's elevation from `sunAt`** (geometric, before the horizon cut; interpolated between rows):

| Elevation | Sun colour, K (×π) | Sky colour, K | Ground | Sprite tint | Glow | Shadow | lightLevel |
|---|---|---|---|---|---|---|---|
| ≥ 20° | `0xfff1de`, 0.79 | `0xc4d0ea`, 0.60 | `0xa06e56` | 1, 1, 1 | 0 | 1.0 | 1.0 |
| 8° (golden) | `0xffdcb0`, 0.72 | `0xb6c2e2`, 0.55 | `0x9a6450` | 0.97, 0.92, 0.86 | 0 | 1.0 | 0.9 |
| 4° (low) | `0xf6b48c`, 0.50 | `0xa4b0d8`, 0.45 | `0x8a5a4a` | 0.82, 0.70, 0.66 | 0.2 | 0.8 | 0.6 |
| 0° (on the horizon) | none | `0x8a96c8`, 0.38 | `0x6a4a44` | 0.60, 0.56, 0.66 | 0.6 | 0 | 0.35 |
| −6° | none | `0x4a5888`, 0.24 | `0x3a3036` | 0.20, 0.22, 0.34 | 1 | 0 | 0.12 |
| ≤ −15° (night) | none | `0x232a44`, 0.14 | `0x1e1c26` | 0.035, 0.05, 0.10 | 1 | 0 | 0.02 |

Mars's twilight is long, because dust aloft keeps scattering light after sunset (observed by Mars Pathfinder and the rovers); the rows are spread over −6° to −15° to keep about an hour and a half of dusk. Mars has no moon worth the name: Phobos at its brightest is about magnitude −4, some three thousand times dimmer than a full Moon, so the night is starlight and the player's lamps. Base lamps, vehicle lights and the helmet lamp are what you see by.

**Dust storms**, laid over the Mars rows by the air's optical depth τ (PLACES' weather gives τ and wind; Opportunity measured τ about 10.8 in the 2018 global storm):

| τ | Direct sun × | Sky K × | Sky colour toward `0xb07656` | Shadow | Haze | Sight cap | Dust falls | lightLevel at noon |
|---|---|---|---|---|---|---|---|---|
| 0.5 (clear) | 1.0 | 1.0 | 0 | 1.0 | 0.05 | none | 0 | 1.0 |
| 1 (hazy) | 0.6 | 1.15 | 0.3 | 0.7 | 0.25 | 2,000 m | 0 | 0.95 |
| 3 (regional storm) | 0.15 | 0.9 | 0.7 | 0.15 | 0.55 | 150 m | 0.5 | 0.6 |
| 6 (heavy) | 0.01 | 0.6 | 0.9 | 0 | 0.75 | 40 m | 1.0 | 0.35 |
| 10 (a global storm's core) | 0 | 0.35 | 1.0 | 0 | 0.85 | 15 m | 1.0 | 0.15 |

Tradecraft's Cairo dust (`shots/tradecraft-walk-cairo-dust.png`) is the visual model: the visible cone clear, everything else veiled toward the dust's colour, sideways streaks.

**Base Melas interiors** (tradecraft `indoors()` moods, extended):

| Mood | Light | lightLevel |
|---|---|---|
| Day | overheads `0xf2f0ea` (4000 K) as fill 0.75; windows add the sky's colour by day | 0.75 |
| Evening | overheads warmer `0xf6e6cc`, 0.65 | 0.65 |
| Lights out (taps to reveille) | overheads off; exit signs in phosphor glow; the head's light through its doorway; the fire watch's red-lens torch as a moving pool (r 1.5 m, red family); night lights at floor level every 6 m (amber, r 0.8 m) | 0.04 plus pools |

**Ships**, worst state first (LONGHAUL's room-camera lighting states, `longhaul/js/ui/roomcam.js` header, re-made for the stage). PLACES says which state each compartment is in.

| Mood | Fill | Lamps and strips | Flicker | lightLevel |
|---|---|---|---|---|
| Vacuum, dead | none | one panel flickering (random 0.2-2 s on, 0.1-1 s off), rime on surfaces | yes | 0.03 |
| Blackout | none | photoluminescent strips along walls and hatch frames (1 px phosphor lines), exit arrows | no | 0.03 |
| Emergency | panels at 10% | amber lamps `0xf0a93a` every 4 m, r 1.6 m, core 0.5, ring 0.2; rotating beacons at hatches at ≤ 1 Hz | beacons | 0.3 |
| Battle stations | panels at 15%, red cast | red strips `0xd23a2e` along deck edges, red pools over stations | no | 0.3 |
| Ship's night (22:00-06:00 ship time) | panels at 30%, blue-white `0xdfe8f6` | red night lights at deck level every 5 m in passageways; berthing dark except reading lamps | no | 0.25 |
| Normal | panels `0xe8eef6`, fill 0.75, even | console glows | no | 0.75 |
| Fire (over any) | as the base mood | flicker pools `0xff8a3a` r 2-3 m at the fire, 6-10 Hz random; smoke haze by density | yes | by smoke |

**Europa and airless bodies:**

| Mood | Light | lightLevel |
|---|---|---|
| Under-ice street | sodium pools `0xf0b050` r 2.5 m every 8-12 m; cold fill from the ice overhead `0x1a2a44`, 0.15; lit windows; steam from vents. The town keeps a day on UTC: full 07:00-21:00, 30% overnight | 0.6 in pools, 0.15 between |
| Under-ice works | cold white `0xd8e8ff` floods, fill 0.6; hazard yellow; condensation | 0.7 |
| Under-ice homes | warm `0xf6e0bc`, fill 0.55 | 0.55 |
| Europa surface, day side | sun `0xfff6ec` at 0.79 calibrated (50 W/m², 3.7% of Earth's, about an overcast afternoon to adapted eyes); sky fill 0 (no air, black sky); strong ice bounce: ground `0xd8d0c0` at 0.25 | 0.8 |
| Europa surface, Jupiter-shine | Jupiter, 12° across, lights the night side to roughly a deep twilight: key `0xe8d8b8` at 0.06 from Jupiter's direction | 0.08 |
| Airless rock (Phobos, Callisto, a hull) | sun at 0.79, no fill, shadows black; on Phobos's Mars-facing side a rust fill from Mars (42° across the sky) `0xb06048` at 0.08 | 1.0 sunlit, 0.0 in shadow |

**Glows.** Painted glow colours light up as tradecraft's do: windows, signs, consoles, exit signs. Glow must be opted into colour by colour (tradecraft lesson, 2026-10-25: a yellow taxi painted the colour of a lit window lit up whole). Lamps report `userData.light` for a slot; consoles do not get pools, only emissive faces.

**Strobes and beacons** never exceed 2 Hz (section 12).

### 2.8 Air and surfaces

Ported from tradecraft's `WX` uniforms and `wxPatch` (`pixelart.js` L583-693) and the composite falls (L344-386); falls are in screen pixels pinned to the world, so they do not slide as the camera pans; their speeds scale with `PX_PER_M`.

| Effect | Where | How |
|---|---|---|
| Dust falls | Mars storms | tradecraft's sideways streaks, 8.75 m/s on screen, slant by wind, density by τ |
| Dust lying | Mars outdoors, airlocks, a neglected room | the snow-cover shader with regolith `0xb07656`, `dustCover` 0-1.5 from PLACES; swept on roads and parade decks |
| Water frost at dawn | the Mars valley floor after cold nights | tradecraft's frost veil (a veil, not patches: lesson 2026-10-27), burning off by mid-morning. No CO₂ frost: at 0.6% of 52-68 kPa its frost point is about −128 °C, so it forms only at the poles |
| Boot prints and tracks | dust, frost, blood, wet decks | `tradecraft/src/render/prints.js` ring buffer, fading; rover tracks as long prints. The user (tradecraft, 2026-11-04): footprints "without it being too heavy in performance" |
| Wet | showers, galleys, Europa's drips | tradecraft's wet darkening and puddles; polished deck plate mirrors lamps as wet ground did |
| Steam | showers, galleys, laundries, Europa vents | a local haze patch: white-blue, radial, Bayer-dithered, strength from the appliance or vent |
| Smoke | fires (PLACES' fire model) | haze by the room's smoke density, sight cap down to 2 m; grey `0x3a3a3a` |
| Rime | vacuum-exposed compartments, suits on Europa | the frost veil with glints |
| Floating liquids | zero g | blood, water and vomit as globules: 1-3 px instanced cards with a highlight, moved by the sim, sticking where they hit |
| Vacuum | anywhere without air | no haze, no falls, no halos: hard edges and black shadow are the cue |

### 2.9 Cutaways

**Interiors** are tradecraft's dollhouse (`tradecraft/src/render/interior.js`, `src/sim/interiors/plan.js`): the back (north) wall stands full height and carries what hangs on it; side walls stand full height, seen edge-on; every other wall is cut to `CUT_H` 1.0 m, its top in the cut colour `0x3a3f4b`; the outside is dark `0x14151c`. `WALL_T` 0.16 m, `OUTER_T` 0.3 m. `WALL_H` is the room's own height from PLACES (2.8 m for base buildings, 2.2-2.6 m for decks). Exits are marked with a plaque on the back wall over the door (the user, tradecraft rc28: "where is the door out of the flat").

**Base buildings.** From outside, a building is boxes with painted fronts and a roof. Entering a building you go into is an area change (PLACES' model: a building's floor is an area): its interior plan replaces the street behind a scene cut at the door. Small structures you step into without leaving the outdoor area (a guard shack, the range tower's ground floor, a sentry post) are opened in place by tradecraft's slot cut (`tradecraft/src/render/cutaway.js`): the structure rebuilt with a slot from the ground to the roof, cut faces hatched as a section drawing (8×8 diagonal hatch, `0x3a3f4b` and `0x4a4f5c`), so the outside goes on round you (my call).

**Ship decks.** One deck shows at a time, as an interior plan with the cut. The camera looks down the thrust axis, toward the stern ("down" under thrust). Two rules make the stack read (my call; PLACES' deck programs follow them):
- **Screen-up is the ship's dorsal side on every deck**, so all decks of one hull share their orientation.
- **The shaft keeps its place on screen.** Changing deck, the camera does not move: the current deck dissolves outward from the ladder shaft and the next dissolves in (a radial 4×4 Bayer wipe, 0.4 s). The shaft, the hatch and you are at the same pixels before and after.

A floor hatch is drawn as a hole with the shaft's dark and the ladder's rungs; its open or closed state reads. Decks above and below are never drawn; what is on them is known only by sound and comms (fog, section 2.11).

**Multi-storey buildings** use the deck rules (one floor at a time, stairs as the shaft). As built in v0.0.3 for Echo: floors linked by a stair share the camera's bounds, so the stair and you are on the same pixels on both, and the wipe (`STAIR_DISSOLVE_S` 0.4 s, outward from the stair) holds the camera: no cut, once both floors are built. A door to another area is a cut, behind which the last picture holds until the new area and everyone in it are up; a move within the area already shown (a debug `go`) is no cut (my call). **A stair's word names the end it leads to** (as built in v0.0.6, `src/art/kit/structure.js`; the user, 2026-11-07: "the UP indicator is on the entry of the staircase which I interpreted as the top of the staircase and not the bottom"; DESIGN.md's log): "UP" centred `WORD_IN_M` 1.5 m in from a flight's top, clear of its own 1.0 m closed end and of a 1 m cut wall beyond the top on the screen; "DOWN" centred 0.5 m in from a well's far end. The word is amber on a dark plate in the kit's pixel font, upright whatever the turn, a pixel clear of the guard (at 16 px/m DOWN uses a narrowed 3-px W). **A walking arrow** (a shaft and a solid head) is painted in the piece's frame from the end you step onto to the word; on a flight with an open side its shaft comes in through the opening and turns up the flight. **The treads show the slope**: a flight's run from dark at the foot to near white at the top (OKLCH −0.40 to +0.14; on the main flight at 1:1, 51 to 126 of 255 luma, where v0.0.5's sat flat at 119 to 148); a well's darken toward its bottom. A flight's high end is drawn as a cut wall `END_H_M` 1.0 m high in the cutaway's colours (cut top `0x3a3f4b`, wainscot `0x6f735e`), with a dithered shadow on the floor past it. Its rails are a stringer with a 0.9 m handrail on posts; the open side starts at a 0.2 m newel, and the handrail rises from it over 0.7 m at the camera's 45 degrees, so its picture begins where the opening ends (0.94 m clear on the screen past the handrail's picture). The opening's edge is an amber nosing, and a dithered shadow lies on the floor beside the open side, widening to 0.3 m at the high end. A well's rails run along its landing too. The rails, the closed end, the rail across the foot and the landing's rails are drawn from the rule the sim's blockers keep (PLACES §1.5's `flightGuardOf` and `landingRailsOf`, the kit's `flightGuard`), and a well's landing, its word, its dark well and its guard from `stairEnd`. Readable at 16 and 24 px/m. **Each stair is lit at night**: a night light on each stair room's north wall over the stair, on both floors, lights a well's DOWN and a flight's way on 0.12 at 23:00, where the room's fill at lights out is 0.04 (in v0.0.5's dark corner the main well's DOWN read "??OI"; my call, a stair being a way out). v0.0.5 marked the end one steps on from the floor shown, "▲ UP" at a flight's foot and "▼ DOWN" on a well's landing, an amber solid triangle over the word, which the user read as the top (v0.0.4's arrow and word turned with the flight, so a south-climbing flight's UP read "dn", and the upper floor came to look like a basement: the user's report of 2026-11-06). For the user to judge from the shots: the arrow pointing down the screen to UP downstairs and up the screen to DOWN upstairs (VIEWS §18).

### 2.10 See-through occluders

A thing standing between the camera and someone who matters is seen through, smoothly.

- **Protected figures**: the player; anyone the player currently perceives within 12 m; the bracketed or aimed target.
- **Cards** (a stack of crates, a vehicle, a tall machine, a tree in a dome park): tradecraft's checkerboard discard of the card's pixels over the protected figure's rectangle (`tradecraft/src/render/town.js` `seeThrough()`).
- **Masses** (a building or module south of the player, a bulkhead's full-height section, overhead pipes, cable trays, a catwalk above): inside the protected rectangle plus a 6 px margin, the parts above `CUT_H` dissolve to a 2×2 checkerboard and roofs are hidden; the cut line gets the section hatch.
- **No popping**: dissolves run by Bayer threshold over 0.25 s both ways (the user's standing rule: nothing pops in or out of view).
- **The figure through it**: a protected figure behind a dissolved mass gets its silhouette outline at 60% ink, so it reads through the checkerboard (my call).
- **As built in v0.0.3** (`src/render/view.js`, `materials.js`): the fade is decided by a CPU occlusion test; roofs over 2.4 m are hidden; a mass's other faces above `CUT_H` inside the protected rectangle are checkerboarded 2 × 2 as above.
- **The wide see-through** (my call, after the review: north of Echo the box opened only the figure's size, and the ground and the fence round you stayed under the roof): once a mass over `TALL_MASS_M` 3.2 m has hidden you for longer than `SEE_DISSOLVE_S`, the ground's batched geometry above 1 m south of you is cut over a disc of `SEE_WIDE_M` 3.5 m round your ground spot, with a dithered rim, as the interior cutaway cuts walls down. A glimpse behind a lamp post keeps the figure's box, so the checkerboard shows only for brief occlusions and indoors. Whether a seen-through mass should keep the checkerboard over the figure or hide above `CUT_H` outright is the user's call (§18, question 9).

### 2.11 The fog of awareness

Ported from tradecraft (`src/render/view.js` L307-396, `src/sim/perception.js`; the user, 2026-10-26: "a notion of where we're looking and what characters are aware of"). **The same visibility function draws the fog and decides the dice.** PEOPLE owns perception and its numbers; this section owns how the fog looks and what it needs.

| Constant | Value |
|---|---|
| `FOG_CELL_M` | 0.25 m, the sight grid's lattice (PEOPLE §7.6), so no cell holds both a wall and the floor past it (tradecraft's 0.5 m, and v0.0.3's first build, lit a strip of hall floor past the bay's south wall at night and, read the other way, bled the hall's dark over the sleepers' heads against it; my call) |
| `FOG_N` | 192 × 128 cells in the game (`FOG_CELLS`, `src/render/view.js`): 48 m × 32 m round the camera, the frame's 40 m and its 31.8 m of ground north to south |
| Texture | RG8: R visibility, G felt; 48 KB, re-sent only when it changes |
| Recompute | when the eyes move, turn or change, or once a game second for light; only the easing runs every frame |
| Ease | in 0.08 s, out 0.4 s ("as eyes do"), felt out 1.1 s |
| Dim | `dimK = 0.18 + 0.3 × air`: darker, greyer, slightly cold; near black at night |
| Edge | 4×4 Bayer dither, never a smooth gradient |
| Walls | a building or bulkhead takes the visibility of its wall's feet ("a building lights up when its wall is seen"; the fix for "the flickering shadows on the buildings", 2026-11-03). Left from the 0.25 m change: a faint dotted line, one dither row, on a cut wall's own hall-side face, where the post reads a surface 0.5 m south per metre up; its fix is a stage call on the façade lookup |
| As built (v0.0.3) | the view computes the mask by calling people's `sightMask` from `eyeOf(player)` when the eyes move `FOG_MOVE_M` 0.25 m or turn `FOG_TURN_DEG` 3°, a door in reach moves, and once a game second: 2.0 to 2.6 ms indoors and 5.6 ms on the street in macOS's background band (about 0.6 and 1.5 ms in the foreground); `render-fog` finds 0 mismatches on 3 × 24,576 cells. When its window moves, the eased values move with their cells (`fog.place()`), and on a new area it snaps (my call), so its edge never lags the world |

**Memory.** People out of sight are drawn frozen where last seen, mid-step, dimmed, until that spot is looked at again (`state.mind.seen`, forgotten past 70 m). The same holds for a dropped magazine, an open hatch, a light left on: the picture shows the world as last seen in the fogged cells (things placed since are not drawn there until seen).

**As built in v0.0.3**, the memory is the view's (`src/render/memory.js`), view-only and never saved, ahead of `state.mind.seen`, which stays PEOPLE's for sightings (0.0.10) (my call). The view draws every actor and the fog only dims, so without it a change made out of sight would show in the dimmed cells (through 22:00, 13 of 13). An actor is drawn as last drawn in sight while the player's visibility is 0 both where it stands and where it was last drawn; once either spot is in sight it is drawn as it is and remembered anew, so a change shows only where you look, as the fog lifts there. A new state (a load, a new career), another area or a skip forgets it. **From v0.0.5 a skip forgets the memory only while a full splash's iris covers the picture**; a brief splash's lapse keeps it, so those out of sight stay as last seen until you look (the review of 0.0.5: three to seven squadmates drawn lying in their berths were dressing in the next frame of the dressing splash, the memory forgotten on its first frame with the bay still in view).

**What OLYMPUS adds to the eyes** (requests to PEOPLE and BODY; defaults are my call if they leave them open):

| Condition | Effect on the fog |
|---|---|
| Helmet with visor | cone narrowed by 20°; the all-round awareness radius (footsteps, the sense of someone there) shrinks 30% (the helmet muffles) |
| Suit in vacuum | no hearing: the awareness radius drops to touch and vibration, 1.0 m, plus what the suit radio and datalink report (shown as felt patches with the reporter's name) |
| Darkness | reach by `lightLevel` through the adapted eye (BODY §23.4): the fog of awareness follows (bay-2-1 at 23:00: 42% in sight just in from the lit head, 71% at a minute, 84% at five minutes); the helmet lamp is a lamp pool that moves with the head and lights what it falls on. Your eye through a transition is the pose shown, and your own berth is always in your sight (PEOPLE §7.6) |
| Smoke, steam, dust | sight capped by the air (section 2.8) |
| Hypoxia | night reach falls first (night vision degrades early in hypoxia), then colour and the edge of the cone (BODY gives the level) |
| On a deck | walls, bulkheads and closed hatches block sight; an open hatch lets sight through its frame |
| Optic in the far window | reach × the optic's factor inside the window's field (WEAPONS gives the factor) |

**Heard, not seen.** A meaningful sound from outside sight (a shot, a shout, an alarm, a hatch slamming, boots on the deck above) puts a small "heard" plaque at the frame's edge on its bearing, with the kind and a rough distance in words, for 4 s (the user, tradecraft 2026-11-04: "who shouts to drop it ? I don't see any police near me"). Heard plaques, felt patches' plaques and waypoint plaques at the edge are placed by the labels pass against the HUD's rectangles (section 7.5), sliding along the edge to the nearest free place; one with no room is left off, never drawn over the HUD. The same event is captioned in the log (kind `heard`) either way.

**Instruments obey the fog's rule too**: a screen shows only what its source knows (section 6.1).

### 2.12 Decals

One instanced draw each, ported from tradecraft (`src/render/blood.js`, `items.js`, `prints.js`):

| Decal | Look |
|---|---|
| Blood | spatters one pixel each, seeded, drying darker; pools under the badly hurt; trails behind a dragged casualty |
| Brass | a 1-2 px glint per case, where the sim drops it; kicked by walkers; in zero g it drifts and spins as a 1 px glint |
| Dropped magazines and kit | tradecraft's `items` templates, drawn bigger than life (a magazine 4 px at A, 6 at B) |
| Prints | boots, tyres, drag marks (section 2.8) |
| Bullet strikes | a 1-2 px dark pock with a lit rim on the face it hit; sparks for a few frames on steel; a vent plume (white haze streak) from a holed pressure wall |
| Scorch | soot round a blast or fire, dithered |

**As built in v0.0.5** (`src/render/decals.js`, tradecraft's `render/items.js` ported, one instanced draw; its pure placement in `src/render/range-items.js`, which the node tests read; `src/render/range.js` draws the bay's own): **brass**, a case two pixels turning end over end, white on its first tick out of the port, brass at rest; the orange dummy, a stripped live round brass and copper; all from `rangeLook().brass` on the sim's arc (WEAPONS §2.8), a kneeling case from the kneeling port (the integrator had left it mapped through the prone and standing ports); **a dropped magazine** lying where it fell; **holes** as ink pixels on the card (pale through the black, dark through the white, a puff of paper for 200 ms), lifted `HOLE_LIFT_M` 0.12 m toward the camera along their line so they win the depth test (at 5 to 7 cm the card hid them) and drawn at half ID alpha so the outline pass does not ink them; **the blast's dust**, nine grey-ochre motes (five kneeling) thrown up to 0.3 m in front of a prone or kneeling muzzle, falling at 0.38 g and settling over 1.2 s (`dustPixels`). The card is drawn **three times life size** (`CARD_K` 3, my call, the stage's: 14 px at 16 px/m, its black 5 px; at life size it was 5 px and a string's holes stacked on 1 or 2 pixels), the holes at `(xCm, yCm) × 3 × PX_PER_M / 100`; the lane boards on the line carry the lane's number.

**As built in v0.0.7** (`src/art/kit/range.js` `FACE_K`, `src/render/blood.js`; the build sheet 0.0.7 §8 item 20). **KD faces are drawn twice life size** (`FACE_K` 2, the 25 m card's 3 would overlap the 5 m lanes), **the face's left edge on its line** (x 1,600, so it spans 1,600.06 to 1,602.06 and its carrier's frame is drawn at its middle, PLACES §4.12); its holes, spotter and disk at that scale. **Blood** is the body's (BODY §17): a spatter where a round strikes, drips under the bleeding, a pool under someone lying still, read through `bloodLook(state, area, ms)` from `places.sites[site].blood`, each decal `{ area, x, z, dx, n, seed, atMs }`; its shades are **darker than tradecraft's** (my call, the stage's: tradecraft's read as paint on the ochre regolith). On the KD the brass is counted on its 1 m tiles and drawn from them (WEAPONS §2.8).

**As built in v0.0.8: the turners on the bay** (`src/render/range-items.js` `TURNER_K`, `ROCK_MS`, `PLATE_FALL_MS`, `PLATE_DRIFT_MPS`; `src/render/view.js`, `range.js`; `src/art/kit/range.js` `kdTurner`, `kdPaint`; COMBAT §25.10.3, PLACES §4.12). **A turner's face is drawn twice life size** (`TURNER_K` 2, the face's role's call: 15 × 24 px at 16 px/m beside the 34 px chibi, where at life size it was 7 × 12 px) about the sim's centre 1.35 m up, so holes land where the sim puts them. **It turns over its real 0.3 s, never jumping**: each frame as wide as it has turned, its one-pixel edge at least (no change of facing over 0.45 between frames in review). **It draws belief, not truth** (the fixer's; PEOPLE §7.6): every paper face is one khaki board, threat and no-shoot alike, what it holds (a rifle, a pistol, open hands, a phone) painted only once this turn's take-in identified it, nothing where "can't see his hands"; the armoured silhouette is drawn in steel with its plate and a head plate. Holes on the faces at that scale; a lead splash where a round rang and a star of sparks for 180 ms (the 'fx' fact's `spark`); **the steel face rocks a pixel over `ROCK_MS` 120 on each ring**, and **its head plate falls** at Mars' gravity with a drift (`PLATE_DRIFT_MPS` 0.35 m/s, at most `PLATE_FALL_MS` 1,100) and lies on the ground. **The stands** (`kdTurner`, makes `'stand'` and `'frame'`: a grey motor box, shaft and clamp; in olive the box had read as a small marine at the frame's foot) and **the painted lines** (`kdPaint`, makes `'line'` and `'worn'`, "7 M" and "10 M" stencilled on the line's side every 3 m about the pad's middle) are the bay's kit, drawn in test-handling and test-range too, edge-on with no face.

---

## 3. Figures

### 3.1 How a figure is made

Ported from `tradecraft/src/art/sprites.js` (1,587 lines): a figure is composed per frame from **templates of role letters** (s skin, h hair, t top, p legs, f shoes, a hat, r beard, y trim, w white, x carried thing, ø plate-carrier cloth, and the fixed e/k ink, l lens glint, m frame, z the skin's darkest, q blood), each part a template in three views (down, up, right), placed by a **pose table** (bob, arm reach and swing, leg shapes, lean). Shading is by rule, as a pixel artist does: a part's top edge lit, its right and bottom edges shaded, a pixel under a later part in its shadow, an edge over an earlier part in the role's darkest (an inner line), an ink outline round the silhouette. **Frames are poses of parts, not drawings of their own, so a new helmet or suit animates in every frame for free.**

Tradecraft's alphabet is nearly full: besides the roles above, `b` (brow), `g` (gold), `V` (a lit screen) and `Q` (blood) are fixed colours, and the held-weapon roles `v` (steel), `n` (dark grip), `o` (wood), `d` (green glass), `j` (brick), `i` (yellow) and `u` (black) keep their base tone "or it'd vanish into a coat". Weapons keep using `v` and `n`. An upper-case letter forces its role into shade, so new roles must have an upper case. The new roles OLYMPUS adds (my call):

| Letter | Role | Shading |
|---|---|---|
| `c` | suit shell | as cloth, five tones |
| `ð` | suit joint and seal rings | the suit's darkest plus one lit pixel |
| `þ` | visor glass | dark glass, keeps base; the `l` glint on the upper left; lit from inside (a faint cyan or amber face) when the suit's HUD is on at night |
| `æ` | webbing and pouches | drab ramp; pouches get a lit top edge |
| `¤` | glow (lamps, chest display, LEDs) | unlit, emissive, never shaded; drawn into the glow card layer |

Rank and unit marks are not a sprite role: they are never readable at sprite size, and the doll draws them from SETTING's insignia (section 4). What does tell people apart on the stage is in section 3.9.

### 3.2 Proportions and cells

Section 2.2 gives the four variants and their cells. Templates are hand-placed pixels, so each variant has its own template set until the pick, and only the picked set is kept after it (section 2.3); the pose tables, rigs and shading rules are shared. **Builds: six** body templates per variant (my call): three heights (short 1.62 to 1.70 m, medium 1.70 to 1.80 m, tall 1.80 to 1.92 m; at B that is 40, 42 and 45 px standing) × two frames (slight, broad). PEOPLE's roster gives each person a height and a build, and the nearest template draws them. As built in v0.0.3 (`src/data/people/looks.js`): `body.build` is `slight` or `broad`; heights are drawn by sex from triangles within 1.62 to 1.92 m (men 1.66, mode 1.77, 1.92; women 1.62, mode 1.67, 1.82: my calls on the Corps' spread); grey hair is drawn only from age 32. The figures stay the samples' set this round, so height and build are data the stage does not yet draw. **Facings: four** (down, up, right, left), as tradecraft. Tradecraft draws left as right mirrored, which would make every marine left-handed when facing left. OLYMPUS composes the left view by mirroring the body's symmetric parts and drawing **asymmetric layers from their own left templates**: the rifle rig (stock at the right shoulder in every facing), the pistol holster (right thigh), the dump pouch (left hip), the radio antenna (left shoulder), the IFAK (my call). Asymmetric layers are few, so the cost is a fifth of drawing a true left view.

Aiming off the facing uses tradecraft's tilts (`aimhi`, `aimlo` when off by more than `TURN_RAD { side: 0.2, front: 0.35 }` rad). Eight facings were considered and refused: they would double every sheet for what the tilts already show.

### 3.3 Kit on the sprite

Layers in draw order (side view; front and back views swap the near and far limbs as tradecraft's `compose()` does): far arm, far leg, near leg, torso (top kind), plate carrier and pouches, pack (from behind: over the body; from the front: straps only; side: 1 px proud), near arm or weapon rig, head, face, hair, helmet or cover, visor, slung weapon (by carry posture), lamps (glow layer), blood worn.

| Top kind (SETTING's uniforms decide the colours) | Notes |
|---|---|
| Utilities (field uniform), sleeves down or rolled | belt with buckle; trousers bloused into boots |
| PT kit | shorts, tee, running shoes; reflective belt at night (glow role, opted in) |
| Service and dress uniforms | for ceremonies, leave, boards: the tradecraft `uniform` torso with buttons and belt; the dress oxbloods **red and black** (the user, 2026-11-08), the UN's blue and black |
| Shipboard coverall | one piece, name-tape row, deck shoes |
| Vac suit (soft) | `c` shell, `ð` rings at neck, wrists and waist, a chest display (one `¤` pixel), suit pack as its own part, helmet with visor `þ` |
| Hard armour over a vac suit | plates as `ø` over `c`, shoulder plates proud one pixel; **black** for the Corps and the UN alike (the user, 2026-11-08: "armors are black"), the UN's with blue markings and the Corps' with red |
| Cold-weather gear (Europa works, Mars nights) | hood, insulated layer, mittens |

Head wear: patrol cover, helmet (tradecraft's `helmet` hat), the vac helmet with visor (closed, open, removed and clipped to the pack), the drill instructor's campaign cover (a silhouette every marine knows), garrison cover, ear defenders at the range, NVG mount (later).

**What reads at each density** (section 2.2): under A a sprite tells posture, carry posture and muzzle direction, helmet or not, suit or not, pack or not, armour or not, rifle or pistol, team colours if any. Under B it also tells a magazine in the rifle or not, an optic, separate pouches, a face's expression (two-pixel eyes, a mouth), a visor up or down. Gun state below the pixel (safety, chamber) is never on a sprite: it lives on the weapon card and in the step panel, as the character knows it.

**As built in v0.0.13: the carried gun** (`view.js` `armedLook`, my calls): it puts `gunLook`'s finish, and a non-R-7 model, on the figure's look and keys its cache on both. A finish changes the rifle's furniture colours, never its shape (the atlas `shapeKey` is unchanged); Earth desert's figure uses its own ramp, one step under its card. The R-7's template carries the magnifier's pixel behind the box. The stock and the sight stay gun metal at 16 px/m.

### 3.4 The frame catalogue

Frames are composed on demand ("lazy frames", tradecraft's `crowd.js`): a new look (section 3.7) gets its street band, a new person gets only their head band, and other bands are painted the first time any wearer of that look needs them. Counts are frames per facing.

**Street and daily life**

| Frame | Count | Drive | Notes |
|---|---|---|---|
| idle | 2 | time, 2 fps, per-person phase | |
| walk | 4 | distance, one frame per 0.16 m (tradecraft `STEP_M`) | feet never slide |
| run | 4 | distance, one frame per 0.45 m | |
| sit | 1 | state | lifted to the seat (`SEAT { y: 0.24, z: −0.2 }`) |
| wrist | 1 | state | looking at the wrist terminal |
| wave, point | 2 | state | |
| eat | 2 | time, 1.5 fps | seated, hand to mouth; the tray is the table's prop |
| drink | 1 | state | canteen or hydration tube |
| carry box | 4 | distance | walk with arms forward (stores, ammo cans) |
| clean | 2 | time | at a bench, arms over the work (rifle cleaning seen at stage scale) |

**Drill and customs** (SETTING owns the customs; these are their poses)

| Frame | Count | Notes |
|---|---|---|
| attention, parade rest, at ease | 3 | |
| hand salute | 1 | right hand to the brow; a covered and uncovered variant is the head layer's |
| march | 4 | walk with drill arm swing, 0.76 m step (30 inches) driven by distance |
| order arms, port arms, right shoulder arms, present arms, inspection arms | 5 | rifle rigs of their own |

**PT**

| Frame | Count | Notes |
|---|---|---|
| push-up | 2 | long cell |
| sit-up (crunch) | 2 | long cell, a partner holding the feet is another figure's `kneel` |
| pull-up | 2 | hanging from a bar (furniture) |
| side-straddle hop | 2 | |
| run in formation | the run frames | PT kit |

**Weapons** (WEAPONS owns the postures and steps; one rig per weapon class: rifle-length, carbine, pistol, and later SAW and launcher)

| Frame set | Count per class | Notes |
|---|---|---|
| slung on the back | 0 (a layer) | the weapon drawn across the back over any frame, muzzle up or down |
| slung in front, hands off | 0 (a layer) | across the chest, muzzle down |
| patrol carry (muzzle down 45°, finger off) | 10 (idle 2, walk 4, run 4) | the street frames with this arm rig |
| high ready (muzzle up) | 10 | |
| low ready (muzzle at the ground ahead) | 10 | |
| compressed ready (stock in the shoulder, muzzle down) | 2 | standing only |
| aim, aim high, aim low | 3 | tradecraft's rigs: rifle turns as one piece about the butt (`at [9,19]` at A, scaled), pistol at arm's length |
| fire, fire high, fire low | 3 | kick `KICK_TILT { pistol: 0.3, rifle: 0.14 }` rad |
| magazine out (hand at the well) | 1 | |
| magazine to pouch or dump | 1 | hand at the belt or chest |
| new magazine from a pouch | 1 | |
| magazine in (seat it, a push) | 1 | |
| charging handle or slide, bolt release | 1 | |
| press-check | 1 | |
| tap and rack (malfunction drill) | 1 | the palm slap then the rack reuse the charging frame |
| throw (grenade) | 2 | wind-up, release (tradecraft's `throw`) |

A holstered pistol is a layer; the draw has one frame of its own (`draw`: the hand at the holster, the pistol coming up).

**Stances** (combinable with the weapon rigs: a stance gives the legs and torso height, a rig gives the arms; each combination is a frame painted when first needed)

| Frame | Count | Cell |
|---|---|---|
| crouch | 1 + walk 2 | normal |
| kneel (tradecraft `kneel`), kneel up | 2 | normal |
| kneeling aim, aim high, aim low, fire | 4 | normal |
| prone | 1 per facing view | long cell (east-west), normal cell (north-south views, foreshortened) |
| prone aim, prone fire | 2 | as prone |
| crawl | 2 | long cell, distance-driven (one frame per 0.3 m) |
| sit against a wall | 1 | |

**Casualty and medical**

| Frame | Count | Notes |
|---|---|---|
| down on the back, down on the side | 2 | long cell; tradecraft's turned card stays for crowds |
| hold a wound (hand on the part) | 1 | standing or sitting |
| limp | 4 | walk with an uneven bob |
| drag a casualty (walking backward, bent, a hand on the drag handle) | 4 | distance-driven; the casualty is their down card pulled behind |
| fireman's carry | 4 | one composite figure: the carrier's walk with the casualty's body over the shoulders, drawn as one sprite from both specs |
| give aid (kneeling, hands on a casualty) | 2 | time |
| hands up, cuffed | 2 | |
| dead | 1 | long cell; suited dead keeps the visor's glint |

**Gravity regimes** (BODY gives the locomotion states and their numbers; these are their pictures)

| Frame | Count | Drive |
|---|---|---|
| bound (push-off, rise, apex with legs tucked, landing knees bent) | 4 | by the bound's phase from the sim; the card is lifted by the sim's real height above the ground |
| float (limbs loose, arms drifting) | 2 | time, 1 fps |
| tumble | 8 rotations of `float0` | by the body's roll angle from the sim, nearest 45°; rotated frames drawn with tradecraft's inverse-mapped `turned()`, so lines step cleanly |
| handhold (one arm to a rail) | 1 | |
| push-off (legs extended from a wall) | 1 | |
| mag boots (wide stance, heel-toe) | 4 | distance, one frame per 0.25 m |
| ladder (back view, hands up) | 2 | distance climbed, one frame per 0.3 m |
| braced (standing braced under thrust over 1.5 G) | 1 | |
| pinned (flat on the deck under crushing G) | 1 | long cell |
| thrown (inertial events) | the tumble frames | rotation and lift from the sim |

**Couches, racks, and the private things**

| Frame | Count | Notes |
|---|---|---|
| couch | 1 | lying on the back facing the camera (see 3.5): the front view with legs straight, straps (`y`) at chest and thighs, arms on the rests |
| couch under G | 1 | head back, a grimace under B; the couch's gel shown as the furniture's |
| couch, out (G-LOC or juiced sleep) | 1 | head turned, eyes shut |
| sleep in a rack | 1 | lying on the side under a blanket: the rack draws the blanket over the body, the sprite shows head and shoulder; breathing is the blanket's 2-frame rise at 0.2 Hz. As built in v0.0.3 (`src/art/figures/bedding.js`): the sleeper is a quad laid on the mattress at the berth's height (`RACK_DECKS` plus `BERTH_TOP_M`), its top seen from above as the floor is, the head on the pillow in the person's hair and skin, turned by the seat's head; a drawn curtain replaces it, its colour the rack's `look.curtain`, else olive. The breathing is not built yet |
| sleep in a bag (zero g) | 1 | upright in a bag tethered to a wall: the bag is furniture, the head shows |
| shower | 1 | the stall's curtain covers shoulders to shins; above it wet hair, below it bare feet; steam from the stall (section 2.8). The body is never drawn |
| head (toilet) | 0 | the stall door shut, boots visible under the gap (the door is furniture with an OCCUPIED slide) |
| centrifuge | 1 | seated in the gondola (the couch frame turned to the arm's angle) |

Total: about 170 new frames per facing (some 40 of them per weapon class), plus tradecraft's 18 fight frames, which CQC keeps (COMBAT owns CQC). As built in v0.0.3 a figure's bands are the samples' with two for the barracks: `rest` holds `sit`, and the new `lie` holds `couch` and `sleep`. A typical look on screen needs about 60 of them painted, shared by everyone who wears it (section 3.7).

**As built in v0.0.4** (`src/art/figures/poses.js`, `outfits.js`; the frames ROADMAP §4.6 held until the look was picked). The **move** band holds the stroll (four, by distance at `STEP_M.stroll` 0.12 m: a shorter stride, the arms barely swinging), the stairs up and down (four each, every 0.14 m), the look (the head a quarter turn) and the glance (the eyes aside). The **rest** band grows the berth's transitions, drawn frame by frame from PEOPLE §4.6's `poseAt`: `sitUp` (up on the mattress, the legs under the blanket), `sit` on the rack's edge, `climb` (down from an upper berth, the hands on its rail), `standUp` (half risen, the hands on the thighs) and `lieDown` (back on an elbow); and daily life: two dressing frames, leaning at a basin, brushing and shaving. **The towel** is an outfit of its own (at the waist, at the chest for a woman, with shower shoes). **The body's cues on the sprite** (BODY's `cuesOf`, through `figureOf`): wet hair darker with a sheen while `wetK > 0` (a glint on the scalp of a shaved head: the integrator's, since seed 48213's player is bald and the shower had left no mark on him), and the tired walk at `tiredK ≥ 0.5` (the head down a pixel, the arms swinging half as far). The figure is drawn at `figureOf(state, actor, ms)`'s position, height, frame and outfit, never the actor's own fields, so a transition is never a pop. The shower and the head are drawn as section 5.2 says, as built. **v0.0.5** (the user's "slightly slower animations on getting in and out of rack", 2026-11-06): the steps between a lower berth's edge and its foot are drawn with the gait's walk frames, by the metres walked (`poseAt`'s walk frame, PEOPLE §4.6; `TRANSITION_FRAMES` walk: null), never the half-risen frame slid. The sitter on the mattress (`sitUp`, `lieDown`) moves from the berth's head to its edge over the last `SIT_SLIDE_K` 0.6 of sitting up (smoothstep, `poseAt`'s `upK` and edge), so the edge sit follows on with no hop (the review saw 1.04 m in a frame at every rise and lie-down, nine in the drill's first 30 s at seed 48213; `view-squad` pins the drawn picture: no figure off its berth outside the walk moves over 0.3 m in a frame faster than 3 m/s, and the largest such step is 0.031 m at 60 fps).

**As built in v0.0.5** (`poses.js` `RIFLE_BANDS`, `compose.js`, `outfits.js`; the build sheet 0.0.5 §2.3 (b), (d)). The rifle's handling, the R-7 side on in every carry and stance the 25 m line uses, in **three bands of their own** in the atlas's rifle pool (section 3.7), so a look that never handles a rifle costs none of them: **`rifle`** (standing: low and high ready, slung front and on the back held still, the rifle raised from the sling or slung again, the charging handle, the bolt released, the press check), **`rifleKneel`** (the same kneeling, with the magazine out and in) and **`rifleProne`** (the rifle rested forward, slung across the back, the charging handle, the release, the press check, the magazine out and in, the rifle propped on the elbows for the hands to work under it); the aims and the fires stay in the `arms` band. `rifleFrame()` turns the arms role's `gunLook` (carry, stance, the action's frame and its share) into a frame. The kit on the sprite (`kitLook`): **ear defenders** over the cover (drab cups on a band), **the plate carrier with its magazine pouches over utilities** (under the cover, not the helmet: the 25 m line's dress), the **magazine out** of the well while a step has it out. The range staff wear **`rangeStaff`** (utilities, a soft cover, **the range detail's red brassard** on the left arm; the range officer **a headset** over the cover), a duty's dress (`DUTY_DRESS`) rather than one of `OUTFITS`, since the samples' lineup sits at the 24 px/m atlas's 15 looks (section 3.7). A look's carry is sticky (the carry last walked with), so a posture changed in stop motion repaints nothing.

**As built in v0.0.6** (`src/render/view.js` `PART_FRAME`, `src/art/figures/compose.js`, `bedding.js`, `atlas.js`; the build sheet 0.0.6 §2.2, §8 item 26). The single actions at a sink draw frames that exist: washing the hands is the basin's lean (`PART_FRAME` `hands: 'basin'`), buzzing your head the shave's frame (`clip: 'shave'`, the hand at the head; no new pose). The barber's haircut is drawn inside (the figure hidden, `inside`), its splash with no vignette: the pole on the regolith until the PX has an inside (section 18). **Every cut is drawn at its four grow-out steps** (section 3.9) in every view and every frame that shows the head, the sleeper in his berth included (`bedding.js`, the sleeper's key naming the step), and the step is part of a look's shape (`atlas.js` `shapeKey`: the style and the step), so a squadmate whose step changes gets a new sheet the next time he comes into view, as an outfit change does; his step changes only out of your sight (PEOPLE §6.2).

**Designed 2026-11-07: four pose sets for a defender's state** (COMBAT §7.11; the doctrine proposal's; my calls), each drawn for the rifle bands and readable at 16 px/m, where a chibi figure is about 34 px tall (section 2.3) and the rifle drawn larger than life where it must read (section 2.2): **`daze`** (hunched, a hand to the eyes or both to the ears, the muzzle dropped, a 1 px sway at 1.5 Hz, held still under reduced motion), **`cower`** (crouched to the floor or into a corner, arms over the head, the rifle lying or hugged), **`blind`** (down behind cover, the rifle held up over it, its flashes with no aim) and **`hands`** (hands up, the rifle on the floor before him). The aim, the run and the hurt frames exist. A figure is drawn only as the character perceives it (PEOPLE §7.6), so a state is seen, never told.

**As built in v0.0.11**: the `float` gait now draws the float frames, and the low-g run draws the bound. The bound's stride stays the art's 2.8 m cycle, because `STRIDE_WRAP_M` must stay a whole number of cycles; its airtime frames are step 7's. **Effects take their real time** (the pillar): the blast's dust lasts `dustMsOf(g)`, until the highest mote lands and lies 360 ms, and never less than 1,200 ms (Melas 1,200; Europa 1,742). The head plate lands at the fall time sqrt(2h / g) and drifts until max(1.1 s, its fall); in the float band it drifts for 1.1 s and is then gone (my call: no fade on the stage's pixels). The berm's dust keeps fading in the air, as at Mars. Open: `range-items` still ends some timings at Mars's fixed numbers.

### 3.5 Lying, floating and the projection

In this projection a metre along the ground and a metre up a wall both cover `PX_PER_M` pixels. So **a body lying on its back with its head north looks, in outline, like a body standing and facing the camera**: the couch, the rack sleeper on their back, a casualty laid head-north for treatment are all the front view, legs straight, drawn flat at the floor's depth for the outline pass. That is why the couch frame is cheap. A body lying east-west is a long-cell frame; one lying head-south is the back view. The look round's L5 showed the cost: an upright card of a lying body reads as standing. So a sleeper in a rack is drawn flat on the mattress, as the rack's own bedding is (§3.4, built in v0.0.3), and the couch's frame waits for its scene.

**Height off the ground** (bounds, floating, a figure on a ladder) is the card lifted by its height × `PX_PER_M` pixels. The depth cue is the **blob**: the ink ellipse stays on the floor under the body and shrinks with height (`scale = 1 / (1 + 0.6 × heightM)`, opacity from 0.4 down to 0.15 at 3 m). In free fall there is no "under", so the blob becomes a dashed ring at 30% on the nearest deck, telling where the floater is over the plan (my call). A figure mag-booted to a wall is the card turned 90° and set against the wall; on the deckhead it is drawn at the deck's height, head down.

**North and height share the screen's up** (v0.0.8; the user's report of 2026-11-07, "the wind hose doesn't match the wind instructions ? Visually it looks like this as we read and coach tells us 3m/s right"). A point at height y shows where the ground at z − y does, so a thing drawn along north or south on a pole (a sleeve streaming in a crosswind) and one on the ground cannot be told apart by position alone. The rule for anything that must show a direction north or south (a sleeve, later a flag or smoke): it also shows it on the ground, as a shadow straight below (the figures' blob rule: flat, dark three pixels in four, no outline), and it shows which way it faces by its openings (an opening is seen when it faces the camera). PLACES §4.12 gives the sleeve's cues.

### 3.6 Timing and what drives frames

Frames follow the sim, never a clock of their own, so a stopped clock (stop motion, a conversation) holds every frame. **Designed 2026-11-11 (the user's note on v0.0.12)**: the walk, the stances, turning and the close-quarters beats are rebuilt in section 3.10, with three cycles for the user to score. Tradecraft's gun timings stay (`tradecraft/src/render/crowd.js` `gunPose`): `RAISE_MS` 120 (the first part of a turn held lower, the gun coming up), `KICK_MS` 140, `AFTER_MS` 600 (arms kept up), `FLASH_MS` 70; anyone within `FLASH_LIT_M` 3 m lit by `FLASH_LIGHT (1.0, 0.85, 0.55)` for the flash. OLYMPUS adds: a step frame (magazine out, in, charge, check) is held from the step's start to its end as the sim reports it, so a fumbled magazine change visibly takes longer.

**Muzzle flash** (tradecraft `FLASH`: white-hot `0xf6f4ee`, then `0xf8e08a`, then an `0xe7b84a` tip) is an unlit instanced card at the muzzle. In thin air the flash is a little larger (less air to quench it; my call: × 1.2 at 40 kPa and below); in vacuum there is a short bright flash and a puff of propellant gas as a grey 3-frame spray that does not linger; with a suppressor, no flash card. Ejected brass is a glint thrown on the sim's arc (in low g it flies far and slowly).

**As built in v0.0.5** (`look.js` `FLASH_MS`, `KICK_MS`; `src/render/range.js`; `atlas.js` `flashStrip`): the flash and the kick run on game time from the shot, so stop motion freezes them. **`FLASH_MS` 100** (two ticks: at tradecraft's 70 its strong part fell in a tick never drawn, and a tapped Fire showed none). Your own shot's flash is **a star at the drawn muzzle, over the figure**: 9 × 5 pixels for its first tick, 5 × 3 for its second, drawn after the figures in three's transparent pass (a 4 × 3 px flash under the chibi's chin had not read); Mars's `MARS_FLASH_K` 1.2. The flash and a case's launch are held on the **drawn** muzzle and the drawn bore, not on WEAPONS §6.1's muzzle tip, which is a full-size body's (the chibi holds its rifle lower and draws it longer: prone, its muzzle is 10 px further along); the sound keeps the sim's. `KICK_MS` 140. **The blast's dust** in front of a prone or kneeling muzzle and **the cases** two pixels with a first-tick glint are section 2.12's.

**As built in v0.0.6** (`src/art/figures/templates.js`, `compose.js`; `src/render/range-items.js`; the build sheet 0.0.6 §9 items 37 and 38; the user, 2026-11-07: "on the gun drawing, the magazines are very long, if they could be a bit slicker it would be nice"). **The figure's magazine is one reference pixel wide**, stepping forward as it goes down, two below the receiver: 2 cells at 16 px/m (12.5 cm below the well, 6 cm front to back) and 7 at 24 px/m, where v0.0.5 drew 4 and 12; the doll's rifle takes the same shape, and a loose magazine in the hand is three quarters of the magazine's length, a pixel thick at 16 px/m, two at 24. **A tracer** lying on the ground is brass with a red tip (`brassPixels`, `SHAPES.tracer`). Fired, its trace proper lights only at `TRACE_FROM_M` 30 m (WEAPONS §2.3), past the 25 m card, so by day the shot draws the igniter's dim ember: a dotted dull-red streak (`EMBER` 0x8a3a2e, every other pixel) `TRACE_STREAK_M` 3 m behind the round as it flies at 790 m/s from the drawn muzzle to the card's centre, 32 ms at 25 m, one or two frames at 60 Hz; the bright `TRACE` only past 30 m. Lit by the light where it is drawn, the ember reads pale against the daylit regolith (section 18, question 13).

**As built in v0.0.7** (`src/art/figures/poses.js`, `atlas.js`, `src/render/figures.js`; the build sheet 0.0.7 §2.4). **The sitting frames**, a seated band of their own laid on the base sheet's last shelf after `float` (so the sheet keeps its 512 × 752 and its 40 looks at 16 px/m): `sitAim`, `sitFire` (in `FIRE_FRAMES`, so a sitting shooter has its flash card), `sitLow`, `sitCharge` (the charging handle, the release, a press check) and `sitMagout` (a magazine in or out); at 16 px/m the seated R-7 reads as a compact low crouch, its knees not distinct (a later look round may improve it). **The hurt and aid frames**: `hurt` (in the lying band), a casualty on the back, a knee up and a hand at the wound; `aid` (in the rest band), the corpsman on the right knee over them, both hands forward and down. **Every actor's stance is drawn**, the relay's prone and sitting with the player's. The figures prepare the seated band for armed looks; **a rifle drawing ordered for a figure with no rifle slot is ordered again later**, and **a figure whose drawing is not ready yet is drawn from its 'twin'** (the same figure with the magazine in or out), so nothing pops.

### 3.7 The atlas

Requirements for TECH's renderer (the implementation is TECH's, §9.4):

- Tradecraft's design is kept: GPU-allocated atlas filled by sub-image copies (`copyTextureToTexture`), never re-sent whole (the user, 2026-10-29: "each time I turn it staggers almost a second"); one `InstancedMesh` for everyone on screen with per-instance cell and light tint; blobs and flashes as two more instanced draws.
- **Bodies are shared by look; colours and heads are per person** (my call). It replaces one sheet per person, which cannot hold the busiest scenes: the 180 drawn in `mess-noon` (TECH §16.7; CONTRACTS §8) at a typical 60 frames × 4 facings each would need 427 MiB at B, against the 128 MB TECH §16.4 allots, and a full atlas means bands evicted and recomposed mid-play, which is the upload hitch the user saw on Windows (2026-10-29).
  - **A look** is the key `(variant, build, top kind and sleeves, kit silhouette, slung or holstered weapon)`: everything that changes the body's outline. The kit silhouette is what stands proud of the body: a battle belt, a plate carrier, a pack, a suit shell, the dump pouch's side, a taped antenna. Everyone of one look shares its bands, so a platoon of 42 in utilities with slung rifles is six looks, one per build.
  - **Bodies are painted as role indices**, not colours: one byte a pixel, `role × 8 + tone` (tone 0 to 4 the five shades the shading rules give, 5 to 7 spare; index 0 transparent; upper-case roles resolve to their shade at paint time, as now). The crowd shader looks the index up in the person's **colour row**: 256 RGBA8 entries in a small texture of `MAX_PEOPLE` rows (256 rows, 256 KiB), built on the CPU from the person's spec (skin and hair families and steps, the uniform and its pattern, the kit's colours, the team's tape), every entry a palette colour. Fixed roles (ink, the lens glint, blood) map to the same entries in every row, and the glow role `¤` writes as emissive. The light tint, the fog and the snap then run as before.
  - **Heads are per person**, in a head band: 4 facings × 6 states (level, looking up, looking down, eyes shut, mouth open, strain), plus 4 lying and 8 tumble rotations, 36 cells of 24 × 24 px at B (16 × 16 at A). A head is the face, the hair (so hair at the nape and a bun show under a helmet), the headgear and the visor; a change of headgear is a second head band. The pose table gives each frame's head offset, and each person is **two instances of the one instanced draw**, body then head, the head card 1 cm nearer the camera. Both write the person's part ID, so the outline pass draws no line at the neck.
  - Composite frames (the fireman's carry, a casualty dragged) are painted per pair, as a band of their own; they are rare.
- **Bands, not sheets**: a look's frames are allocated in bands (street, drill and PT, weapon class, stance, casualty, gravity regime, couches and private things, fight), each band a slot in an LRU, so a sleeping crowd costs no weapon frames. The atlas is an array texture (`DataArrayTexture`) of 4096² R8 layers, 16 MiB each (TECH §9.4 and §16.4 take this budget; CONTRACTS §7). v0.0.2 draws from one RGBA8 4096² texture, 64 MiB, a slot per look's whole sheet and the glow class in the alpha byte (`src/render/figures.js`), until these bands land with the crowd port.
- **Band sizes**, from the frame catalogue of 3.4 (a cell is 2,592 px at B-chibi and 1,152 px at A-chibi; long cells are the same size):

| Band | Cells (frames × 4 facings) | KiB at B | KiB at A |
|---|---|---|---|
| street | 92 | 233 | 104 |
| drill and PT | 84 | 213 | 95 |
| rifle (one weapon class) | 188 | 476 | 212 |
| stance | 60 | 152 | 68 |
| casualty | 64 | 162 | 72 |
| gravity regimes | 96 | 243 | 108 |
| couches, racks and private things | 28 | 71 | 32 |
| fight | 72 | 182 | 81 |
| one head band (36 head cells) | 36 | 20 | 9 |

- **Per scene**, for TECH §13.4's bench scenes at TECH §16.7's drawn counts (live in view plus ghosts; CONTRACTS §8), counting six builds per outfit, a head band for everyone drawn and every band any wearer of a look could need (the worst case):

| Scene | People | Looks | Bands per look | At B | At A |
|---|---|---|---|---|---|
| `squadbay-night` | 14: the squad and the fire watch | 7 | sleepers in PT kit: racks and street; the fire watch: street | 2.3 MiB (0.14 layer) | 1.0 MiB |
| `parade-platoon` | 62: the platoon's 42 and 20 passing | 24 | the platoon: street, drill; the passers-by (utilities, PT kit, ship greys): street | 7.9 MiB (0.50) | 3.5 MiB |
| `range-far` | 48: the platoon's 42 and 6 range staff | 12 | shooters: street, rifle, stance; range staff: street | 7.4 MiB (0.46) | 3.3 MiB |
| `mess-noon` | 180: 48 persistent, 12 puppets, 100 crowd, 20 ghosts | 54: utilities (sleeves down, rolled), PT kit, ship greys, cooks' whites, four contractors' cuts | street | 15.8 MiB (0.99) | 7.0 MiB |
| `troopship-battle` (0.2) | 100: 48 persistent, 40 crowd (the crew on watch, another company), 12 ghosts; two head bands each, the worst case | 12 | suited marines (two headgear each): racks and couches, street, gravity; crew: street, gravity | 9.9 MiB (0.62) | 4.4 MiB |
| `europa-street` (0.3) | 160: 19 persistent, 120 crowd, 21 ghosts | 54: eight civilian cuts, the patrol | civilians: street; the patrol: street, rifle | 18.2 MiB (1.14) | 8.1 MiB |
| `cavern-riot` (0.3; COMBAT's `crowd`: 200 civilians in a cavern when shots start) | 256: 24 persistent (the squad, an MP team), 200 crowd, 32 ghosts | 78 | civilians: street, casualty, half of them fight; the squad and the MPs: street, rifle, stance, fight, casualty | 46.3 MiB (2.89) | 20.6 MiB |

  Tier 1's own looks (section 3.9) add at most 16 looks to a scene: 3.6 MiB more of street bands at B.
- **Budget: two layers at A (32 MiB), three at B (48 MiB)**, where TECH §16.4 now counts 128 MB for people (CONTRACTS §7). Only the crowd scene needs more than `europa-street`'s 1.14 layers at B, and `cavern-riot`'s worst case fits at both densities: 2.89 layers at B (0.11 to spare), 1.29 at A. Tier 1's own looks would take it 0.12 of a layer past B's three; eviction absorbs that, because the worst case counts a casualty band for every civilian look and a fight band for half of them at once, which no riot draws.
- **Eviction**: least recently drawn band first, never a band drawn in the last 2 s, never the player's. Standing still in any bench scene evicts nothing, and walking evicts only bands unseen for a minute; the `atlas` test prints evictions a minute in `mess-noon` and asserts 0 while standing still.
- **Composition budget**: `BANDS_PER_FRAME` 2 (a head band counts a tenth), 1.5 ms a band at A and 3.0 ms at B, in the paint worker (TECH §11.2); the player's own figure is never deferred. These are the role-indexed bands' budgets: v0.0.2's whole gait band of RGBA sheets measures 16 to 190 ms in the worker (TECH §11.2), which the worker hides, and which the bands must bring down before crowds of looks arrive (0.0.9). A newcomer whose look is already in the atlas costs one head band: 20 KiB of upload at B.
- `MAX_PEOPLE` 256 people (512 instances with heads), `GHOSTS_MAX` 32 (TECH §16.7; CONTRACTS §8), `MAX_FLASHES` 24.
- **As built in v0.0.4**, still v0.0.2's one RGBA8 4096² atlas with a slot per look's whole sheet: the move and rest bands grew a look's sheet to **512 × 752 px at 16 px/m**, so the atlas holds **40 looks** (64 before) at 16 px/m and 15 (25) at 24. A sleeper in a berth uses no look (the berth's own drawing), and the squad in PT kit and utilities at the klaxon needs about 27, so 16 px/m is comfortable; at 24 px/m, a test density, a squad all dressing at once could pass 15. The role-indexed bands above are what lifts that limit.
- **As built in v0.0.5** (`atlas.js` pools, `src/render/figures.js`): the rifle's three bands (section 3.4) are a **pool of their own**, a second, smaller sheet a look gets only when it first handles a rifle (896 × 152 px at 16 px/m, its three bands side by side), kept in the atlas's rows the base sheets leave below them: **8 rifle sheets at 16 px/m and 9 at 24**, the base looks unchanged at **40 and 15**. A full pool gives the rifle sheet unseen longest to the look that needs one; its owner keeps its base sheet. The figures sample's lineup sits at exactly the 15 looks of 24 px/m, so a new entry in `OUTFITS` breaks that density's lineup until the role-indexed bands land (the range staff's dress is a duty dress for that reason).

### 3.8 Over people

| Mark | When | Look |
|---|---|---|
| F keycap | someone within reach of F | tradecraft's keycap plaque over the head |
| Name plaque | a person whose name you know, while you look at them (E held) or while F reaches them | 3×5 (A) or 5×7 (B) pixel font: "LCPL OKAFOR"; only what you have learned (PEOPLE) |
| `?` / `!` | an NPC half-noticing you / having seen you | tradecraft's bubbles |
| Speech balloon | scripted speech | over the speaker, 16 s, lifted clear of other tags (the user, 2026-10-27: "speech bubbles for scripted speech, they should linger as long as when using the top left text") |
| Radio speaker | someone talking on the net who is in view | a small `◉` over their head while the radio box shows their line |
| You | the player, when crowded (a formation, a mess line) | a caret over your head |

### 3.9 Telling your people apart

Your squad wears the same utilities and helmets, rank marks never read at sprite size, and names show only with E held or within F's reach (3.8). Thirteen people dressed alike would read as clones, and you could not find Okafor across the parade deck (a name for whichever squadmate the roster drew: every person is generated, the user, 2026-11-05, "All people generated"). The user asked in tradecraft that haircuts differ "so who's who reads at a glance" (2026-10-26). So (my call):

**Every tier-1 person has at least two differences that read at sprite size and survive the helmet**, chosen at roster generation by hash so that no two people of one squad share the same pair:

| Difference | Lives in | Survives a helmet | Survives a sealed suit |
|---|---|---|---|
| height and build (the six builds of 3.2) | the look | yes | yes |
| skin tone (eight steps across the skin light and skin deep families) | the colour row | yes (face and hands) | the face behind the visor, at B |
| hair at the nape, a bun, a braid | the head band | yes | no |
| sleeves rolled or down, where the uniform of the day leaves the choice (SETTING §5.7) | the look | yes | no |
| a kit habit: the dump pouch on the other hip, a taped antenna, a knife on the carrier, a towel round the neck in the bay | the look | yes | the antenna and the knife |
| the fire team's tape: a 1 px band of the team's colour round the helmet's back, and a tab of it on the suit's shoulder | the colour row | yes | yes |
| a gait: a stride of 0.15 to 0.18 m a frame (round tradecraft's `STEP_M` 0.16), an idle sway's phase, a 1 px lean | per instance | yes | yes |
| PEOPLE's quirk where it has a figure cue (push-ups when nervous, a rock from home turned in the hand) | its frames, when the quirk fires | yes | some |

**As built in v0.0.3** the rule is narrowed to what the figures draw: every pair of a rifle squad differs in at least two of skin, hair style and hair colour (`src/data/people/looks.js`, redrawn on the squad's stream up to 10 times). With the kit's 4 skins and its cuts (crew, short and bald for men, a bun or short for women) that cannot hold for a squad of 13 men or of 9 or more women: 1.67% of squads over 80 worlds, where the generator keeps the clashes fewest. **Open** (VIEWS's to settle, with the art): add height or build as a fourth attribute the figure draws, or more cuts.

**As built in v0.0.6** (`src/data/people/looks.js` `CUTS`, `src/sim/people/roster.js`, the art; CAREER §2; the user, 2026-11-06: "this haircut is not military acceptable, we should have to groom our hair the same way we will have to groom our beards and a soldier with half balding hair would 100% go fully shaved head for service"). **The cuts are CAREER §2's seven regulation cuts**, and men and women share none: men high and tight, low regulation, medium regulation or a shaved head; women a regulation bun, short, or a braid pinned up. v0.0.4's horseshoe `bald`, its `crew` and a man's `short` are gone from the data and the art (`LEGACY_CUTS` maps them on load). The squad rule runs over the seven, so a squad has **16 (skin, cut) pairs for men where it had 12**, and a squad that cannot be told apart is 3 in 720 (0.42%, was 1.31% on the same measure). **A thinning man is shaved** (`look.hair.thin`, drawn by hash against CAREER §2's `THIN_P`), and every shaved head is drawn alike, never as a horseshoe. **Each cut is drawn at four steps**, fresh, growing out, due and out of regulation (BODY §6's hair), each at least 2 px from the next on the head at 16 px/m: a man's sides go from skin to a shadow, a dark and the hair's colour, and his top stands a pixel taller out of regulation; a woman's short cut grows a row a step, and a bun or a braid works stray pixels loose at the last step only; under a cover a man's sides show below it, and a cut is never drawn over a cover. **The hairline** (the hair's lowest pixel over the face) is drawn in the skin's shadow rather than the hair's darkest (`shade.js`), and high and tight and low regulation are drawn narrower than the head from the front, skin at the temples, so a fresh blond cut in the bay's light no longer reads as a tan cap with a brim (the design review's, the fixer's). A squadmate's drawn step (`actor.hair`) changes only out of your sight (PEOPLE §6.2). The cuts' look waits for the user's scores (`samples/cuts/`, section 18).

Anyone you may meet suited has two of the suit-proof ones (build, the tape, the gait). The fire team's tape is a field practice, not a unit patch; if SETTING refuses it under its rule "you know a unit by its people" (§5.7), another row stands in. Tier-1 looks that differ only by a habit are looks of their own (at most 16 in a scene, counted in 3.7).

**The check.** The `sprites` test composes every tier-1 person's idle frame facing down, in their colours, at the picked density, with the helmet on and with it off, and asserts that every pair differs by at least `RECOG_PX` pixels: 40 at B and 20 at A, about 4% of a figure's 1,000 and 450 opaque pixels (my call). It prints the closest pair and their count.

### 3.10 Locomotion and action, rebuilt: three walk cycles to score

**Designed 2026-11-11 (the user's note on v0.0.12)**, to build in the shoot house rework (ROADMAP §4.2's rework row, stages R2 and R8; COMBAT §25.19.7; the sim's side is BODY §16.8). The user: "saying that the walking about is goofy is an understatement, the animation is really not there yet." The animation audit (`.run/rework1/anim/`) found three stacked causes: the #2 is never animated (idle on all 496 of his moving ticks, his drawn place a 20 Hz sawtooth, median 9.9 px, max 23.7); a four-frame cycle that reads as two, with no bob, a frozen torso, standing on tiptoe and sliding feet (30% slip in the stroll, 46% in the run); and the stances drawn with the wrong cycles (Assault's legs at 2.26 steps a second against Combat's 5.1, the aim walked at low ready, every change a cut). The design is the animation role's (`.run/rework1/anim-design/`: `cadence.mjs`, `cycles.mjs`, `layout.mjs`).

**The constraint.** The chibi is life-size in height but its legs are 6 px: the hip 0.375 m up, thigh 0.1375 m and shin 0.1125 m, a boot 0.125 m tall and 0.31 m long (`body.js` CHIBI). At BODY §16.1's 1.23 m/s (Combat) and 2.03 m/s (Assault) a human takes about two 0.6 m steps a second; the chibi's leg swung ±0.5 rad spans 0.24 m. Either the cadence rises (short honest steps), the boot rolls (the body travels further over a planted foot), or the feet slide. **No candidate slides**; they differ in how they buy the stride. Flight is the way out for the fast gaits: in the air no foot can slip, so steps lengthen and the cadence falls.

#### 3.10.1 First, whatever the cycle: every mover fed to the view (stage R2; no art change)

- **The locomotion record** (BODY §16.8) for every actor that moves, the #2 and the instructor included; `figure.js` passes `gait`, `strideM` and the new fields through for anyone moving (today it forces `'idle'` on every non-player with a service record).
- **The brake, not the cut**: a contact halt brakes at the body's brake (BODY §16.2) instead of dropping 0.8 m/s to 0 in a tick (8 times for you and 9 for the #2 in one lane); the instructor's walk takes the same push and brake.
- **Pre-painted bands**: every band a scene's armed movers need is painted before GO; in close quarters no figure ever falls back to idle0 or is "not drawn yet" (`figures.js` `deferred`; my call).
- **The aim drawn as an aim**: `poses.js` `gaitCarryOf('aim') → 'low'` goes; until the aimed bands exist, `aim` maps to `high`, never `low`, so the picture never shows a muzzle down that the sim holds level (half of the user's "goes low ready … but we still get flagged").
- **One person, one outline**: each drawn figure gets its own part id in the post pass's id buffer (a slot index mod 7), so the ink falls between #1 and #2 in a stack (`cards.js` PEOPLE_PART, `post.js`; my call). The "one blob" question of section 7.4's v0.0.12 note.
- **Tests** (node, the lane headless, each printing its numbers): the #2's drawn gait non-idle on 100% of his moving ticks; each mover's drawn position monotonic along its travel, no tick's drawn step over the sim's plus 1 px; no armed mover undrawn after GO; no speed drop over 1.5 m/s in a tick but a hit or a fall.

#### 3.10.2 The machinery: frames by distance, the gait phase, the plant lock

- **Frames follow distance**, as now (stop motion holds every frame), counted in **steps of the band in use** through the gait phase `gp` (BODY §16.8), never a fixed `STEP_M` per frame name. A band change (Combat to Assault, or the walk to the lope at Froude 0.5) keeps `gp`: the same foot stays forward.
- **The pose model: feet, not angles.** A gait key gives each foot's target (forward and up in metres from the pelvis's ground point, and the boot's pitch: heel strike toes up, flat, heel off) and the pelvis's offset in pixels; `compose.js` solves each leg by the two-bone IK it already uses for the arms. **Grounding is the planted foot's sole on the floor**, not "the lowest heel, toe or knee" (`compose.js`), which ends the tiptoe and the 1 px pop between every walk frame and the idle. The held frames (idle, low and high ready, SHOOT's split stance) are re-keyed the same way and share the gait's pelvis height: Relaxed 0 px, Combat and Assault −1 px, the knees bent.
- **The plant lock** (the view): each gait frame reports its planted foot and its pixel, as `composeFrame` reports the muzzle. On the frame a foot plants, the view records its world position; on every later frame of that step the card is placed so the planted foot sits exactly there, the pelvis moving over a fixed foot in whole pixels baked into the frames: **slip zero by construction**. In flight and while standing, the card is at the sim's interpolated place. It re-anchors at each contact, a heading change over 20°, a stop, or a drawn place 0.1 m from the sim's. The drawn body lags the sim by at most a frame's travel (1 to 2 px, 0.06 to 0.11 m), the order of the pixel snap it replaces (my call: "visuals obey the sim" within a pixel).
- **The camera** follows the sim's continuous place, so your own card steps by at most 1.5 px against a smoothly scrolling world; the sample has a toggle for a camera on the plant-locked figure, for the user to judge (my call to test, not to decide).
- **Legibility**: the far leg one shade darker (`shade.js`), so the swapped half of the cycle is a different picture; front and back, the shoulders and rifle sway 1 px toward the stance leg on Down and the swinging foot lifts 1 px on Passing, so the step reads along the camera's axis. **Front and back the stride is drawn at `DEPTH_K` 0.4** of its length, which leaves 5 to 11 px a step of on-screen foot movement in every candidate (W0 4 to 7): no plant lock removes it unless the legs are drawn with a depth factor of 1, a call for TECH and this section after the scores.

#### 3.10.3 The keys of a step, and flight from physics

| Key | Planted foot (from the pelvis) | Swing foot | Pelvis |
|---|---|---|---|
| **Contact** | the new foot at +S/2, heel strike, toes up about 0.25 rad | the old one at −S/2, on its toe | 0 |
| **Down** | +S/4, flat, knee flexed about 0.3 rad | off the ground behind | −1 px |
| **Passing** | 0, under the hip | beside it, lifted 1 px (2 in C) | 0 |
| **Up** | −S/4, heel rising | reaching ahead, 1 px up | 0 (Relaxed +1 px) |

Each frame moves the planted foot back exactly S/4: the plant lock's travel a frame. The second step mirrors the legs, never the rifle. In a gait with flight, Up becomes **Push-off** and a fourth key, **Flight**, has both feet off, the trailing knee tucked, the card lifted by the ballistic height `4h × u(1 − u)` (u the flight's share), computed from the sim's speed and gravity (BODY §16.8), so a lope in stop motion hangs in the air.

#### 3.10.4 The candidates, and the gallery's measure (`samples/walk/`, group W)

All three share the machinery above, so the score picks only the cycle's keys; the other two are deleted after the scores (tradecraft's way), `poses.js` carrying them behind one `CYCLE` constant only while the sample stands. The sample (built 2026-11-11 in the tree, uncommitted; `src/art/figures/cycles.js`, not imported by the game, with additive hooks in `compose.js`: `opts.pose`, `pose.feet`, `pose.sway`, `pose.farShade`, and `feet` returned only for a given pose) draws every frame with the game's figure code at 16 px/m in the black combat EVA suit with the R-7 on the house's slab floor at 1 G, the Combat glide at low ready (1.23 m/s) and Assault aimed (2.03 m/s), side on, front and back (the stage's 45° camera's three-quarter views; eight facings out). Live (the gallery's O): Space runs time, S a quarter speed, F the footprints (each sole printed where it lay flat: a clean dash held, a smear slid), R again.

| View | Candidate | Steps, cadence, frame rate (measured) | Slip side on | Head and muzzle range |
|---|---|---|---|---|
| **W-a** | **W0, v0.0.12 as built** (the reference) | glide 5.1 steps/s, 10 fps; Assault 2.3 steps/s, 5 fps, drawn at low ready | 4.7 px a step (glide), 7.3 (Assault) | 2 px (Assault) |
| **W-b** | **A, "Eight, planted"** (the animation audit's recommendation): 8 frames a cycle, steps of 4 and 5 px with flat feet and a small heel strike, the body 1 px down on Down | glide 4.9 steps/s, 20 fps; Assault 6.5, 26 fps | 0.0 px | 1 px |
| **W-c** | **B, "Eight, rolling"** (doctrine's heel-to-toe glide): 8 frames, the boot rolling heel to toe on its 0.31 m, steps of 6 and 7 px, the pelvis flat in Combat and Assault (the turret) | glide 3.3 steps/s, 13 fps; Assault 4.6, 19 fps | 0.0 px | **0 px** |
| **W-d** | **C, "Six, bold"** (pixel-classic): 3 keys a step, steps of 5 and 6 px, the body 1 px down on the passing | glide 3.9 steps/s, 12 fps; Assault 5.4, 16 fps | 0.0 px | 1 px |
| **W-e** | the four side by side: treadmills in both bands and the three facings on one clock, then each side on, a picture every 1/12 s for a second | | | |
| **W-f** | the same four in the range's utilities, where the legs show | | | |

As built in the sample, C's 2 px knee lift was not possible with the pelvis 2 px down (the passing foot clears the floor by 1 px, the knee folded to its limit), and its 1 px muzzle dip on contact is not drawn. Painting: A and B 64 cells a look (2 bands × 4 facings × 8 frames) in 18 to 25 ms in node, C 48 cells in 12 ms (about 0.3 ms a cell).

**A look finding for the user**: in the black suit at 16 px/m the legs are near-black on near-black (the suit's legs take the skin tone 0x1c1e24) and the side-on low-ready rifle covers them, so the stride barely reads in any candidate and the far leg's darker shade is invisible; W-f shows the same cycles reading clearly in utilities. Lighter leg shells or lit knee and shin plates on the suit may matter as much as the cycle (a question with the scores).

**The designed numbers by gravity** (from `cycles.mjs`; speeds `gaitSpeeds` as built; S the planted travel; steps in m, cadence in steps a second, frames a second):

| Place, gait | Speed m/s | Fr | Band | Flight, apex | A | B | C |
|---|---|---|---|---|---|---|---|
| 1 G Combat glide | 1.23 | 0.17 | walk | none | 0.25, 4.9, 20 | 0.38, 3.3, 13 | 0.31, 3.9, 12 |
| 1 G Assault | 2.03 | 0.45 | walk | none | 0.31, 6.5, 26 | 0.44, 4.6, 19 | 0.38, 5.4, 16 |
| 1 G walk (Relaxed) | 1.45 | 0.23 | walk | none | 0.31, 4.6, 19 | 0.38, 3.9, 15 | 0.31, 4.6, 14 |
| 1 G run | 3.60 | 1.42 | run | 183 ms, 0.7 px | 0.97, 3.7, 15 | 1.10, 3.3, 13 | 0.97, 3.7, 11 |
| Mars glide | 0.97 | 0.27 | walk | none | 0.25, 3.9, 16 | 0.38, 2.6, 10 | 0.31, 3.1, 9 |
| Mars Assault | 1.60 | 0.74 | lope | 268 ms, 0.5 px | 0.74, 2.2, 9 | 0.87, 1.8, 7 | 0.80, 2.0, 6 |
| Mars run | 2.69 | 2.09 | run | 483 ms, 1.7 px | 1.61, 1.7, 7 | 1.74, 1.5, 6 | 1.61, 1.7, 5 |
| Europa walk | 0.88 | 0.64 | lope | 763 ms, 1.5 px | 0.98, 0.9, 4 | 1.05, 0.8, 3 | 0.98, 0.9, 3 |
| Europa run | 1.97 | 3.19 | bound | 1,374 ms, 4.9 px | 3.02, 0.7, 3 | 3.14, 0.6, 3 | 3.02, 0.7, 2 |

In every candidate cadence and step rise with speed, Combat is slower-legged than Assault, Mars runs at about half Earth's cadence, and the run's cadence falls into the human band through flight. A's Assault at 6.5 steps a second is the honest-leg price, the reason B and C exist. **My default until the score: B** (the turret's 0 px gun line and the cadence nearest a human's; my call).

**Questions with the scores**: which cycle reads as a marine in each stance (score each); a bob on the gun line in Combat and Assault at all (B says no); the camera on the plant lock or on the sim; eight facings in a later round; the suit's legs.

#### 3.10.5 The stances, and shooting on the move

Doctrine (FM 3-06.11 §3-15a, §3-23b; TC 3-22.9 §9-13): a flat pelvis, short strides, bent knees, the head up, the muzzle where the eyes look.

| Stance and carry | Body | Rifle | Bob |
|---|---|---|---|
| Relaxed, slung or low ready | upright, lean 0.03 | slung bounces 1 px with the pelvis; free arms swing | 1 px |
| Combat glide, low ready | knees bent (−1 px), lean 0.10 | **a turret**: locked to the torso at −40° | A 0 to 1 px; B 0; C 1 with a 1 px dip on contact |
| Combat glide, high ready | as above | muzzle up 45° (the stack's #1 on the approach) | as above |
| Combat glide, aimed | lean 0.12 | shouldered; **the muzzle's pixel row constant** across the cycle | 0 in A and B, 1 in C |
| Assault, aimed | −1 px, lean 0.15 to 0.18, a longer rolling step, no flight under Fr 0.5 | shouldered turret | B 0; A and C 1 px of the upper body on Down |
| Run | lean 0.2 | the carry's | the flight's lift |

Counter-motion with both hands on the rifle: side on, the shoulder opposite the leading leg 1 px forward on Passing; front and back, the 1 px sway; the rifle moves only with the torso. **The shoot-on-move gait** (FM §3-21c: "engagements must not slow movement"): aimed bands for the glide and Assault (8 frames, 6 in C); four `fireMove` frames, one a quarter of the cycle, swapped in for `KICK_MS` 140 on a shot, the legs never stopping and the flash on the drawn muzzle (section 3.6); a step the sim shortens while firing slows the frames by itself.

#### 3.10.6 Turning, side-steps and walking backwards

- **The order of a turn** (TC 3-22.9 §9-12, §9-13): the eyes, then the muzzle, then the body. The view draws **the facing from `bodyRad`** (BODY §16.8), never from `headRad`, which snaps up to 168° in a tick.
- **Hysteresis**: the facing changes when `bodyRad` passes **55°** off the current facing's axis, not 45° (you changed facing 28 times a lane in v0.0.12, 8 within 250 ms of the last: the dither at 45°, exactly where a room's corners lie from a doorway). A 180° turn shows the middle facing for the middle third of its time. The gun's turned frames (`aimhi`, `aimlo`) cover the ±55° between facings.
- **Legs by the travel's angle to the body** (14% of your moving ticks and 20% of the #2's were crabbing drawn as walking): within ±55° of forward the band's cycle; within ±55° of backward **the same band reversed** (`gp` decreasing; no backward band, my call); otherwise **the side-step**, 2 keys a step (the lead foot out 4 px, the trail in 2 px), S 0.25 m, the feet never crossing.
- **A turn on the spot** of 90° or more plays a **pivot**: one Passing frame of the new facing over the turn's middle third, by the turn's own sim time.
- **Eight facings** are not in this round (my call): hysteresis cures the dither and diagonals double every band; a sample once the cycle is chosen.

#### 3.10.7 The close-quarters beats (each driven by its sim beat's time or distance, so stop motion holds it)

- **The stack** (CALL 97-20; FM §3-18): **`stackLead`**, #1 crouched (−1 px, knees 0.35 rad, lean 0.12), bladed to the door, aimed or at high ready; **`stackLow`**, #2 tight behind (0.65 m), the same crouch, low ready, **muzzle down**; **`stackTap`**, the #2's support hand on #1's shoulder for 300 ms of the squeeze, then back: the visible beat the user missed ("Partner does nothing … or at least doesn't animate doing it"). **Breath while held**: a 1 px upper-body drop on the exhale at the person's breath rate (the view already reads `breathS`), phase hashed per person; held in stop motion.
- **The door**: **`doorHand`** (the support hand at handle height, the rifle one-handed at high ready) for the door step's hand time; **`kick` × 3** (chamber, strike, recover) over the kick's 1.2 s, a failed kick returning to the stack frame.
- **Push-off**: the first 0.1 m from a standstill plays **`start`** (a lean-in, the lead foot lifting), about one frame; then Contact with `gp` 0.
- **Through the funnel**: the aimed Assault cycle without a stop, the facing following `bodyRad` by the hysteresis, side-steps where the muzzle leads the travel, shots by `fireMove`.
- **The plant at the point**: over the braking distance `v² / 2a` (0.35 m from Assault at 5.88 m/s², 0.13 m from Combat), a Down with the lead knee flexed, then **`plant`**, whose feet are SHOOT's split stance, then the held aim. SHOOT's stance is re-keyed to the gait's Contact spread. If the sim still cuts a move short, the view re-anchors and plays `plant` over the next tick of sim time, never zero frames.
- **Gun down and the kneel**: kneeling by the step's k (500 ms × `paceOf`), 0 to 0.4 **`kneelGoing`** (the left foot forward, the right knee halfway), 0.4 to 1 `kneel` or `kneelLow`, standing the reverse (today the stance applies at its end, a pop); from a walk, the plant first. Gun down is the kneel and the kneeling handling frames (`kneelCharge`, `kneelCheck`, `kneelMagout`, `kneelMagin`), the rifle canted port-up, then `kneelHigh` until the stand.
- **The transition** (COMBAT §25.19.6): `draw` and `pistolAim` frames, the rifle hanging on its sling, and the holster's reverse.
- **The #2's admin**: LOAD, MAKE READY, UNLOAD and SHOW CLEAR are frames already in the rifle pool (`magout`, `magin`, `charge`, `release`, `pressCheck`, `lowReady`); driven through them by COMBAT §25.19.5's macros, he animates with no new art, frame for frame as you do on the same sub-step.

**Every pop, with its fix**: idle to walk 1 px (one pelvis height a stance); the planted foot creeping and snapping back at 9 to 10 Hz (the plant lock); the stop's legs and rifle in one picture (`plant`); a halt from 0.8 m/s to 0 in a tick (the brake); Combat to Assault halving the cadence (a band each, `gp` kept); the aimed walk at low ready (aimed bands); a carry change on the move a new sheet (the stance pool painted before GO); the 168° flip and the 45° dither (`bodyRad`, hysteresis); the kneel at its end (`kneelGoing`); the #2 gliding (the locomotion record); a still stance change (the existing `raise` frame over its `toAimS`).

#### 3.10.8 The atlas

- **The base pool keeps its 512 × 752**: the stroll's own 4 frames go (the stroll is the walk band at its speed, my call); re-shelved as `gait` (idle 2, walk 8, bound 4, look, glance: 16 cells) and `move` (run 8, stairs up 4, down 4: 16 cells). C's six-frame cycles fit with 4 cells to spare. Every unarmed crowd figure gets the new walk and run at no cost in looks.
- **A stance pool** for looks that move in a stance (the armed close-quarters figures), painted before GO: glide at low ready, high ready and aimed, Assault aimed (8 each), `fireMove` 4, the side-step 4, `start` 2, `plant` 2, the stack 3, `kneelGoing` 2, the breath twins 3, the door and kick 4: **56 cells, 896 × 288 at 32 × 36** (C: 48), plus `draw` and `pistolAim` (2) with the pistol.
- **Where it goes**: no room today (40 base looks and two rifle rows leave 32 px). **Option 1 (my preference)**: the people's atlas becomes a two-layer 4096² `DataArrayTexture`, base looks on layer 0, rifle and stance pools on layer 1, still one instanced draw (TECH §9) with a layer index an instance, room for a full enemy cell later; 64 MB more GPU memory, to be judged on Windows ANGLE over D3D11 (TECH's call). **Option 2**: give up one base row (32 base looks, 8 stance sheets, 12 rifle sheets); whether 32 looks are enough for the bay at muster is TECH's to count. At 24 px/m the stance sheet is 1344 × 432.

#### 3.10.9 Acceptance (once a cycle is chosen; node, the art and the headless lane, each printing its numbers)

1. **Slip**: every band and facing's planted foot moves exactly its frame's travel against the pelvis; with the plant lock its screen pixel is unchanged through its stance, every mover, the whole lane.
2. **No pops**: the held frame, `plant` and the gait's Down and Contact match the designed bob ±0; `start` and `plant` drawn on every start and stop from 0.8 m/s or more; `kneelGoing` on every kneel.
3. **Turret**: the aimed bands' muzzle row range is the design's (0 px in B).
4. **Every mover**: non-idle gait on 100% of moving ticks; drawn within 0.1 m of the sim every tick; no drawn step over the sim's plus 1 px; no facing change within 250 ms of the last unless `bodyRad` moved over 100°.
5. **The muzzle drawn is the muzzle held**: on every tick the drawn carry equals the sim's posture, 0 mismatches (v0.0.12: 333 ticks aimed drawn low).
6. **Cadence**: a bot walking each stance at 1 G, on Mars and on Europa prints steps a second and the band; Combat's cadence under Assault's at each gravity; the 1 G run in 3.0 to 4.0 steps a second.
7. **Nothing undrawn**: every frame an armed mover needs in the house painted before GO, 0 deferred draws; frame times on the Mac and Windows unchanged within the band's allowance (`frameMs`).
8. **Separation**: in a stack along an east-west hall, at least one ink pixel a row between #1 and #2.

**Decisions to log when taken** (my calls): the stroll dropped as a band; the lope's and the run's take-off speeds; the 55° hysteresis; the turn rates; the backward walk as the band reversed; the stance pool and its texture layer; eight facings deferred.

---

## 4. The close figure and the weapon card

### 4.1 Density and display

The close figure (the doll) is a figure of its own, not a sprite blown up, ported from `tradecraft/src/art/doll.js` (903 lines). DESIGN.md calls it "a close figure at double density": its pixel is **half the stage pixel on screen**. Its density per metre is nine times the stage's (my call), so it stands about 40% of the picture's height whichever candidate is picked:

| | A | B |
|---|---|---|
| `DOLL_PX_PER_M` (9 × `PX_PER_M`) | 144 | 216 |
| Canvas | 160 × 288 | 240 × 432 |
| A 1.80 m marine | 259 rows | 389 rows |
| Rifle, 0.85 m | 122 px | 184 px |
| Rifle magazine | 27 px | 41 px |
| Selector lever, 1.5 cm | 2 px | 3 px |
| Collar rank insignia, 3 cm | 4 px | 6 px |
| Displayed height | 144 stage px (40% of 360) | 216 stage px (40% of 540) |

Tradecraft's doll is 64 × 140 at 72 px/m; OLYMPUS's is twice as fine, which is what makes a selector, a chevron and a dressing's tape readable. It is drawn the tradecraft way (the user, 2026-10-31: "improve the character outline, it's not as good as it should be"): each part a polygon whose contour is placed by hand in the figure's own coordinates and smoothed by Catmull-Rom; light and shadow are shapes within the part; five tones per colour (`cloth()`: light, soft, base, shade, deep, with dark cloth lifted 13% toward grey; `flesh()` with warm shadows toward `0x6b2f2a`); a dark seam where a part lies over another; ink round the lot; the figure stands easy, weight on the viewer's left leg. Contours in figure coordinates scale to either density. It is painted only when what it shows changes; the test caps a repaint at 15 ms (section 14).

The backdrop is tradecraft's: wall `0x383c4a`, floor `0x2b2e3a`, the figure's shadow `0x1f2029` thrown a little right. In a suit or in the field the backdrop takes the place's light mood, so a doll opened under battle red is lit red (my call).

### 4.2 What the doll shows

Layers from the skin out: body (undershirt and shorts, never less), uniform (top kind, trousers, boots), belt or battle belt and what hangs on it, plate carrier and its pouches, pack, sling and weapon, holster and sidearm, helmet or cover, or the suit in place of the clothes.

Containers are drawn as part of the gear they belong to, and marked as tradecraft marks pockets: **free** (its seam in the cloth's own tones), **used** (a gold fill under the flap), **shows** (rust: it bulges or something stands out of it). A double magazine pouch shows two baseplates when full and one when half, a dump pouch sags by what is in it, the hydration bladder's tube runs over the shoulder.

Body marks, from BODY's states, as the character sees themselves (BODY gives which and where; the doll draws):

| Mark | Look |
|---|---|
| Grime and sweat | tradecraft's `stain()` in the cloth's darker tones: sweat at the armpits, back and collar after PT; dust on the legs after the field; grime on hands and face by hours since the last wash |
| Wounds | tradecraft's four-tone blood: soaked stains ragged at the edge, fresh drips while bleeding fast, a bullet entry a dark hole with a wet rim and a glint, a round stopped by a plate a grey splash with frayed cover, cuts, gashes, an artery spurting, bruises, breaks as a jag |
| Burns | reddened and blistered skin in the skin's ramp shifted red; charred cloth at the edges |
| Decompression and cold | blotched skin (ebullism) and frost on a breached suit's edge; frostbite whitening fingers |
| Injection sites | a dot and a strip of tape (juice, morphine, an autoinjector) |
| Care | a dressing (a taped pad, or turns round a limb), a tourniquet's strap and buckle high on the limb with the time written on the tape, a splint's staves tied in three places, a chest seal (a clear square with a valve), bleeding inside as a dashed ring round the belly |

**The doll's first cut, as built in v0.0.4** (`src/art/doll/doll.js`, `doll({ look, sex, marks, body: cues, outfit })`): the PT kit or the towel; wet hair; grime on hands, face and cloth by `grimeK`, thickest low on the legs; sweat patches by `sweatK`; stubble by `stubbleK` (none on a body that grows none, BODY §6); heavy eyelids and dropped shoulders at `tiredK ≥ 0.5`; knees in and a hand at the belt at `bladderK ≥ 0.6`; a hand on the stomach at `hungerK ≥ 0.6`.

**As built in v0.0.6** (`doll.js` `HANDS_SHARE`, `HANDS_DIRT`; BODY §6's hands). **The hands** are marked by their band, in the colour of what last soiled them (`cuesOf`'s `handsK` and `handsWhy`): 18% of the hands' pixels once used (dirt 20), 40% dirty (40), 65% grimy (70); grey for the slow rate, the head and a stall, a brown for food, black-grey for gun oil and carbon, rust for regolith. **The hair** is drawn as it has grown: the sheet's and the inventory's dolls take `lookFor(look, outfit, indoors, hairOf(state, pid).step)`, so the doll wears the same cut at the same step as the figure (section 3.9).

Each numbered wound has a plaque at its side with a leader line, as tradecraft's first-aid card (`tradecraft/src/ui/body.js`; the user, 2026-11-03: wounds as "graphical representations (high quality based on inventory screen)").

The same doll draws **other people** on the read card (F → read) and on first aid, with what the character perceives of them (a read failed shows less).

**Hit marks, one helper** (2026-11-07; section 7.7): `hitMarks(state, who, by)` gives the marks of every round that struck a person, as `by` knows them (the shooter's called and seen marks during a fight, the truth after a search, your own wounds as you feel and see them), from WEAPONS §8.7's hit record; this doll, H's (§8.4) and the hit card (§7.7) all draw from it: one quantity, one drawing.

**As built in v0.0.10, the hit marks** (`src/sim/arms/marks.js` `hitMarks(state, key, { k, phase })`, not `art/doll/marks.js`: what the marine believes is the sim's, and the art draws what it is given; the build sheet `docs/build/0.0.10.md` §8 items 15 to 17; my calls): the card's marks are made in the sim from the hit records. **The called point** moves from the aim toward the real hole as Marksmanship rises, `callK(mrk) = clamp(mrk / CALL_MRK 40, CALL_K_MIN 0.2, 1)`, blurred by a hash of up to `CALL_BLUR_CM` 8 cm × (1 − k) (never the dice): a novice calls where he aimed, an expert where the round went (for a hole 17.5 cm off his aim the boot recruit's call lands 7.6 cm from the aim and 12.5 cm from the hole; the tier one's on the hole); a round that missed is called `MISS_CALL_CM` 30 cm from the aim. **A seen mark** is any round that struck the face, drawn at its called point. Its words are the sim's ("FIRE · 1 SEEN" in belief) and its line the coach's ("PAIR · A · A", "Two in the chest. He went down.", never "dead"). Belief during a string (`phase` 'belief'), truth from its end ('truth'): VIEWS §7.7.

### 4.3 The suit on the doll

With a suit on, the doll is the suit: shell, rings at neck, wrists and waist, the pack, the helmet with the visor down (the face behind it lit by the HUD), the chest display, the shoulder lamp, the tether, the patch kit pocket. Seal state per ring is marked (a ring's lit pixel green when sealed, amber when unchecked, red when open). A breach is a small dark tear with frost round it and a jet of vapour while it leaks; a patch is a grey square over it. The suit's own readouts are the HUD's (section 7.2), not the doll's: the doll shows what you see looking at yourself.

### 4.4 The weapon card

A side view of the weapon at doll density: a rifle of 0.85 m is 122 px (A) or 184 px (B) long. It shows, **as far as the character knows** (WEAPONS owns what is known and when):

| Part | Look |
|---|---|
| Selector or safety | its lever drawn at its position: SAFE, SEMI, AUTO or BURST marks on the receiver |
| Magazine | in or out, its kind, its body translucent where the real one is (witness holes or a polymer window show rounds); a magazine you have not counted shows its baseplate only |
| Chamber | the ejection port cover open or shut; if press-checked, a brass glint in the port; a case caught in the port (a stovepipe) drawn when seen; a closed port that was never checked reads "unknown" beside it |
| Bolt | locked back on empty when the rifle does that |
| Optic, light, suppressor, sling | as fitted |
| Condition | fouling as dust specks and carbon on the bolt face and around the port, by WEAPONS' condition and dust; a dry action is matte, an oiled one has a sheen |

Where it appears: in the step panel of the weapon mode (left of the steps), in the inventory when the weapon is selected, on the armoury counter when you sign it out, and in the cleaning splash's close plate.

**As built in v0.0.5** (`src/art/weaponcard.js` `paintWeaponCard({ model, belief, k })`, pure; shown by `src/ui/hud/steps.js`; the build sheet 0.0.5 §8 item 27): the R-7 side on at `CARD_PX_PER_M` 144 (section 4.1's 9 × 16 px/m: the 0.92 m rifle 132 px long), its muzzle to the right, in the step panel's **180 × 148** at its left, **drawn from the belief alone** (`beliefOf`, which returns no truth field: WEAPONS §4.2): the selector's lever toward the believed mode by its three marks (S, 1, A), the one it points at lit, SAFE or SEMI; the magazine in or out, its believed rounds stacked behind the HAD-30's window (its top dithered when the count is approximate) and the count beside it ("≈3" below Weapon handling 15, a 4 × 5 "≈"), its body with the window blind and a "?" on the baseplate when uncounted, "MAG OUT" in the words' colour; the port's cover shut or open, a glint of brass at the port for a round believed in (an orange dummy once one was seen); the bolt's face at the back of an open port when locked back; a "?" by the port for a chamber never checked; an amber "!" for a stoppage felt and not yet looked at (CLICK, DEAD, FELT), and, looked at, a case standing out of the port (a stovepipe) or two rounds in it (DOUBLE). It is drawn at **a whole number of device pixels a card pixel**, cropped by its box, never shrunk (shrunk, "SEMI" had read "<-NT"), its words at twice the letter. The optic and the sling are drawn as fitted; dust and carbon wait for 0.0.8. Its words (`weaponCardModel`) are the card's hover title, and its caption only where the picture cannot be painted. The runtime review put a live round in the truth by hand: the card read "SAFE · 0 + 0 · LOCKED" as believed.

**As built in v0.0.6** (`weaponcard.js`; the build sheet 0.0.6 §9 items 38 and 39; the user, 2026-11-07, the magazines "very long"). **The HAD-30 is drawn shorter and slimmer**: of its 0.21 m, `MAG_HIDDEN_M` 0.045 m sits up in the well and `MAG_SHOWN_M` 0.165 m hangs below it (24 px at 144 px/m and a 2-px baseplate), `MAG_W_PX` 7 px wide (4.9 cm), curving `MAG_CURVE_PX` 8 px forward; v0.0.5 hung all 0.21 m below the well, 9 px wide, curving 14 (416 pixels with its ink and shadow, now 280). **The magazine in your hand is drawn as believed**, held under the handguard, its window to its believed count with the top round's tip (a red nose for a tracer), "?" when nothing is known, and under it its count ("5", "≈5"), its weight's band ("A FEW") or "?", and "TR" in red when believed tracer; the empty well then says MAG OUT by itself; a seated magazine believed tracer reads "5 TR". The card's words add "HAND 5 TR". The rifle is drawn 6 card pixels higher (`Y0` 56) and the floor's line at `FLOOR_K` 0.69 of the card (was 0.62), so a magazine seated or in the hand hangs clear of the SAFE and "5 TR" words (the design review saw it overflow; the fixer's).

**As built in v0.0.8: the zeroing dial** (`weaponcard.js`, `src/ui/plaque.js` `distanceParts`'s `zeroing` option; kdNow's `zeroing { from }`, shot.js `zeroingOf`; the user, 2026-11-07: "I dialed in the coaches corrections, the UI still says that I'm on zero ?"). While the rifle is being zeroed (the KD course's 25 m zero, until the coach accepts it or its UNLOAD, SHOW CLEAR writes it down), the dial row over the rifle reads "ZEROING ▲4 ◀2", or "ZEROING · NONE" before a click: the clicks from the turrets as issued, counted from the issue setting rather than from the believed sight (WEAPONS §11.4). The caption and the hover say "zeroing, 4 clicks up and 2 clicks left dialled this zero". After acceptance the row is the dial from the believed zero, as in v0.0.7. A "·" glyph was added to the card's `EXTRA` font.

**As built in v0.0.13: the weapon card as scored** (`src/art/weaponcard.js`, `rifles.js`, `src/ui/hud/steps.js`, `main.js`; the user's picks of 2026-11-08; WEAPONS §3.10 holds the look):
- The rifle is the model's design in the gun's finish (`rifles.js` `drawingOf(key, finish)`). `main.js` reads the finish from the item by its id (`finishOf`), never from the belief (the ui-truth rule), and passes it as the step panel's `view.finish` (part of the panel's repaint signature) and as `paintCard`'s third argument.
- No sling is drawn. The HAD-30 is 9 px wide, curving 5 px, its window 2 px.
- The R-7's flip magnifier is in line at the believed 4× and swung down at 1×. At distance the elevation turret sits on the box's hood and the windage turret at its front.

---

## 5. The splash

The brief: "some degree of splash screen to illustrate the action and a time fast-forward", "taking a shower will take a chunk of time forward on the clock" (the user, 2026-11-05). DESIGN.md: "The splash is the stage itself, zoomed close on you at the appliance, with the action's vignette (steam, the mess tray, the rack's curtain) and a clock running fast. It is skippable to its end, and it is interruptible by events". **TIME owns the splash's behaviour**: the `skip()` contract, the activity table, interrupts, the two forms, every duration and the engine model (TIME §5, §6, §7). This section is the look, drawn on TIME's timeline; it holds no duration of its own, so one splash means one length everywhere (the user's rule, tradecraft debrief 2026-10-26: "every number means the same thing everywhere: one shared helper per quantity").

### 5.1 The time-skip splash

**The facts.** The view listens for TIME's facts as TECH §2.7 registers them:
- `skip-start { id, activity, kind, fromMs, toMs, where, posture, mask }`: the form follows from `kind` and the planned gap `toMs − fromMs` (under 3 minutes brief, from 3 minutes full; `day` is a chapter day, section 8.11; `out`, unconscious, is the picture gone to ink with the clock running, section 7.3); `where` is the fixture spot, so the appliance is the fixture there;
- `skip-frame { id, atMs, ticker, frame }`, once per frame: how far the sim has got, the ticker's new lines and the close frame's sample (who is where inside it, the light);
- `skip-interrupt { id, atMs, by, prio, line, reflex }`;
- `skip-end { id, activity, fromMs, toMs, planned, interrupted, by, outcome, papers }`: the outcome rides here, for the outcome strip.

The vignette and the close plate are chosen from the activity's record (TIME §8.1, its `vignette` field, in `src/data/activities.js`), and so is whether "stop here" is offered. If that can only be known at the moment (TIME §6.4: "or that would leave you unsafe"), TECH §2.7 adds a `stoppable` flag to `skip-start`.

**Outcomes accrue as the clock runs.** The splash's clock shows only what the engine has resolved (TIME §6.2: "if a slow machine lags, the clock waits for the sim, never the reverse"). Nothing is computed ahead and replayed: an interrupt cuts the activity at its exact second, with the partial outcome of that second, and the vignette's state (the tray half eaten, the carbon half off the bolt) follows `skip-frame.atMs` against the activity's span.

**The two forms** (TIME §6.1):

| Form | When (TIME) | What the view draws |
|---|---|---|
| Brief | a planned gap under 3 minutes | no zoom: the stage dims round you to a ring of `BRIEF_RING_M` 6 m (my call), its edge a 1 m Bayer dither; the clock plaque runs by you; the vignette is drawn in place over your figure. In a fast-forward (under 2 minutes) the world inside the ring moves at speed, truly; in a short outcome skip the ring is dark |
| Full | 3 minutes and more | TIME's four phases, drawn as below |

**The full form, phase by phase** (durations are TIME §6.2's; `splashMs(m)` is TIME's helper for the time-lapse, `S(m) = clamp(1.4 + 0.95 ln(1 + m/4), 1.6, 8.0)` s, so a 10-minute shower takes 4.3 s in all and a night's sleep 7.7 s):

| Phase (TIME §6.2) | What the view draws |
|---|---|
| Zoom in | the camera eases from zoom 1 to `SPLASH_ZOOM` 3 (a crop of the picture, section 2.4), centred between you and the appliance; the iris closes: everything further than `SPLASH_IRIS_M` 3.5 m from that centre dims through the fog's dim to ink, with a 1.5 m Bayer edge. Outside the iris nothing is drawn at all (TIME §6.3), so the world can be recycled and placed behind it |
| Time-lapse | the clock plaque runs from `fromMs` toward `toMs` by `skip-frame.atMs`, through TIME's ease (the first and last minutes tick slowly); the light follows the displayed time (light is a pure function of time, so a night's sleep shows the squad bay go dark, the exit signs, dawn at the windows, reveille's overheads); the vignette animates; the ticker prints one line at a time in the instinct line's place (at most one per 0.8 s, TIME §6.3); the rest of the HUD is hidden (section 7.5) |
| Outcome strip | in the radio box's place: icons of what changed, from `skip-end.outcome` (section 5.6); a roll in its short form, its full sum on hover and in the log |
| Zoom out | the iris opens and the zoom returns to 1 on the world in its new state |

**The clock plaque** is what the character can tell the time by (DESIGN.md: a wrist terminal, a suit HUD, or a wall clock in view): the wrist terminal's face, or the wall clock drawn as a plaque by the clock's position, with TIME §3.1's faces (the slip shows as `24:00 +12`). With no timepiece, there is no clock: a sun or moon glyph travels an arc across the plaque and the outcome strip gives the time in words, "about twenty minutes" (the character's estimate, TIME §3.4; "we only know what we know").

**As built in v0.0.4** (`src/render/splash.js`, `post.js`, `view.js`; the HUD's controller `src/ui/hud/splash.js` builds the splash frame each frame from `skip-start`, which now carries `spotId`, `vignette`, `stoppable` and `chunkMs` (CONTRACTS §11), and `main.js` hands it to the view as `info.splash`). **The zoom is a crop**, not a camera move: `cropOf()` takes the rectangle of the picture round the splash's centre (between you and the spot, a metre up), zoom times smaller and its corner on a whole pixel once settled, and the stage's blit shows it (`post.js` `setCrop`); `camera.js` is unchanged. At zoom 3 the crop is 13.3 × 7.5 m of the room. **The iris** inks every pixel whose ground lies further than R from the centre through the fog's dim across the 1.5 m Bayer edge, R closing from beyond the picture's corners to `SPLASH_IRIS_M` 3.5 m as `inkK` goes to 1 and opening again over the zoom out; nothing beyond it is drawn. **The ring** of a brief fast-forward dims beyond `BRIEF_RING_M` 6 m over a 1 m edge, the world inside moving truly; a brief outcome skip inks beyond 3.5 m, as the full form does. **The beat**, by the interrupt's kind: an alert is the red beacon's pulse, twice in the 0.6 s, through the curtain and the steam over everything inside the iris; reveille the overheads striking; the body's own crossing a pulse of the iris's edge. One draw call while a splash is drawn, its result snapped to the palette again. **Inside a closed iris the fog lifts** (my call, the stage's), so a sleeper sees their own vignette, easing back as the iris opens. The light follows the time shown, so the bay goes dark at 22:00 on the way through a night. Measured at 60 Hz: the shower's splash 4.28 to 4.30 s, frames 16.7 ms median and p95, none over 25 ms, 25 draw calls, 482.5 KB uploaded in a frame at most; the night's (`?bench=splash-sleep`) 16.7 ms median, 16.7 to 18.1 ms p95, 23 to 25 draw calls, 336 to 521 KB a frame at most, within TECH's 1 MB.

**People inside the iris.** At 0.1 the iris holds you, the appliance and anyone using the same appliance with you (the squad at the mess table), playing their activity's frames. From 0.2, a **time-lapse of people** (needs PEOPLE's `whereIs(person, ms)`, PEOPLE §4.6 and CONTRACTS §13, and TIME's `skip-frame.frame`): persistent people whose schedule brings them into the iris or takes them out of it **walk**, at the time-lapse's speed, along `whereIs`'s path, through the iris's edge, a stall door or the hatch (TIME §6.3: "a squadmate at the next sink who leaves at minute 7"). They are drawn solid, in their walk and activity frames, and never fade, dither or appear in place (the user, tradecraft 2026-10-26: "passers-by vanished mid-street"; 2026-11-04: "we still get ghosts shouting at us"). Someone whose path has no way in or out inside the iris (they would appear from a wall) arrives or leaves at the iris's edge. The crowd is never drawn during a splash; it is recycled behind the iris.

### 5.2 Vignettes

The vignette is part of the stage (props and effects at stage density, seen at zoom 3), with an optional **close plate** at doll density for actions too small to read at stage scale: a 96 × 64 doll-pixel picture in a pixel bezel at the iris's edge (my call).

| Activity (TIME's list) | In the stage | Close plate |
|---|---|---|
| Eat (mess hall, galley, field ration) | the tray's contents in three states (full, half, cleared), steam off the food, the cup; the squad at the table | none |
| Shower | the stall, the curtain, steam rising, water streaks (the rain fall in a local rect), the hot-water timer light | none |
| Head | the stall door with its OCCUPIED slide, boots under the gap | none |
| Sleep (rack, couch, bag) | the blanket's breathing, the rack's curtain where racks have them (troopship berths), the light cycle | none |
| Clean a weapon | the bench, the cleaning mat, the parts laid out | the weapon card field-stripped: the bolt carrier brushed, carbon fading from it as the run proceeds |
| Fill magazines | the bench and the ammo can | rounds pressed into a magazine, the count rising |
| A class | the instructor at the board, the screen's glow, the rows | the slide on the screen (a page of the subject's diagram) |
| Centrifuge session | the arm turning (a top view, the gondola at its radius, 1 frame per 30° of rotation at the real rate scaled down), the G readout on the operator's console | none |
| PT block | the formation's PT frames in the iris | none |
| Read, study, write a letter | the rack or the table | the terminal's page or the writing pad |
| Laundry | the machine's drum turning | none |
| Suit check | the suit on its rack, the checklist's lines ticking | the checklist |
| Standing a watch or waiting | the post or the bench, the light changing | none |
| Dressing (uniform change) | the wall locker open, the preset's items moving onto the doll | the doll changing layers |
| First aid over minutes (a dressing change) | the patient and you kneeling | the doll's wound, the dressing going on |

Variety: each vignette takes its tray contents, its class subject, its steam density and so on from a hash of the activity and the day, never from the sim's dice (tradecraft's rule: cosmetic choices come from hashes).

**As built in v0.0.4** (`src/render/vignettes.js`, its placement pure in `src/render/vignette-items.js` so the node tests read it, the pieces painted by code in `src/art/kit/vignette.js`: 12 pieces, upright cards in 2 instanced draws; my calls, the stage's). **The shower**: Head A's stalls face north with their curtains on the far side from the camera, so while a part is `inside` the view draws you in the stall facing its head behind an opaque **steam cover from 0.2 to 1.0 m**, the whole wet head above it and the shower shoes below (the body never drawn); steam rising, water falling only while the water part runs, the timer lamp lit, a towel on the partition. **While the iris is closed the stall and the floor to its spot are cut down to `CUT_H_M` 1 m by `inkK`**, as the cutaway cuts walls, and the see-through's dither lets go, so you read whole, not as a checkered shape (the review of v0.0.4). You stay in the stall through the six minutes of the dress part, the steam thinning behind you, and step out to its spot over the part's last 15% (`STEP_OUT_VK` 0.91), the steam clearing, so at the strip you are seen clean and dressed. **The toilet stall**: its partitions hide the inside from this camera, so the boots and the red OCCUPIED slide are drawn at its door, just outside it, on its south side when the stall's door faces east or west. **The sink**: the tap running, the figure's own brushing, shaving (foam on the jaw) and leaning frames. **The urinal**: your back at it. **The rack**: the berth's own drawing, the sleeper breathing at 0.2 Hz, the curtain closing over `CURTAIN_MS` 1 s after a sleeper lies, the blanket thrown back on sitting up; dressing at the foot in the turn-in. **The locker**: open while you dress. **Standby**: the light changing. **Every piece dissolves in and out with the iris's `inkK`**, none drawn at zoom 1 (they had popped on the splash's first frame and off after its last). **Effect clocks run on the view's real time** (the steam, the water, the tap), and so do the breathing and dressing frames during a splash, since a time-lapse on the game clock flickers them every frame. Outside a splash, **the hall's beacon**: a red lamp at the klaxon's horn in hall-2 at (57.7, 8.8), lit while `alertNow().hornOn`, alternating every 1.5 s; the bay stays dark. The see-through dither over the shower stall outside a closed iris is the open question 9's checkerboard.

### 5.3 Interrupts and skipping

- **Interrupt**, drawn on TIME §6.5's beats and times (TIME decides what interrupts and gives the cause): the clock decelerates to `skip-interrupt.atMs` and holds; in the beat, the vignette shows the cause where the frame can see or hear it (the klaxon's light turning the steam red, a hand on the rack's curtain, smoke under the door, the wrist buzzing with a name), a plaque names it in the place's style ("ALARM", "SGT REYES: ON ME, NOW", "BLEEDING") and the ticker prints its line; then the zoom out to the live stage at that second, with the partial outcome of that second applied, and the reflex card if the interrupt carries one. A mid-shower alarm leaves you wet, in a towel, with the clock where it stopped.
- **The keys are TIME §6.4's** (section 10.3):
  - **To the end**: Space, Enter or a click. The clock snaps, with TIME's 0.25 s whirr, to the end or to the first interrupt.
  - **Stop here**: Backspace. The activity is cut at the minute shown. Its keycap hint shows only where the activity can be stopped (5.1).
  - **Menu**: Esc. It opens the menu and pauses the splash.
  - **One more chunk**: T, while the strip offers "carry on (10 min)" at a chunk's end (for 1.2 s, TIME §6.4). The next chunk starts without the zoom-out, so reading on a bench goes on "for as long as we want … in chunks of 10min" (the user, 2026-10-31).
  - During the outcome strip, Space, Enter, a click or any key unbound in the splash ends the strip at once (the zoom-out still runs). T and Backspace never close it, and Esc still opens the menu.
- **Short splashes** (section 12) run every time-lapse at TIME §6.2's floor of 1.6 s (TIME owns the number).
- **Nothing is lost by skipping**: every ticker line, outcome and roll is in the log.

### 5.4 The outcome splash

The user (tradecraft, 2026-11-04): "I got arrested instantly without a splashscreen that explains what happened, without a reflex action to try to resist or fight off the cop, without an animation of the cop nailing me to the ground". Before a big outcome lands on you (an arrest by the MPs, a takedown, being knocked down, being thrown by a hard burn, a negligent discharge), the view shows it:

1. **The moment**: time stops (stop motion), the camera eases to zoom 2 on you and the cause in 0.3 s, the edges darken by 15%, and the action's pose is shown mid-way (the MP's grab, the round leaving the muzzle).
2. **The plaque** names what is happening in a sentence ("CPL HAAS GOES FOR YOUR ARMS").
3. **The reflex card** (COMBAT and TIME own the options; tradecraft's card: numbered choices with times, "nothing" always one of them, R to keep the answer two minutes) if you perceived it coming; if not, no card, the outcome lands.
4. **The outcome**: the animation plays out (the takedown pose held 6 s, as tradecraft's), then, where the outcome is administrative, a **paper** (a charge sheet, an incident report) as section 8.7.

Death has its own: the stage freezes, colour drains to luma over 2 s, the iris closes to the body, and CAREER's memorial card follows.

### 5.5 Scene cuts

Changing area (a door into a building, an airlock, boarding a vehicle or a ship) and changing deck are cuts, never fades to black: a 4×4 Bayer dissolve of 0.35 s (radial from the shaft for decks, section 2.9; from the door for doors). The place set and the lookup texture swap behind the dissolve's midpoint. A journey that takes time (a shuttle to Phobos, a drop) is an activity with its splash, or a chapter (TIME).

### 5.6 The outcome strip

TIME §6.2 gives the strip 0.8 s and its content, "icons of what changed, from `skip-end.outcome`". The view draws it as a row of plaque-scale glyphs in the radio box's rectangle (section 7.5), left to right in the order BODY, SKILLS and the rest report them:
- **the body**: the strip's pictograms of section 7.6 for each need that moved, drawn before and after with a 1 px arrow between (the drop filling after chow, the grime glyph emptying after the shower), dithered by the belief's confidence as everywhere;
- **you as you look**: a small glyph for what the doll now shows (wet hair, a fresh dressing, clean utilities);
- **what you did**: training hours as the star glyph with the count, rounds loaded as the rifle glyph with the count, money as an MCR stamp with the sum;
- **a roll**: its short form ("Weapon handling · passed"), the full sum on hover and in the log;
- **a chunk's end**: "carry on (10 min) · T" for TIME's 1.2 s.

Each glyph's words are in an on-hover infocard (the user, tradecraft 2026-11-04: "too wordy, this needs to be a on-hover infocard"), and every one is a log line as well.

**As built in v0.0.4** (`src/ui/hud/strip.js`, `splash.js`): the glyphs at **6×** (3× was unreadable in the shot; the hud's call), each need that moved drawn before and after with a pixel arrow between (after the shower "grime 3→0" and "wet"), the look glyph (wet hair, the towel, utilities, PT kit), and "carry on (15 min) · T" for a chunk's end. The strip shows only on a skip that ran to its end, or one that reveille ended at its own planned end (TIME §6.5); an interrupted splash has none.

---

## 6. Instruments as in-world screens

### 6.1 Principles

- **Two registers.** The world is pixel art; a screen in the world is an instrument, drawn crisp at device resolution in LONGHAUL's grammar (Canvas2D, hairlines, avionics colour), inside a **bezel drawn in pixel art** at the stage's pixel size. So the world stays pixel art and the screen reads as a screen (the user's brief, 2026-11-05: "longhaul's telescope views of planets and stars, and how ship tactical maps are drawn: something like that when looking at a tactical screen on a ship").
- **Only real screens.** A view exists only where a screen, a lens or an eye is (LONGHAUL v0.24.0, 2026-10-22: "Nothing aboard sees the whole ship from outside"). The marine uses the troopship's repeater in the berthing, a wall terminal, the suit's visor, the drop ship's seat display, a window.
- **Only what that screen knows.** Every screen has a `source`, and draws from that source's knowledge, never from the truth: the ship's fused picture (as old as the repeater's lag), the suit's own sensors and the squad's datalink, the telescope's optics, the base network's last update (as old as the light lag from where it came), the ephemeris (always right about planets). Each display prints its age ("PICTURE 9 s OLD", "IMAGE 53.3 min OLD", "LAST SYNC 14 min · LIGHT 11.2 min").
- **Screens are live.** Looking at a screen does not pause the game (my call): you watch the CIC's picture while the ship fights, strapped in or standing. Cards and menus pause (DESIGN.md: "an open overlay pauses"); a screen is not an overlay, it is a thing you are looking at. Anything that interrupts a splash also closes a screen.
- **No screen effects** (LONGHAUL's console rule: "no scan lines, no glow for its own sake, no grain"). A real optic's grain and glare are the telescope's physics, not a filter.

### 6.2 The screen view

R at a screen (or a key for your own devices: U, P) opens it. Layout:

| Part | Spec |
|---|---|
| The stage behind | keeps running, dimmed by the fog's dim; you stand at the screen, and a hand on your shoulder (an interrupt, someone addressing you) closes it |
| Bezel | drawn at the stage's on-screen pixel size, 10 stage px thick (A) or 15 (B), in the device's own look: steel with screws and a placard for a repeater, a rubber surround for the drop ship's arm display, the suit's visor edge for the HUD's tac. Its hard keys run along the bottom, labelled in the pixel font, pressed by digits or the mouse |
| Display | a `FitCanvas` (LONGHAUL `js/ui/dom.js`) at device resolution, DPR clamped to 2, in the device's aspect, sized to the smaller of `0.72 ×` the window's height and the free band the screen state leaves between the HUD's top and bottom rectangles (section 7.5), so it never covers the toasts, the watch, the instinct line or the radio box |
| Header | top left in the display: device and source ("REPEATER 3-B · CIC FEED · PICTURE 9 s OLD"); top right: the time in the device's own clock (UTC aboard) |
| Close | Esc, R again, or stepping away (moving closes it, as moving cancels any busy action) |

| Device | Where | Display aspect | Source | Modes (hard keys) |
|---|---|---|---|---|
| CIC repeater | troopship berthing and mess, frigate passageways | 16:10 | the ship's fused picture, `REPEATER_LAG_S` 5 s (my call; COMBAT may set) | SYSTEM, LOCAL, THREAT, SCOPE (when the CIC shares it) |
| Wall terminal | Base Melas barracks, offices, Callisto, Europa posts | 4:3 | the base network: news, the published Plan of the Day, orders, traffic as the net knows it | NET, MAP, SYSTEM |
| FOB terminal | the FOB's ops room and the surface lock on Europa | 4:3 | the base network, plus PLACES' radiation fields as the FOB's monitors last reported them | NET, MAP, SYSTEM, DOSE (section 6.10) |
| Wrist terminal (P) | on you | 16:10 small | itself: clocks, messages, compass, the published Plan of the Day | section 8.8 |
| Suit HUD tac (U) | in the visor | 1:1 | the suit's sensors and the squad's datalink | GROUND TAC 100 / 500 / 2,000 m |
| Drop ship seat display | drop ships, shuttles | 3:2 | the craft's navigation | DESCENT, PLANETARY, LOCAL |
| Rover dash | Mars rovers | 16:10 | the rover's navigation and datalink | GROUND TAC, MAP |
| Range tower display | the Base Melas range | 16:10 | the target system | LANES (hits per lane, scores) |
| Telescope station | an observatory, a ship's optics station (special settings) | 4:3 | the optics | SCOPE |
| Window, port, open sky | anywhere with a window; outdoors at night | the window's real field | your eyes | the sky view (section 6.8) |

### 6.3 The grammar

Ported as a small kit, `src/ui/displays/` (LONGHAUL's helpers, rewritten data adapters):

| Item | Value (from `longhaul/css/console.css`, `js/ui/*.js`) |
|---|---|
| Void, panel, raised | `#05070A`, `#0A0E13`, `#0F151C` / `#141C25` |
| Lines | `#1C2632`, `#2A3846` |
| Text | `#D8E1EA`, `#94A3B2`, `#5E6D7C`; key figures `#EDF2F7` |
| Meaning | own and nominal `#5FD38D`; selected and informative `#3EC7E6`; route and objective `#D46BE0`; caution `#F0A93A`; warning and hostile `#EF5350`; military zones `#E07B4F` |
| Factions | UN `#4A90D9`, MCR `#C1553B`, OPA `#E2A355`, independent `#8A8A6A`, pirate `#C05AA0` (`longhaul/js/sim/factions.js`) |
| Line weights | 1 px hairlines on half pixels; 1.5 px for selection brackets and hollow marks; 2 px for a route under way |
| Dashes | AU rings `[2,6]`, minor orbits `[1,4]`, a dark contact's ring `[2,2]`, uncertainty `[1,4]`, light-time rings `[1,6]`, hot zones `[6,4]`, a planned route `[7,5]`, an aim line `[2,4]` |
| Type | names 11 px IBM Plex Sans Condensed 500 (12 px 600 caps for planets); readouts 10 px IBM Plex Mono; labels haloed 3 px in the background colour |
| Names | `longhaul/js/ui/labels.js` as is: priority-sorted, tries right, left, above, below, never printed over another; a name with no room is left off |
| Marks | `longhaul/js/ui/marks.js` adapted: solid when broadcasting, hollow and called DARK when not, grey hollow for wrecks, magenta diamond for what your orders point at, plus OLYMPUS's: squad chevrons in green, reported contacts as amber hollow diamonds with their uncertainty ring and age |
| Picking | nearest within 14-18 px; a pick list when several are under the pointer |
| Zoom | wheel `k = exp(−deltaY × 0.0018)`, eased 28% of the log distance a frame, the point under the pointer kept still; drag to pan |
| Scale bar | a round length (1, 2, 5 × 10ⁿ) of at least 70 px, Mono 10 px |
| Pointers | LONGHAUL's pixel pointers (`js/ui/tooltip.js`): string-mapped, whole device pixels, at most 32 px |

### 6.4 Tactical

**Ship local space** (LONGHAUL `js/ui/tac.js`): ship-centred, nose up, ranges 1, 5 and 25 km, the grid every quarter range, range rings at thirds; our hull as the outline of its own deck plan (stylised size 60, 24 and 8 px for the three ranges); our plume "the way it looks" (fireball then taper, flicker `0.85 + 0.15 sin 40t sin 23t`); contacts only as the source holds them, by range: silhouettes at 1 km, arrowheads at 5 km, dots at 25 km; selection as four pulsing arcs.

**Ground tactical** (new; the suit HUD's tac and the rover's), north up like the stage, ranges 100, 500 and 2,000 m: terrain from the known map as hairline edges (buildings, walls, the canyon wall's foot, roads); you at the centre as a green chevron; the squad on the datalink as green chevrons with names, their age if stale; contacts as reported (amber hollow diamonds, uncertainty ring, "3 min" age), confirmed hostiles red; objectives and waypoints magenta; the bearing and distance to what is selected. What the datalink has not reported is not there.

### 6.5 Planetary

LONGHAUL `js/ui/worldzones.js` adapted: the world's disc at true size (a dark tint of its colour with a 1.5 px limb once it is over 18 px), its pull as a wash out to 0.01 G with contours at 0.03, 0.1, 0.3 and 1 G, the high parking orbit green, the stationary orbit amber, the low orbit band violet, the air as a glow in its colour (Mars `rgb(217,138,106)`), airspaces as ticks at the limb in their authority's colour, spaceports turning with the world, our craft's track (burns dashed, coasts dotted, the air's stretch solid). Fix LONGHAUL's unshipped font name (`worldzones.js` asks for "IBM Plex Sans"; use Plex Sans Condensed). **Mars's disc carries its relief** once it is over 60 px: Olympus Mons and the three Tharsis Montes, the Mariner Valley, Hellas and the young sea's shore as hairline outlines in a lighter tint, Olympus Mons always named (the user, 2026-11-06: "as long as it appears on maps in game it's already fine"; SETTING §4.1). The same holds for every other map of Mars: briefings, routes, the news, and the wall maps and posters in the handcrafted places.

### 6.6 The system map

LONGHAUL `js/ui/solar-map.js` adapted: no starfield, hairline orbits, the Belt as a faint band, AU rings, the Sun as a small radial glow, bodies as dots growing to true size, influence washes in faction colour at 11% alpha, light-time rings round us (1 light-second, 1 light-minute, 10 light-minutes) in dotted amber, our transit as a 2 px magenta route with its days to go, and the footer line in Mono ("SUN 2.31 AU · HELIO V 24.1 km/s · MARS 18.7 LIGHT-MIN"). On a troopship it is the voyage's clock made visible: the flip marked on the route, the days counted down.

### 6.7 The threat board

LONGHAUL `js/ui/combat.js` ThreatView, read-only on a repeater: nose up, logarithmic from 1 km to 10,000,000 km on one screen (`radius(km) = R × log10(km) / 7`), red-black background `#0A0608`, decade rings labelled, the point-defence envelope as a green 6% fill, inbound torpedoes as red diamonds with their time to impact, hostiles boxed in red. No fire-control panel: a marine watches, the CIC fights.

### 6.8 Telescope, windows and the sky

**The telescope** (LONGHAUL `js/sim/telescope.js` optics as is; `js/ui/telescope.js` cut down to worlds, stars and point sources): diffraction and jitter limit, magnitudes from albedo, area, phase and distance, exposure and gain, zoom steps, the HUD's sentences ("A CRESCENT · the Sun beyond it", "NOTHING ABOVE THE NOISE"), grain as the sensor's physics. OLYMPUS adds the lines LONGHAUL lacks for world targets: "BELOW THE HORIZON" and "OCCULTED · behind Phobos".

**Windows and the open sky** use the same sky module (`longhaul/js/ui/scope-sky.js`, ported) in a **pixel finish** (my call; the research note proposed `finish: 'optical' | 'pixel'`): the sky sampled at the stage's pixel scale, snapped to the palette, stars as one-pixel points in two tones, worlds ray-cast as lit spheres at their true phase and size, no blur. What you see is the real sky for the place and time:
- From the Mars surface (R outdoors at night: "look up"): an all-sky disc centred on the zenith (azimuthal equidistant), horizon ring with N E S W, the canyon walls as a dark band where they cut the sky; stars, Earth as an evening or morning star, Jupiter; Phobos, 0.2° across, rising in the west and setting in the east about every 11 hours; Deimos as a bright star moving slowly east to west.
- From a window: the window's frame in pixel art and the rectangle of sky its field holds.
- From Europa: Jupiter 12° across in its phase, its bands at the palette's grain; the Sun small and white.

Upgrades the research note asks for: surface maps at 2048 × 1024 (generated lazily, cached) or extra octaves evaluated per sample when a disc exceeds 260 px; a sky seen from a surface (latitude, time of sol, elevation and azimuth), which LONGHAUL's in-plane bearing does not give.

### 6.9 The drop ship seat display

A small arm-mounted display (TIME and COMBAT give the descent's numbers): the descent profile as a hairline curve of altitude against downrange with our dot on it, the entry interface marked, and four Mono readouts, ALT km, V m/s, G, TO GROUND min, with the G box turning amber over 1.5 G and red over 3 G. The PLANETARY and LOCAL keys show the corresponding displays from the craft's own knowledge.

### 6.10 What each screen decides

An instrument nobody acts on is looked at once and then ignored. So every screen informs a decision the marine really makes, in the milestone the screen arrives (my call; the milestones are ROADMAP's), and the instinct points at the screen when that decision is due:

| Screen | The decision it informs | What it shows for it | From |
|---|---|---|---|
| Wall terminal (NET, the Plan of the Day, the duty board) | what to do with the free hour, and what to be ready for | the published Plan of the Day against what TODAY knows (a change nobody told you about), the roster's duties, the next obligation and its uniform | 0.1 |
| Range tower display | the next string's sight correction | each lane's hits by ring and the group's offset from the aim point, which WEAPONS' zeroing turns into clicks | 0.1 |
| The open sky ("look up") | the time and a bearing without a device | Phobos and the stars as a clock (TIME §3.4's cue) and the cardinal points for land navigation at night (Fieldcraft) | 0.1 |
| System map (the repeater's SYSTEM page, a terminal's SYSTEM) | when to write or call | the light lag both ways and the relay's next window, so whether a reply can come back before the flip, the drop or taps (the instinct: "Write now and her reply can land before taps.") | 0.2 |
| Repeater, the voyage page and LOCAL | when to eat, use the head or sleep before the ship needs you strapped in | the time to the next burn, the flip or secure-for-burn, a drill's hold point, a contact's time to engagement range ("SECURE FOR BURN 40 min": chow now or not at all) | 0.2 for drills, 0.4 for real |
| Threat board | whether to suit and strap in now or finish what you are doing | inbound torpedoes' time to impact, the point-defence envelope | 0.4 |
| FOB terminal, DOSE | how long a surface job can take, and by which route | each candidate route on the known map with its dose in mSv from the fields, the time to the limit at the present rate, the margin left for the walk back; the plan goes to the suit's dose clock | 0.3 |
| Ground tac (suit, rover) | the patrol's route, and what goes into a contact report | the squad's positions on the datalink and their age, reported contacts with their uncertainty and age, the bearing and distance to the objective; Comms composes the report from what is on it, so a stale picture makes a stale report | 0.3 |
| Drop ship seat display | whether to brace, and when the G will come | the descent profile, the time to entry and to the burn, the G to come | 0.3 |
| Telescope station | recon's "eyes on": what the report can claim | what is at the target, counted and timed, with the image's age and resolution deciding what can be told apart (ROADMAP's `moment-eyes-on`) | 0.6 |

---

## 7. The HUD

### 7.1 What is on screen while you play

Tradecraft's HUD, kept minimal and diegetic (DESIGN.md: "The HUD shows only what your character carries").

| Element | Where | Shows | Rule |
|---|---|---|---|
| The watch | `WATCH` (section 7.5) | the time in large Mono digits, then TIME §3.1's faces from TIME's one helper: "Sol 590 · MY 211" on Mars (SETTING §3.3's display), the UTC date aboard; the place as you know it (the room, the building); the air and sky as a weather glyph, with numbers where the terminal has them ("66 kPa · 14 °C"); what is in your hands as glyphs: the item's icon, the selector glyph and the carry posture's glyph (section 7.6), the words on hover ("Rifle · patrol carry · safe, as you left it"); the body strip folded in (section 7.6) | only with a wrist or hand terminal on you, or a wall clock in view (then a small clock plaque by the clock instead) |
| Log toasts | `TOASTS` | the last three log lines, 16 s each (`hudMs` only runs while play runs), a coloured left border by kind; a roll's short form, the full sum on hover; captions under them when on (section 11.4) | the user wanted 16 s (twice tradecraft's first 8 s) |
| The instinct line | `INSTINCT` | one line from the instinct (the drill instructor's voice in your head, dry), its tone as the border (calm, note, warn, urgent: red, blinking 3 times), keys as keycaps in your layout; then R's offer as a chip | tradecraft's `settle()`: a line holds while its rule fires, drops at once when it stops (T and R split: the user, 2026-10-28) |
| The radio box | `RADIO`, stacked above the instinct line (and above the step panel in the weapon mode) | "◉ SGT REYES · 1ST SQD" the standing command and two lines at most (v0.0.8, below), each held 3.5 s + ⅓ s a word; the queue never piles up | tradecraft's earpiece (`src/sim/tutorial/earpiece.js`): in the field, your NCO's voice joins the instinct |
| Keys | `KEYS` | `? keys`, folded | the user, 2026-10-27: "put the keybinds behind '?' key instead of always in the bar at the bottom" |
| Paused | `PAUSED`, top centre (built in v0.0.3, my call: in the margin row between `TOASTS` and `WATCH`, where it covers the least of the picture and never the figure; centre as first written) | PAUSED in the pixel font on a plaque | |

**As built in v0.0.3** (`src/ui/hud/`): the watch shows Melas time large, then the weekday and the sol, UTC on its second line, then the place ("Echo Company barracks · 1st Squad, 2nd Platoon"); from v0.0.5 the place names the floor of a building of floors, on two lines, the building and floor over the room: "Echo Company barracks, ground floor" over "1st Squad, 2nd Platoon", "Echo Company barracks, upper floor" over "East stair" (places' `placeLine` text is still one line, the watch breaking it at its dot, so it never wraps there; the user, 2026-11-06, took the upper floor for "N-1" with no floor named), and the log names the floor on arrival ("Echo Company barracks, upper floor."). Out of doors no floor is named and the words are as before, but the watch breaks the line at its dot all the same: "Base Melas" over "The 25 m line" on the range. The toasts show the last three of the log's records and the page's lines, newest last, 16 s of play each, a line wrapping to two at most; if three long ones would overflow the rectangle the oldest goes first, and a debug skip says so once. The instinct line carries R's offer only: "R open the door" within `DOOR_REACH_M` 1.2 m of a door you face, "R close the door", else "R again: wait 15 min" (my call, after the review: a single R a step short of a door waited fifteen minutes, which Ironman cannot take back). R at a door acts at once; away from a door the first R arms the wait and a second within `HAND_AGAIN_MS` 2,000 ms sends it. Each R goes to the sim as `{ act: 'hand', args: { want: 'door' | 'wait' } }`, what the line said when the key went down, and is dropped if the offer has changed kind by its tick, so a door walked out of reach never turns into a wait. The HUD and the sound cost 0.10 ms a frame at the median.

**As built in v0.0.4** (`src/ui/hud/instinct.js`, `offer.js`, `strip.js`, `watch.js`). **The instinct line** holds SKILLS's `instinctNow(state).line` in at most **two rows**: the lead (while time stands still) and the line on the first, its tone as the left border (calm slate, note blue, warn brass, urgent red blinking three times) and T's keycap before it when T does something; the chip and R's offer on the second (one row when only one is there), each row cut with an ellipsis rather than spilt over the picture (my call, after a shot where three rows overflowed the rectangle). The chip leads with "T held" only where its line has an act at hand, then its short words (SKILLS §14.3). R's offer is never on an urgent line. R carries its offer's kind, `{ act: 'hand', args: { want } }` with `want` `rise`, `activity`, `door`, `resume` or `wait` (and the choice's `id`, `args` and `late`), dropped if the offer has changed kind by its tick. **The body strip folds into the watch's time row** (section 7.6): only the 5 × 5 glyphs whose band has left fine. **R and T are press keys** (`src/core/input.js`): tapped they act on key-up under `TAP_MS` 220 ms, held they act at 220 ms, never both; T tapped does the line shown when the key went down, T held the chip; R held at an offer with choices opens the choices card (digits), and at one without does what the tap does; an offer whose activity would make you late opens the late card (TIME §9.5).

**As built in v0.0.6** (`src/ui/hud/instinct.js`, `offer.js`, `src/ui/kit/pixels.js` `keyPlatePixels`; the build sheet 0.0.6 §2.3, §8 items 7 and 8; the user, 2026-11-06: "the shave+wash+water when pressing R at a basin without the tootip telling us what is going to happen is no good"). **R's plate is on every line, urgent ones included** (v0.0.4's "never on an urgent line" and SKILLS §14.1's exception are withdrawn): R's keycap and its words in the game's own pixels, the 3 × 5 capitals on the plaques' dark enamel, at the right of `INSTINCT`, where the eye finds it where it was: "R WASH HANDS · 30 S", "R SHAVE · 4 MIN, DONE 20:06", "R OPEN THE DOOR", "R AGAIN: WAIT 15 MIN", and on the klaxon's line "R GET UP". It is drawn at round(2 × `--ui`) CSS pixels a pixel (`plateScale`, at least 2) and takes at most `PLATE_SHARE` 0.75 of the rectangle, the chip and the lead shortened before it and its own words cut past it. Its words are TIME §8.1's price, ", done HH:MM" only from `DONE_FROM_MS` 60 s (TIME §8; it was `LIVE_MAX_MS` 45 s until the user's 10 s of 2026-11-07). **Amber** when the action would make you late. **"HOLD ▸"** in brass at its right when R held offers more than the plate and R's wait (handOffer's `rows` over two, or other choices): a door and its wait carry none (in review the mark was three brass dots on the corner, which read as decoration, and the build's first rule, `rows` over one, put it on almost every plate). **Where the spot's own action is struck**, the plate says why before the keycap, in the struck rows' grey: "USE THE HEAD: NOTHING TO GIVE · R WAIT 15 MIN", "HAIRCUT: THE BARBER OPENS AT 10:00" (the fixer's). **On an urgent line the DI's order comes first** (`fitUrgent`): the plate drops ", done …", ", the count …" and the note (the late shows in amber anyway), and if the line is still cut the plate gives it the room, its own words cut instead, so "PT kit is not the uniform of the day. Utilities." is never cut (in review it read "PT kit is not th…" at 1600 × 900 and 1024 × 768). R tapped and held are section 10.1's.

**As built in v0.0.8: the radio box keeps the tower's standing command** (`src/ui/hud/radio.js` `standingLine`, `boxLines`, `RADIO_H_PX` 60, `style.css`; `handling.js` `standingCmd`, `courses.js` `short`; the user, 2026-11-07: "tower sometimes doesn't say anything but we're expected to do it ?", of the 300 m line, and his 200 m screenshot showed only the coach's wind call; my calls, the tower fixer's). At "Set your dope" the coach's dope line and wind call were said in the same tick as the tower and pushed its line out of a box of two. Now the command you have still to answer is kept in the box, drawn from the state (so a save loaded, a splash ended or the box cleared shows it again), until your readiness meets it. The box stays in the order things were said, newest at the bottom: the command takes its spoken line's place, voices said before it sit above and those after it below, and the tower's earlier commands leave the box while it stands (a stale "LOAD." under "MAKE READY." read as the latest word). It is marked by a brass tint and a NOW tag (a CSS `::before`, so the text stays the tower's words) and is never trimmed: the oldest other voice goes first, then the command switches to its short form (its terms kept: "Ten rounds rapid, sixty seconds. Commence fire."), then the voices after it. `RADIO` is **720 × 60** (was 52): three rows; the splash's outcome strip stays 52 at its foot. The line is "the standing command and two lines at most" (it was "two lines at most"). WEAPONS §5.3 and §6.4 give the tower's words.

No health bars, no numbers for needs, no minimap, no compass rose, no ammunition counter. Needs and body states reach you as the instinct's lines, the log, the doll, the body cues below and the body strip of felt bands (section 7.6), which is quiet when all is well. A round count shows only if the weapon has a counter (an optic's display, WEAPONS) and only while aiming through it.

### 7.2 The suit HUD

With a helmet on and sealed, the suit's readouts **replace the watch** in its corner (`SUIT`, section 7.5) instead of running along the top of the window over the toasts: the suit HUD is the clock then (TIME §3.2's rule: "the suit HUD if sealed"), with UTC and the T+ since sealing as its first line. The visor itself shows as a 2 px rim of the visor's edge round the picture, which no HUD element crosses. The readouts are drawn in the instrument grammar (Plex Mono 11 px, cyan and green, amber and red for alarms), because the suit measures these things and knows them exactly. BODY gives the suit's sensors; these are the defaults.

| Left group | Right group |
|---|---|
| `O2 5 h 40 min` at the current rate | `1ST SQD · ◉ SGT REYES` (channel, who is talking) |
| `SUIT 34.0 kPa` (the light vac suit's pure O₂, BODY §19; SETTING §1.4) | `DATALINK 4 · 2 s` (members in contact, oldest report) |
| `CO2 0.4 kPa` (the scrubber's) | `BAT 82 %` |
| `DOSE 0.40 mSv · 0.2 mSv/h` | `LAMP` when on |
| `TEMP 21 °C` | the biomonitor's `HR 96 · SpO2 97 %`, if the suit has one |

Alarms light LONGHAUL-style annunciator boxes in the block's last row (`O2 LOW`, `PRESSURE`, `DOSE RATE`, `SEAL`), two blinks then steady, with the suit's tone (section 11). When the visor goes up or the helmet comes off, the block gives its corner back to the watch.

### 7.3 Body cues in the picture

Few, honest, and driven by BODY's levels (0 to 1). They are applied in the post pass before the palette snap, so they stay in the palette.

| BODY state | In the picture |
|---|---|
| Blood loss | tradecraft's veil: darkening from the edges, opacity by blood lost |
| Grey-out under +Gz | colour drains toward luma in proportion; past the grey-out threshold the fog's dark closes from the edges, to a 30% radius at blackout |
| Blackout, G-LOC, unconscious | the picture goes to ink; the clock runs on; what happened while out is written to the log when you come to |
| Hypoxia | night reach falls first; then colour drains 30% and the cone's edge closes; severe: the tunnel |
| A daze or a blow to the head | a 1 px jitter of the picture for 2 s (no blur: blur is not pixel art) |
| Tear gas, smoke in the eyes | the sight cap of the air shortened; the fog's dim deepens |
| Tinnitus after an unprotected shot indoors | sound only (section 11), captioned |
| **Felt suppression** (2026-11-07; COMBAT §5.3: the chaos less hardening, never the raw pool) | the picture's edge closes by felt's band, in palette: under fire a 6% darkening at the corners, suppressed 14% with the edge dithered, pinned 24% and the colour drained 20% (Easterbrook's narrowing; Artwohl's tunnel vision, COMBAT §5.10). A tier one under three bangs is at felt 10: nothing shows |
| **The startle** (COMBAT §5.7) | one frame lit pale on the bang, then the picture held a shade dark for the startle's length, the keys refused; at its end the FROZE stamp (§7.4). Under "reduce flashes", no pale frame |
| **Flash-blind** (COMBAT §11.4) | the picture white where the eyes faced the burst, fading back over the 5 s with a dark afterimage where the flash stood; dazzled (60° to 120°), a pale veil for 2 s. Under "reduce flashes", a 60% grey veil instead of white, never a whole-screen flash (section 12) |
| **Deafened by a bang** | sound only (section 11.2): the whine and the dulled mix, captioned "[a high whine]" |

**As built in v0.0.9, the bang and the chaos in the picture** (`src/render/range-items.js`, `look.js`, `decals.js`, `view.js`, `post.js`; the build sheet 0.0.9 §2.3, §8 items 16, 17, the face's departures and the fixers' calls; each my call unless named):
- **The flash**: a white disc of `BANG_FLASH_R_M` **1.2 m** for `BANG_FLASH_MS` **30 ms** on the first frame at or after its moment (one tick late at worst), on a flag the fog of awareness never dims (`decals.js LIGHT_FLAG` 0.9, `view.setChaos`, `post.setChaos`). The recruit stands with his back to it, so he sees it on the ground and not in his eyes.
- **The light pool** `BANG_POOL_M` **4 m**, softer than first built (a hard 5 m pool hid the flash), which lights the pad and the figures beside it.
- **The smoke** grows 0.3 → 1.5 m over 1.5 s and is gone by `BANG_SMOKE_MS` 8 s: its own draw, written at most once per 50 ms of game time and never while the clock stands (it had re-uploaded every frame); **a checker's half over a standing figure's box** (±`SMOKE_FIG_HALF_W_M` 0.4 m, `SMOKE_FIG_H_M` 1.85 m tall), so the shooter and the coach show through; it thins from 1.0 m to 2.5 m of drift (`SMOKE_OFF_PAD_M`) as the wind carries it off the pad, and the wind reaches it through `main.js` (`info.wind`, `wind.js windAt`), since the render may not import `sim/arms/wind.js`. The coach's thrown body is drawn 3 × 2 px on the pad (larger than life), on a low arc, **with an ink outline in flight**; he has **no throwing pose** (his figure has only its walking frames painted, so the bang leaves his hand with the arm still: a frame on the atlas is later work).
- **The startle**: one pale frame on the first startle only, then the picture held **12% darker** until it ends. **The vignette** by felt's band: 6 / 14 / 24% at the corners (under fire, suppressed, pinned; the suppressed edge dithered), the colour **drained 20% when pinned**. A tier one at felt 10 shows nothing.
- **Reduced flashes**: by `&flashes=reduced` and the `olympus.flashes` key, and from the Esc menu (§12), the 60% grey veil for white and no pale frame. anti-G straining manoeuvre (+1.5 G of tolerance while held, draining stamina) is offered **whenever +Gz exceeds 3 G**, in every posture, and bound three ways (my call, each):
- **outside the weapon mode, T held**: while +Gz is over 3 G, T is the strain for as long as it is held, and the instinct's line says so with its keycap ("Strain! Legs, gut, breathe in bursts. Hold T."). Every other offer of the instinct waits until the G falls, because nothing else it could offer matters more;
- **in the weapon mode, a step**: "strain" or "relax" on a digit in the step panel, toggled, with the onset time the trained skill gives (SKILLS names it; section 17), since a held key means nothing while time stands still;
- **on the G reflex card**, which already offers "Strain" and "Relax" (BODY §26): "Strain" holds the manoeuvre for you until a tap of T or the "relax" step lets it go, or stamina gives out.

The strain shows on your figure (the `strain` head state and a braced torso) and in the log; its stamina cost reaches you as BODY's lines through the instinct.

### 7.4 In the weapon mode

Tradecraft's stop-motion overlays, kept as the user approved them (tradecraft 2026-11-03: "Make aiming more natural … but no list"):

- **Brackets** over what the pointer is on (pale) and what is aimed (red), corner brackets of 3 px arms.
- **The reticle plaque** over the target in the pixel font: the part, the odds now, the distance, the next click's action and its time ("BODY 82% 34 M · CLICK FIRE").
- **The step panel** in its reserved rectangle above the instinct line (`STEPS`, section 7.5): numbered steps with their times, unavailable ones struck through with why ("1 fire · 0.8 s (aim first)"); the weapon card at its left (section 4.4); while +Gz exceeds 3 G, the strain step among them.
- **"Time stands still."** as the instinct line's lead while the mode holds time, with the gun's state as the character knows it. As built in v0.0.3, while G holds time the line leads "Time stands still: a digit to choose.", in place of v0.0.2's banner.
- **Cover**: when the panel's cover row would get you down behind something, the cover's outline glows faintly (1 px pale) and the plaque names it.
- **The take-in** (COMBAT §25.4, §25.11): hollow amber corner brackets (3 px arms) appear round a person newly seen, at three times the figure's box, and close onto it over the marine's take-in; no words, no sound. At the pause they snap to the pale bracket; a stamp ("0.80 S", amber from 0.5 s, pale below) stands over the figure for 2.5 s in the picture's 3 × 5 alphabet; the plaque leads "CONTACT · TAKEN IN 0.80 S" over a thin strip ticked every 0.1 s and filled to the take-in; the instinct line's lead is "Contact · 0.80 s.". The hover card gives the take-in's parts.
- **A bundle** (COMBAT §25.7, §25.11): its row reads like a command's, its beats as dots grouped by channel and a seam as a bar, its options (entry, breach, flash first with "1 flashbang", stance) as rows set at no time; taught but not yet lived it shows struck once, "by hand first". While it runs it is shown alone with short lanes of glyph ticks, **FEET, HANDS, EYES** and VOICE, filling one at a time for the recruit and together for the operator.

**As built in v0.0.5** (`src/ui/plaque.js` `shotPlaque`, `plaqueWords`, `plaqueParts`; `src/main.js` aimHud; the build sheet 0.0.5 §2.4; WEAPONS §7.10 for the figures). **The plaque** over the bracketed card, drawn in the picture's 3 × 5 alphabet: before the aim "PAPER 95% | 25 M · AIM 0.9 S" in the picked kind's paper, the odds as **a meter** along its foot; once aimed, in the aimed red, "PAPER 95% | 25 M · +4 IN 1.4 S · 1 HELD FIRE" by the keys (**Fire's digit named**, the fixer's), "CLICK FIRE" after the mouse moves, and "HELD +4" once the hold is full. When Fire is struck, its reason stands where the click would be (the integrator's: it never asks for a click the panel refuses): "+4 IN 1.4 S · ON SAFE", "· CHAMBER EMPTY", "· A STOPPAGE". On a card the figure is the chance of a hole (WEAPONS §7.10). **The hover card** lists the DC's parts and every modifier as believed, the roll's own list; it shows while the pointer is on the card or the plaque, and **for 2.5 s after an aim or a move of the brackets by the keys** (the fixer's: by the keys it had never shown). **The brackets**: pale on the card the pointer or the keys pick, red on the aimed one, at half strength while the plaque is hidden. **The plaque hides on a cold line and under a handling step** (it had counted through SHOW CLEAR's sub-steps), and is **kept inside the picture**, 2 px from its edge, its notch a little off a card at the frame's edge rather than its words cut off. "Time stands still." is the instinct line's lead only (SKILLS §14.3), no longer a toast as well.

**The step panel** (`src/ui/hud/steps.js`, in `STEPS`): the weapon card at its left (section 4.4), then `stepsOf()` in two columns of five, numbered 1 to 9 and 0; past ten, 1 to 9 hold Fire, Aim, Hold and the commands and 0 is "more", paging the singles; after any step is sent it returns to its first page. A row reads "3 LOAD · 2.4 s" with its odds ("85%", or "routine"), a command's sub-steps as dots, the tower's current command marked "◉" with a brass edge (only the drill that completes it: WEAPONS §5.3), a struck row with its reason ("Fire at your card · 0.4 s (on safe)"), and **a struck row's digit says why** when pressed (the row lit, its reason in a toast, Fire on safe in WEAPONS §4.4's words: it had looked like a dropped key). Shift held shows the rushed times; hovering a row, what it rolls and its rushed and careful times. **While a step runs the panel shows it alone** (my call, the hud's: the step leaves `stepsOf` as it changes the gun), its sub-steps in their words as glyph ticks filling as they are rolled (✓ passed, ◦ routine, ✗ fumbled, · to come) (from the shoot house rework, also `~` caught, ★ a natural 20 and `!` a stoppage, and ✗ only a failure that cost something: the designed paragraph at this section's end) and a bar of its time gone on the game clock; a chained wait keeps the normal panel, its row "waiting for the tower". The HUD reads the sim's stop-motion views once a tick, not once a frame (`stepsOf` costs about 0.7 ms): firing went from 1.2 ms of HUD a frame to 0.2 at the median and 0.9 at p95, inside CONTRACTS §7's 1 ms.

**As built in v0.0.6** (`steps.js`; WEAPONS §5.2, §6.4; the build sheet 0.0.6 §9; the user, 2026-11-07). **The reach rows say what each would bring, as believed**: "Reach: chest pouch 1 (5 ball · front of 2)", "Reach: chest pouch 2 (5, kind not seen)", "Reach: the dump pouch", "Reach: at your feet (empty · front of 3)", a count known only by weight "a few by its weight" (in review "(5, 1 of 2)" read as cryptic). With a magazine in the hand the singles are Magazine in, Look at it, "Put back: pouch N" (one per chest pouch with room; "Put it back: chest pouch 1" had wrapped its digit onto a line of its own at 1600 × 900), Dump it and Drop it. **A step may be marked, not struck** (COMBAT §3): an amber "!" and its words on its row, still choosable, "! one magazine a string" on every step that would seat another magazine mid-string, "! tracer: the course is ball" on Magazine in with a tracer looked at in the hand (`style.css`'s two rules for the marked row); REMEDIAL ACTION, which re-seats the rifle's own magazine, is never marked.

**As built in v0.0.7** (`src/ui/plaque.js` `termsPixels`, `ringShares`; `steps.js`; `src/art/weaponcard.js`; `src/ui/cards/kd.js`; the build sheet 0.0.7 §2.5; WEAPONS §7.10 for the figures). **The plaque at distance** leads with the chance of a five or a V, "FIVE 47% | 300 M", or words when the read is wide; the zero card keeps "PAPER". Under it **the terms plate** draws the shooter's terms as glyphs, not words: the range, the wind as read (or the coach's call, and its age), the hold, the turrets off the believed zero; and **the rings' odds strip**, six cells (V, 5, 4, 3, 2, a miss) whose widths are their shares. **The hover says them in words** ("a five or a V 47% · on the paper 94%", "the rings: …"), and **its info box is placed clear of every HUD rectangle, the plaque and the terms plate, or not shown** (the fixer's: it had covered PAPER and the terms). **The weapon card carries the SO-4**: its turrets dialled from your believed zero ("▼3"), the lever's 4×, the line's dope ticked when dialled or the clicks to go ("▼3 TO GO"), and the hold on a small reticle; where a whole device pixel a card pixel would be larger than its box (1024 × 768's `--ui` 0.85), **it is drawn at the box's own scale, smooth** (`steps.js` `cardFit`), so no column drops. **The range's actions are panel rows** (`kdActs`: "Police your brass (6)", "Unused rounds back to the coach", "Say it: no brass, no ammo"), sent as `kd:<id>`; with the call's row ("Dial the coach's call"), the dope, "Hold for your read", "Hold for the coach", the hold back to centre, the read of the flags, the lever and sitting. Click-by-click dials and free holds are accepted by `chooseStep` but have no row (the dial keys, section 10.2). **Fire is marked**, never struck, while the last slow-fire shot waits for its mark ("! wait for your mark", with a `wait:mark` row of 20 s), on a cold line, and with the aim on a person (WEAPONS §6.4, §11.5).

**As built in v0.0.8: the take-in and the shot rows** (`src/main.js` contactHud; `src/ui/plaque.js` `BRACKET_START_K`, `STAMP_S`, `STRIP_TICK_MS`; `src/ui/hud/steps.js`, `timer.js`, `instinct.js`; `src/ui/cards/log.js`, `pairs.js`, `end.js`; COMBAT §25.4, §25.6, §25.11; the build sheet 0.0.8 §2.4, §4; my calls unless named).
- **The window**: hollow amber corner brackets (3 px arms, the palette's `ACCENT`) open on the sighting tick at **`BRACKET_START_K` 3** times the target's box and close linearly to 1× over the take-in (`contactNow().pending.k`; 39 steps over the recruit's 0.65 s in review; the tier one's shut on the first frame). **One colour whatever the target**, so they never say what it is; a window's bracket is no taller than the gap to its neighbour's (two lanes' had met in an "E" at 7 m). Every key but Space and Esc waits; no words, no sound.
- **At the pause** the brackets snap to the pale pick bracket; **the stamp** "0.55 S" in the 3 × 5 alphabet stands above the face (no longer over it) for **`STAMP_S` 2.5 s** of real time, amber from 0.50 s (`STAMP_AMBER_MS` 500) and pale below, **gone once a step is chosen** (it covered the spark of the shots that follow); **the plaque's lead** "CONTACT · RIFLE · TAKEN IN 0.55 S" over a strip ticked every **`STRIP_TICK_MS` 100** on a 2.0 s span (`STRIP_SPAN_MS`, longer only for a longer take-in) and filled to the take-in; the instinct line's lead "Contact · 0.55 s."; the factors on the plaque's hover and in J (the `contact` log entry, split into its head and its sum, raising no toast). For 350 ms of real time after the pause appears no key acts but Space and Esc (`PAUSE_GUARD_MS`, COMBAT §25.4.5).
- **The plaques beside a turner**: the shot plaque, the row's parts plate and the contact plate stand **to the target's right**, unnotched (over the unused 25 m frames, or to its left near the picture's edge); stacked above it they covered the next lane's turner. Other targets keep v0.0.7's placement. A turner's plaque names the part ("HEAD 75% · 7 M").
- **The shot rows**: "Pair · 0.40 + 0.52 s · 95% 95%" (the price by its parts, each round's odds); **the rows struck by their gate fold into one struck row** ("Hammer 12 · Triple 18 · Failure drill 12", Marksmanship; choosing it toasts "Not yet: …"); a row struck "off safe first" brings the Off safe single up beside it; Hold him and Challenge lead on an identified no-shoot; the reloads read by purpose. **Paging**: the fixed rows (Fire, the aim, the commands, the shot rows, the contact's answers, a single brought to the head) stay on every page up to **`FIXED_REPEAT` 5**; past it at most **`FIXED_MAX` 8** hold the first page alone and later pages show the singles nine at a time (unfolded, the private's Off safe was on page 9 of 14). A command marked `later` at a contact pages with the singles. test-handling's and test-range's panels page as before (no shot rows).
- **The coach's shot timer paper** (`src/ui/hud/timer.js`) in `PAPER` after each string, `paperText`'s line ("TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.50 · SPLITS 0.40 · 2 A"), its numbers equal to the sim's record; **the sheet picker** (`src/ui/cards/pairs.js`, the five sheets with their Warfighting, Private focused) and **the end card**'s "Again as …" on the same seed, its faults named, the room's take-in beside the bay's, this session's runs a line a sheet.
- **As built in v0.0.8, the zero's words** (`src/ui/plaque.js` `termsPixels`, `steps.js`; the user's report, 2026-11-07, WEAPONS §11.4). **The terms plate**: while the rifle is being zeroed the zero term reads "ZEROING ▲4 <2", or "ZEROING · NONE" before a click (the card's words), the clicks from the turrets as issued (shot.js `zeroingOf`); otherwise the term is the turrets against the believed zero, as before ("ON ZERO", "▼3"). The hover says "zeroing: 4 up, 2 left dialled this zero, from the turrets as issued", or "zeroing: nothing dialled yet this zero". The windage arrows stay "<" and ">" on the plate and "◀" and "▶" on the card, as in v0.0.7. **The step panel's "Dial the coach's call"** offers only the confirm's call, or the zero's last group's while the zero is open (never after "Zeroed.", never an older group's), and is gone once the turrets stand at the call, however they got there; its label and clicks are the clicks still to go.

**Designed 2026-11-07, the chaos at the pause** (COMBAT §5, §7.11, §25.18; my calls): **the FROZE stamp**, "FROZE 1.20 S", amber, in the take-in stamp's 3 × 5 alphabet and place, for 2.5 s at a startle's end, gone once a step is chosen; **marked rows**: a row whose odds the chaos cut below 70% is marked "! shaking" (section 7.4's marked row: never struck), and an exposing step shows its nerve check's odds and, under area fire, its chance of being hit ("Rise and fire · 0.4 s · 55% to make yourself · about 1 in 4 to be hit"); **the roll's hover** gives the chaos's sum ("the chaos 105 − your hardening 17 = felt 88: pinned, −9"); **the plaque's state word** at a contact, as the marine could tell it (LOOKING AT THE DOOR, AIMING AT YOU, DAZED, COWERING, FIRING BLIND, RUNNING, RUNNING AWAY, HANDS UP · RIFLE DOWN, DOWN; "can't tell" on a failed identification): "CONTACT · RIFLE · DAZED · TAKEN IN 0.85 S"; **no meter**, ever: the instinct line names the band.

**As built in v0.0.9** (`src/ui/plaque.js` `frozeStamp`, `chaosSum`, `feltMod`; `src/main.js`; `src/render/view.js`; `src/ui/hud/steps.js`; the three reviews' fixes; my calls):
- **FROZE** stands in amber (500 ms from the 3 × 5 alphabet's amber rule) **beside your head, not above it** (above it covered the coach at your shoulder), `STAMP_S` **2.5 s** of real time at a startle's end, gone once a step is chosen; its figure is **the frozen time in all** (COMBAT §5.7: startles within `STARTLE_JOIN_MS` 1 s joined, so three bangs read one stamp, "FROZE 2.40 S", never `untilMs − fromMs`). **It counts up live while the startle lasts** (`suppNow().startle.soFarMs`) and holds while a planned bang is still to join the freeze (`pairs.js bangDue`), then stands at the whole freeze for `STAMP_S`; **a key refused in it pulses the stamp**. **Your figure ducks** `FLINCH_DUCK_PX` 1 px and **trembles** 1 px side to side every `FLINCH_STEP_MS` 70 ms while it lasts, so the freeze is seen as the marine's from its first frame, not as lag.
- **Every key but Space and Esc is refused** while the startle lasts (`main.js` reads `suppNow(...).startle`; the sim's act gate already refuses every sim action).
- **The "! shaking" row** (`steps.js`): a row the chaos cut under 70% is marked, never struck, never "routine": "1 Off safe · 1.0 s · 50% ! shaking", "Top up 16% ! shaking", "Sling it 55%"; the hover gives the sum ("the chaos 105 − your hardening 7 = felt 98: pinned, −10"), the same on the plaque's hover, the row's hover and J. The face calls `stepsOf` on change, not every frame (with a combat block on the player it costs 1.29 ms against 0.72 ms calm, `hardOf` running once per roller, until the pool drains: about 54 s after three bangs). **A struck shot row's remedy is brought up beside it, and To the head keeps its key on every page** (§2.6's panel numbering, TECH §2.6).
- **The last-step badge on the weapon card** (not in the sheet; the face's call): the step last run shows with its marks for 3 s ("Off safe ✗"), since Off safe is a single sub-step and the running view had no ticks to show it failing.
- **Esc** offers **"End the scene: to its card"** in a test scene still running and **"Reduce flashes: on | off"** in every game (`boot.js menuActs`).

**As built in v0.0.10** (`src/ui/hud/steps.js`, `timer.js`, `instinct.js`, `src/ui/cards/stress.js`, `end.js`; the build sheet `docs/build/0.0.10.md` §8 items 12 and 13, §9 item 25, §10 items 31 to 33; each my call):
- **Breathe's row** reads **"Breathe · 4.0 s"**, a fixed row on the first page with nothing facing you; with a threat up it is paged and marked **"! he's up"**, never struck. **While it runs** the instinct line leads with the count: **"Breathe · in · HOLD · out · hold"**, the running word in capitals (one second each), and the lead out of the mode as in it. The toast says "Breathed 4.0 s." (a cut one "Breathed 2.0 s, cut short."), J the whole line ("Breathed 4.0 s: the chaos 75 → 59."); the toast carries its head only, since its text holds the chaos as a number.
- **Shots at a turner on the stress course** toast what the marine could tell ("Marksmanship 16 against 6 · seen to strike." or "not seen.") while a string runs; the zone stays in J and in the truth (the user's answer A, belief then truth).
- **PAPER's timer: a long paper grows by its laid-out lines**, up to 200 px (`timer.js paperFoot`). String 5's paper, with five splits wrapped under SPLITS and its RELOAD and SECOND rows, was sized by its rows alone (174 px) and cut its zones line at the foot; it is now 189 px. One "Three bangs" paper of v0.0.9 was cut too (the recruit on seed 1: 140 → 155 px); the 249 other Pairs and "Three bangs" papers over 25 runs stay 140 px. The din's paper leads with its plan, "DIN 30 BLANKS · 22 HEARD" when the string ended first.
- **A walk key that went down in a startle or its guard is let go** in the key machine (`main.js dropStartleMoves`, each poll), so held past the startle it does not walk the marine (0.285 m before the fix; 0 m now).

**As built in v0.0.12** (COMBAT §25.11 holds the panel): bundle dots capped at 6 between seams, the running bundle's four lanes, "T: <row> · <s>" on the instinct line, the lane timer in the PAPER, a stand drawn only once seen, the plates beside a turner on the side clear of the others (house only). **A look question for the user's samples**: the #2 at 0.65 m in the stack draws as one blob at 16 px/m (a tag or an outline?), the instructor on the catwalk reads over a doorway, and the catwalk's rails run across the rooms. **Designed 2026-11-11 (the user's note on v0.0.12)**: one outline per person (section 3.10.1) answers the blob; the step panel is regrouped by type in section 7.8, whose layout the user scores.

**Designed 2026-11-11, to build in the shoot house rework: the dice drawn as they fall** (SKILLS §5.1; the user, 2026-11-11: "nat 1s are insanely frequent, much much more than nat 20s"). The count found a fair die: 4.92% natural 1s against 5.00% natural 20s over 352,722 rolls. What made the 1s look frequent was the screen. Every routine 1 was a red ✗ (1,254 of 1,254) and stayed on the row and the weapon card for 3 s; the instructor's dummy click drew a ✗ too; and a 20 drew ◦ or ✓ like any pass. A private by the keys saw 2.38 ✗ a house run and no 20 at all. The marks now say what each roll did, in the same glyph cell:
- **The marks.** ✓ passed. ◦ routine, passed. **`~` caught**: a natural 1 that SKILLS §5.1 catches, in amber, its hover "a natural 1, caught: +0.2 s". **★ a natural 20**, in brass, its hover "clean: −0.1 s", or "saved by a natural 20" where it turned a failure. **✗ only a failure that cost something**: a fumble with its time and its ladder, a missed round. **`!` a stoppage**: the gun's fault, not the hands' (the dummy click, a dud, a double feed), in the "! shaking" row's amber, so a lane's dummy round never reads as a fumble.
- **A round's tick reads its roll**, no longer only that it fired: ✓ a hit, ✗ a miss, `~` caught (a hit, late), ★ a natural 20, `!` a click. The weapon card's last-step badge and the row kept after a step use the same marks.
- **Odds.** A row whose natural 1 would be caught reads **"sure"** in place of 95%, as a routine row reads "routine". The plaque reads "BODY SURE | 4 M · AIM 0.3 S", its meter full, and its hover reads "a natural 1 is caught: +0.13 s". One quantity, one number: `oddsOf` gives 1 there (SKILLS §5.11).
- **Toasts.** A caught round takes the hit's tone and words ("In the A zone · caught, +0.13 s"), never the miss's amber. A caught handling 1 makes no toast, as a routine 1 made none. A 20 that saved a roll toasts in brass ("Weapon handling 20 against 9 · saved by a natural 20"). A 20 on a hit keeps "(a natural 20)" in its toast.
- **J** carries SKILLS §5.14's lines ("a natural 1, caught (+0.2 s)", "a natural 20: clean (−0.1 s)"), and the rolls filter folds them like any roll.
- **The hit card and PAPER**: a caught round's hole is drawn as any hit, and its split shows the late round as it was, with a `~` beside it ("SPLITS 0.26 · 0.39~").
- **Per run, after** [the 800 runs of the count, re-marked]: the private by the keys in the house sees 0.53 ✗ (his shot misses), 1.38 `~`, 1.77 ★ and 1.00 `!`; the tier one by T sees 0 ✗, 1.42 `~` and 1.39 ★. In Pairs the private sees 1.04 ✗, 2.07 `~` and 2.96 ★, and the tier one 0 ✗, 2.86 `~` and 2.69 ★. Before, they saw 2.38, 2.00, 2.07 and 1.82 ✗ and never a 20.

### 7.5 The layout: a reserved rectangle for everything

The user complained of "overlapping UI elements" in tradecraft (the hunt's HUD icons had to be moved: `tradecraft-design-3.md` §2.6), and LONGHAUL's rule is "nothing floats over a display" (v0.19.0, 2026-10-22). So every HUD element owns a fixed rectangle, reserved per state; no two rectangles of one state meet; and everything drawn in the picture (the far window, heard, felt and waypoint plaques at the frame's edge, name plaques, speech balloons, the talk box, the splash's close plate) is placed by LONGHAUL's `labels.js` with every rectangle of the state given to it as a `block()`, so it goes round the HUD or is left off, never drawn over it (my call).

**The rectangles**, in CSS px at `--ui` 1, from the window's edges with a 12 px margin and 6 px between stacked ones, all scaled by `--ui` (tradecraft's `fit()`, 0.85 to 1.5):

| Rectangle | Anchor | Size (w × h) | Holds |
|---|---|---|---|
| `TOASTS` | top left | 460 × 84, plus 44 under it when captions are on | three log toasts; two caption lines |
| `WATCH` | top right | 280 × 132 | the watch with its hands line and the folded body strip |
| `SUIT` | top right, in `WATCH`'s place | 380 × 176 | the suit's readouts: the clock line, two columns of five, the annunciator row |
| `INSTINCT` | bottom centre | 720 × 44 | the instinct line and R's chip; in a splash, the ticker and the splash's keycaps |
| `STEPS` | bottom centre, on `INSTINCT` | 720 × 148 | the step panel: the weapon card (180 × 148) at its left, the steps in two columns of five |
| `RADIO` | bottom centre, on `STEPS` in the weapon mode, on `INSTINCT` otherwise | 720 × 60 (52 before v0.0.8) | the radio box (the standing command and two lines, §7.1); in a splash, the outcome strip, which stays 52 |
| `KEYS` | bottom right | 120 × 32 | `? keys` |
| `CLOCK` | top centre | 260 × 72 | the splash's clock plaque |
| `PAUSED` | top centre (built in v0.0.3; §7.1) | 240 × 48 | PAUSED |
| `SCREEN` | centre | the free band between the state's top and bottom rectangles, at most `0.72 ×` the window's height, in the device's aspect | a screen and its bezel (section 6.2) |
| `TALK` | placed by the labels pass beside the speaker, inside the free area | 520 × up to 260, up to 300 in a hard talk | the talk box (section 8.10) |

**Per state** (a state is the union of what holds at the moment: sealed in the weapon mode uses the weapon mode's row with `SUIT` for `WATCH`):

| State | Rectangles in use |
|---|---|
| Walking (the default) | `TOASTS`, `WATCH` (if a timepiece), `INSTINCT` with `RADIO` on it, `KEYS` |
| Weapon mode | `TOASTS`, `WATCH`, `INSTINCT` with `STEPS` on it and `RADIO` on `STEPS`, `KEYS` |
| Sealed suit | as the state under it, with `SUIT` in place of `WATCH` |
| Screen open | `TOASTS`, `WATCH` or `SUIT`, `RADIO`, `INSTINCT`, `SCREEN`; `KEYS` hidden |
| Talk | `TOASTS`, `WATCH` or `SUIT`, `RADIO`, `INSTINCT` (its lead "Time stands still."), `TALK`, `KEYS` |
| Splash | `CLOCK`, the outcome strip in `RADIO`, the ticker in `INSTINCT`; everything else hidden |
| A card or a paper open (the game paused) | the card alone, sized within the window's margins; the HUD is hidden under it, not drawn through the glass |
| Paused | the state's own, plus `PAUSED` |

Computed with tradecraft's `fit()` (`--ui = clamp(s / 2, 0.85, 1.5)`, s the window's scale over a 640 × 360 picture, the same at either density), at the three window shapes the test uses:

| Window | `--ui` | Bottom stack | Clear of `KEYS` | Between `TOASTS` and `SUIT` | A screen's free band |
|---|---|---|---|---|---|
| 1920 × 1080 | 1.5 | 1,080 px wide | 222 px | 624 px | 675 px, 0.63 of the window |
| 1440 × 900 | 1.13 | 814 px | 164 px | 464 px | 595 px, 0.66 |
| 1024 × 768 | 0.85 | 612 px | 94 px | 290 px | 538 px with the watch (0.70), 501 px sealed |

So a screen never gets its full 0.72 at these shapes; it takes the band, and nothing is covered. Built in v0.0.3 with the five rectangles walking needs (`TOASTS`, `WATCH`, `INSTINCT`, `KEYS`, `PAUSED`; `src/ui/hud/layout.js`), apart at all three shapes (`--ui` 1.5, 1.13 and 0.85). The `hud-overlap` test (section 14) renders every state at the three shapes and asserts no overlap at all. **v0.0.4 adds `RADIO` and `CLOCK`** and three states (`STATES`): walking (`TOASTS`, `WATCH`, `INSTINCT`, `RADIO`, `KEYS`), paused (the same and `PAUSED`) and the splash (`CLOCK`, the outcome strip in `RADIO`, the ticker in `INSTINCT`, everything else hidden); `CLOCK` and `PAUSED` share the top centre but never a state, since the splash's own pause is not the player's. `core-browser` measures the rectangles apart in the page at 1024 × 768, 1280 × 600, 1600 × 900 and 1920 × 1080, splash included. The splash's clock plaque shows the slip as `24:00 +12`.

**v0.0.5 adds the weapon mode's states** (`layout.js` `STATES.weapon` and `weapon-paused`; the build sheet 0.0.5 §2.4, §8 item 21): `TOASTS`, `WATCH`, **`PAPER`**, `INSTINCT`, **`STEPS`** (720 × 148 on `INSTINCT`, the weapon card's 180 × 148 at its left), `RADIO` and `KEYS`, and `PAUSED` when paused. **`PAPER`** (200 × 200, your card close, below) sits at the top centre **under `PAUSED`'s slot**, so the paused weapon mode keeps both apart with `PAUSED` where it always is (my call, the hud's: both had the top centre). **`RADIO` moves onto `STEPS`** in the weapon states (`onIn`). **A reflex card sits beside the weapon card**: the panel shrinks to its weapon card alone (`cardonly`) and the card takes the rest of `STEPS`, so the believed state stays in sight at the moment of diagnosis (the fixer's; the build sheet had it take `STEPS`' whole place). At 1024 × 768, 1280 × 600, 1600 × 900 and 1920 × 1080 every pair is apart (`core-browser`), `PAPER`'s foot clearing `RADIO`'s top by 314, 146, 233 and 279 px and `TOASTS` by 26, 154, 85 and 102 px, and the picture's centre stays clear.

**`PAPER`** (`src/ui/hud/paper.js`): your card from `rangeLook()` at `PAPER_K` 4 px a centimetre at `--ui` 1 (the 30 cm card 120 px), its rings and the black, the lane and the distance over it, each hole a torn 6.7 mm hole, dark in the paper and light in the black; the course's earlier strings stay plain and dimmer, and **only the newest hole is numbered**, ringed in red (the fixer's: every hole numbered had made a knot in the black). At a string's CEASE FIRE its score goes under the card, **every shot in order, a miss "-"**: "STRING 2 · 4 - V - 4 · 13 OF 25 · 1 V", until the next commence fire. **The radio box** (`src/ui/hud/radio.js`, tradecraft's earpiece grown): the `say` facts under who said it, the tower's as "◉ TOWER · GYSGT ROMERO" (kind `pa`), the coach's as "◉ SGT TREVELYAN · BESIDE YOU" (kind `speech`), **two speakers' lines** at most, a long one wrapping to two rows and then shown alone, each held 3.5 s and 0.33 s a word on a clock that stops with time.

**As built in v0.0.7** (`layout.js` `STATES`, `placeFar`; `src/ui/cards/kd.js`; `radio.js`; the build sheet 0.0.7 §2.5). **Two weapon states more, `weapon-far` and `weapon-far-paused`**: the weapon mode's rectangles with `PAPER` yielding, since on a KD line your face is in the far window (section 2.4), which the placer slides round every rectangle of the state. **PAPER on the KD** (`cards/kd.js`) shows the zero card live as you fire, **the group card** once the coach has read a group (its holes, the coach's combined centre, his call as an arrow and "6 DOWN · 14 RIGHT"), your face as the pits mark it, and **the score card** once marked ("300 M · V 5 - 5 5", "20 OF 25 · 1 V"); the group and score cards stay up with the far window open, which then goes round `PAPER` (the state `weapon`). **The radio box drops the older voice when the newest wraps**, measured by the voices' own heights (the box is aligned to its end, so what overflows goes off its top, which `scrollHeight` did not count: two wrapped lines had each been clipped to a row; the integrator's). **The end card** says the KD's summary ("Clear at 10:27 · zero in 2 groups · 300 m 25 of 25 · 200 m 40 of 45 · 7 V · no faults"), an incident when there was one, and a third line ranking relay one with you (`kdNow`'s `relayLine`); a rule's words are `STOP_WORDS`' (WEAPONS §6.4). **C lists your wounds in words** (BODY §2.5), and the picture dims as a casualty fades.

**As built in v0.0.8** (`layout.js` `STATES`; `src/ui/hud/timer.js`): **two states more, `walking-paper` and `paused-paper`**, walking's and paused's with `PAPER`, where the coach's shot timer paper stands on the pairs course in stop motion and out of it; `PAPER` clears `TOASTS`, `WATCH` and `PAUSED` at every size the tests use (checked against every rectangle at four sizes; `ui-pairs` at 1600 × 900 and 1024 × 768). Left open (the fixer's list): the HUD's DC list over the figures at 1024 × 768, the timer paper over the 25 M board, and the folded gated row wrapping onto two lines.

**As built in v0.0.8: the far window and its plates keep clear of the wind flag you read** (`layout.js` `flagToKeep`, `FLAG_KEEP_M`, `FLAG_IN_FRAME_K`, `placeFar`'s `keep` option; `main.js` `flagBoxes`, which publishes the box kept as `__olympus.far.flag`; the sock verifier's finding of 0.0.8, my calls). `flagToKeep` picks the nearest KD flag within 30 m whose pole is in the picture with at least `FLAG_IN_FRAME_K` 0.6 of its box. A flag's box is `FLAG_KEEP_M` (3 m each side, 7.5 m up for the 4.5 m pole and the sleeve's reach, 0.5 m down); the part in the picture must meet no HUD rectangle of the state, and `placeFar(..., { keep })` treats those boxes as more rectangles to stay clear of. Where nowhere is free, `main.js` places the window again without them, over the flag (the target comes first). The rule: **one wind flag is always readable from the firing point on every KD line and lane at 1024 × 768 to 1920 × 1080** (PLACES §4.12's row of four flags 18 m downrange makes it possible).

### 7.6 The body strip and the hands line

The user's recent verdicts on words in the interface: "too wordy, this needs to be a on-hover infocard", "too many words, this should be graphics" (tradecraft, 2026-11-04), and body screens "should include graphical representations (high quality based on inventory screen)" (2026-11-03); the brief asks for "managing hygiene levels" (2026-11-05). So the felt body is drawn, with the numbers still out of it (my call):

- **The strip**: nine 5×5 pictograms (section 9.1) in a row: water, food, bladder, bowel, sleep, grime, heat (the thermometer when hot, the flake when cold), air, pain. Each is **filled from the bottom to its felt band** (BODY's band for the need, as many of the glyph's five rows as the band's place in BODY's scale), and the fill is **dithered by the belief's confidence** (solid when sure, a 50% checker when "thinking so", 25% when guessing: SKILLS' and BODY's belief words). The words are in an on-hover infocard: BODY's belief line ("Fed two hours ago; thirsty"), never a number the character could not know. A glyph in a warn or urgent band takes the instinct's tone as its border, doubled by its fill (section 12).
- **Where it shows**: always at the head of the character sheet's ON YOU (section 8.2); in the outcome strip for the needs that moved (section 5.6); and **folded into the watch** while a terminal is worn, where by default it shows only the glyphs whose band has left "fine", so it is empty when all is well and is not a row of meters to keep green (pillar 1). Settings offer "all nine" and "none" (section 12).
- **The hands line** on the watch: the held item's icon, the **selector glyph** (the lever at its position on a dial: safe, semi, auto or burst, from what the character believes, with a `?` beside it when the belief is unknown) and the **posture glyph** (the weapon's line at the carry posture's muzzle angle against a 1 px body tick: slung back, slung front, patrol carry, low ready, high ready, compressed). Their words are on hover: "Rifle · patrol carry · safe, as you left it".

### 7.7 The hit card: a person hit, drawn as a range target is

Designed 2026-11-07 for the user's words of that day (DESIGN.md's log): "Targets in game should be represented with the same logic we represent the shooting range targets, drawn with impact points drawn as well, using similar to inventory and character menu drawings of people." The doctrine proposal's card, whole (my calls unless named); the judge's gaps (the mapping, exits, several people hit, legibility) closed here.

- **What it is**: `PAPER`'s card (section 7.5: your card close, its holes, the newest numbered and ringed red, the string's line under it) for a person. The person is drawn with **the doll** (section 4: PERSONNEL's and the inventory's drawing), front view, head to mid-thigh, as the character perceived him (his kit, the plate carrier's outline, the helmet, the weapon as identified), at `HIT_PX_PER_M` 96 card pixels a metre in `PAPER`'s 200 × 200, 40 px of words under it, at a whole number of device pixels a card pixel as the weapon card is. Faint man-target zones over the doll at 25% (the box over the heart and lungs, the head's T, the pelvis), so it reads as the range's board. [computed, COMBAT §5's T17] The figure is 110 px tall and its shoulders 48 px, six times the stage's scale; a 6.7 mm hole, 0.64 px true, is drawn as a 3 × 3 mark (4.7 times life, as the stage draws a magazine larger than life); at `--ui` 0.85 the card is 170 CSS px a side.
- **Where a mark goes**: WEAPONS §8.7's hit record gives the part (a torso hit turned to an arm by BODY's `ARM_SHARE` is drawn on the arm) and the roll's margin; the point inside the part is the man-target's (`manHole(face, part, roll, shotId, seed)`, built in v0.0.8: the A zone at a margin of 4, else the C zone), placed in the doll's figure coordinates by hash of the shot (cosmetic, never the dice). A plate's stop is the grey splash with frayed cover; a graze a 3 px streak; a training round's paint a splash of its colour; a miss a "-" in the string's line, never on the figure. **Exits** (`penetrate.js`'s `through`) are on the back view, a toggle (B) on the card, at the entry's point mirrored and shifted by the round's yaw.
- **The words under it**: the string, "PAIR · CHEST · PLATE" (HEAD, CHEST, BELLY, PELVIS, ARM, LEG, PLATE, GRAZE, MISS), then one line as the character can tell it: "Two in the chest. He went down and stayed down." Never his blood, never "dead" before someone checks.
- **Belief, then truth** ("we only know what we know"): during the fight the card shows what the shooter could tell: a **called** mark (a hollow ring where the sight was at the break, blurred by the shooter's Marksmanship) and a **seen** one (filled: a stagger, a puff, a plate's spark); a teammate's hits seen on the same man in a pale tone, unnumbered. **After the fight** (the consolidation's new step **"Search him"**, 20 s, COMBAT §7.7) and in training's hot wash, the truth: every hole, exits on the back view. Paper and steel targets show the truth at once, as the range's do.
- **When**: at the pause after any hit on a person or a man-target (stop motion); held `HIT_HOLD_MS` 6,000 out of stop motion; in the search; in the hot wash, a card a target or role-player; in the after-action report's annex, small; in the use-of-force review as evidence (COMBAT §9.7: "two in the back" is a question the board asks); on first aid (H) for a casualty you treat, the same marks.
- **Several people hit**: the card follows the pick, the person the brackets are on, so picking another person (the keys and the mouse that already move the brackets) shows his; a strip of small tabs under the card, one a person hit this fight, newest first, says how many there are. No new key.
- **For whom**: the player sees his own hits and his team's as seen; the truth after the search. NPCs never see the player's card. At 16 px/m the stage shows the spark, the puff, the blood and the stagger, and the card carries what the sprite cannot (section 2.2's rule, as the weapon card does).
- **The look is chosen from numbered samples** (the house method; §18, question 21): **A** the doll in colour (default: "similar to inventory and character menu drawings"); **B** the man-target board, khaki, the person's outline and kit in its two tones, holes in ink (the turner's face grown); **C** the casualty card's front and back outlines with marks (the TCCC card's diagram, COMBAT §12.3). Each shot at 1,024 × 768, 1,600 × 900 and 1,920 × 1,080 in the gallery.
- **Built** with `test-stress` (on turners, 0.0.7c) and `test-breach` (on people, 0.1.x); `sim/arms/marks.js` (`hitMarks`, as built in v0.0.10: VIEWS §4.2), `art/doll/hitcard.js` and `ui/hud/hitcard.js`; the `hitcard` test (COMBAT §25.18.4).

**As built in v0.0.10** (`src/art/doll/hitcard.js`, `src/ui/hud/hitcard.js`, `layout.js`, `src/ui/cards/end.js`, `stress.js`, `samples/hitcard/`; the build sheet `docs/build/0.0.10.md` §8 items 15 to 18, §10 items 31 and 32; look A, the doll in colour, until scored; each my call):
- **The turner as the doll in colour** at 96 px a metre, head to mid-thigh (the 2× crop to the waist was not taken: it would cut the man-target's C zone and low hits), the zones laid over him at 25%, what he holds in his hands; the doll has no civilian clothes, so a threat is drawn in utilities, bare-headed, with what he holds, an armoured face in the plate carrier and helmet, a no-shoot bare-handed.
- **Place: `HITCARD` at the top left under `TOASTS`** (`layout.js`), not left of PAPER as the sheet said: at 1600 × 900 left of PAPER covered the coach, where the din's horn and flashes are drawn, since the camera leads and the shooter and coach stand left of the middle. The picture's middle stays clear; PAPER keeps its place as built.
- **Size**: painted at `cardSize(ui)`, **200 card pixels from --ui 1, 170 at 1024 × 768** (--ui 0.85), at the box's whole pixels (crisp; it was resampled smooth and blurred at 1024 × 768 before the fix), and **shown at whole device pixels a card pixel while they fill 66% of the box (`HIT_FIT_MIN` 0.66), else smooth** (`hitFit`): at 1600 × 900 200 crisp pixels in a 250 box, at 1920 × 1080 200 in 300. The headline and the coach's line are both at 2× the 3 × 5 alphabet, up to two and three rows (`wordsRows`); each mark's number is placed clear of the others by 2 px (`tagPlaces`; a Pair's 1, 2 and 4 had sat on each other). Shown at the pause in stop motion and **`HIT_HOLD_MS` 6,000** after leaving it.
- **Several turners hit** (string 5's two): **tabs** under the card, one a turner hit, newest first (L3, L2).
- **Belief, then truth** (the user's answer A to question 22): during a string, rings and seen fills; from its end the holes by zone, the calls faint under them, the coach's line. VIEWS §7.7's "paper and steel show the truth at once" is read as the range's 25 m card only.
- **The end card's hot wash**: one truth card at the HUD's size, outside the glass beside it (`.end-wrap`), with a button a string and painted when chosen (it replaces the five small thumbnails, which were smoothed to 61 to 90 px and unreadable). From the second sheet on a seed **the session's grid** (`sessionGrid`, page memory) sets the sheets side by side, a row a string (the freeze, the first round against calm, the RELOAD), in place of a summary line a sheet. The end card for "Bang" is wider (680 × --ui) with its choices in two columns, so nothing scrolls at 1600 × 900 or 1024 × 768 with two sheets.

**As built in v0.0.13: the hit card is B** (the user, 2026-11-08: B ★ 99, A 10, C 0, "Second set is perfect, keep all three to represent varying ranges"; `src/art/doll/hitcard.js`, `src/ui/hud/hitcard.js`, `main.js` `hitModelOf`; question 21 answered):
- The hit card is B, the khaki man-target board, at every window size (a 170 to 200 px card). A and C are removed (`ZONE_C` and `LOOKS` are gone). Holes are in ink with the board's ink rim; calls are in amber.
- **The board's figure is drawn at its range band's density** (`HIT_BANDS`): near, up to 10 m, at 96 px/m; mid, up to 25 m, at 80; far, beyond, at 64. `bandOf(rangeM)` gives no range as near, the card as scored. The range comes from `hitRangeM(turner, player, R.line)`: the course's line first (so all of "Bang"'s lanes are on its 7 m line), else the ground distance to 0.1 m, else null. The card repaints when the band changes, not the metres. A smaller board stands lower on longer stakes (`STAKE_IN_PX` 24, `STAKE_W_PX` 3) and the marks keep their sizes; `figAt`, `manToCard` and `zonesOnCard` take `pxPerM` in place of the old look argument.
- **My reading of "keep all three to represent varying ranges"** (my call, to confirm with the user): the three densities are the ranges. If the user meant the three looks, a revert restores A and C.
- **The look round's samples** (the gallery, `./play.sh --gallery`): `samples/guns/` (the gun looks and finishes), `samples/hitcard/` (B at three sizes and `hitcard-b-ranges.png`), then 2026-11-11's `samples/panel/` (P1 to P3, §7.8) and `samples/walk/` (W-a to W-f: W0 as built and the candidates A, B and C, then the four side by side and in utilities, §3.10.4).

### 7.8 The step panel by groups: three layouts to score

**Designed 2026-11-11 (the user's note on v0.0.12)**, to build in the shoot house rework (ROADMAP §4.2's rework row, stage R7; COMBAT §25.19.7). The user: "The numbered options have felt off for a while but here we can see that it's not something we can continue with in this state, I spend my time either tapping "T", or cycling through endless, seemingly unorganized options with "0" until I find what I'm looking for. If We're going to keep this system of numbered options, we need to find a way to group them by type and find a clever way to make this manageable with top of the head core gameplay options being always visible and accessible (even if grayed out, like hammer if you only have one bullet)." Designed by the panel role from the panel audit's 832 recorded choices (`.run/rework1/auditor/presses-house.json`, `presses-other.json`), replayed through a press model (`.run/rework1/panel-design/cost.mjs`). Section 7.4's panel stands until this is built; its "As built" notes are the reference it replaces.

**What was wrong** (v0.0.12, the house's lane): 33.6 rows across 4.8 pages on average, 31% of choices past page 1; no row with a fixed digit (Fire held 33 page-and-key places on the lane, Aim 34, "Clear!" 21); one Watch or Look row per hot spot took a quarter of page 1 (chosen 18 times); the `halfOrLess` bug kept Top up on page 1 (never chosen); the moving and planted twins doubled every shot row; high ready, the posture that avoided the flag, was never on page 1. The scored scenes (Pairs, Three bangs, Bang) worked because at a contact everything chosen was on page 1, in 125 of 125 panels; the house broke that with the drill's 7 to 11 rows. **1.84 presses a choice on the lane, up to 8.**

#### 7.8.1 The model all three layouts share (my calls)

**Five groups, each a fixed map of at most nine slots.** Every row `stepsOf` offers gets a `group` and a `slot`, both fixed; a verb keeps its slot in every scene that has it (Reload is GUN 1 on the 25 m line, in the house and in a firefight). COMBAT §25.19.2's drill groups map onto them: stack, door and room are DRILL (two halves by where you stand: outside a door, inside a room), shot is FIRE, weapon is GUN, team is TEAM; BODY holds the body's rows. `⇄` marks a toggle: one key, never two rows.

| Slot | FIRE | DRILL, outside a door | DRILL, inside a room | GUN | BODY | TEAM and VOICE |
|---|---|---|---|---|---|---|
| 1 | Pair | Stack up | Watch your corner (Q and D step the hot spot) | Reload, by purpose (speed when empty, Top up when half or less ⇄ keep the empty) | Low ready ⇄ High ready | Cover me |
| 2 | Hammer | Stack up, take point | To your point (Dominate from rung 2) | Gun down | Careful ⇄ Fast (Combat ⇄ Assault) | Stack on me |
| 3 | Triple | Open (push or pull, from the swing) | "Clear!" | Transition: pistol | Kneel ⇄ Stand | Hold the door |
| 4 | Failure drill | Kick door | Go long | Off the line | Prone | On me |
| 5 | To the head | Breach (the one issued) | Mark the room | Safe ⇄ Off safe | To cover (its outline glows, section 7.4) | Ready (the squeeze) |
| 6 | Fire (one round) | Flash, then in | Coming out | Finger off ⇄ on | Stop here (plant the feet) | Challenge ("Drop it!") |
| 7 | Aim ⇄ Hold (Hold: covered, no shot; "Hold him" folded in) | Enter (its reach by rung) | To the next door | Check: press ⇄ magazine | Wait | Short room |
| 8 | Breathe | Read the door | Hold it (an inner door) | The tower's command ◉ (LOAD, MAKE READY, UNLOAD, SHOW CLEAR, CEASE FIRE, and Stop: safe, finger off, low ready as one macro) | Sling it ⇄ Relaxed | Next man in |
| 9 | The line ▸ (the 25 m and KD line's rows) | Hold it (a door not taken) | Clear it (an inner door) | Hands ▸ (lock back, magazine out ×3, reach, port cover, inspect, remedial) | | Status |

A `▸` slot opens a third level, holding only rows never chosen on the lane (the admin singles: 0 of 343 choices on the lane, 1 in 278 Pairs panels); on a KD line the line's rows become FIRE's own half.

**Cuts and fixes, whatever the layout**: no "Clear the house" (COMBAT §25.19.2); **one shot row per shot**, the feet by the drill and shown on the row as a variant (COMBAT §25.19.3.2), BODY 6 "Stop here" planting on purpose; **one Watch row**, naming the drill's next hot spot, Q and D (KeyA, KeyD) stepping the pale bracket across the hot spots when nobody is in sight, as they step across targets now (frees 25% of today's page 1); `halfOrLess` against the magazine's load; **the Stop macro** (36 of 48 Stop choices were past page 1); CEASE FIRE and UNLOAD mid-lane only when the tower calls them; no rows for actions with a key (X, A and W, Wait's duplicate: the key strip shows them as keycaps); **the DI's line always names a key that works** (the digit or the key sequence when T cannot act; with one round left, Reload or Fire, never a struck Pair).

**Greyed, never removed.** A row the situation could offer is drawn at 40% opacity with a badge at its right edge: the remedy's key where the panel has one, else a glyph; the hover gives the reason in words; pressing it flashes it and its remedy's key with `refusedStep`'s toast.

| Reason | Badge | Example |
|---|---|---|
| another step first, which the panel has | an arrow and the remedy's keycap, `→2` | Pair, aim first `→2`; Fire on safe `→8` |
| not enough rounds | a round glyph and the count, `▮1` | Hammer with one left (the user's example); Triple `▮2` |
| a skill gate | `MKS 18` | Triple for a private |
| not yet taught (the rung) | rung chevrons and the rung needed, `▲▲ 2` | Flash, then in for a new join |
| not yet done by hand once | `✋` "by hand first" | the first time it is offered |
| not issued | the item's silhouette, struck | Transition: pistol below the Sergeant |
| locked | a padlock | Open on a locked door (Kick and Breach stay live) |
| nothing to act on | an eye, struck | Aim with no one in the frame |

**The rung changes how far a row goes, not which rows exist** (COMBAT §25.19.2.3): the panel is the same from the recruit to the tier one, and each digit means one thing for a whole career. The row shows its reach as COMBAT §25.11's dots ending at the seam bar `│`: "Kick door" from 4 m down the hall is `●│` (stack, then hand back) at rungs 0 and 1, `● ●│` at 2, and `● ● ● ● ●│` to "Room clear!" at 3 and 4 (drawn in one lane at 4). Open, Breach and Flash include the stack from rung 2 when you are not stacked, and below it show `→1` (Stack up first).

**T and the core.** T keeps its meaning (tapped, what the instinct says; held, the next choice), and T's act always also sits on one visible key with a brass edge (NEXT), so T is never the only way. **The core five**, each on a fixed key in every layout: **the shot**; **Aim ⇄ Hold**; **Fix**, the remedy for the gun's state (Off safe, IMMEDIATE ACTION, MAKE READY, Press check, RELOAD; with nothing to fix, the reload by purpose; `remedyOf` already computes it); **the muzzle**, Low ⇄ High ready; **NEXT**, T's act. Every digit keeps its tempo: tapped normal, Shift rushed, held 220 ms careful.

#### 7.8.2 Layout A, "Home and drawers" (digits only, two levels)

- **Always shown**: the core on 1 to 5 (1 Pair, Fire on a paper line; 2 Aim ⇄ Hold; 3 Fix; 4 Muzzle; 5 NEXT with its `T` keycap), tiles with a 16 px pixel icon, a two-word verb and the time; the groups on 6 to 0 as drawer tabs (6 FIRE, 7 DRILL, 8 GUN, 9 BODY, 0 TEAM), each with its live count and an amber dot when it holds the row the DI names.
- **A group**: its digit opens its drawer over both bands, its slots on 1 to 9 in the fixed map, 0 `◂ home`; it closes after a choice, on 0 or on its digit again, at no game time. **FIRE opens by itself at a contact's pause** (the shots one press, as in Pairs and Bang, Pair still on 1) and closes when the contact ends; with a stoppage it stays shut, so Fix is one press (the sample's call). DRILL never opens by itself.
- **The DI's line** names the path: "Kick door: 7 › 4".
- **The press model**: the lane 1.35 presses a choice (65% in one), a contact 1.07 (93%), other scenes 1.10, Pairs' contacts 1.01; never more than 2.
- **Risks**: modal (with a drawer open, 1 is not Pair); 6 to 0 at the far end of the AZERTY digit row.
- **The designer's score** (speed / discoverability / fit / AZERTY, out of 5): 4 / 5 / 4 / 3 = **16**.

#### 7.8.3 Layout B, "The fixed ten and the letter banks"

- **Always shown**: the same ten verbs on the ten digits in every armed scene, never paged or reordered, greyed as above: the shots on 1 to 5 (Pair, Hammer, Triple, Failure drill, To the head: Hammer stays on 2 struck `▮1` with one round left), the core on 6 to 0 (6 Fire, 7 Aim ⇄ Hold, 8 Fix, 9 Muzzle, 0 NEXT `T`). On a paper line 1 to 5 are struck with the eye: a waste of space, but a digit never changes meaning.
- **A group**: four banks on letters under the left index finger, which never leaves Z Q S D: **R** the Room (DRILL), **C** the gun and its sights (GUN and the line's rows; *chargeur*), **B** the Body, **F** Friends (TEAM). Drawn as keycaps at STEPS' right edge with counts and the DI's amber dot; a bank's map replaces the ten on 1 to 9 and closes after a choice, on Esc or on its letter again. Banks never open by themselves.
- **The DI's line**: "Kick door: R › 4".
- **Keys taken in the mode**: R opens its bank except while a reflex card is up (where it keeps the answer); C opens its bank, so the sheet is reached through Esc in stop motion; B and F are free in the mode today; V keeps its meaning.
- **The press model**: the lane 1.36 (64%), a contact 1.10 (90%), other scenes 1.11, Pairs 1.05; never more than 2. The most stable keys: each of the ten has one key for the whole game.
- **Risks**: four letters to learn; the drills (39% of the lane's choices) always two keys unless T names them; Triple and To the head take two of the ten best keys even for a recruit.
- **The designer's score**: 4 / 3 / 3 / 5 = **15**.

#### 7.8.4 Layout C, "Five that follow the situation, the core fixed, a fan for the rest" (the designer's lean, my call)

- **Always shown**: 1 to 5 the situation's five, a fixed set for each situation, named by a label (an icon at 1024 × 768) at the band's left; 6 to 0 the core, as in B.

| Situation | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| CONTACT (a contact's pause) | Pair | Hammer | Failure drill | To the head | Challenge |
| AT THE DOOR (outside, a door within 4 m or on the plan) | Stack up | Stack up, take point | Open | Kick door | Breach (the one issued) |
| IN THE ROOM (inside, nobody up) | Watch your corner | To your point | "Clear!" | Coming out | To the next door |
| AN INNER DOOR | Hold it | Clear it | Watch your corner | "Clear!" | Coming out |
| STOPPAGE (after the card's answer, or a click with a threat up) | Gun down | Transition: pistol | Off the line | REMEDIAL | Cover me |
| THE TOWER (a command given) | LOAD | MAKE READY | UNLOAD | SHOW CLEAR | Stop |
| THE LINE (paper targets) | Top up | Press check | Kneel ⇄ Stand | Prone | Breathe |
| THE KD LINE | Hold (your read ⇄ the coach's) | Dial the call | Dope for the line | 1× ⇄ 4× | Breathe |
| UNDER FIRE (not yet built) | To cover | Suppress | Bound | Crawl | Cover me, moving |

  CONTACT keeps Pair on 1, so the scored scenes' first key does not change.
- **The rest: the fan.** **Tab held** (or the right mouse button held) turns STEPS into a half-wheel of the five groups (FIRE, DRILL, GUN, BODY, TEAM); a first digit picks the group, whose map opens beside the fan on 1 to 9, a second the row; releasing Tab closes it. Tab tapped still opens the mind (a press key's `held` at 220 ms, as R and T). With the mouse, the drag's direction picks the group and a click the row. **The fan opens inside STEPS, never over the picture** (at 1024 × 768 a wheel at the pointer would cover about 10 m: the room being cleared).
- **The DI's line**: "Kick door: 4"; outside the five, "Go long: Tab › 2 › 4".
- **The press model**: **the lane 1.09 (96% in one)**, a contact 1.13 (93%), other scenes 1.20, Pairs 1.02; at most 3 key presses.
- **Risks**: 1 to 5 change with the situation (named on screen; a wrong key costs nothing until the step runs, and Backspace stops a bundle after its beat); Tab and a digit with one hand; Triple only in the fan (gated below Marksmanship 18, never chosen on the lane).
- **The designer's score**: 5 / 4 / 4 / 4 = **17**. Fallback B if the user prefers one meaning per key over one press at the door; a hybrid (C's bands with B's banks) only if holding Tab plays badly.

#### 7.8.5 How the user scores them, and what the build holds

- **The gallery** (`./play.sh --gallery`; built 2026-11-11, shipped in v0.0.13): `samples/panel/`, groups **P1** (A), **P2** (B) and **P3** (C), 10 views each: five moments captured by the house and range bots (seeds 1489397426 and 48213, `samples/panel/moments.json`): a private stacked on room 2's door ("Open it. Pull."), a corporal at the hall's pistol man with one round left ("Press."), the corporal's click on the dummy in room 2 ("Immediate action."), the 25 m line under LOAD, and each layout's second level open (A's DRILL drawer, B's bank R, C's fan on DRILL); each at 1600 × 900 (`--ui` 1.25, verbs and times in full) and 1024 × 768 (`--ui` 0.85, one word a key, the times on the hover). The rows the game offers come from `stepsOf` through the hud's `timeText` and `oddsText`; the rows the design adds are drawn in its state, with no time; ✓ marks a row already done (the sample's call). 30 of 30 shots crisp.
- **A playable toggle** (my call; a control scheme has to be played): `&panel=a|b|c` on `test-shoothouse` and the other armed scenes, and an Esc menu toggle saved as `olympus.panel`; the model of 7.8.1 built once, one drawing layer per layout, the losers deleted on the user's pick.
- **Tests each layout passes, printing its numbers**: the audit's choices replayed (presses a choice, the share over one press); every key the DI's line names works on the panel, the hall's "Pair." dead end pinned; no row ever changes slot within its group (a stability count against v0.0.12's Fire in 33 places); `layout.test`'s rectangles apart at the four window sizes, the fan included; the T-only bot unchanged.

---

## 8. Cards and screens

### 8.1 Common chrome

Everything that is not a paper is a card on **dark glass** (`rgba(20,21,28,0.94)`, 1 px border `#353947`, radius 4), headed by a plaque in the pixel alphabet (the user, 2026-10-28: "most menus need revamping, the generic paper isn't adapted to inventory for instance"). **Papers stay paper** (`#f4efe6`, typewriter type). Every card pauses the game. Cards size to their content within 1,200 × 760 CSS px at `--ui` 1; `--ui` scales the whole UI from 0.85 to 1.5 with the window (tradecraft `ui.js fit()`). Headings are amber uppercase (`#e7b84a`), the Corps' own marks (unit emblem, letterheads) MCRN red `#c1553b`. Numbers are tabular Mono. Where a line would be a paragraph, it is a graphic with an on-hover infocard instead (the user, tradecraft 2026-11-04: "too wordy, this needs to be a on-hover infocard"; "too many words, this should be graphics"). **As built in v0.0.5** (`src/ui/boot.js` `CARD_GUARD_MS`; my call, the fixer's): a card opens with the focus on its lead line (the end card's Score it) and **takes no Enter or Space for its first 400 ms**, so a key meant for the screen before never presses it (Enter, read as the HUD's "end the scene", had pressed the end card's Again and thrown the run away); a digit names its line, so it is never pressed by accident. **From v0.0.6** the R menu (section 8.10) is a card like every other: centred, pausing, its own keys read while it is open (`boot.js` `openCard` with `{ guard: false }`, since its keys are its own from the first frame). The runtime review found it covering the picture's centre, which this section allows; the user may ask for it beside the figure (section 18, question 14). *Default: centred, as every card.*

### 8.2 The character sheet (C): PERSONNEL

Tradecraft's four columns (`shots/tradecraft-charsheet.png`), made a service record:

| Column | Content |
|---|---|
| The doll | you as you stand, wounds numbered |
| ON YOU | the body as you read it: first the body strip of section 7.6 at twice its HUD size, each glyph filled to its felt band and dithered by the belief's confidence, with BODY's belief in words on hover ("Fed two hours ago; thirsty", "Sore from yesterday's ruck"), never a number the character could not know; then FITNESS (base, the effective band of ±3 round it as cells, the week's load bar) and G-CONDITIONING (the same shape: where you stand against 1 G, the week's centrifuge and thrust hours); then CARRYING (mass, and what it bears like here, section 8.3) |
| WHAT YOU ARE | Warfighting as a bar with its XP; the skills with their level words, practice dots, rust, multiplier and value (SKILLS gives them) |
| THE FILE | name, rank and insignia (drawn at doll density), MOS, unit (1st Squad, 2nd Platoon, Echo Company, 2/4), time in service and in grade, qualifications with their dates and expiry (rifle, pistol, swim or suit, CPR), awards, the record of counselling and NJP, the next board |

**As built in v0.0.4** (`src/ui/cards/sheet.js`, C, paused): **three columns**, WHAT YOU ARE waiting for the skills (0.0.6). The doll (section 4.2's first cut) as you stand. **ON YOU** gives BODY's words for each need (`wordsOf`: "Fed two hours ago; thirsty."; after the shower "Fresh. Hair wet.", "Fresh. Head wet." on a shaved head), each in a row headed by its strip glyph, in the strip's order (the review of v0.0.4: nine glyphs in one row above a table of ten had matched nothing, so the watch's folded glyphs could not be learnt), with words where BODY's first band has none ("Not thirsty.", "Nothing pressing.", "Breathing easy.") and the rows Shave, Breath, Nerves and Morale for stubble, stamina, stress and morale (no Shave row on a body that grows none); never a number. **THE FILE**: name, rank, MOS, unit, billet, rack and time in service, from the roster. **As built in v0.0.5**, where a sheet is written (the scene's player, SKILLS §15.1) THE FILE gives the two skills the line rolls on in words, "Marksmanship 9 · course", "Weapon handling 11 · advanced"; WHAT YOU ARE still waits for the skills in full. **As built in v0.0.6** (`sheet.js`; BODY §6): ON YOU gains **a Hands row** (`wordsOf`'s hands: "Clean hands.", "Dirty hands, since the head.", "Gun oil and carbon on your hands.", "Regolith ground into your palms.") and **a Haircut row** from `hairOf` ("High and tight · fresh from the barber", "Low regulation · growing out", "Haircut due Wednesday.", "Out of regulation.", "Shaved head · freshly buzzed"), never a number; "Head wet." now reads for the `shaved` cut (v0.0.4's `bald` is gone). The doll wears the cut at its step (section 4.2).

**Hardening on C** (2026-11-07; SKILLS §6.8): in WHAT YOU ARE, under Warfighting, "Hardening · green · inoculation 6 of 10: as far as unit training goes", the level word (green, settled, steady, hardened, unshakeable) and its hover ("How much of the noise reaches your hands. It grows with fights lived and with training under noise and bangs."); "frayed: the noise reaches you more today" while the body's toll takes some back. The test scenes' picker and end card show each sheet's ("Tier one · WF 93 · Hardening 95").

**As built in v0.0.9, hardening in words** (`src/main.js` C's row, `src/ui/cards/pairs.js` the picker; the user's answer to COMBAT §24 question 16; the build sheet §8 item 16): C's WHAT YOU ARE reads "Hardening · green · inoculation 2 of 6: as far as boot camp goes" (the word first, the number and its parts, experience, inoculation and toll, on the hover); the picker labels each sheet "Hardening: green" and leads on "Three bangs" (the picker opens on the Boot recruit, "Again as Tier one" the second half), the number on its hover. "Again as …" leads with the hardening word. Felt is never a number on the HUD.

### 8.3 Inventory (I): by load-bearing gear

Tradecraft's inventory (`shots/tradecraft-inventory.png`, `src/ui/pockets.js`) with the doll at the left and containers as tiles; OLYMPUS arranges tiles by the gear they belong to, top to bottom as they sit on the body. The user's rule carries over: "very little storage space, no magic inventory, volumes and pockets" (tradecraft, 2026-10-26).

**One rig, one table.** The containers below are the rows of one container table, `src/sim/arms/kit.js` (TECH §2.1: containers and load-bearing gear, WEAPONS and VIEWS). VIEWS draws from it, WEAPONS' issue counts and BODY's masses read from it, and nothing keeps a second list (my call, after the user's "why are all these items … not taking any inventory space ?", tradecraft 2026-10-31). The rifleman's rig is the real one: WEAPONS §3.3 issues 7 magazines, 1 in the rifle and 6 in pouches, "two magazines to a chest-rig pouch".

| Group | Containers (defaults; the table above holds them, WEAPONS and CAREER set the issue) |
|---|---|
| In your hands | right, left |
| Slung | the long weapon on its sling (its posture) |
| Plate carrier, front | three double rifle magazine pouches (two magazines each, 0.6 L each: a HAD-30 is 0.27 L), admin pouch (0.5 L), radio pouch |
| Plate carrier, sides and back | IFAK, hydration bladder (water in litres: BODY's), drag handle |
| Battle belt | holster (right thigh), two pistol magazine pouches (one magazine each, 0.08 L each: a HAD-17 is 0.06 L), dump pouch (left hip, 3 L collapsible, for empties), canteen |
| Uniform | blouse chest pockets ×2 (0.3 L), sleeve pocket (0.1 L), cargo pockets ×2 (1.0 L), hip pockets ×2 (0.4 L) |
| Suit | thigh pouches ×2 (0.5 L), tether and tool hardpoints, the patch kit pocket |
| Pack | assault pack (25 L) or ruck (60 L), with its own items list |

Each tile shows its fill bar, its items with pixel icons (drawn by code at icon size, tradecraft's `heldIcon()` grown into a kit icon set), and **its reach**: how long getting a thing out of it takes (WEAPONS' draw and reach table), so a magazine "from the chest, 1.4 s" and "from the pack, 20 s, pack off" read at a glance. Buttons per item: take out, put away into…, drop, use; digits pick the first button. A header line gives the mass on you and what it bears like here: "31 kg on you · bears like 12 kg at 0.38 G · its inertia is all 31". At a wall locker, footlocker or armoury counter the card splits: you on the left, the store on the right, and **presets** (PT, utilities, range, field, suit) apply as one dressing activity with its splash (my call: the user dislikes chores; the preset is lived as the time it takes, not clicked item by item every morning).

**As built in v0.0.5** (`src/ui/cards/inventory.js`, tradecraft's `pockets.js` ported; from WEAPONS's `kitView(state, pid)`): I on the dark glass, its heading a plaque, the doll at the left, then each container as a tile **by the gear it belongs to**: the plate carrier's two magazine pouches and its dump pouch, each with its **fill bar against its capacity** (`holds`: 2, 2 and 4), its magazines as icons with **their believed counts** behind a window that fills as believed ("5", "≈3" under Weapon handling 15, "?" uncounted), and **its reach**, which is **the sim's own time for a magazine in at your Weapon handling**, the step panel's number (the fixer's: the 1.4 s from the chest and 2.0 s from the dump pouch first shown were charged nowhere; every pouch reaches alike this round); the sling with the rifle and its carry; the head with the ear defenders. **I shows and does not move**: no buttons, I or Esc closes it (the build sheet 0.0.5 §7). The doll does not yet wear the carrier, the ear defenders or the rifle.

**As built in v0.0.6** (`inventory.js` `tilesOf`, `magWords`; WEAPONS §3.3; the user, 2026-11-07: "There should be some way to select which mag we put in as well because we may have different types of rounds in inventory"). **I names your pouches** ("Chest pouch 1", "Chest pouch 2", "The dump pouch") and gives each magazine **its believed count and kind**: "5 in it, ball", "5 in it, kind not seen", "a few by its weight", "not counted", the icon's top round tipped red for a tracer. **Two tiles more** show when they hold anything: the magazine in your hand, and those at your feet (within `FEET_M` 1.2 m), the feet's reach a pickup's and a seat's. A v0.0.5 save's magazines read "kind not seen", since v0.0.5 never told the kind (no upgrade, the before-1.0 rule).

### 8.4 First aid (H)

Tradecraft's first-aid card (`src/ui/body.js` on the doll): the casualty's doll (you or the person in reach) with numbered wounds and their plaques; findings as the character's Medicine read them (a failed read shows less, and says nothing of what it missed); the options as numbered rows in the order COMBAT and BODY set (the MARCH order: massive bleeding, airway, respiration, circulation, hypothermia and head), each with its time at your Medicine, its DC and the supply it uses, greyed with why when it cannot be done. The supplies on you are listed with counts. Choosing runs the action in the world (lived, or skipped with a splash if long).

### 8.5 The mind (Tab)

What the character knows, on the glass (the user, 2026-10-28: "The TAB key for desk should be the mindmap, the character's knowledge"; "a section with an actual map (known only again, it's our mind) where we can select waypoints"). Five leaves, digits 1 to 5:

| Leaf | Content |
|---|---|
| 1 TODAY | the Plan of the Day as you know it (TIME's structure): blocks with time, place, uniform of the day and who; the current block marked; done, late and missed marks; the next duty; T on a block sets a waypoint to its place |
| 2 MAP | the known map in pixel art: only what you have walked within 40 m, plus what you were briefed (hatched, "briefed"); places named with their plaques; waypoints by click; five zoom steps from 120 m to 800 m across, arrow keys and the wheel to pan and zoom, C to recentre (the user, tradecraft 2026-11-03: "the map should be zoomed in our position … and a zooming and arrows control to navigate"). Aboard a ship, the decks you know as a vertical stack of their plans |
| 3 PEOPLE | your chain of command as a tree (platoon commander, platoon sergeant, squad leader, team leader, you) and the squad's roster, each with what you know: name, rank, billet, how you get on in words, where and when you last saw them; then others you know, by place |
| 4 ORDERS | the orders in force: the standing orders (the general orders of a sentry, the base's), the current order from your NCO with who gave it and when, duties assigned (fire watch 02:00–04:00), what is coming (inspection Friday 08:00), each with its source (the times are CONTRACTS §4's) |
| 5 STANDING | where you stand, as the character believes it: with your NCOs and your squad in words with a confidence ("Sgt Reyes thinks you're squared away. You're fairly sure.", Reyes being whoever the roster drew as your squad leader), pay and money, leave days, qualifications current or lapsing |

### 8.6 The log (J)

Every line, newest first, on the glass, with filters on digits: 1 all, 2 rolls, 3 speech, 4 radio, 5 body, 6 orders, 7 heard. As built in v0.0.3 (`src/ui/cards/log.js`) the card shows the last `LOG_CARD_LINES` 40 records, newest last, opened at its end, with no filters; the filters and the newest-first order come with the rolls. Each line is timestamped in the clock you live by, from TIME's face helper ("S590 06:12:33" on Mars, "3 Jan 06:12:33Z" aboard *Testudo*, which sails from Phobos on 2351-12-31: CONTRACTS §3). **Every roll is readable**: its sum on its own indented line with every modifier named, in SKILLS' format, for example "Weapon handling · d20 14 + 9 (skill) − 2 (suit gloves) − 1 (tired) = 20 against 12 · passed". The log keeps `LOG_MAX` 1,500 records in state (TECH §6.5, CONTRACTS §7; tradecraft kept 500); older pages are papers of the chapter.

**As built in v0.0.5** (`src/ui/cards/log.js`; the build sheet 0.0.5 §2.4; the integrator's and the fixer's): J shows the last **`LOG_CARD_LINES` 400** lines (40 had lost string 1 before the scene was scored), **newest first**, with **the filter by kind** (everything, the rolls, what was said, the rest). **Each roll folds to one line, the action's words first**: what it did ("Two rounds in the action: a double feed."), then its short sum under them, "Look at the port: Weapon handling 17 against 4 · routine" (a page of bare sums had said nothing of what was done), and opens to its full `checkText` with the DC's parts. **An observer's look shows only what he found**, named, with no number ("Sgt Trevelyan looks in the chamber: a round in it."). **Hidden rolls are left out** (`hiddenRec`: the silent bad inspection, the coach's failed look; SKILLS §5.14), shown in debug once the scene is over. **The toasts** carry shots by their hole's tone (a 2 on the edge a hole whatever its margin), failures that are not routine and a look that finds a stoppage, each in its words, and range faults as tags ("Fault: the muzzle off downrange"); the voices go to the radio box. A log line of the `note` tone no longer picks up the cards' footnote style (`.glass .note`), which had spaced J unevenly and greyed it.

**As built in v0.0.11**: the watch, the splash's plaque, the log and the wall clocks read the site's clock (TIME §3.1). On a ship the log stamp reads `22Mar 06:12:33`; a wall clock's face named `melas` or `local` reads the site's clock and `utc` reads UTC. `logLines` with no longitude stamps on the live site's clock (it was longitude 0).

### 8.7 Papers

Typed sheets, Papers, Please-cold, as tradecraft's title and briefs: paper `#f4efe6`, rules `#c4bba9`, typewriter type (Courier Prime), stamps in typewriter red `#9e3c36` and MCRN red. CAREER and TIME write their content; the templates are:

| Paper | Look |
|---|---|
| Orders | the Corps' letterhead (SETTING's names) and the unit's stamp; naval-letter blocks (From, To, Subj, Ref, numbered paragraphs); a signature block; RECEIVED stamped with the date when you read it |
| Counselling and evaluations | a form: the marks grid (proficiency and conduct for junior enlisted, SETTING and CAREER give the scheme), the reviewer's remarks typed, your signature line |
| Pay | a leave and earnings statement: entitlements, deductions, balance, leave days, as a table in Mono |
| Letters | lined paper in a hand font (Caveat) when written by hand, or a printed message; the header gives when it was sent and when it arrived, in each end's clock, light lag and relay included ("sent Sol 604 · MY 211, Melas · received 2352-01-03 aboard *Testudo*, light and relay 6 h 12 min"; the ship sails from Phobos on 2351-12-31, CONTRACTS §3) |
| Charge sheets, incident reports | a form with boxes, the charge, the hearing date |
| Chapter pages | the day-by-day of a voyage or a quiet week (TIME §10.6's chapter paper): one line a day, TIME's day line, with the day's activity icons beside it (section 8.11's glyphs, so a week reads at a glance); beside the lines a small chart of the totals by day (fitness load, G-conditioning, skill hours, dose, money), one hairline per quantity in the instrument grammar, printed in typewriter ink; papers inside papers (pay day, an evaluation); the key days marked "lived" |

Papers come one after another after a splash or a chapter (tradecraft's `papers` cards); each can be kept, and the kept ones are filed under ORDERS or the terminal.

### 8.8 The terminal (P)

Your wrist or hand terminal, an in-world screen (section 6) in the instrument grammar: the three clocks (Mars local with the timeslip, UTC, and your body clock as words: "you feel it's mid-afternoon"), messages and letters (opening a letter shows its paper), the Plan of the Day as published (which can differ from what TODAY knows when it changed and nobody told you), and a compass. It is live: the game does not pause.

### 8.9 Menus

| Screen | Look |
|---|---|
| Title | a typed sheet on a dark vignette, as tradecraft's (`shots/tradecraft-title.png`): OLYMPUS letter-spaced, the version, dashed rules; New career, Continue, Load a save file, Tests (each mechanic's scored test scene, tradecraft's method), Settings. The Corps' emblem in MCRN red as a pixel stamp |
| New career | enlistment papers: CAREER's steps as typed forms with choices; Ironman or Standard chosen here, stated plainly |
| Esc menu | dark glass: Resume, Save (Standard only), Export save as JSON, Import, Settings, Quit to title; debug toggles when debug is on |
| Settings | UI scale, text size, keys (remap by physical key), audio volumes by bus, the accessibility list (section 12), autosave status |

### 8.10 Choice cards, talk, reflex

- **Choice cards**: a stamp and a title plaque, numbered buttons, an optional "keep" toggle; digits by physical code (AZERTY's top row types `& é " '` unshifted).
- **Talk**: time stands still (DESIGN.md); the talk box sits by the speaker (placed by the labels pass, section 7.5) with the last three exchanges and numbered lines (PEOPLE writes the content).
- **The hard talk** (PEOPLE §10.11, the user's "KLM style minigame for at least some conversations", tradecraft 2026-10-26): the talk box gains a row for the bout. Each side's **composure** as pips (filled, and hollow when lost), each side's **edges** as small chevrons, the round's number against 12; the three moves as keycaps, **K press · L probe · M yield**, with the wheel that orders them drawn as a small triangle (yield beats press, press beats probe, probe beats yield); when you have read their choice, its keycap lights on their side before you pick; holding Shift on a won round spends an edge, and the keycaps show `⇧` while you can. Each round's result is a line in the box and in the log, with the opposed roll when the choices met.
- **Reflex card**: tradecraft's, numbered options with their times, "nothing" always last, R to keep the answer two minutes.
- **As built in v0.0.5** (`src/ui/hud/reflex.js`; COMBAT §3.5): the reflex card inside stop motion, offered when your own rifle stops itself in a lived step. Its title is a plaque of the picture's alphabet ("Click.", "It didn't cycle."), its options numbered with their times, "Tap, rack", "Look at the port" and "Nothing: stay on the card" last ("Nothing: let it come" for a threat). It sits **beside the weapon card** in `STEPS` (section 7.5). A digit answers; R flips keep and the card shows it.
- **The R menu, as built in v0.0.6** (`src/ui/cards/actions.js`, the kit in `src/ui/kit/pixels.js`, `list.js`, `mount.js`; the build sheet 0.0.6 §2.3, §8 item 15; the user, 2026-11-06: "long pressing R should open the menu with all the possible interractions as single actions, with the ability to select several actions (not pre-combined actions like you do now that make lists hard to read), implement pixel art menu drop downs or checkboxes for multiselections"). It replaces v0.0.4's choices card (`choose.js`, deleted), whose lines were bundles. **One canvas of the game's pixels** on the dark glass, at round(3 × `--ui`) CSS pixels a kit pixel (`kitScale`, at least 2), never the browser's controls: the fixture's title on a plate ("THE SINK", `handMenu().title`); **up to ten rows** (the digits 1 to 0) in `ROWS`' order, the order one does them in, each "1 ☐ WASH HANDS · 30 S" with a 7 × 7 checkbox (ink frame, lit face, a 5-pixel tick) and its time right-aligned; **a struck row** greyed with its reason after its words and never done, its box a grey cross ("SHAVE (CLEAN-SHAVEN)", "BUZZED TODAY", "FRESHLY BUZZED", "NOTHING TO GIVE", "ALREADY IN PT KIT", "REVEILLE COMES FIRST", "REVEILLE IS OVER 12 H OFF", "THE BARBER OPENS AT 10:00", "FRESH FROM THE BARBER", "TAKEN"); **a choice is one drop-down on its row**, never a row each (sleep until reveille, 1, 2, 4 or 8 h; a nap of 20, 45 or 90 min; PT kit or utilities; your cut), the drop-downs aligned in one column, the card kept the size of its longest drop-down so it never changes size as one opens; **the cursor** lit, opening on R's quick action; **the foot** from TIME's `planChain` of the checked rows ("TOTAL 7 MIN · DONE 20:08"), amber with the late's words when late; with nothing checked, **a ghost tick** in the cursor's box, since Enter does that row, so the total matches a tick you can see (the fixer's); the keys line, "1-0 CHECK · Z S ↑↓ · ENTER DO · ESC", with " · Q D CHOICE" where a row has a choice; and the **DO IT** plate at its right. The sink's six rows measure 561 × 408 CSS px at 1280 × 720. **Its keys** are section 10.1's. **What it sends** (the card closes first): one row as the single action (`activity` with its lead; a door's row as `hand` with its target, turned if it is still at hand; the wait as TIME's wait, wherever R's quick action is something else: in review the menu's wait at a sink and its door beside the lounge's vending machine went nowhere, fixed); two or more as one `{ act: 'chain', args: { spotId, steps } }` (TIME §8.1); a late plan through the late card first. The card pauses the game (section 8.1), so its total and end hold, and nothing reaches the world while it is up. The kit (`textPixels`, `platePixels`, `checkboxPixels`, `dropPixels`, `rowPixels`, `createList`, `mountPixels`) is ready for the late card, I, C, F's and V's menus, which keep their DOM this round.

### 8.11 The chapter's day card

TIME §10.3 sets what the day card holds; VIEWS draws it as graphics where the choosing happens (the user, tradecraft 2026-10-28: "The underground selection should be graphical with points of interest drawn on the map"; 2026-11-04: "too many words, this should be graphics"). On the glass, it pauses:
- **The header**: the date in the locale's faces (TIME §3.1), and on a voyage an **instrument strip** in the instrument grammar: the deck G as a readout, the deck state (THRUST, COAST, FLIP), the route from Mars to the destination as a hairline with our dot, the flip marked on it, the distance and light lag to Mars, "FLIP IN 1d 14h".
- **The timeline bar**: the day from reveille to the next reveille as one horizontal bar, hours ticked. The Plan of the Day's fixed blocks (watches, drills, classes, meals) are solid segments with their plaque glyphs (chevron for a formation, fork for chow, rifle for weapons); forced moments are red ticks with their times; free slots are hatched gaps.
- **Filling a free slot**: below the bar, the activities the place and your status allow, each an icon whose length is its duration at the bar's scale (an hour in the gym is as long as an hour of bar). Arrows (or a click) choose the slot; digits 1 to 9 (or a click) drop an activity into it in order; Backspace takes the last one out; one that will not fit is greyed with the time left ("40 min left"). The remainder of a slot becomes rest, drawn as the rest icon. Hover gives each icon's words and what it is for (TIME §10.3's list: gym, centrifuge, rifle, kit, study a named manual, read, letters, socialise with named people, rest, volunteer, liberty).
- **The three choices**: **Live this day** (L), **Spend it** (Enter), **Carry on** (C), as TIME §10.3 defines them.

A spent day then plays as TIME §6.6's day splash on the same bar: the clock's marker runs along it over TIME's 2.5 s, each block lights as its hours pass, and the day's lines appear as icons on it.

---

## 9. Plaques and fonts

### 9.1 Plaques

Labels in the picture are enamelled plaques in the picture's own pixel alphabet, at its scale and grid (`tradecraft/src/ui/plaque.js`; the user, 2026-10-27, of browser-text labels: "infocards need to be revamped, they feel low quality, low tech too sharp and practical"): an ink outline, a face in the kind's colour with a lit top edge and a shaded foot, a 5×5 glyph, the name, a quieter second part after a seam, a notch pointing at what it names, a pixel of shadow.

| Style | Face | Glyph | Used for |
|---|---|---|---|
| home | gold `0xe7b84a` | bed | your rack, your squad bay |
| duty | MCRN red | chevron | your place of duty, the formation point |
| mess | warm brown | fork | mess hall, galley |
| armoury | steel | rifle | the armoury, the range |
| medical | paper white | cross (red) | aid station, sick bay |
| way | dark | arrow | a waypoint at the frame's edge |
| seen | paper | eye | a person you have marked |
| squad | green | chevron | your team and squad when crowded |
| hazard | yellow | warn | hazards, live-fire areas |
| exit | phosphor green | door | exits, ladders, airlocks |
| felt and heard | fog blue | ear | what is heard or reported but not seen |
| airlock | cyan | lock | airlocks and their state |

New 5×5 glyphs (rows top to bottom, 1 is ink):

| Glyph | Rows |
|---|---|
| bed | `00000` `10000` `11111` `11111` `10001` |
| fork | `10101` `10101` `11111` `00100` `00100` |
| rifle | `00000` `11111` `00110` `00100` `00000` |
| chevron | `00000` `00100` `01010` `10001` `00000` |
| warn | `00100` `01010` `01010` `10001` `11111` |
| ear | `01110` `10001` `00101` `00110` `01100` |
| door | `11111` `10001` `10011` `10001` `11111` |
| lock | `01110` `11011` `10001` `11011` `01110` |
| clock | `01110` `10101` `10111` `10001` `01110` |

The body strip and the hands line (section 7.6; a strip glyph's fill rises from its bottom row; food is the fork above):

| Glyph | Rows |
|---|---|
| drop (water) | `00100` `00100` `01110` `11111` `01110` |
| vessel (bladder) | `10001` `10001` `10001` `10001` `01110` |
| coil (bowel) | `01110` `10000` `01110` `00001` `01110` |
| moon (sleep) | `01110` `11000` `11000` `11000` `01110` |
| grime | `10010` `00100` `01001` `10000` `00101` |
| thermometer (heat) | `00100` `00100` `00100` `01110` `01110` |
| flake (cold) | `10101` `01110` `11111` `01110` `10101` |
| lungs (air) | `00100` `10101` `11011` `11011` `01010` |
| jag (pain) | `00010` `00100` `01110` `00100` `01000` |
| dial, safe | `01110` `10001` `11101` `10001` `01110` |
| dial, semi | `01110` `10101` `10101` `10001` `01110` |
| dial, auto | `01110` `10001` `10111` `10001` `01110` |
| dial, burst | `01110` `10001` `10101` `10011` `01110` |

Posture glyphs follow one rule rather than a table: a 1 px body tick at the centre and the weapon's 4-pixel line at the posture's muzzle angle (WEAPONS §6.1 gives the postures).

**Built in v0.0.4** for the outcome strip and the sheet: `arrow` (the strip's before and after), `wet` (wet hair), `towel`, `utilities` and `pt` (the outfit's look); a glyph's unfilled pixels are `#6a7182`, the glass line colour having read too dark in the shots (the hud's call).

Tradecraft's star, house, key, eye, cross, pin, aim and arrows stay.

**As built in v0.0.5** (`src/ui/plaque.js`, tradecraft's 190 lines ported; TECH §12.3): the plaque, the bracket and `place()` keep their meaning. What changed: the pixels are drawn into a plain buffer first (`plaquePixels`, `bracketPixels`: `{ w, h, data }` in ImageData's byte order), so node tests read a plaque glyph by glyph, and `plaque()` and `bracket()` only copy that onto a canvas, cached by their arguments; **the kinds** of the table above beside tradecraft's, and its `tail`, the red of what is aimed at; the new glyphs (bed, fork, rifle, chevron, warn, ear, door, lock, clock) and the font's missing marks (`MARKS`: +, ?, ·, ≈, ×, (, ), =, −, ◉, >) drawn in the same 3 × 5 manner; and **a meter**, the plaque's foot line filled to a fraction in the face's light (the shot's odds, a graphic beside the number). `place(el, p, x, y, k, anchor)` sets a plaque on the HUD in the picture's pixels, snapped to its grid. The shot's plaque is section 7.4's.

### 9.2 Pixel fonts

Drawn by code, never shipped as files:

| Font | Glyphs | Use |
|---|---|---|
| `PIX3x5` | tradecraft's `GLYPHS` (3×5, M W N wider; digits, `& . , - / ! %`; Cyrillic kept) plus `: ° + ' ( ) # ·` | plaques and signs under A; small stencils |
| `PIX5x7` | new, Latin capitals, digits and the same punctuation | plaques under B; big stencils at both; the splash's clock digits (doubled) |
| Stencil | `PIX3x5` and `PIX5x7` with bridges: the pixels where a closed counter would form removed at fixed rows | hull and door markings ("DECK 4", "AIRLOCK 2", "MCRN"), crates |

Painted markings use the font whose glyph height is nearest the letters' real height × `PX_PER_M` (30 cm stencils: 5 px at A, 7 px at B).

### 9.3 UI fonts

Vendored as Latin-subset WOFF2 with their licence texts in `fonts/` (LONGHAUL shipped none of its OFL texts; OLYMPUS must). Verify each licence when vendoring.

| Family | Use | Licence |
|---|---|---|
| IBM Plex Mono 400, 500 | the glass, the HUD, instruments' readouts, the log | SIL OFL 1.1 |
| IBM Plex Sans Condensed 500, 600 | instruments' names, headings on the glass | SIL OFL 1.1 |
| Courier Prime 400, 700 | papers (tradecraft used the system's Courier New; vendored so Mac and Windows match) | SIL OFL 1.1 |
| Caveat 400 | handwritten letters and notes | SIL OFL 1.1 |

### 9.4 UI tokens

Tradecraft's, kept and extended: `--ink #1a1214`, `--ink-2 #23252f`, `--paper #f4efe6`, `--paper-2 #e2dac6`, `--rule #c4bba9`, `--brass #e7b84a`, `--red #9e3c36`, `--muted #8f96a6`, `--glass rgba(20,21,28,0.94)`, `--hud rgba(20,21,28,0.78)`; new `--corps #c1553b` (MCRN red), instruments' tokens in `--c-*` as section 6.3. Prompt tones: calm `#4c5262`, note `#3b6296`, warn brass, urgent red. Semantic colour is always doubled by a shape or a word (section 12).

---

## 10. Controls

Keys are read by **physical position** (`KeyboardEvent.code`), so the game plays the same on any layout; labels on screen show the player's own layout where the browser can tell (`navigator.keyboard.getLayoutMap()`), and **AZERTY** where it cannot (the user, tradecraft 2026-10-26: "don't give me the QWERTY keybinds"). Ported from `tradecraft/src/ui/input.js` with a new `KEYS` table. "The mouse is for menus", and for aiming by pointing (tradecraft 0.1.13). E is hold or tap (`TAP_MS` 220). Action keys fire once on key-down and ignore repeat; Meta and Ctrl combinations are left to the browser; a lost focus releases every key.

DESIGN.md set tradecraft's keys and left the military ones here, "where they fit, in the step panel, not on new keys". Eight new keys are needed because their actions are frequent outside the weapon mode, where there is no step panel: stance up, stance down, carry posture, the suit, the light, the radio, orders and signals, and the terminal (my call, each). Inside the weapon mode the same actions are also steps in the panel.

### 10.1 In the world

| Physical code | AZERTY | QWERTY | Does |
|---|---|---|---|
| KeyW KeyA KeyS KeyD, arrows | Z Q S D | W A S D | walk. Low g: walk or bound by speed. Mag boots: the slow boot walk. Zero g at a handhold: the push-off's direction. Free-floating: nothing (no thrusters) |
| ShiftLeft | Shift | Shift | run (bound in low g); in zero g, a hard push |
| AltLeft | Alt, Option | Alt | stroll, a slow walk while held; in zero g, a gentle push |
| KeyE held | E | E | stop and look: the move keys turn the eyes; the far window opens on a far point looked at (section 2.4) |
| KeyE tapped | E | E | glance back over the shoulder, walking on |
| KeyQ | A | Q | **stance up** (prone, kneel, crouch, stand) |
| KeyZ | W | Z | **stance down** (stand, crouch, kneel, prone). The pair sits left of the move keys: A above, W below on AZERTY |
| KeyF | F | F | people at hand: the context menu (talk, report, salute, read, aid, hand over, take, restrain…) |
| KeyR | R | R | what's at hand: an appliance (with its activity card), a door, a hatch, a ladder (then Z and S climb), a handhold (grab or let go), a screen, a window or the open sky ("look up"), a thing lying there, a gap to jump. In v0.0.3: a door within reach at once, else the 15-minute wait, asked twice (R, then R again within 2 s; §7.1). From v0.0.4 a press key: tapped, lying or sitting, get up, else the activity of the free fixture spot you stand at with its price, else a door, the resume or the wait; **held, the choices** (the rack's sleep and naps, the sink's basin and drink). **From v0.0.6** (below the table): tapped, **the plate's action**, one single action chosen by a priority; held, **the R menu** of every single action at hand (section 8.10) |
| KeyT | T | T | do what the instinct's line offers (customs too: "Lieutenant, outdoors, covered: T salute"; and the NCO's last order: "T: fall in"). **While +Gz exceeds 3 G, T held is the anti-G straining manoeuvre** for as long as it is held (section 7.3). From v0.0.4 a press key: tapped, the line; **held, the chip** (SKILLS §14.1). In a clear T's reach grows with the drill rung: one step, a group, the room, the house; never the walk in at rungs 0 and 1 (COMBAT §25.8) |
| KeyG | G | G | weapon ready: intent. Enters stop motion with raising the weapon as its first step (the user, tradecraft 2026-11-03: "taking it out should imply we intend on using it") |
| KeyX | X | X | shooting mode on and off (the built toggle; in a clear, "game unpaused with X", the user's words of 2026-11-07: X and the move keys are the recruit's walk in, COMBAT §25.5). Getting down behind cover is the panel's cover row |
| KeyV | V | V | **carry**: tap for the next posture in the safe cycle (slung back, slung front, patrol carry); hold for the full list on digits (WEAPONS owns the postures) |
| KeyU | U | U | **the suit**: helmet on or off, visor, seal check, mag boots, tether, the visor's tac, the suit's radio channel; on digits |
| KeyN | N | N | **light**: tap toggles the helmet lamp, or the weapon light when the weapon is up; hold to choose |
| KeyB | B | B | **radio**: the net panel (acknowledge, report, ask to repeat, call a corpsman, change channel), on digits |
| KeyO | O | O | **orders and signals**: hand signals always (halt, freeze, down, come here); orders to your team when you lead one (COMBAT's list) |
| KeyP | P | P | **the terminal**: your wrist or hand terminal (section 8.8) |
| KeyK KeyL Semicolon | K L M | K L ; | hit, grab, guard (CQC); Shift with one spends an edge (COMBAT). In a hard talk: press, probe, yield (section 10.3) |
| KeyI | I | I | inventory |
| KeyC | C | C | character sheet |
| KeyH | H | H | first aid |
| Tab | Tab | Tab | the mind |
| KeyJ | J | J | the log |
| Space | Space | Space | pause; during a splash, to the end (section 10.3) |
| the key that types `?` | Shift + `,` | Shift + `/` | the keys table on screen (read by `e.key`) |
| Escape | Esc | Esc | the menu; closes the top card or screen |

**R, as built in v0.0.6** (`src/sim/places/hand.js` `handOffer`, `handMenu`; `src/data/activities.js` `ROWS`, `PRIORITY`; the build sheet 0.0.6 §2.1, §8 item 5; the user, 2026-11-06: "R should wash hands if hygiene is low enough, drink if we're thristy and shave if none of the above (use a priority thing and R is the most urgent), long pressing R should open the menu"). **R tapped does the plate's action** (section 7.1), one single action, never a bundle; **R held** (`TAP_MS` 220) opens the R menu (section 8.10) wherever `handMenu` has a row. R's order is unchanged: lying or sitting, get up; else the quick action at the free spot you stand at; else a door, the resume or the wait. **The quick action is a priority kept as data** (`PRIORITY`): the first test whose row is not struck and that holds. At a sink: wash hands when they are dirty (dirt 40, the hands' band 2), else drink when thirsty (a 1% deficit), else shave where stubble shows (12 h), else buzz a shaved head whose cut is due. A toilet stall: a stall if the bowel could go, else the head over 50 mL in the bladder. A urinal: the head over 50 mL. Your rack's foot: in a drill, dressing into utilities, else stand fast; by night (20:00 to 05:30) sleep until reveille; by day a 45-minute nap. **At a spot with a `PRIORITY` where no test holds, nothing is due, and R falls to the door or the wait** (the fixer's, overruling the build's "else wash hands" at a sink and the stall's six minutes for nothing: a plate that always shows a chore stops being read); the menu offers the rest. A spot with no `PRIORITY` (a locker, a tap, a machine, the barber's pole) offers its first row not struck. **The menu's keys** (`src/ui/kit/list.js`, read by `KeyboardEvent.code` while the card is open, nothing reaching the world): Digit and Numpad 1 to 0 check that row and put the cursor on it (one key a row, so R held, 2 3 4, Enter is an errand; in review it took a digit and Space a row); ArrowUp and ArrowDown, KeyW and KeyS (Z and S on AZERTY) move the cursor, wrapping; ArrowLeft and ArrowRight, KeyA and KeyD (Q and D) change the cursor row's choice; Space checks or unchecks the cursor's row (a struck row: its reason lit, nothing checked); Enter and NumpadEnter do the checked rows, else the cursor's; Escape or KeyR close it. With a drop-down open, up and down move in it, Enter or Space pick, Escape closes it alone. A held key repeats only the moves. **The mouse**: hovering moves the cursor; a click on a box or a row's words checks it, on a drop-down opens it, on an item picks it, on DO IT is Enter; a click outside the card closes it.

### 10.2 In the weapon mode (stop motion)

| Key | Does |
|---|---|
| Digits 1-9, 0 | the numbered steps (safety, magazine out, in, charge, check, clear, aim, fire, stance, posture, throw, put away), each with its time; 1 again in recovery is a tap where WEAPONS allows, until `test-pairs` replaces it with the shot rows (Pair, Hammer, Triple, Failure drill, To the head: COMBAT §25.6.4); **while +Gz exceeds 3 G, "strain" or "relax"** (the anti-G straining manoeuvre, BODY §13.3; section 7.3), toggled, with its onset time |
| Mouse | hover brackets a target and shows the aim's time; a click aims; a click on the aimed target fires |
| Arrows, Enter | step the brackets across targets in the frame (and the far window); Enter aims |
| A, W (KeyQ, KeyZ) | a stance step |
| V | a posture step |
| N | the weapon light |
| X | leaves the mode while choosing, as built; this table's first design ("get down behind the nearest cover; X held (0.3 s) leaves the mode") is withdrawn: cover is a row, getting down is W (COMBAT §25.11) |
| Backspace | stops a running bundle at the end of its beat, the rest offered as "Carry on" (v0.0.6's chain key; COMBAT §25.8.2) |
| E held | look without turning the weapon (the eyes and the muzzle part) |

**As built in v0.0.5** (`src/core/keys.js`, `input.js`, `src/main.js`; the build sheet 0.0.5 §2.4, §8 item 15). Outside the mode, **V** (KeyV) the next carry posture, **A** and **W** (KeyQ, KeyZ) the stance up and down, each a lived step (TIME §4.3), and on the line with the rifle in the hands the walking keys strafe without turning (WEAPONS §6.4); G and X as above. In the mode:
- **The digits are press keys** (as R and T): **tapped** (key-up under `TAP_MS` 220 ms) the step the panel showed at its normal tempo, **with Shift** rushed, **held** (at 220 ms) careful; **Fire held** is hold and fire (the hold to +4, then the pull); 1 again inside a shot's recovery is a follow-up; 0 pages the singles past nine. The bare digit is refused in stop motion: the panel sends `{ act: 'stop', args: { step, tempo, target } }` for the row it showed.
- **Enter** aims at the bracketed target; **Q and D** (KeyA, KeyD) or the arrows step the brackets (no time passes); **the mouse** brackets on hover (projecting each target through the stage's camera: my call, the hud's), aims on a click and fires on a click on the aimed one.
- **V, A and W** are posture and stance steps; **X** leaves the mode while choosing **or from the chained wait** (which it cuts, as any step does: the integrator's), sent as the `leave` step.
- **In a reflex card** a digit answers and **R** keeps the answer for two minutes.
The keys card lists G, X, the digits (tap, Shift, held), A and W, V, Enter, Q and D.

**As built in v0.0.7** (`keys.js` `DIAL_ELEV_CODES`, `DIAL_WIND_CODES`, `dialOf`; `main.js`; the build sheet 0.0.7 §2.5). In the mode, where they walk nowhere, **Z and S (KeyW, KeyS) and ↑ ↓ dial a click of elevation** up and down, and **Shift with Q and D (KeyA, KeyD) or ← → a click of windage** left and right (Q and D alone still step the brackets); each is the step `sight:elev:±1` or `sight:wind:±1`, timed and unrolled (WEAPONS §3.5). **E held on a KD line** opens the far window on your own face (section 2.4), as aim and bracket do. Free holds have no key; the panel's rows set the hold (section 7.4). The keys card lists the dial keys.

**As built in v0.0.12**: V cycles the movement stances (Relaxed, Combat, Assault) where a scene spec sets `stances: true` (the shoot house); elsewhere V is the carry cycle. Backspace stops a bundle after its beat (`HOUSE_KEYS` on the keys card). GO has a 350 ms key guard, so a press made as the instructor says GO does not act.

**Designed 2026-11-11 (the user's note on v0.0.12)**, the panel's keys by layout (section 7.8; the user's pick decides which stands): **A** the digits only, 6 to 0 opening the groups' drawers and 0 going home inside one; **B** R, C, B and F open the Room, the gun (*chargeur*), the Body and Friends' banks in the mode (R keeps a reflex card's answer while a card is up; C's sheet is reached through Esc in stop motion; Esc closes a bank); **C** Tab held (a press key's `held` at 220 ms) or the right mouse button held opens the fan, a digit picks the group and a digit the row, Tab tapped still opens the mind. In every layout: **Q and D** (KeyA, KeyD) step the Watch row's hot spot when nobody is in sight, as they step across targets; the digits keep their tempo (tapped, Shift rushed, held careful); the stances' row reads Careful ⇄ Fast; X, A, W and Wait keep their keys and lose their rows. `&panel=a|b|c` and the Esc menu's toggle (`olympus.panel`) choose the layout until the pick.

### 10.3 Everywhere else

| Context | Keys |
|---|---|
| Cards and menus | digits (by code) for numbered buttons, Enter for the highlighted one, Backspace back from a submenu, Esc or the card's own key closes |
| Talk | digits for lines; in a hard talk, K press, L probe, M yield, and Shift with one spends an edge (PEOPLE §10.11; section 8.10); time stands still |
| Reflex card | digits; R keeps the answer two minutes; closing it is "nothing" |
| Under G (+Gz over 3 G, outside the weapon mode) | T held: strain; the move keys as BODY's gait allows |
| Splash (TIME §6.4's map) | Space, Enter or a click: to the end; Backspace: stop here, where the activity allows it; Esc: the menu, which pauses the splash; T at a chunk's end, while "carry on (10 min)" shows: one more chunk. During the outcome strip, Space, Enter, a click or any key unbound here closes it; T and Backspace never do, and Esc still opens the menu |
| Chapter day card | arrows choose a free slot; digits drop an activity in; Backspace takes the last one out; L live this day, Enter spend it, C carry on (section 8.11) |
| Screens | the device's hard keys on digits, wheel zoom at the pointer, drag to pan, click to pick, Esc or R to close |
| The mind's map | arrows pan, `+`/`−` or the wheel zoom, C recentres, click sets a waypoint |
| Debug only | `[` skip 15 min, `]` skip 1 h (the `^` and `$` keys on AZERTY) |
| As built in v0.0.4: the splash | Space, Enter or a click to the end (in the decel or the beat, straight to the zoom out); Backspace stop here, landing through the strip with the partial outcome; Esc the menu, freezing the splash; T on the strip while "carry on (15 min)" shows for its 1.2 s: the next chunk; any other key during the strip closes it. The keys card lists T (what the instinct says; held, the next), R (what's at hand; held, the choices), C (the character sheet) and, in a splash, Space and Backspace |
| As built in v0.0.4: a test scene's end | Enter ends the scene ("Enter: end the scene" on the line) during the 6 s of play its end card waits after the splash; C and J open over the world meanwhile (ROADMAP §2.2) |

Every key is remappable in Settings by pressing the new physical key; the labels follow. A test proves no code is bound twice within one context, the splash, the hard talk, under G and the day card included (section 14).

---

## 11. Audio direction

### 11.1 Principles

- **Procedural, from nothing**: every sound is synthesised by WebAudio from oscillators, noise buffers, filters, envelopes and convolvers with impulse responses generated per space. No audio files ship, as no image does: the game stays offline and small (my call).
- **Physical where the player can tell**: air pressure shapes what carries, vacuum carries nothing, a helmet muffles, a hull carries thumps.
- **The sim decides, audio presents**: an `audio` presenter listens to the bus as the UI's does (LONGHAUL's `presenter.js` pattern); audio never touches the sim.
- **Everything that matters is also captioned** (section 12), so no information is sound-only.
- **No soundtrack in play** (my call): sound is the world's. But the world makes a good deal of music, because 40 to 70 minutes of routine a sol over a 60-hour term would be sterile with only fans and footsteps (my call, widening the rule):
  - **cadence calls** ("jodies"), sung by the platoon on PT runs and marches: the caller's line, then the platoon's answer, one call picked by hash from a pool (PEOPLE writes the lines; SETTING the Corps' own), voiced as a chant bed of formant-shaped noise on the cadence's beat with boots in step, the words in balloons. The instinct offers to join ("T: sound off"); joining is your voice in the answer and the balloon over you, and what it does for the squad is PEOPLE's;
  - **a squadmate's speaker** in the bay before taps, playing what that person likes (a hashed style per person: Belter drum, Martian folk, Earth pop gone stale), turned down at taps by the fire watch;
  - **the Rec's screen**, a bar in Redwater, the mess deck's radio, a street musician under the ice;
  - **the bugle calls** (section 11.3) and the band at a parade.
  
  In-world music is made by a small generator of tunes by style (melody, bass and drum voices from seeds, through the space's convolver and occlusion like any sound), so it stays procedural and offline.
- **An optional score**, off by default: sparse, a few bars at set pieces (the drop, the first contact's aftermath, the memorial) and at day transitions (reveille, taps), made by the same generator in one restrained style, on its own bus. It never plays under 1:1 routine. The title is silent but for the base's wind.

### 11.2 The model

| Constant | Value |
|---|---|
| Voices | at most 48 at once, the quietest dropped first |
| Buses | world, body (your breath, heart, suit), radio, alarms, UI, score; each with a volume in Settings; a limiter on the master |
| Distance | inverse distance, reference 1 m, rolloff 1 (outdoors), 1.5 (indoors, where walls absorb) |
| Occlusion | per wall or closed hatch between source and listener: −6 dB and a low-pass at 2 kHz, from PLACES' wall grid |
| Air | the ambient pressure P (kPa) scales sounds by PEOPLE §7.3's one air law, `airDb(P) = 10 log₁₀(P / 101.3)` dB, and low-passes them at `8 kHz × P / 101.3` (my rough model of the higher absorption in thinner air): Melas floor at 65.9 kPa −1.9 dB and 5.2 kHz; datum, 52 kPa, −2.9 dB and 4.1 kHz; highlands, 40 kPa, −4.0 dB and 3.2 kHz; Olympus summit, 17 kPa, −7.8 dB and 1.3 kHz. This replaces my first `20 log₁₀(P / 101.3)` (−3.7 dB at Melas), as PEOPLE §7.3 asked; built in v0.0.3 (the build sheet's §8 item 16) |
| Helmet on | outside sounds −12 dB, low-pass 1.5 kHz; your breath and the suit's fan added on the body bus |
| **Felt suppression** (2026-11-07; COMBAT §5.3) | the world bus ducks by felt's band, −3 dB under fire, −6 suppressed, −12 pinned, its highs cut by a low-pass at 6, 4 and 2.5 kHz; your breath and heart rise on the body bus: auditory exclusion (Artwohl 2002, COMBAT §5.10). A tier one under three bangs hears the room as it is |
| **A flashbang** (COMBAT §11.4) | the bang through the space's convolver; without ear defenders then the whine (a 6 kHz tone), the mix low-passed at 1.5 kHz and −18 dB for the deafness's length, fading back over its last minute; captioned "[a high whine]"; with ear defenders the bang clipped and the room's voices kept |
| Vacuum | outside sounds silent. Only what reaches you through the body: your own weapon as a dull thump (low-pass 250 Hz, −20 dB) with the action's clacks (band-pass 2-4 kHz, faint) through your hands; impacts on a hull or deck you touch as low thuds through the boots; the suit's own sounds |
| Spaces | a convolver per area from a generated impulse response: length and brightness by the room's volume and hardness (PLACES' finish): a steel passageway rings, a squad bay is dull, the canyon floor gives a late, low echo off walls kilometres away |

**As built in v0.0.3** (`src/ui/audio/engine.js`, `steps.js`, `synth.js`; the parameters in `src/data/sounds.js`, unscored until the sound gallery). The context and its graph are made at boot behind the title, suspended, as the browsers' autoplay rule asks, and the first key or click only resumes it (0.2 ms; made on the key, the device's opening blocked the first step for 219 to 233 ms, the review). What plays this round is the world bus into the master, then a limiter (−3 dBFS, ratio 20): the master is the profile's volume squared, so the slider's middle sounds like the middle (my call), 0 when muted, saved in the profile in one transaction (TECH §7.4). Distance is inverse from 1 m with rolloff 1.5 on a floor and 1 on the ground (`ROLLOFF`), a sound not your own panned by its offset east or west of you (full at `PAN_FULL_M` 8 m); the air is `AIR_KPA` 65.9 kPa on the ground and 66.0 indoors (CONTRACTS §16). Doors play where they are, from the side they were turned from (the `door` fact, CONTRACTS §11).

**As built in v0.0.4** (`src/ui/audio/world.js`; the numbers in `src/data/sounds.js`; the hud role's calls). A **UI bus** joins the world bus. The world's sounds are rendered at `WORLD_RATE_HZ` 24 kHz and baked **a layer at a time across frames**, so the HUD and the sound at the rack went from a 3.1 ms p95 and a 14.4 ms worst frame to 0.8 and 2.2 ms. **In a splash the world bus is muffled**, low-passed to `SPLASH_LP_HZ` 900 Hz and ducked `SPLASH_DUCK_DB` −9 dB from the zoom in to the zoom out, with the iris, and the watch ticks once a shown minute, at most `TICK_MAX_HZ` 10 a second. **Occlusion this round** is by rooms, not the wall grid: `WALL_DB` −10 dB and the low-pass halved for each wall between the source's room and yours (0 in the same room, 1 next door, 2 beyond), a closed door counting as a wall. Loops (the shower's water, the tap) fade in and out over 0.25 s.

**As built in v0.0.9** (`src/data/sounds.js`, the audio bus; the build sheet 0.0.9 §2.3; my calls):
- **Felt's ducking**: the world bus −3 / −6 / −12 dB by band with its low-pass at 6 / 4 / 2.5 kHz, as designed above; the breath and heart rise on the body bus.
- **Deafened** (an unprotected ear within 5 m): the world cut to **1.5 kHz and −18 dB** (`MUFFLE_LP_HZ`, `MUFFLE_DB`; −30 dB when pinned) **under the whine**, a 6 kHz tone, loud for 20 s and **falling over 60 s** (`MUFFLE_RECOVER_S`), captioned "[a high whine]" once. The constants are named MUFFLE_ and not DEAF_ because `SUPP_HOME` (TECH §14) keeps every `DEAF_` name in `supp.js`. The report sounds at its moment (28.6 dB, 1.5 m, echo 73 ms).
- **The coach's voice** is text: the voice bus and `voiceRoute` exist and are tested, but nothing is sent through them this round (the sim gates no speech on hearing; a voice within 2 m is still heard as text).

**As built in v0.0.10, through the electronic ear defenders** (`src/data/sounds.js`, `src/ui/audio/stress.js`; the build sheet `docs/build/0.0.10.md` §8 item 8, the face role's calls, unscored): **the horn** is two detuned sawtooths (440 and 554 Hz) through a 1.2 kHz formant, taken by the defenders' limiter to −20 dB and 2 kHz; **each blank** is the R-7's report from 1.2 m through the defenders' gate (−25 dB) with its berm echo, to the left of the marine, low-passed at 2 kHz; **the called bang** is gated with no whine (the ears are protected, so no deafness). A slow **box breath** plays on the body bus while Breathe runs. The coach's "Bang!" stays in the radio box as his speech, captioned "[a shout: Bang!]" (§11.4) 0.95 s before the burst.

**As built in v0.0.11** (the as-built line above): `AIR_KPA` and `SOUND_SPEED_MS` are gone from `src/data/sounds.js`. Every voice takes `pKpa` and `soundMs` from `ui/audio/range.js` `airHere(state)` (`src/sim/places/env.js` `airAt`); `steps.js` `lowpassHz` refuses a non-number, and `stepVoice` needs `gG`. The world's loops, the flush and the bugle use the air where you stand (out of doors 65.9 kPa, 0.007 dB quieter than before). A speed of sound of 0 (vacuum) means no airborne delay. The step's level is the weight on the foot (+4.8 dB at 3 G) and its cadence follows the gait's speed at the place (4.53 foot-falls a second walking at 1 G, 3.56 at Melas); a `float` has no foot-falls (`NO_FEET`); a step with no finite level is not played. In vacuum the bangs, horn and blanks are silent. The coach's "BESIDE YOU" caption in vacuum should come by radio or not at all (later step: voices in vacuum by radio only).

### 11.3 The sounds

| Family | Synthesis and behaviour |
|---|---|
| Footsteps | as built in v0.0.3: a foot-fall at each half of the drawn gait cycle, every 0.32 m walking or strolling (3.56 a second at 1.14 m/s), 0.9 m running, 1.4 m bounding, scheduled on the audio clock up to a tick ahead and dropped, counted, if more than `LOOKAHEAD_S` 0.1 s late (a stalled frame, a hidden tab); tile and vinyl tick, concrete, paving and stairs slap, regolith crunches; the gait offsets stroll −4, walk 0, run +4, bound +6 dB; each step's rate jittered ±4% and its level ±1.5 dB by hash; at Melas 6.1 dB under the same step on Earth (−4.2 dB of weight, −1.9 dB of air) and low-passed at 5,204 Hz. As designed: one impact per foot-fall from the gait the sim reports; surface by the floor's finish: regolith (low-passed noise, 60 ms, a gritty crackle), concrete (band-pass 800 Hz, 50 ms), deck plate (band-pass 400 Hz plus metallic partials at 1.1, 2.7 and 5.3 kHz ringing 120 ms), grating (higher ring and a rattle), rubber matting (low-passed thud, 40 ms), tile and lino (sharp tick), ice (a squeak and a crunch). Gain by weight on the foot: `10 log₁₀(g / 9.81)` dB, so Mars −4.2 dB, Europa −8.7 dB; a bound gives a push-off and a louder landing and silence between; mag boots a clunk and a servo release; zero g, no steps, only hands on rails |
| Gunshots | the muzzle blast (a noise burst through a low-pass and the space's convolver, gain by calibre from WEAPONS), the supersonic crack heard only downrange (a short N-wave), the action's mechanical clack, brass tinkling on hard floors; all shaped by the air, the helmet and vacuum as above; a suppressor takes the blast down and leaves the crack and the action |
| Hearing | an unprotected shot in an enclosed space leaves a 4-6 kHz ringing and a dull low-pass on everything, fading over 20-60 s (BODY gives the level); ear defenders at the range take shots down 25 dB (as built in v0.0.5: electronic, impulses only, below) |
| Ship | the life-support fans (pink noise low-passed at 200 Hz with a 100 Hz hum), pumps cycling; the drive's rumble under thrust (brown noise below 90 Hz, gain with the thrust's G) and its silence when the ship coasts, which the player learns to hear as the flip; hull creaks as thrust changes; the hatch's seal hiss; the airlock's pumps rising and falling with its pressure |
| Alarms (my calls, until SETTING says how the MCRN sounds) | general quarters: a two-tone 500 and 700 Hz, 1.2 s a cycle; decompression: rapid 1 kHz pips at 6 Hz; fire: a bell-like 800 Hz strike once a second; brace for burn: a rising whoop 300 to 900 Hz; announcements on the 1MC open with a two-note chime |
| Base calls | the bugle (a sawtooth through a brass formant filter) plays the real calls at their times from TIME's schedule: reveille, chow, colours, retreat, taps |
| Radio | the click of a key, a squelch tail (band-passed noise 300-3,000 Hz, 120 ms) at each transmission's end; the words are text in the radio box; an optional quiet "voice bed" (band-passed noise modulated at a syllable rhythm) is off by default |
| The suit | breath in the helmet (rate from BODY), the fan, alarm tones (two-note caution, three-note warning) |
| Places | Mars wind (filtered noise with gusts; in storms a hiss and grit), the base's distant range and engines, the PA (a band-passed chime, then its words as text and captions); showers (filtered noise by the head's flow, the drain's gurgle, the timer's click when the water stops); Europa's drips, pumps, crowd murmur and the ice shell's low groans; a ship's berthing at night: fans, someone's snore, a hatch |
| Voices and music | cadence calls as a chant bed on the beat (call, then answer); in-world music from the tune generator by style; the optional score (section 11.1) |
| UI | soft ticks for cards and digits, a paper's rustle; nothing for the HUD |
| As built in v0.0.4 (all synthesised, unscored until the sound gallery) | **the shower's water** (noise while the activity's `water` part runs, and only then); **the tap** at a sink and a drinking fountain (the basin, a drink); **the flush** at a urinal or a toilet when you go (the `body-event` void or bowel at a head); **the klaxon**, a 1.5 s whoop from 600 to 1,100 Hz at the horn in hall-2 while `alertNow().hornOn`, `KLAXON_SOURCE_DB` +20 dB at 1 m (a horn far over a step, the limiter catching it), through Melas's air and the walls: +10.2 dB over the recipe's peak beside it, −12.9 dB through bay-2-1's door, −30.1 dB two rooms off; **reveille's bugle**, its phrase on every room's speaker; **the splash's tick**, once a shown minute |
| As built in v0.0.5: the range (`src/ui/audio/range.js`, a presenter beside `world.js`; the recipes in `src/data/sounds.js` `RANGE`; the hud role's calls) | **the R-7's report** where its muzzle was (yours 0.9 m ahead of your ear), through Melas's air (`airDb(65.9)` **−1.9 dB**, low-passed at 5.2 kHz); **the berm's slap-back** `ECHO_DB` **−12 dB** under it and low-passed, twice the muzzle's distance to the berm's face at 322 m/s later (**0.171 s** from the 25 m line); **the ear defenders are electronic** (my call): impulses only, the report and its echo, **−25 dB and low-passed at 2 kHz**, while the action's clicks, the case's tick and the tower's chime pass unmuffled (the voices are text); **the action's clicks** at their fractions of each sub-step as the drawn clock passes them (`ACTION_SOUNDS`: the magazine's seat at 0.8 of `magIn`, the charging handle's pull at 0.35 and its slam at 0.9, the release's slam, the tap's palm, the selector), and a dry click at once for a pull that clicks; **the case's tick** on regolith where it lands as the clock passes its `landMs`, a step's cleared case and a stripped round or the dummy too (a round duller, 3 dB down); **the tower's two-note chime** from its deck before each of its lines. Nothing new sounds while time stands still or before the first key wakes the context |
| As built in v0.0.6 (`src/data/sounds.js`, `src/ui/audio/world.js`; my calls, unscored until section 11.5's set) | **the R menu** on the UI bus, so a splash never muffles it: `uiMove` a 12 ms tick as the cursor moves, `uiCheck` a latch's click as a box is checked (centroid 4.1 kHz) and `uiUncheck` the same lower (3.7 kHz), `uiConfirm` two rising notes on DO IT (660 then 880 Hz), `uiClose` a falling blip; **the clippers**, a loop while a `clip` part runs at a sink, a 120 Hz motor's sawtooth through a 2 kHz band (centroid 2.3 kHz); **the tap** now also while a `hands` part runs; **the seat's click** at 0.65 of the new `seat` sub-step (WEAPONS §5.2), and a tracer landing duller |
| As built in v0.0.7: the line at 300 m (`src/data/sounds.js`, `src/ui/audio/range.js`; the build sheet 0.0.7 §2.5 (d), §8 item 18; my calls, unscored) | **the crack of your own round** as it leaves, a 1 ms N-wave riding the blast, `CRACK_SOURCE_DB` 16; **the strike's thump** coming back a flight and a sound's way later (0.42 + 0.93 = **1.35 s** at 300 m), `IMPACT_SOURCE_DB` 34 at 1 m, inverse with distance and **low-passed by it** (5.2 kHz × 40 m / d past 40 m, never under 500 Hz); **the relay's reports** a sound's way late and panned (16 ms from 5 m), two within `REPORT_MERGE_MS` 60 ms one, at most `REPORT_VOICES` 6 reports and echoes at once, each 0.6 s, never a wall of noise; the KD's berm echo; **the carriers** on their rails over the parapet, `CARRIER_SOURCE_DB` 26, a sound's way late, `PARAPET_DB` −10 and low-passed at 1.2 kHz. **The ear defenders are worn the whole scene** (`kit.worn.ears`, issued with `range-kd`): an impulse over `EARS_GATE_DB` −12 at the ear (the reports, echoes, the crack) is taken down by `EARS_DB`, kept at −25, and a quieter one passes (the far strikes, the carriers); **the tower's speaker comes through their circuit, low-passed at 2 kHz** |
| As built in v0.0.8: the turners (`src/data/sounds.js`, `src/ui/audio/range.js`; the build sheet 0.0.8 §8 item 24; the face role's calls, unscored) | **the turner's motor** over its `TURN_MS` 0.3 s and **its clack** as the face comes square (a 1.8 kHz click over a board's 260 Hz thump), `TURNER_SOURCE_DB` 10 at the stand, the way back the same 3 dB lower; **the shot timer's beep** at the turn, the timer's start (a 2.9 kHz tone of a quarter second with its third harmonic), `BEEP_SOURCE_DB` 4 at the coach's hand, 0.9 m off your left shoulder (pan −0.45); **a round ringing on the armoured face's steel**, a strike and the plate's inharmonic partials (1.35, 2.21, 3.46, 5.1 kHz), `STEEL_SOURCE_DB` 30 at the plate, heard a sound's way late through the defenders' gate; a round through the plate or into board makes no ring. **A row's rounds are lagged within their tick** to their own formula times, so a Pair's two reports stand its split apart (395 ms, not the ticks' 400; the tier one's hammer 0.11 s). The take-in's window is silent (COMBAT §25.4.5); in review each string gave one beep, a motor and a clack per turn and per turn away, and rings on the steel |

**As built in v0.0.10, the din in the picture and the sound** (`src/render/range-items.js`, `src/data/sounds.js`; same sheet; unscored): the coach holds a short rifle at his hip, muzzle downrange, and each blank flashes 0.15 m at the muzzle for 30 ms on the first frame at or after its moment, once (in the page, 25 of 25 blanks flashed on one frame each, none early or late; each flash showed one tick, 50 ms of game time, after its moment). While the horn sounds, a small red horn (3 × 2 px, the flag's red) is drawn **before his chest**: on the face it read as a red nose, over the head the fog took it, and at the cap's brim the figure's ink line covered it. The din draws with no depth test and the light flag, so the fog never dims it. Weak spot, left: at 16 px/m the stage's palette snap pulls the red toward the bay's pinks, so it reads as a small salmon blob.

### 11.4 Captions

Every sound the sim marks as meaningful (shots, shouts, alarms, a hatch, boots on a deck above, an engine) writes a log line of kind `heard` and, when its source is out of sight, the edge plaque of section 2.11. A setting shows captions on screen as well, in the two caption rows reserved under the log toasts (`TOASTS`, section 7.5).

### 11.5 The sound gallery, and what 0.1 needs

A synthesised sound is tuned by ear, and Claude, who builds it, cannot listen; the user can. So sounds are chosen as the look is (my call): a **sound gallery**, `samples/audio/` on the gallery's port (:8212), with numbered sounds, each a set of synthesis parameters in a data module (`src/data/sounds.js`: oscillators, noise, filters, envelopes, the convolver's room, the air's pressure), played in its conditions (a rifle at 10 m in Melas air, with ear defenders, indoors; footsteps on each floor at 0.38 G), scored per sound and per aspect by the user, with ★ picks and **"Copy my scores"**, which the user pastes into the conversation, as the look round's "Copy my picks". A sound in the game is always a scored sample's parameters, never a hand-tuned number in code.

**0.1's sounds are six families**, and no more until the gallery has scored them: footsteps (concrete and tile, then regolith), the rifle in Melas air (ear defenders as a filter on it), the bugle, the PA, the shower, the wind. Three generated rooms (a dull room, a hard room, the canyon floor) stand in for per-area convolvers until 0.2. Everything else that happens at 0.1 is captioned (the log's `heard` lines and the edge plaques) and gets its sound when its sample is scored; the helmet's breath and the Tank's hiss (0.1.x, with the Tank: ROADMAP §5.8) are the next candidates.

**Measured, not only heard.** The `audio` test renders each scored sound offline (`OfflineAudioContext`) in its conditions and prints its peak and RMS level in dBFS, its loudness in LUFS, its spectral centroid, its energy in octave bands from 63 Hz to 8 kHz and its decay to −30 dB. It compares them with the numbers stored beside the scored parameters, so a change to the synthesiser that alters a scored sound fails the test without anyone listening.

---

**As built in v0.0.12** (`src/ui/audio/house.js`): the hall's reverb is made by code (RT60 0.6 s), the `HOUSE` cues, the suit's ear filter, no berm echo indoors, the instructor's PA and the low par tone with the double beep for a room within par, and the #2's whispered "Ready." on every stack (your own single's stack said nothing before). The bay's range noise stays out of the house.

## 12. Accessibility

| Setting | Default | Range or note |
|---|---|---|
| UI scale | by window (tradecraft `fit()`) | 0.85 to 1.5 |
| Text size | 100% | 90 to 150%, cards reflow |
| Captions on screen | off (always in the log) | on |
| Screen shake | on | off |
| Flashes | strobes and beacons at most 2 Hz always; muzzle flashes and explosions; a flashbang's white and the startle's pale frame (section 7.3) | "reduce flashes": flash cards dimmed 60%, no whole-screen flashes: the flashbang's white becomes a 60% grey veil and the startle shows no pale frame. The 3 Hz photosensitive limit (WCAG 2.3.1) is never exceeded; the `daze` sway is 1.5 Hz and held still under reduced motion |
| Splash length | TIME §6.2's `S(m)` | "short": every time-lapse at TIME's floor, 1.6 s (TIME owns the number) |
| The body strip on the watch | only the glyphs whose felt band has left "fine" (section 7.6) | all nine; none |
| Score | off (section 11.1) | sparse |
| Colour | semantic colours always doubled by a shape or a word (hollow or solid marks, the DARK tag, the plaque's glyph, the alarm's text) | a high-contrast HUD option: glass at 0.98 opacity, text `#FFFFFF` |
| Hold or toggle | E, Shift and Alt are held | each can be a toggle |
| Keys | physical, remappable, labels follow the layout | |
| Mouse-free | aiming by arrows and Enter, every card by digits | |
| Pause | Space, anywhere outside a splash (in a splash Esc opens the menu, which pauses it) | |
| Reduced motion | the camera lead eases | lead off: the camera stays centred |

**As built in v0.0.9, "reduce flashes"** (`src/core/debug.js` `readParams`, `src/ui/boot.js` `menuActs`, `view.setChaos`): on by `&flashes=reduced`, by the `olympus.flashes` localStorage key, and **by "Reduce flashes: on | off" in the Esc menu of every game** (the face shipped with the URL and the key only; the fixers added the menu toggle). Reduced, the flashbang's white is a 60% grey veil and the startle shows no pale frame.

---

## 13. Reuse

| Source (read-only) | Verdict | What changes |
|---|---|---|
| `tradecraft/src/art/pixelart.js` | **port, adapted** (built in 0.0.x: TECH §1.2) | `PX_PER_M` from `src/render/scale.js` (`?ppm=`); MRT part IDs; the lookup snap baked on the GPU; palette core plus place sets; body veils; `SOFT_MIN_M` from the density; tiled static lamp pools plus the 10 dynamic slot pairs (TECH §9.6) |
| `tradecraft/src/art/sprites.js` | **adapt** (the core of the soldiers) | new tops, helmets, suit, webbing, roles `c ð þ æ ¤`; output as role indices, heads composed apart; six builds; true-left asymmetric layers; the frame catalogue of 3.4; rigs per weapon class; the picked variant's templates only |
| `tradecraft/src/render/crowd.js` | **adapt** | array atlas of R8 layers in bands per look, colour rows per person, heads as second instances, long cells, rotated float frames, lifted cards and ground rings, `MAX_PEOPLE` 256 |
| `tradecraft/src/art/doll.js` | **adapt strongly** | double density, military layers and containers, the suit, OLYMPUS's wounds and care; plus the weapon card |
| `tradecraft/src/art/furniture.js` | **adapt: reuse the kit, new makers** | PLACES lists the kinds; the kit (whole-pixel boxes, parts, `GLASS`, `THIN`, `compact()`) as is |
| `tradecraft/src/render/interior.js`, `cutaway.js` | **adapt** | deck and base finishes; the deck rules of 2.9; slot cuts for small structures |
| `tradecraft/src/render/view.js` | **rewrite around OLYMPUS's sim** | keep the frame's order: cut, sky, interpolation, camera and lead, builds in budget, lights, weather, tints, fog, remembered people, crowd, decals, render |
| `tradecraft/src/sim/light.js` | **adapt** into `src/sim/places/light.js` | the sun from TIME's `sunAt` (horizon profile included), moods of 2.7, ship and Europa moods; the one-helper rule kept |
| `tradecraft/src/render/blood.js`, `items.js`, `prints.js` | **reuse** | brass, magazines, boot prints in dust and frost, floating globules |
| `tradecraft/src/render/town.js`, `src/art/pixeltown.js`, `townsprites.js` | **reference; port helpers** | `keep()`, `compact()`, `bevel`, `fineBricks`, `stones` (regolith flags, bulkhead panels), `foliage()` (hydroponics, dome parks), `seeThrough()`, the generator-in-budget pattern |
| `tradecraft/src/ui/input.js` | **reuse** with the new `KEYS` | |
| `tradecraft/src/ui/plaque.js` | **adapt** | new styles and glyphs; `PIX5x7` under B |
| `tradecraft/src/ui/ui.js`, `style.css` | **reference; rewrite as modules** | split the 1,169-line monolith into one module per screen; tokens kept |
| `tradecraft/src/ui/pockets.js`, `body.js`, `mind.js` | **adapt** | containers by load-bearing gear; MARCH first aid; the five leaves |
| `tradecraft/tools/shot.mjs`, `tools/gallery.mjs`, `samples/` | **reuse** | the look round of 2.3; the sound gallery of 11.5 on the same pattern ("Copy my scores") |
| `longhaul/js/ui/scope-sky.js` | **reuse, then upgrade** | pixel finish, surface sky, finer maps |
| `longhaul/js/sim/telescope.js` | **reuse the maths** | inputs from OLYMPUS's state |
| `longhaul/js/ui/telescope.js` | **adapt, cut down** | worlds, stars, points; horizon and occultation lines |
| `longhaul/js/ui/solar-map.js`, `worldzones.js`, `tac.js`, `combat.js` (ThreatView), `scanner.js` | **adapt: grammar kept, data rewritten** | knowledge by screen source; ground tac new |
| `longhaul/js/ui/labels.js` | **reuse as is** | also for the HUD's layout: every in-picture label placed against the state's rectangles (7.5) |
| `longhaul/js/ui/marks.js` | **adapt** | squad chevrons, reported contacts |
| `longhaul/js/ui/dom.js` (`FitCanvas`, diffed `setText`), `tooltip.js` (pixel pointers) | **reuse** | |
| `longhaul/css/console.css` tokens | **adapt** for screens | |
| `longhaul/js/ui/presenter.js` | **reuse the pattern** | a UI presenter and an audio presenter |
| `longhaul/js/ui/roomcam.js` | **reference** | its lighting states and postures, re-made for the stage |
| IBM Plex fonts | **reuse** | ship the OFL texts |

Skipped: tradecraft's Blender, MPFB, Mixamo and PBR pipeline (rejected by the user, 2026-10-25), LONGHAUL's WebGL2 3D views (`js/ui/gl/*`, `exterior.js`, `hullcam.js`, `shuttlecam.js`), LONGHAUL's legacy 8-bit CSS.

---

## 14. Tests: what they must print

`tests/*.test.mjs`, run by `node tests/run.mjs [filter]`; browser tests by playwright-core with the system Chrome, `--use-angle=metal` on the Mac. Each prints its numbers.

| Test | Prints | Passes when |
|---|---|---|
| `density` | `PX_PER_M`, `RES`, metres in view, figure and kit sizes in px (the table of 2.2) | the view is 40 × 22.5 m at 16:9 for either value |
| `texel` (browser) | for a painted box face of known size: texels per picture pixel | exactly 1.00, both densities |
| `palette` | each family's colours; the lookup's agreement with the exact search over 10,000 random colours; the worst mismatch's metric distance; colours sampled from a shot of the calibration card per mood | agreement ≥ 99%; a calibrated grey card shows its painted colour at Mars noon (within one palette step) |
| `outline` | `SOFT_MIN_M`, and on a test scene the count of inked pixels along a wall and across touching parts | no line inside a flat wall; one line between touching parts |
| `light` | for each mood: sky, sun, tint, glow, shadow and `lightLevel`; at Melas, hourly through a sol at Ls 316.4 (the start) and Ls 90: the elevation, azimuth and `eclipsed` the stage's sun used, beside TIME's `sunAt` for the same instant, and the key light's state | the stage's sun is `sunAt`'s to the bit (the same function called, not a second model); the key light off whenever `eclipsed`; `lightLevel` the same number perception reads |
| `fog` | the cells the stage dims against the cells perception reports unseen, on 200 seeded scenes | identical sets ("one function") |
| `sprites` | for 6 kit specs × every frame × 4 facings × the six builds: composed without error, pixel counts of the rifle in aim right, outline continuity (no gap in the ink); for the squad's 13 and their chain, each pair's pixel difference in the idle frame facing down, helmet on and off, and the closest pair | all compose; the rifle 14 px (A) or 20 px (B) in aim right; every tier-1 pair differs by at least `RECOG_PX` (40 at B, 20 at A; section 3.9) |
| `atlas` (browser) | bytes uploaded per frame (max, mean) over a 60 s walk through Base Melas with 60 people; then a minute standing still and a minute walking in `mess-noon`; looks, bands and heads resident; layers in use; bands composed per frame; evictions a minute | no upload over 1 MB in a frame, no whole-texture upload after start; `mess-noon` within the budget of 3.7; 0 evictions while standing still |
| `perf` (browser) | draw calls, triangles, frame time median and p95, view CPU ms, post pass ms, for: the squad bay at night, the parade deck with a platoon, the range with the far window open, `mess-noon`, a troopship deck under battle red; on the Mac unthrottled and under 4× and 6× CPU throttles | CONTRACTS §7's rows (TECH §16.1): unthrottled a 60 fps median and p95 ≤ 18 ms; under 4× the walking scenes at a 60 fps median and `mess-noon` and the crowd scenes at a median ≤ 25 ms and p95 ≤ 33 ms; under 6× the walking scenes at a 60 fps median with no frame over 50 ms; draw calls ≤ 160, 600 failing |
| `doll` | repaint ms per layer change at both densities | under 15 ms |
| `labels` | on 1,000 random displays: names placed, names left off, overlaps | zero overlaps |
| `hud-overlap` (browser) | for each state of 7.5 (walking, weapon mode, sealed suit, screen open, talk, splash, sealed in the weapon mode) at 1920 × 1080, 1440 × 900 and 1024 × 768: every visible HUD element's box and every placed label's box (the far window, edge plaques, name plaques, balloons, the talk box), from the page and the labels pass | zero overlaps between any two, and none outside the window |
| `screens-know` | a scene where the truth holds a contact the screen's source does not: marks drawn | none for the unknown contact |
| `keys` | every action's physical code and its AZERTY and QWERTY labels, per context (the world, the weapon mode, under G, cards, talk and the hard talk, the reflex card, the splash, the day card, screens, the mind's map); codes bound twice within a context | none twice |
| `kit-fit` | for each issue (the rifleman's, the range's, the suit's): every container of the one table with its volume, what the issue puts in it and the fill; the issue's mass, as BODY sums it | every issued item fits its container by volume and count (the 6 magazines in the three double pouches); the mass equals BODY's |
| `audio` (browser) | voices at peak in a firefight scene; for each scored sound in its conditions, rendered offline: peak and RMS dBFS, LUFS, spectral centroid, octave-band energy from 63 Hz to 8 kHz, decay to −30 dB; a rifle shot at 10 m at 101, 66, 40 kPa and in vacuum | at most 48 voices; each scored sound within 1 dB and 5% of its stored numbers; the air's dB as section 11.2's formula |
| `shots` | `tools/shot.mjs` over the sample scenes and four moods each, failing on any page error | no page errors |

The splash's timing (durations, the stop at an interrupt's tick, the clock waiting for the sim) has one test, TIME's (TIME §15, test 11 and test 9); VIEWS keeps none of its own, so there is one number for it.

---

## 15. Fun

**What the views make possible.**
- **Not knowing, visibly.** The fog shows the edge of your knowledge: the squad bay's far end dark at night, the deck above silent, a figure frozen where you last saw her. Players learn to look, to turn on a lamp, to send someone round. The instruments do the same at larger scales: the CIC picture is nine seconds old, the image of Jupiter is 53 minutes old, the datalink's report of movement is three minutes stale, and those numbers are a story every time.
- **The gun read at a glance.** Under B the sprite of the marine next to you has no magazine in her rifle; the weapon card tells you that your own chamber is "unknown" because you never checked it after the range. Pillar 2 lives in pictures, not in a status line.
- **Time you can see spent.** The splash turns "Shower, 10 minutes" into steam, the light shifting through the barracks windows and the clock running, with the outcome landing at the end. Time feels like a currency because you watch it go.
- **The body you can see.** Sweat stains after PT, regolith dust on the trousers after the field, a tourniquet with its time on the tape, frost round a patched suit tear, the grime glyph filling on the watch. Looking at the doll is how you notice you need a shower before the inspection.
- **Your people at a glance.** Okafor is the tall one with the dump pouch on the wrong hip and the red tape on her helmet; you find her across the parade deck without a name plaque.
- **Screens you use.** The repeater says secure-for-burn in 40 minutes, so you eat now; the dose planner says the long way round the ridge costs 3 mSv less; the system map says your letter can still get a reply before taps.
- **Songs on the road.** The platoon's cadence on the valley road at dawn, and you joining in.
- **Places with a mood.** The canyon wall holding back the sunrise, a moonless Martian night where your lamp is all there is, the berthing going red at general quarters, the ship falling silent at the flip, Phobos rising in the west.
- **Sound as information.** Boots on the deck above, the drive's rumble stopping, a shot dulled by thin air at the range and gone entirely through a suit in vacuum, except for the thump in your hands.

**Where it could turn into chores, and what removes them.**
- **Checking needs in menus**: there are no numbers to watch; the instinct says what matters when it matters, the doll shows it when you look, and the body strip on the watch stays empty until something is felt.
- **Inventory every morning**: presets at the locker, applied as one dressing activity.
- **Waiting through the same splash**: Space skips to the end, "short splashes" runs every one at TIME's floor, vignettes vary by hash, and every outcome is in the log.
- **Reading the same screen**: screens are opened only when they tell something new, for a decision that is due (section 6.10; the instinct points to the repeater when the CIC posts something); otherwise the radio box says it.
- **Long quiet stretches**: cadence calls, a squadmate's speaker before taps, the Rec's screen, and on choice a sparse score at day transitions (section 11.1).
- **Walking blind in the dark**: the lamp key is one press, and darkness is meant to be dealt with, not suffered: lamps, NVG later, or staying where the light is.

---

## 16. Build order

ROADMAP owns the milestone numbers; this is the order the views need.

**0.0.x, before anything else: the look round.** Shipped with the engine in v0.0.1 (CHANGELOG): the five scenes of section 2.3 (L1 to L5), each a 2 × 2 of density by figure, 24 views with L4's storm, built as samples on the stage port: the kit's rough sets (the squad bay, the head, the mess hall, the valley floor, a frigate's deck 5) and the figures in both proportions, seven outfits and the frames the scenes needed (idle, walk, run, the low-g bound, aim, fire, kneel, prone, the magazine out and in, sit, the crash couch, asleep, float and tumbles). Shot by the gallery, scored by the user. The pick sets `PX_PER_M` and the template set, and the other variants' templates are deleted.

**The skeleton, shipped as v0.0.2** (ROADMAP's 0.0.3 row; CHANGELOG): the stage in the game, a free walk in the test rooms with the samples' figure (the chibi until the look is scored); the paint worker painting and packing areas and figure sheets off the main thread; the upload queue (1 MB and 2 ms a frame, yours first) and the shader warm-up behind the title; the camera of section 2.4 with its held axis and pixel-snapped lead; the picture held still while time stands still; `__ready` on nothing pending; the figure atlas as one RGBA8 texture until 3.7's bands.

**The barracks, shipped as v0.0.3** (ROADMAP's 0.0.4 row; CHANGELOG): the game at 16 px/m with the chibi; Echo's two floors through the cutaway and Base Melas's ground in 32 m chunks built within 56 m and dropped beyond 96 m; the light from places' helpers (the key light from `sunAt` with the disc's share, the eye's exposure, ceiling fills and the tiled pools); the fog from people's `sightMask` on 0.25 m cells, with the view's memory; see-through masses and the wide see-through; the stair's wipe and the cut that holds its picture; door leaves, wall clocks, stencils, sleepers in their racks; the HUD's five rectangles, the toasts, R's offer, the keys, log and menu cards; footsteps and doors in sound; the bench card.

**Needs and the first skip, shipped as v0.0.4** (ROADMAP's 0.0.5 row; CHANGELOG): the splash in TIME's two forms (the zoom as a crop, the iris, the brief ring, the beat), the vignettes of the shower, the sink, the urinal, the stall, the rack, the locker and standby, the hall's beacon; the move and rest bands, the towel, wet hair and the tired walk; the doll's first cut; the instinct line in two rows, R and T as press keys, the folded body strip, the outcome strip in `RADIO`, the splash's `CLOCK`; PERSONNEL (C) in three columns; the choices, late, Tests, end and score cards; the water, the tap, the flush, the klaxon and the bugle; the bench's `splash-sleep`.

**R says what it does, shipped as v0.0.6** (a patch round of the user's asks of 2026-11-06 and 2026-11-07; CHANGELOG): R's plate on every instinct line (section 7.1); the pixel kit and the R menu with checkboxes and drop-downs (sections 8.10, 10.1); the chain's strip and Backspace in the splash; the seven regulation cuts at four steps on the figure, the sleeper and the doll, the doll's hands (sections 3.9, 4.2); the Hands and Haircut rows (section 8.2); the menu's sounds and the clippers (section 11.3); on the range, the reach rows, the marked step, the weapon card's magazine in hand and the slimmer magazines, the I card's pouches and kinds, the tracer (sections 3.6, 4.4, 7.4, 8.3).

**0.1, a standby week at Base Melas** (everything the week needs):
- The stage at the picked density: camera and eye-lead, the lookup snap, MRT outlines, the Mars place set.
- Light: Mars from TIME's `sunAt` with the canyon's horizon profile, the long twilight and the dark night, under a clear sky (a fixed τ, ROADMAP §3.4); Base Melas interiors (day, evening, lights out) on the tiled lamp pools.
- Air and surfaces: dust lying, dawn frost, wet showers, steam, boot prints; decals: blood, brass, magazines, bullet strikes on the range's berm.
- Cutaways: building interiors as areas, slot cuts for small structures; see-through occluders; the fog with the helmet's modifiers.
- Figures, in the six builds, painted as role indices with per-person heads and colour rows (3.7), and the squad's differences of 3.9: street, drill and customs, PT, every rifle and pistol carry posture, aim and fire, reloads, kneel, crouch, prone, eat, sleep in a rack, the shower and the head, clean. None of them beyond the look round's own set is drawn until the round has scores (ROADMAP §3.4 and §4.6); the suit's, the centrifuge seat's and the casualty frames come with their 0.1.x scenes (below).
- The far window (the range's distances need it).
- The doll with utilities, PT kit, the plate carrier and its containers from the one table; the weapon card.
- The splash in TIME's two forms with every 0.1 activity's vignette and close plates for cleaning and filling magazines; the outcome strip; interrupts on TIME's beats; the outcome splash for a negligent discharge and an NJP. At 0.1 the iris holds only you and those at your appliance.
- The HUD on the reserved rectangles of 7.5: watch with the hands glyphs and the folded body strip, toasts, instinct line, radio box, step panel.
- Cards: C (with the body strip), I with presets at the wall locker, Tab (TODAY, MAP, PEOPLE, ORDERS, STANDING), J; the talk box with the hard talk; the day card for "spend the sol" without the voyage strip; papers: orders, counselling, pay, a letter; the terminal (P); title, new career, Esc, Settings.
- Screens, each for its decision (6.10): the wall terminal and the range tower display; the open sky at night through "look up" (the sky module's pixel finish).
- Controls: the full table of section 10 (O with hand signals only), the strain's T waiting for the G-house (0.1.x).
- Audio: the sound gallery (11.5) and its six families, footsteps (concrete and tile, then regolith), the rifle in Melas air with ear defenders, the bugle, the PA, the shower, the wind, in three generated rooms; cadence calls as balloons over the platoon (their chant bed when scored); everything else captioned.
- Accessibility: everything in section 12.

**0.1.x, the rest of the week** (ROADMAP §5.8), each with its scene: the Tank brings the suit and helmet frames for suit drills, the suit on the doll and the suit's readouts in the watch's place; the G-house brings the centrifuge seat's frames and the strain (the `strain` head state, the step panel's strain step, T held for the strain); the lifesaver lane brings the casualty frames for first-aid training and the first-aid card (H).

**Next (the voyage, 0.2):** dust storms up to τ 3 as weather, with Melas's predeploy (ROADMAP §3.4); the ship place set and every ship mood (normal, ship's night, battle red, emergency, blackout, fire); decks with the shaft rule; zero-g frames (float, tumble, handhold, push-off, mag boots, ladder), floating liquids, couches, racks with curtains, braced and pinned; the body cues for G; the CIC repeater with SYSTEM, LOCAL and THREAT and their decisions; windows on the voyage's sky; the drop ship's seat display; the day card's voyage strip; ship sounds and alarms, per-area rooms, the speaker in the berthing, the chant bed; the splash's time-lapse of people walking in and out.

**Then (Europa, 0.3):** the Europa place set and moods, the surface under Jupiter-shine, the under-ice town streets, steam and ice, vacuum audio and the suit's full HUD and ground tac, the FOB terminal's dose planner, the PLANETARY display, the telescope station where a setting has one.

**Combat and special operations, at ROADMAP's milestones (§3.4).** **0.3:** suppression and casualty frames in full, CASEVAC carries, the reflex outcome splash for combat events, the threat board in a fight; **0.5:** the boarding's dead-compartment and vacuum looks; **0.6:** NVG and thermal visor modes (a fog-pass recolour within the cone; with the device on, `body.eyes.nv` the one flag, the picture is the device's and the eyes' adaptation is neither shown nor read by perception, while the eyes keep adapting underneath, so taking it off shows them as they are: BODY §23.4, built in v0.0.5), the airless rock place set, the telescope for "eyes on". The optional score with the polish of 0.9.

---

## 17. Cross-references (what VIEWS needs from the other sections)

| From | What |
|---|---|
| SETTING | uniform list and colours (utilities pattern, PT kit, service and dress, coveralls, suits) to fill the `corps` family; rank insignia and unit emblems for the doll, the sheet and papers; the Corps' letterhead names; how MCRN alarms and bugle calls sound if they differ from my defaults; Base Melas's coordinates and canyon horizon (§4.9), through PLACES to `sunAt`; the display strings for sols and Mars years ("Sol 590 · MY 211", §3.3); name pools for plaques; whether a fire team's helmet tape is allowed under "you know a unit by its people" (3.9); the Corps' cadence calls, with PEOPLE |
| TIME | the splash's behaviour in full: the two forms, `S(m)` and every phase's duration, exported as `splashMs(m)` for the view to call, the engine model in which outcomes accrue as the clock runs, and the one splash test (§15, tests 9 and 11); the activity record's `vignette` field and whether "stop here" is offered (§6.4, §8.1); the clock faces' strings from one helper (§3.1) and what the character can tell the time by; `sunAt(site, ms)` as the only sun (if the equation of time is wanted, TIME adds it there for everyone and SETTING's table is recomputed); the Plan of the Day's structure for TODAY and for the day card's bar; chapters' page content; reveille, chow and taps times for the bugle. TIME's keys for the splash (§6.4) are adopted as suggested |
| BODY | the locomotion state per regime (gait, bound phase and height, float, roll angle, handhold, mag boots, ladder) for the frames; G states (braced, pinned, couch, G-LOC) and the grey-out, tunnel and hypoxia levels; the straining manoeuvre's state and its key, bound here (7.3); in §13.3 and §11.6, the roll for the strain's onset and for "Exhale!" made with SKILLS' named skill or Nerve in place of Warfighting, which multiplies skills and is not rolled (SKILLS §4); blood loss; tinnitus level; the suit's sensors and readings for the suit block; wounds and care marks with positions for the doll; grime, sweat and burns; for each need of the body strip, its felt band index on its own scale and the belief's confidence (7.6), and the body beliefs for ON YOU; the issue's mass summed from the one container table |
| SKILLS | the roll text format for the log; the instinct's rules and tones (the strain's line takes T while +Gz is over 3 G); in §2.2, the skill that trains the anti-G straining manoeuvre and shortens its onset (I suggest Fitness, whose uses, legs, torso and breath, are the manoeuvre's own muscles; EVA is the other candidate), so the step panel can show the onset time; the belief words that set the strip's dither |
| WEAPONS | carry postures and their muzzle directions (for the posture glyphs too); weapon classes and silhouettes (length, magazine shape, optic, colours); handling steps for the step panel and their frames; what the character knows of each gun's state (for the weapon card and the selector glyph); optics' fields, reticles, round counters and perception factors; muzzle flash, suppressors and calibre loudness; the issue counts, read from the one container table (`arms/kit.js`) that VIEWS draws, with the three double rifle magazine pouches holding §3.3's six; reach times; the armoury counter; the range tower's group offset for zeroing |
| COMBAT | the step panel's content; cover outlines; reflex card options and the outcome splash's events; orders and hand signals for O; suppression and hit energies for shake; CASEVAC actions; ship combat events and the repeater's lag; MARCH order for first aid; the riot's numbers for the atlas's worst scene (the `crowd` test's 200, benched as `cavern-riot`) |
| PEOPLE | perception (cones, reach, awareness radius and their modifiers) that the fog draws; who knows whose name; awareness bubbles; conversation content; the hard talk's state (composure, edges, round, whether you read their choice) for its display (8.10); the chain of command and roster; each person's height, build, skin and hair, and tier 1's two differences of 3.9 at roster generation; quirks with figure cues; `whereIs(person, ms)` with its `path` for the splash's walkers (PEOPLE §4.6; CONTRACTS §13); crowd spawning outside the no-pop box `[26, 23.5]` m round the player and outside the far window; cadence-call lines and what joining does; what each squadmate's speaker plays |
| CAREER | the content of orders, evaluations, pay statements, letters and charge sheets; the new-career steps; the memorial card |
| PLACES | rooms, finishes, furniture kinds and sizes; each compartment's lighting state and its static lamps for the tiled pools; weather (τ, wind, dust cover), smoke density, pressure; the canyon's horizon profile for `sunAt`; radiation fields for the FOB's dose planner; deck programs oriented dorsal-up with the shaft at one position; wall heights; streaming of outdoor chunks out to `FAR_LOAD_M` 600 m in the open; which screens and windows exist where |
| TECH | the renderer's structure (stage, MRT, the GPU-baked lookup, the tiled lamp pools and 10 dynamic slots); the atlas of 3.7 (R8 layers of role indices, bands per look, colour rows, heads as second instances of the one draw, `MAX_PEOPLE` 256) and TECH §16.4's people line at 128 MB (two 4096² layers); the bus facts of §2.7 as adopted in 5.1, with a `stoppable` flag on `skip-start` if the activity record cannot say it; deterministic cosmetics by hash; the audio presenter's place and `src/data/sounds.js`; the perf harness, `tools/shot.mjs`, the gallery with its sound page; `window.__olympus` hooks for shots (`?scene=`, `?mood=`, `?ppm=` for samples) and the labels pass's placed boxes for `hud-overlap` |
| ROADMAP | the look round's place before the skeleton, as shipped in v0.0.1: five scenes and 24 views (0.0.2's row and moment 1's count; CONTRACTS §18 and §19, item 6); its risk §4.6 "every template is kept per variant" replaced by 2.3's deletion after the pick; 0.1's audio as the six scored families of 11.5; "the splash's time-lapse ghosts" at 0.2 as people walking in and out; moment 3's 4.3 s, which is TIME's and now the only figure; milestone numbering |

---

## 18. Open questions for the user

1. **Density and proportions.** *Answered 2026-11-06: A, 16 px/m, with chibi figures (§2.3).* A (16 px/m) or B (24 px/m), and chibi or taller figures, by scoring the look round. *Default until scored: B with chibi figures* (the brief's "High Resolution Pixel Art" and your tradecraft taste for the smaller, bigger-headed figures: "I like the smaller figures, but the new environment", 2026-10-26).
2. **Sound in vacuum.** Fully silent outside, with only what your body and suit carry (the thump of your own rifle in your hands, hull impacts through your boots), or a faint "film" version of outside sounds? *Default: fully silent, body-carried only.*
3. **Music.** No soundtrack in play; music only where the world makes it (cadence calls you can join, a squadmate's speaker before taps, the Rec's screen, the bugle), plus an optional sparse score at set pieces and day transitions? *Default: the world's music on, the score off.*
4. **Screens do not pause.** Watching the CIC repeater, the terminal or the sky keeps the clock running (menus and cards still pause). *Default: screens are live.*
5. **Seeing past the frame.** The far window (a round inset at the frame's edge on a far point you look or aim at) instead of the camera zooming out, so the pixel art stays crisp and nothing shrinks. *Default: the far window.*
6. **Privacy.** Showers behind a curtain (head and feet show), the head behind a stall door (boots show), never more. *Default: that.*
7. **The body on the watch.** The body strip (nine pictograms filled to how you feel, no numbers) folded into the watch: only what you feel, all nine, or none? *Default: only the glyphs that have left "fine", so the watch is quiet when you are well.*
8. **Straining under G.** T held is the anti-G straining manoeuvre whenever +Gz is over 3 G (a step in the weapon mode, "Strain" on the reflex card), rather than a ninth new key. *Default: T held.*
9. **Seeing through a building.** When a mass hides you only briefly (a lamp post, a corner indoors), its faces above `CUT_H` round your figure dissolve to a 2 × 2 checkerboard and your silhouette shows through at 60% ink (§2.10), which reads as a dotted patch (shot behind Echo at (500, 187)). Keep the checkerboard over the figure, or hide the mass above `CUT_H` outright inside that rectangle and keep the checkerboard for cards? On the ground the wide see-through (§2.10, v0.0.3) already cuts everything above 1 m round you once a mass over 3.2 m has hidden you for a quarter of a second, so this is about brief occlusions and indoors. *Default: the checkerboard, as written.*
10. **Shadows at dawn and dusk.** The key light's height, colour and strength follow the real sun, but its direction on screen is the art's fixed one, from the upper left, so the dawn's long shadows run up and to the right while the sun rises at 106° (§2.7). Should cast shadows follow the sun's real azimuth at dawn and dusk (sprites keep their drawn light), or stay the art's? *Default: the art's direction.*
11. **Sitting on a lower berth.** By day a squadmate sitting on the lower berth sits under the upper deck, so only the head shows between the rack's parts (physically right; shot of the bay at 07:00). Keep it, or seat the lower berth's sitter where the whole figure reads (the rack's foot, a stool)? *Default: as it is.*
12. *Answered 2026-11-07: keep the dark-adapted wake (the user's score of v0.0.5's `test-night`: night 100, klaxon 100, drill 95, starred, "much better").* **The klaxon through dark-adapted eyes** (v0.0.5's eyes, §2.7, BODY §23.4; your ask of 2026-11-06). Asleep, the lids keep the rods at their floor, so the klaxon wakes you fully dark-adapted: the rods' gain opens at 2.4 to 2.8 times v0.0.4's and the cones' at 1.07, and risen at your rack's foot the bay in sight is 1.34 times as light as the v0.0.4 picture you scored 80 (the rising squad reads as people, not reddish dark shapes; `REF_LOG` 0.15 makes v0.0.4's picture the eye five minutes into the dark). Keep the dark-adapted wake, or cap the rods' gain so the klaxon shows as scored (the picture's rod gain capped, for example at 1.5, never perception's `lightK`)? The two side by side: `/private/tmp/claude-501/olympus-build/fixer-er/ab-klaxon.png`, to show as a numbered sample. *Default: keep, your own ask.*
13. **The tracer's ember by day** (v0.0.6, section 3.6; WEAPONS §2.3). Fired at 25 m, a tracer has not lit (its trace from 30 m), so what shows is the igniter's dim ember, a dotted dull-red streak for one or two frames; lit by the daylight where it is drawn, it reads pale against the regolith (the runtime review's, the design review's). Keep it faint as the physics says, draw it redder (`EMBER` unlit, a glow), or leave it out until a range long enough for the trace? *Default: as built, faint.*
14. **The R menu's place** (v0.0.6, section 8.10). The menu is a card like every other, centred over the picture and pausing it, which section 8.1 allows; the runtime review found it covering the picture's centre, where the figure stands. Keep it centred, or open it beside the figure, clear of it? *Default: centred.*
15. **The barber's splash** (v0.0.6, PLACES §4.13). The haircut takes 12 minutes behind a splash with the figure inside the PX, which has no inside yet, so the splash shows the pole on the regolith and nothing more (the design review's). Draw a chair vignette now (the barber, the cape, the clippers), or wait for the PX's interior and its three chairs? *Default: wait for the building.*
16. **The cuts' look** (v0.0.6, section 3.9; `samples/cuts/`, `./play.sh --gallery`). The seven regulation cuts at their four steps, under the cover and on the doll, at 16 px/m, to star and score; the game draws them as built until you do. Before you score them, the sample gains a view with blond and black hair in utilities without a cover under the bay's overhead light (the design review saw a fresh blond high and tight read as a tan cap; the fixer drew the hairline in the skin's shade and the fronts narrower, `.run/figures-hair/figures.png`). With the cuts: are there too many shaved heads (CAREER §2's `THIN_P` and the cuts' weights: 22 of 101 men at seed 48213, 24.5% of men across 60 seeds)? *Default: as built until scored.*
17. **R at a sink with nothing due** (v0.0.6, section 10.1). With clean hands, no thirst and a clean face, R at a sink is the wait, the plate saying "SHAVE: CLEAN-SHAVEN" before it, and R held offers the rest (the fixer's, after both reviews read "R wash hands" on clean hands as a chore the plate always showed). Keep the wait, or have R wash the hands there anyway? *Default: the wait.*
18. **The stairs' arrows** (v0.0.6, section 2.9; the user's report of 2026-11-07 on the UP mark). Each stair's word now names the end it leads to, with a walking arrow along the treads from where you step on toward it. Downstairs the arrow to UP points down the screen (Echo's flights climb south, toward the camera) and upstairs the arrow to DOWN points up the screen. Does that read, or should the word and arrow follow the screen's up and down? *Default: as built, the arrow on the treads toward the word.*
19. **The far window on the KD** (v0.0.7, section 2.4). A round inset at the frame's edge shows your face at 300 m twice life size, the SO-4's reticle offset by your hold, the face going down into the pits and coming up with the spotter and the disk; it is to score as "far window" in `test-range`. Two things were left for your eye: the score disk is drawn without its pole, and the seated R-7 reads at 16 px/m as a compact crouch, the knees not distinct. *Default: as built until you score it; a look round for the disk's pole and the sitting figure if you ask.*
20. **The turners and the take-in's marks** (v0.0.8, sections 2.12 and 7.4). On `test-pairs` a turner's face is drawn twice life size (15 × 24 px beside the 34 px chibi; life size was 7 × 12 px), every paper face one khaki board until the marine has identified what it holds; the window is amber corner brackets closing from three times the face, the pause a stamp "0.55 S" above it for 2.5 s and a plaque with a strip ticked every 0.1 s, all standing to the face's right. Do they read as the marine's take-in, and is twice life size right beside the figures? *Default: as built, until you score the turn aspect.* **Restated 2026-11-07** (you asked what it meant; the hit drawing it led to is answered by your last sentence of that day, section 7.7). **Said plainly**: on `test-pairs`, when a paper target turns to face you, your marine needs a moment to take it in before you can act; amber corners close round the target during that moment, then a stamp "0.55 S" says how long it took. Do the corners and the stamp read as your marine's reaction, or as the game lagging? And is the target drawn at twice life size right beside the figures? Yes or no on each. *Default: as built, until you score the turn aspect.*
21. **The hit card's look** (2026-11-07, section 7.7; **the three samples are in the gallery to score from v0.0.10**: `samples/hitcard/`, A the doll in colour, B the khaki board, C the casualty card's outlines, each at 1024 × 768, 1600 × 900 and 1920 × 1080, reshot after the round's fixes; `./play.sh --gallery`). A person you hit is drawn in `PAPER` as the range's card is, the impacts marked: three samples to score, A the doll in colour (the inventory's and PERSONNEL's drawing), B the man-target board in khaki, C the casualty card's front and back outlines. *Default: A.* **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds, A, the doll in colour. Not built (with `test-stress`). **Re-answered 2026-11-08** (the user's gallery scores; built in v0.0.13, §7.7's last note): the hit card is B, the khaki board; A and C are removed.
22. **Belief, then truth on the hit card** (2026-11-07, section 7.7). During a fight the card shows what your marine could tell (where his sight was at the break, and what he saw land), and the real holes only after he searches the man ("Search him", 20 s) or in training's hot wash. *Default: yes.* **Answered** (the user, 2026-11-07): the default holds, belief then truth. Not built (with `test-stress`).
