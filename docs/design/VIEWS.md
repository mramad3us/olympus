# VIEWS: what the player sees, hears and presses

Section of the OLYMPUS design, written 2026-11-05; revised 2026-11-06 for v0.0.2 as built (the camera's held axis and pixel-snapped lead, the people atlas's budget shared with TECH, the log's `LOG_MAX` 1,500, the perf test on CONTRACTS §7's rows), for v0.0.3 as built (the barracks and the base on the stage: the look at 16 px/m, light, the fog on 0.25 m cells and the view's memory, the see-through, the HUD, the sound; the build sheet `docs/build/0.0.3.md`), for v0.0.4 as built (the frames, the towel and the body's cues on the sprite, the doll's first cut, the splash and its vignettes, the outcome strip, the instinct line and the folded strip, PERSONNEL, the new glyphs, R and T as press keys, the world's sounds; the build sheet `docs/build/0.0.4.md`) and for the user's rules of 2026-11-05: places are handcrafted and the same in every career, and every person is generated, so the names in this section's examples (Okafor, Reyes) stand for whoever the roster drew. It obeys `docs/DESIGN.md` (the hub wins where they disagree). Sources: the research notes in `docs/research/` (chiefly `tradecraft-art-render.md`, `tradecraft-design-3.md`, `longhaul-visuals.md`, `tradecraft-sim-world.md`) and the screenshots in `docs/research/shots/`. Paths into the two older games are relative to `../tradecraft/` and `../longhaul/`, both read-only.

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
| `FAR_R_PX` | 0.22 × `RES[1]`: 79 px (A), 119 px (B) radius, about 4.9 m of ground either way |
| Anchor | on the frame's edge along the bearing from the player, inset 4 px; the player stays in the main frame. Placed by the labels pass against the HUD's rectangles (section 7.5): where the bearing meets a rectangle, the window slides along the edge to the nearest free place and a 3 px tick on its ring points along the true bearing |
| Frame | a 1 px ink ring and a 3 px pixel bezel; with an optic, the optic's reticle in its colours (WEAPONS gives the reticle) and the optic's field instead of 4.9 m when narrower |
| Fog | its own 24 × 24 cells of 0.5 m round the far point, from the same perception function |
| Plaque | what and how far: "TARGET 6 · 200 M" or "MOVEMENT · 340 M" |
| Opens and closes | a 0.2 s Bayer dissolve, never a pop |
| Max distance | the eye's reach from perception (PEOPLE), out to `FAR_LOAD_M` 600 m: line of sight and the fog's reach come from PLACES's static index, and the one chunk under the far point is built with priority before the dissolve starts (PLACES §2.4, TECH §9.9); nothing else is streamed toward 600 m |

Magnification in a top-down picture does not change pixel size; an optic changes what the eye resolves there, so it lifts the fog inside the window (perception's reach with the optic's factor) and narrows the window's field. Tradecraft's rule (the user, 2026-11-03: "we should only be able to aim at things in the current frame") holds with the far window counted as part of the frame while open.

**Shake.** Tradecraft's fight jolt (1-3 px for 4 ticks) stays. OLYMPUS adds: your own rifle shot 1 px for 2 ticks; an explosion within 30 m, 2-4 px decaying over 0.5 s; a hit on the hull you are in, by the hit's energy (COMBAT gives it), 1-6 px over up to 1 s. G onset never shakes the camera (the body tells it, section 7.3). Shake can be turned off (section 12).

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
| red | 22 | 0.13 | blood, MCRN red, battle-red light |
| steel | 250 | 0.03 | weapons, fittings, glass, ship metal |

Fixed colours: ink `0x1a1214`, paper `0xf4efe6`, warm glow `0xe7b84a`, pale glow `0xf8e08a`, cool glow `0xeaf2f6`, phosphor `0x9fe0b0` (exit signs, blackout strips, old consoles).

| Place set | Families (hue°, chroma) |
|---|---|
| Mars (Base Melas, Redwater, the surface) | regolith ochre (45, 0.10); rust (32, 0.12); basalt (285, 0.025); dust rose (25, 0.05); lichen (110, 0.065); sea and sky (230, 0.05); hazard yellow (90, 0.13) |
| MCRN and civil hulls | bulkhead (245, 0.012); deck green-grey (165, 0.02); hazard yellow (90, 0.13); padding blue (255, 0.07); console cyan (205, 0.08); amber (70, 0.13); cable orange (50, 0.12) |
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
- **The eye's adaptation** (the stage's call, unscored: the user's eye judges it): the picture shows `lightLevel` L through `exposure(L) = min(1, (L / 0.75)^0.6)`, so a bay at its day fill shows its painted colours and at lights out (0.04) about a sixth of them; outdoors the rig's gain lifts the night sky to match (up to 37 times the night row's strength).
- **Lamps**: ceiling lamps are a room's fill, not pools (they carry r 0; the look round's blotches in L1 and L3); pools are the night lights, the fire watch's red lamp, desk lamps, street lamps and floods, each its core inside r and its ring from r to 1.5 r. Windows glow by the glow class `LAMP`. The fire watch's lamp is a fixed red-lensed lamp at the post (r 1.5 m; its core lights to 0.29 at 23:00); the torch as a moving pool comes with AI.

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

**Multi-storey buildings** use the deck rules (one floor at a time, stairs as the shaft). As built in v0.0.3 for Echo: floors linked by a stair share the camera's bounds, so the stair and you are on the same pixels on both, and the wipe (`STAIR_DISSOLVE_S` 0.4 s, outward from the stair) holds the camera: no cut, once both floors are built. A door to another area is a cut, behind which the last picture holds until the new area and everyone in it are up; a move within the area already shown (a debug `go`) is no cut (my call).

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

**As built in v0.0.3**, the memory is the view's (`src/render/memory.js`), view-only and never saved, ahead of `state.mind.seen`, which stays PEOPLE's for sightings (0.0.10) (my call). The view draws every actor and the fog only dims, so without it a change made out of sight would show in the dimmed cells (through 22:00, 13 of 13). An actor is drawn as last drawn in sight while the player's visibility is 0 both where it stands and where it was last drawn; once either spot is in sight it is drawn as it is and remembered anew, so a change shows only where you look, as the fog lifts there. A new state (a load, a new career), another area or a skip forgets it.

**What OLYMPUS adds to the eyes** (requests to PEOPLE and BODY; defaults are my call if they leave them open):

| Condition | Effect on the fog |
|---|---|
| Helmet with visor | cone narrowed by 20°; the all-round awareness radius (footsteps, the sense of someone there) shrinks 30% (the helmet muffles) |
| Suit in vacuum | no hearing: the awareness radius drops to touch and vibration, 1.0 m, plus what the suit radio and datalink report (shown as felt patches with the reporter's name) |
| Darkness | reach by `lightLevel`, as tradecraft; the helmet lamp is a lamp pool that moves with the head and lights what it falls on |
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
| Service and dress uniforms | for ceremonies, leave, boards: the tradecraft `uniform` torso with buttons and belt |
| Shipboard coverall | one piece, name-tape row, deck shoes |
| Vac suit (soft) | `c` shell, `ð` rings at neck, wrists and waist, a chest display (one `¤` pixel), suit pack as its own part, helmet with visor `þ` |
| Hard armour over a vac suit | plates as `ø` over `c`, shoulder plates proud one pixel |
| Cold-weather gear (Europa works, Mars nights) | hood, insulated layer, mittens |

Head wear: patrol cover, helmet (tradecraft's `helmet` hat), the vac helmet with visor (closed, open, removed and clipped to the pack), the drill instructor's campaign cover (a silhouette every marine knows), garrison cover, ear defenders at the range, NVG mount (later).

**What reads at each density** (section 2.2): under A a sprite tells posture, carry posture and muzzle direction, helmet or not, suit or not, pack or not, armour or not, rifle or pistol, team colours if any. Under B it also tells a magazine in the rifle or not, an optic, separate pouches, a face's expression (two-pixel eyes, a mouth), a visor up or down. Gun state below the pixel (safety, chamber) is never on a sprite: it lives on the weapon card and in the step panel, as the character knows it.

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

**As built in v0.0.4** (`src/art/figures/poses.js`, `outfits.js`; the frames ROADMAP §4.6 held until the look was picked). The **move** band holds the stroll (four, by distance at `STEP_M.stroll` 0.12 m: a shorter stride, the arms barely swinging), the stairs up and down (four each, every 0.14 m), the look (the head a quarter turn) and the glance (the eyes aside). The **rest** band grows the berth's transitions, drawn frame by frame from PEOPLE §4.6's `poseAt`: `sitUp` (up on the mattress, the legs under the blanket), `sit` on the rack's edge, `climb` (down from an upper berth, the hands on its rail), `standUp` (half risen, the hands on the thighs) and `lieDown` (back on an elbow); and daily life: two dressing frames, leaning at a basin, brushing and shaving. **The towel** is an outfit of its own (at the waist, at the chest for a woman, with shower shoes). **The body's cues on the sprite** (BODY's `cuesOf`, through `figureOf`): wet hair darker with a sheen while `wetK > 0` (a glint on the scalp of a shaved head: the integrator's, since seed 48213's player is bald and the shower had left no mark on him), and the tired walk at `tiredK ≥ 0.5` (the head down a pixel, the arms swinging half as far). The figure is drawn at `figureOf(state, actor, ms)`'s position, height, frame and outfit, never the actor's own fields, so a transition is never a pop. The shower and the head are drawn as section 5.2 says, as built.

### 3.5 Lying, floating and the projection

In this projection a metre along the ground and a metre up a wall both cover `PX_PER_M` pixels. So **a body lying on its back with its head north looks, in outline, like a body standing and facing the camera**: the couch, the rack sleeper on their back, a casualty laid head-north for treatment are all the front view, legs straight, drawn flat at the floor's depth for the outline pass. That is why the couch frame is cheap. A body lying east-west is a long-cell frame; one lying head-south is the back view. The look round's L5 showed the cost: an upright card of a lying body reads as standing. So a sleeper in a rack is drawn flat on the mattress, as the rack's own bedding is (§3.4, built in v0.0.3), and the couch's frame waits for its scene.

**Height off the ground** (bounds, floating, a figure on a ladder) is the card lifted by its height × `PX_PER_M` pixels. The depth cue is the **blob**: the ink ellipse stays on the floor under the body and shrinks with height (`scale = 1 / (1 + 0.6 × heightM)`, opacity from 0.4 down to 0.15 at 3 m). In free fall there is no "under", so the blob becomes a dashed ring at 30% on the nearest deck, telling where the floater is over the plan (my call). A figure mag-booted to a wall is the card turned 90° and set against the wall; on the deckhead it is drawn at the deck's height, head down.

### 3.6 Timing and what drives frames

Frames follow the sim, never a clock of their own, so a stopped clock (stop motion, a conversation) holds every frame. Tradecraft's gun timings stay (`tradecraft/src/render/crowd.js` `gunPose`): `RAISE_MS` 120 (the first part of a turn held lower, the gun coming up), `KICK_MS` 140, `AFTER_MS` 600 (arms kept up), `FLASH_MS` 70; anyone within `FLASH_LIT_M` 3 m lit by `FLASH_LIGHT (1.0, 0.85, 0.55)` for the flash. OLYMPUS adds: a step frame (magazine out, in, charge, check) is held from the step's start to its end as the sim reports it, so a fumbled magazine change visibly takes longer.

**Muzzle flash** (tradecraft `FLASH`: white-hot `0xf6f4ee`, then `0xf8e08a`, then an `0xe7b84a` tip) is an unlit instanced card at the muzzle. In thin air the flash is a little larger (less air to quench it; my call: × 1.2 at 40 kPa and below); in vacuum there is a short bright flash and a puff of propellant gas as a grey 3-frame spray that does not linger; with a suppressor, no flash card. Ejected brass is a glint thrown on the sim's arc (in low g it flies far and slowly).

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

Anyone you may meet suited has two of the suit-proof ones (build, the tape, the gait). The fire team's tape is a field practice, not a unit patch; if SETTING refuses it under its rule "you know a unit by its people" (§5.7), another row stands in. Tier-1 looks that differ only by a habit are looks of their own (at most 16 in a scene, counted in 3.7).

**The check.** The `sprites` test composes every tier-1 person's idle frame facing down, in their colours, at the picked density, with the helmet on and with it off, and asserts that every pair differs by at least `RECOG_PX` pixels: 40 at B and 20 at A, about 4% of a figure's 1,000 and 450 opaque pixels (my call). It prints the closest pair and their count.

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

Each numbered wound has a plaque at its side with a leader line, as tradecraft's first-aid card (`tradecraft/src/ui/body.js`; the user, 2026-11-03: wounds as "graphical representations (high quality based on inventory screen)").

The same doll draws **other people** on the read card (F → read) and on first aid, with what the character perceives of them (a read failed shows less).

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

LONGHAUL `js/ui/worldzones.js` adapted: the world's disc at true size (a dark tint of its colour with a 1.5 px limb once it is over 18 px), its pull as a wash out to 0.01 G with contours at 0.03, 0.1, 0.3 and 1 G, the high parking orbit green, the stationary orbit amber, the low orbit band violet, the air as a glow in its colour (Mars `rgb(217,138,106)`), airspaces as ticks at the limb in their authority's colour, spaceports turning with the world, our craft's track (burns dashed, coasts dotted, the air's stretch solid). Fix LONGHAUL's unshipped font name (`worldzones.js` asks for "IBM Plex Sans"; use Plex Sans Condensed).

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
| The radio box | `RADIO`, stacked above the instinct line (and above the step panel in the weapon mode) | "◉ SGT REYES · 1ST SQD" and one line at a time, each held 3.5 s + ⅓ s a word; the queue never piles up | tradecraft's earpiece (`src/sim/tutorial/earpiece.js`): in the field, your NCO's voice joins the instinct |
| Keys | `KEYS` | `? keys`, folded | the user, 2026-10-27: "put the keybinds behind '?' key instead of always in the bar at the bottom" |
| Paused | `PAUSED`, top centre (built in v0.0.3, my call: in the margin row between `TOASTS` and `WATCH`, where it covers the least of the picture and never the figure; centre as first written) | PAUSED in the pixel font on a plaque | |

**As built in v0.0.3** (`src/ui/hud/`): the watch shows Melas time large, then the weekday and the sol, UTC on its second line, then the place ("Echo Company barracks · 1st Squad, 2nd Platoon"). The toasts show the last three of the log's records and the page's lines, newest last, 16 s of play each, a line wrapping to two at most; if three long ones would overflow the rectangle the oldest goes first, and a debug skip says so once. The instinct line carries R's offer only: "R open the door" within `DOOR_REACH_M` 1.2 m of a door you face, "R close the door", else "R again: wait 15 min" (my call, after the review: a single R a step short of a door waited fifteen minutes, which Ironman cannot take back). R at a door acts at once; away from a door the first R arms the wait and a second within `HAND_AGAIN_MS` 2,000 ms sends it. Each R goes to the sim as `{ act: 'hand', args: { want: 'door' | 'wait' } }`, what the line said when the key went down, and is dropped if the offer has changed kind by its tick, so a door walked out of reach never turns into a wait. The HUD and the sound cost 0.10 ms a frame at the median.

**As built in v0.0.4** (`src/ui/hud/instinct.js`, `offer.js`, `strip.js`, `watch.js`). **The instinct line** holds SKILLS's `instinctNow(state).line` in at most **two rows**: the lead (while time stands still) and the line on the first, its tone as the left border (calm slate, note blue, warn brass, urgent red blinking three times) and T's keycap before it when T does something; the chip and R's offer on the second (one row when only one is there), each row cut with an ellipsis rather than spilt over the picture (my call, after a shot where three rows overflowed the rectangle). The chip leads with "T held" only where its line has an act at hand, then its short words (SKILLS §14.3). R's offer is never on an urgent line. R carries its offer's kind, `{ act: 'hand', args: { want } }` with `want` `rise`, `activity`, `door`, `resume` or `wait` (and the choice's `id`, `args` and `late`), dropped if the offer has changed kind by its tick. **The body strip folds into the watch's time row** (section 7.6): only the 5 × 5 glyphs whose band has left fine. **R and T are press keys** (`src/core/input.js`): tapped they act on key-up under `TAP_MS` 220 ms, held they act at 220 ms, never both; T tapped does the line shown when the key went down, T held the chip; R held at an offer with choices opens the choices card (digits), and at one without does what the tap does; an offer whose activity would make you late opens the late card (TIME §9.5).

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

**Straining under G.** BODY §13.3's anti-G straining manoeuvre (+1.5 G of tolerance while held, draining stamina) is offered **whenever +Gz exceeds 3 G**, in every posture, and bound three ways (my call, each):
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
- **Cover**: when X would get you down behind something, the cover's outline glows faintly (1 px pale) and the plaque names it.

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
| `RADIO` | bottom centre, on `STEPS` in the weapon mode, on `INSTINCT` otherwise | 720 × 52 | the radio box; in a splash, the outcome strip |
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

### 7.6 The body strip and the hands line

The user's recent verdicts on words in the interface: "too wordy, this needs to be a on-hover infocard", "too many words, this should be graphics" (tradecraft, 2026-11-04), and body screens "should include graphical representations (high quality based on inventory screen)" (2026-11-03); the brief asks for "managing hygiene levels" (2026-11-05). So the felt body is drawn, with the numbers still out of it (my call):

- **The strip**: nine 5×5 pictograms (section 9.1) in a row: water, food, bladder, bowel, sleep, grime, heat (the thermometer when hot, the flake when cold), air, pain. Each is **filled from the bottom to its felt band** (BODY's band for the need, as many of the glyph's five rows as the band's place in BODY's scale), and the fill is **dithered by the belief's confidence** (solid when sure, a 50% checker when "thinking so", 25% when guessing: SKILLS' and BODY's belief words). The words are in an on-hover infocard: BODY's belief line ("Fed two hours ago; thirsty"), never a number the character could not know. A glyph in a warn or urgent band takes the instinct's tone as its border, doubled by its fill (section 12).
- **Where it shows**: always at the head of the character sheet's ON YOU (section 8.2); in the outcome strip for the needs that moved (section 5.6); and **folded into the watch** while a terminal is worn, where by default it shows only the glyphs whose band has left "fine", so it is empty when all is well and is not a row of meters to keep green (pillar 1). Settings offer "all nine" and "none" (section 12).
- **The hands line** on the watch: the held item's icon, the **selector glyph** (the lever at its position on a dial: safe, semi, auto or burst, from what the character believes, with a `?` beside it when the belief is unknown) and the **posture glyph** (the weapon's line at the carry posture's muzzle angle against a 1 px body tick: slung back, slung front, patrol carry, low ready, high ready, compressed). Their words are on hover: "Rifle · patrol carry · safe, as you left it".

---

## 8. Cards and screens

### 8.1 Common chrome

Everything that is not a paper is a card on **dark glass** (`rgba(20,21,28,0.94)`, 1 px border `#353947`, radius 4), headed by a plaque in the pixel alphabet (the user, 2026-10-28: "most menus need revamping, the generic paper isn't adapted to inventory for instance"). **Papers stay paper** (`#f4efe6`, typewriter type). Every card pauses the game. Cards size to their content within 1,200 × 760 CSS px at `--ui` 1; `--ui` scales the whole UI from 0.85 to 1.5 with the window (tradecraft `ui.js fit()`). Headings are amber uppercase (`#e7b84a`), the Corps' own marks (unit emblem, letterheads) MCRN red `#c1553b`. Numbers are tabular Mono. Where a line would be a paragraph, it is a graphic with an on-hover infocard instead (the user, tradecraft 2026-11-04: "too wordy, this needs to be a on-hover infocard"; "too many words, this should be graphics").

### 8.2 The character sheet (C): PERSONNEL

Tradecraft's four columns (`shots/tradecraft-charsheet.png`), made a service record:

| Column | Content |
|---|---|
| The doll | you as you stand, wounds numbered |
| ON YOU | the body as you read it: first the body strip of section 7.6 at twice its HUD size, each glyph filled to its felt band and dithered by the belief's confidence, with BODY's belief in words on hover ("Fed two hours ago; thirsty", "Sore from yesterday's ruck"), never a number the character could not know; then FITNESS (base, the effective band of ±3 round it as cells, the week's load bar) and G-CONDITIONING (the same shape: where you stand against 1 G, the week's centrifuge and thrust hours); then CARRYING (mass, and what it bears like here, section 8.3) |
| WHAT YOU ARE | Warfighting as a bar with its XP; the skills with their level words, practice dots, rust, multiplier and value (SKILLS gives them) |
| THE FILE | name, rank and insignia (drawn at doll density), MOS, unit (1st Squad, 2nd Platoon, Echo Company, 2/4), time in service and in grade, qualifications with their dates and expiry (rifle, pistol, swim or suit, CPR), awards, the record of counselling and NJP, the next board |

**As built in v0.0.4** (`src/ui/cards/sheet.js`, C, paused): **three columns**, WHAT YOU ARE waiting for the skills (0.0.6). The doll (section 4.2's first cut) as you stand. **ON YOU** gives BODY's words for each need (`wordsOf`: "Fed two hours ago; thirsty."; after the shower "Fresh. Hair wet.", "Fresh. Head wet." on a shaved head), each in a row headed by its strip glyph, in the strip's order (the review of v0.0.4: nine glyphs in one row above a table of ten had matched nothing, so the watch's folded glyphs could not be learnt), with words where BODY's first band has none ("Not thirsty.", "Nothing pressing.", "Breathing easy.") and the rows Shave, Breath, Nerves and Morale for stubble, stamina, stress and morale (no Shave row on a body that grows none); never a number. **THE FILE**: name, rank, MOS, unit, billet, rack and time in service, from the roster.

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
| KeyR | R | R | what's at hand: an appliance (with its activity card), a door, a hatch, a ladder (then Z and S climb), a handhold (grab or let go), a screen, a window or the open sky ("look up"), a thing lying there, a gap to jump. In v0.0.3: a door within reach at once, else the 15-minute wait, asked twice (R, then R again within 2 s; §7.1). From v0.0.4 a press key: tapped, lying or sitting, get up, else the activity of the free fixture spot you stand at with its price, else a door, the resume or the wait; **held, the choices** (the rack's sleep and naps, the sink's basin and drink) |
| KeyT | T | T | do what the instinct's line offers (customs too: "Lieutenant, outdoors, covered: T salute"; and the NCO's last order: "T: fall in"). **While +Gz exceeds 3 G, T held is the anti-G straining manoeuvre** for as long as it is held (section 7.3). From v0.0.4 a press key: tapped, the line; **held, the chip** (SKILLS §14.1) |
| KeyG | G | G | weapon ready: intent. Enters stop motion with raising the weapon as its first step (the user, tradecraft 2026-11-03: "taking it out should imply we intend on using it") |
| KeyX | X | X | shooting mode on and off; in the mode, get down behind cover |
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

### 10.2 In the weapon mode (stop motion)

| Key | Does |
|---|---|
| Digits 1-9, 0 | the numbered steps (safety, magazine out, in, charge, check, clear, aim, fire, stance, posture, throw, put away), each with its time; 1 again in recovery is a tap where WEAPONS allows; **while +Gz exceeds 3 G, "strain" or "relax"** (the anti-G straining manoeuvre, BODY §13.3; section 7.3), toggled, with its onset time |
| Mouse | hover brackets a target and shows the aim's time; a click aims; a click on the aimed target fires |
| Arrows, Enter | step the brackets across targets in the frame (and the far window); Enter aims |
| A, W (KeyQ, KeyZ) | a stance step |
| V | a posture step |
| N | the weapon light |
| X | get down behind the nearest cover; X held (0.3 s) leaves the mode |
| E held | look without turning the weapon (the eyes and the muzzle part) |

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
| Vacuum | outside sounds silent. Only what reaches you through the body: your own weapon as a dull thump (low-pass 250 Hz, −20 dB) with the action's clacks (band-pass 2-4 kHz, faint) through your hands; impacts on a hull or deck you touch as low thuds through the boots; the suit's own sounds |
| Spaces | a convolver per area from a generated impulse response: length and brightness by the room's volume and hardness (PLACES' finish): a steel passageway rings, a squad bay is dull, the canyon floor gives a late, low echo off walls kilometres away |

**As built in v0.0.3** (`src/ui/audio/engine.js`, `steps.js`, `synth.js`; the parameters in `src/data/sounds.js`, unscored until the sound gallery). The context and its graph are made at boot behind the title, suspended, as the browsers' autoplay rule asks, and the first key or click only resumes it (0.2 ms; made on the key, the device's opening blocked the first step for 219 to 233 ms, the review). What plays this round is the world bus into the master, then a limiter (−3 dBFS, ratio 20): the master is the profile's volume squared, so the slider's middle sounds like the middle (my call), 0 when muted, saved in the profile in one transaction (TECH §7.4). Distance is inverse from 1 m with rolloff 1.5 on a floor and 1 on the ground (`ROLLOFF`), a sound not your own panned by its offset east or west of you (full at `PAN_FULL_M` 8 m); the air is `AIR_KPA` 65.9 kPa on the ground and 66.0 indoors (CONTRACTS §16). Doors play where they are, from the side they were turned from (the `door` fact, CONTRACTS §11).

**As built in v0.0.4** (`src/ui/audio/world.js`; the numbers in `src/data/sounds.js`; the hud role's calls). A **UI bus** joins the world bus. The world's sounds are rendered at `WORLD_RATE_HZ` 24 kHz and baked **a layer at a time across frames**, so the HUD and the sound at the rack went from a 3.1 ms p95 and a 14.4 ms worst frame to 0.8 and 2.2 ms. **In a splash the world bus is muffled**, low-passed to `SPLASH_LP_HZ` 900 Hz and ducked `SPLASH_DUCK_DB` −9 dB from the zoom in to the zoom out, with the iris, and the watch ticks once a shown minute, at most `TICK_MAX_HZ` 10 a second. **Occlusion this round** is by rooms, not the wall grid: `WALL_DB` −10 dB and the low-pass halved for each wall between the source's room and yours (0 in the same room, 1 next door, 2 beyond), a closed door counting as a wall. Loops (the shower's water, the tap) fade in and out over 0.25 s.

### 11.3 The sounds

| Family | Synthesis and behaviour |
|---|---|
| Footsteps | as built in v0.0.3: a foot-fall at each half of the drawn gait cycle, every 0.32 m walking or strolling (3.56 a second at 1.14 m/s), 0.9 m running, 1.4 m bounding, scheduled on the audio clock up to a tick ahead and dropped, counted, if more than `LOOKAHEAD_S` 0.1 s late (a stalled frame, a hidden tab); tile and vinyl tick, concrete, paving and stairs slap, regolith crunches; the gait offsets stroll −4, walk 0, run +4, bound +6 dB; each step's rate jittered ±4% and its level ±1.5 dB by hash; at Melas 6.1 dB under the same step on Earth (−4.2 dB of weight, −1.9 dB of air) and low-passed at 5,204 Hz. As designed: one impact per foot-fall from the gait the sim reports; surface by the floor's finish: regolith (low-passed noise, 60 ms, a gritty crackle), concrete (band-pass 800 Hz, 50 ms), deck plate (band-pass 400 Hz plus metallic partials at 1.1, 2.7 and 5.3 kHz ringing 120 ms), grating (higher ring and a rattle), rubber matting (low-passed thud, 40 ms), tile and lino (sharp tick), ice (a squeak and a crunch). Gain by weight on the foot: `10 log₁₀(g / 9.81)` dB, so Mars −4.2 dB, Europa −8.7 dB; a bound gives a push-off and a louder landing and silence between; mag boots a clunk and a servo release; zero g, no steps, only hands on rails |
| Gunshots | the muzzle blast (a noise burst through a low-pass and the space's convolver, gain by calibre from WEAPONS), the supersonic crack heard only downrange (a short N-wave), the action's mechanical clack, brass tinkling on hard floors; all shaped by the air, the helmet and vacuum as above; a suppressor takes the blast down and leaves the crack and the action |
| Hearing | an unprotected shot in an enclosed space leaves a 4-6 kHz ringing and a dull low-pass on everything, fading over 20-60 s (BODY gives the level); ear defenders at the range take shots down 25 dB |
| Ship | the life-support fans (pink noise low-passed at 200 Hz with a 100 Hz hum), pumps cycling; the drive's rumble under thrust (brown noise below 90 Hz, gain with the thrust's G) and its silence when the ship coasts, which the player learns to hear as the flip; hull creaks as thrust changes; the hatch's seal hiss; the airlock's pumps rising and falling with its pressure |
| Alarms (my calls, until SETTING says how the MCRN sounds) | general quarters: a two-tone 500 and 700 Hz, 1.2 s a cycle; decompression: rapid 1 kHz pips at 6 Hz; fire: a bell-like 800 Hz strike once a second; brace for burn: a rising whoop 300 to 900 Hz; announcements on the 1MC open with a two-note chime |
| Base calls | the bugle (a sawtooth through a brass formant filter) plays the real calls at their times from TIME's schedule: reveille, chow, colours, retreat, taps |
| Radio | the click of a key, a squelch tail (band-passed noise 300-3,000 Hz, 120 ms) at each transmission's end; the words are text in the radio box; an optional quiet "voice bed" (band-passed noise modulated at a syllable rhythm) is off by default |
| The suit | breath in the helmet (rate from BODY), the fan, alarm tones (two-note caution, three-note warning) |
| Places | Mars wind (filtered noise with gusts; in storms a hiss and grit), the base's distant range and engines, the PA (a band-passed chime, then its words as text and captions); showers (filtered noise by the head's flow, the drain's gurgle, the timer's click when the water stops); Europa's drips, pumps, crowd murmur and the ice shell's low groans; a ship's berthing at night: fans, someone's snore, a hatch |
| Voices and music | cadence calls as a chant bed on the beat (call, then answer); in-world music from the tune generator by style; the optional score (section 11.1) |
| UI | soft ticks for cards and digits, a paper's rustle; nothing for the HUD |
| As built in v0.0.4 (all synthesised, unscored until the sound gallery) | **the shower's water** (noise while the activity's `water` part runs, and only then); **the tap** at a sink and a drinking fountain (the basin, a drink); **the flush** at a urinal or a toilet when you go (the `body-event` void or bowel at a head); **the klaxon**, a 1.5 s whoop from 600 to 1,100 Hz at the horn in hall-2 while `alertNow().hornOn`, `KLAXON_SOURCE_DB` +20 dB at 1 m (a horn far over a step, the limiter catching it), through Melas's air and the walls: +10.2 dB over the recipe's peak beside it, −12.9 dB through bay-2-1's door, −30.1 dB two rooms off; **reveille's bugle**, its phrase on every room's speaker; **the splash's tick**, once a shown minute |

### 11.4 Captions

Every sound the sim marks as meaningful (shots, shouts, alarms, a hatch, boots on a deck above, an engine) writes a log line of kind `heard` and, when its source is out of sight, the edge plaque of section 2.11. A setting shows captions on screen as well, in the two caption rows reserved under the log toasts (`TOASTS`, section 7.5).

### 11.5 The sound gallery, and what 0.1 needs

A synthesised sound is tuned by ear, and Claude, who builds it, cannot listen; the user can. So sounds are chosen as the look is (my call): a **sound gallery**, `samples/audio/` on the gallery's port (:8212), with numbered sounds, each a set of synthesis parameters in a data module (`src/data/sounds.js`: oscillators, noise, filters, envelopes, the convolver's room, the air's pressure), played in its conditions (a rifle at 10 m in Melas air, with ear defenders, indoors; footsteps on each floor at 0.38 G), scored per sound and per aspect by the user, with ★ picks and **"Copy my scores"**, which the user pastes into the conversation, as the look round's "Copy my picks". A sound in the game is always a scored sample's parameters, never a hand-tuned number in code.

**0.1's sounds are six families**, and no more until the gallery has scored them: footsteps (concrete and tile, then regolith), the rifle in Melas air (ear defenders as a filter on it), the bugle, the PA, the shower, the wind. Three generated rooms (a dull room, a hard room, the canyon floor) stand in for per-area convolvers until 0.2. Everything else that happens at 0.1 is captioned (the log's `heard` lines and the edge plaques) and gets its sound when its sample is scored; the helmet's breath and the Tank's hiss (0.1.x, with the Tank: ROADMAP §5.8) are the next candidates.

**Measured, not only heard.** The `audio` test renders each scored sound offline (`OfflineAudioContext`) in its conditions and prints its peak and RMS level in dBFS, its loudness in LUFS, its spectral centroid, its energy in octave bands from 63 Hz to 8 kHz and its decay to −30 dB. It compares them with the numbers stored beside the scored parameters, so a change to the synthesiser that alters a scored sound fails the test without anyone listening.

---

## 12. Accessibility

| Setting | Default | Range or note |
|---|---|---|
| UI scale | by window (tradecraft `fit()`) | 0.85 to 1.5 |
| Text size | 100% | 90 to 150%, cards reflow |
| Captions on screen | off (always in the log) | on |
| Screen shake | on | off |
| Flashes | strobes and beacons at most 2 Hz always; muzzle flashes and explosions | "reduce flashes": flash cards dimmed 60%, no whole-screen flashes. The 3 Hz photosensitive limit (WCAG 2.3.1) is never exceeded |
| Splash length | TIME §6.2's `S(m)` | "short": every time-lapse at TIME's floor, 1.6 s (TIME owns the number) |
| The body strip on the watch | only the glyphs whose felt band has left "fine" (section 7.6) | all nine; none |
| Score | off (section 11.1) | sparse |
| Colour | semantic colours always doubled by a shape or a word (hollow or solid marks, the DARK tag, the plaque's glyph, the alarm's text) | a high-contrast HUD option: glass at 0.98 opacity, text `#FFFFFF` |
| Hold or toggle | E, Shift and Alt are held | each can be a toggle |
| Keys | physical, remappable, labels follow the layout | |
| Mouse-free | aiming by arrows and Enter, every card by digits | |
| Pause | Space, anywhere outside a splash (in a splash Esc opens the menu, which pauses it) | |
| Reduced motion | the camera lead eases | lead off: the camera stays centred |

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

**Combat and special operations, at ROADMAP's milestones (§3.4).** **0.3:** suppression and casualty frames in full, CASEVAC carries, the reflex outcome splash for combat events, the threat board in a fight; **0.5:** the boarding's dead-compartment and vacuum looks; **0.6:** NVG and thermal visor modes (a fog-pass recolour within the cone), the airless rock place set, the telescope for "eyes on". The optional score with the polish of 0.9.

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
