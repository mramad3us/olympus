# Tradecraft: art pipeline and renderer (research for OLYMPUS)

Research note, 2026-11-05. Source: the read-only working tree of `/Users/deaumas/lab/vibe/claudecode/tradecraft` (VERSION `0.2.0-rc3`). Paths below are relative to that folder unless stated. Line numbers are from today's tree. The screenshots are in `/Users/deaumas/lab/vibe/claudecode/Olympus/docs/research/shots/tradecraft-*.png` (catalogue in section 12).

Read in full or in depth: `docs/PIPELINE.md`, `src/art/pixelart.js`, `src/art/sprites.js`, `src/art/doll.js` (structure and key parts), `src/art/pixeltown.js` (header, painter, street, building, props), `src/art/furniture.js` (header, kit, makers), `src/art/townsprites.js` (header, foliage), `src/render/view.js`, `src/render/crowd.js`, `src/render/interior.js`, `src/render/cutaway.js`, `src/render/town.js` (header), the other render headers (blood, items, prints, tape, traffic, dojo), `src/sim/light.js`, `index.html`, `src/ui/style.css`, `src/ui/ui.js` (fit), `src/ui/plaque.js` and `src/ui/pockets.js` (headers), `tools/shot.mjs`, `tools/gen.sh`, `tools/fetch-asset.mjs`, `tools/blender/*.py` (headers), `samples/index.html`, `samples/index.json`, `samples/*/sample.json`, `samples/lib/finepeople.js` and `samples/lib/building.js` (headers), `docs/DESIGN.md` (Look, Stack, World size, Controls), `CREDITS.md`, `CLAUDE.md`, and the CHANGELOG's performance entries. I also viewed every reference image in `ref/`.

---

## 1. The answer in one page

- **How the "high-resolution pixel art" is made.** It is **procedural, in JavaScript, at run time**. It is not Blender renders, not image-model output and not hand-drawn PNGs. The game ships **no image assets for its look**: every texture, sprite and glyph is painted by code into typed arrays (`Uint32Array` over an `ImageData`), put on a canvas with one `putImageData`, and uploaded as a three.js texture with nearest filtering. The world is simple 3D geometry (boxes, rounded boxes, ground planes, upright cards) drawn by **three.js 0.186.1 (WebGL2)** through an orthographic 45° camera. A post shader inks outlines from a part-ID pass and a depth jump, applies the fog of awareness and the weather, and **snaps every pixel to one hand-designed palette**. DESIGN.md says so: "The pixel look needs no Blender or MPFB: sprites and textures are drawn by code" (DESIGN.md, Stack).
- **The realistic pipeline was explored and abandoned.** That pipeline was MPFB bodies, Mixamo and CMU motion retargeted in Blender, Poly Haven and ambientCG PBR textures, and image models through mflux. It survives only in samples 000–005. The user rejected those looks ("none of the above passed the user's sniff test", 2026-10-25) and asked for "pixel art 100%, but simple, almost 2D".
- **Resolution.** The world is **16 px per metre** (`PX_PER_M`, `src/art/pixelart.js:42`) on the ground, up walls and across. The game's picture is **640 × 360** (`RES`, `src/render/view.js:116`), widened on non-16:9 windows up to `RES_MAX = [768, 430]` (`src/ui/ui.js:94`). It is shown at **any scale with sharp-bilinear upscaling** (every pixel the same size, edges blended over one screen pixel), so it is not integer-only. The samples use integer scaling. A person's sprite cell is **28 × 34 px** (24 + 2 × 2 px padding) and the figure is about 28 px tall: a chibi of about 2.4 heads. The inventory and character-sheet figure ("doll") is **64 × 140 px**, drawn at half the picture's pixel size.
- **Characters.** These are paper-doll **templates of role letters** (s skin, h hair, t top, p legs, f shoes, a hat, ø armour…) in **3 views** (down, up, right; left is right mirrored), composed per frame from a **pose table** (bob, arm reach and swing, leg shapes). Shading is by rule, like a pixel artist: light top edge, shade on right and bottom, inner lines where parts overlap, an ink outline. There are **38 frames × 4 facings** at **8 fps**: idle, walk, run, sit, fight moves, a phone, a hail, a kneel, and 6 gun frames (aim, aim high, aim low, fire, fire high, fire low) with pistol and rifle "rigs". Walk frames advance with **distance walked** (0.16 m a frame), so feet never slide. Everyone on screen is **one instanced draw** from a 4096² GPU atlas holding 110 people's sheets.
- **Buildings, interiors, furniture.** Building fronts are textures painted at 16 px/m onto boxes. Interiors are a **dollhouse cutaway**: the north wall stands full height and is painted room by room, the side walls stand full height seen edge-on, and every other wall is cut to 1.0 m with a dark top. **67 furniture kinds** are built from boxes measured in whole pixels, with faces painted to their exact size. A shop you step into is **cut open**: its building is hidden and rebuilt with a slot cut out, the cut faces hatched like a section drawing.
- **Light and weather.** The sun sits where it really stands over the city (NOAA formulas), and keyframes by elevation drive a hemisphere fill plus a directional sun. The light is calibrated so a front face shows **exactly its painted colour**. Night makes painted "glow" colours emissive and adds **hard-edged two-ring lamp pools**, rendered by 10 spotlight pairs moved to the nearest lamps. The weather is drawn on surfaces (snow lying, wet, puddles mirroring lamps, frost) and in the composite (rain streaks, snow flakes, sideways dust, Bayer-dithered haze, lamp halos).
- **Performance.** Measured today, headless Chrome on ANGLE Metal (M5 Pro): **395 draw calls a frame** on a busy Moscow street (471 meshes, about 3,500 triangles), 522 in London rain at night, **821 in the furnished campaign flat**. The view's CPU cost is about **3 ms a frame**, and the frame time sits at the 16.7 ms vsync (60 fps). There are no dirty rectangles: the whole low-resolution picture is redrawn every frame, which is cheap at 640 × 360. Work goes into **caching and spreading**: textures made once per "make" (`keep()`), building generators that yield (6 ms a frame), night façades painted 2 ms a frame, shadows redrawn only when the camera steps 2 m, sprite sheets uploaded by sub-image and never whole.
- **Licences.** CC0 first, then CC-BY with credit, then the image models the free game may use. Every shipped asset carries a provenance sidecar. For the pixel look this hardly matters, because **everything is the project's own code**: no third-party art ships in the game.
- **For OLYMPUS:** port the **pixel stage** (`pixelart.js`), the **sprite system** (`sprites.js` and `crowd.js`), the **doll** (`doll.js`), the **furniture kit** (`furniture.js`) and the **dollhouse interior** (`interior.js`) nearly whole. Adapt the light model to Mars sols and ship lighting, and add vac suits, rifles and reload poses. Use the town painters only as a reference. Skip the Blender, Mixamo and PBR pipeline. Section 13 has the full table.

---

## 2. The target look: what the user picked, and the references

### 2.1 The user's decisions (tradecraft; they are the user's tastes and carry over)

These are from DESIGN.md "Look", PIPELINE.md and the code comments, all attributed to the user:

- **2026-10-25.** The realistic and cartoon-3D looks (samples 000–005) failed. The user asked to simplify: **"pixel art 100%, but simple, almost 2D"**, a handheld RPG "(Pokémon-like) with big heads and almost invisible legs, barely modelled". Their reasons: "few animations, lots of freedom, and it scales very easily". The references they gave were "a top-down pixel RPG camp and close-ups of its 32-px characters: heavy dark outlines, faces of a few pixels, beards, boots".
- **2026-10-25, the user's scores for the first chibi build (box people):** camera angle **95/100**, night colour shift **90**, environment **80** ("tree needs work, things lack flair"), characters **35** (box heads read as boxes from the front). After drawn sprites and new trees: "trees are fixed, characters are now a solid 70", "objectively, this would be a 90-95%".
- **Stoneshard** (Q3, Q155) was named for the "art and animation style, 'if possible'". A lesson from PIPELINE, 2026-10-26: **measure a reference before describing it**. Stoneshard's people measure about 33 px with a 14 px head (2.4 heads); its developer gives 20 × 36 px for the base character. Its native pixels are 2 × 2 at 1080p, so a view of **960 × 540**. What sets it apart is the finish: faces with glints, six tones a colour, outlines softened on the lit side, surfaces worked brick by brick.
- **2026-10-26, the pick:** "I like the smaller figures, but the new environment". The game is therefore **chibi people (sample 006's sprites) in the fine town (sample 007's finish)**: 640 × 360, 16 px/m, the 116-colour palette and its warm grade, bevelled and weathered surfaces.
- **v0.0.33:** "why is the game not taking the whole window". The picture now fills the window at any scale, sharp-bilinear.
- **v0.0.39:** "the top-down view is shorter than the left right … targets up and down are out of the field of view". The camera leans where the eyes go (`LEAD_M`).
- "environments reuse exactly the same elements, please generate at least three more kinds of everything": every element comes in makes.
- **2026-10-27:** the infocards "feel low quality, low tech too sharp and practical". They became **plaques drawn in the picture's own pixel alphabet** (`src/ui/plaque.js`). Also: "more haircuts: women bob/ponytail, men crew/side part".
- **2026-10-28:** "most menus need revamping, the generic paper isn't adapted to inventory for instance". This produced the dark-glass inventory with the doll.
- **2026-10-29 (Windows):** "each time I turn it staggers almost a second". The cause was the atlas upload. Lesson: upload small, never re-send a big texture.
- **2026-10-31:** "improve the character outline, it's not as good as it should be". The doll was redrawn as polygons and clusters.
- **2026-11-03:** "when aiming, the sprites should show us aiming, there should be aiming, carrying and shooting animations with muzzle flash etc". This produced the gun rigs. Also: "fix the holding an umbrella animations, they mostly make no sense"; "the flickering shadows on the buildings" (fixed in the fog lookup); wounds as "graphical representations (high quality based on inventory screen)"; shop names "should periodically animate into english".
- **2026-11-04:** snow tracks melted along the wheels; footprints ("If we could do some sort of transitory footprints … without it being too heavy in performance it would be awesome"); "NPCs streak accross the screen when they spawn" (fixed: jumps over 1.5 m aren't interpolated); police tape "mess"; police and hospital glass with "no goods".
- **2026-10-25 (licences):** "The game is free and won't be sold". This lets non-commercial image models in.
- DESIGN.md Look: the Disco Elysium references are for "the **angle** (a high, near-isometric camera looking down into streets and rooms, with cutaways so interiors read from above) and the **level of realism** (grounded people and places, small on screen, readable by silhouette and light). Not its painted style … the look is ours to find". And "many small look samples … and the user picks the ones that land".

### 2.2 The reference images (`ref/`, gitignored commercial screenshots)

**Stoneshard** (`ref/stoneshard/ss01–ss12.jpg`, 1920 × 1080):
- The camera is a **high three-quarter top-down**. Roofs, walls and the ground are all readable; buildings show their south faces and roofs at once. This is oblique projection, not true isometric.
- **Muted, earthy, warm palette**: mud browns, olive and moss greens, slate greys, dusty ochres. Saturation is reserved for UI icons, magic and fire.
- **Dense hand-pixelled texture**: every plank, shingle, cobble, tuft of grass and mud rut is drawn. Tents and tarps are torn, ivy grows on stone, puddles lie in the mud, debris and planks are scattered about (ss01 village square, ss08 graveyard, ss12 orchard farm).
- **Small people** (about 30 px), heavily outlined, with helmets and weapons legible at that size.
- **Dark dungeons lit by light sources**: torches and candles give warm pools, and the surrounding black is shaped like the explored area (ss02 mine, ss07 crypt, ss11 cellar with candles in sconces). Areas you haven't explored are **black with a dithered edge**. That is the source of tradecraft's fog look.
- **Interior cutaway** (ss10, a tavern): the room is drawn as a box with its south wall gone and its back wall up. That is tradecraft's dollhouse.
- **UI**: heavy gothic carved-stone frames, inventory grids with large painted item icons (ss04, ss06, ss09), a bottom hotbar with red and blue health and mana bars, a combat log at the bottom left in plain sans text (ss11), and a world map in sepia parchment style (ss05).
- Tradecraft took the camera, the finish, the dithered fog and the dollhouse. It did **not** take the gothic UI frames: tradecraft's UI is dark glass and typewriter paper.

**Disco Elysium** (`ref/de-*.png`): painterly 3D with a high oblique camera.
- `de-cutaway-bedroom.png`: a bedroom and kitchen seen from above with the walls cut, warm window light, people small.
- `de-machinery-yard.png`: industrial catwalks, yellow-black hazard framing, grating, a crane, cold grey light. This is relevant to OLYMPUS docks and ship hangars.
- `de-whirling-balcony.png`: a lit glass café at dusk, snow, cobbles, a neon sign.

These were used for the angle, the cutaway and the "grounded realism", not the painterly style.

---

## 3. The pixel stage: `src/art/pixelart.js` (1103 lines, depends only on three.js and `arabic.js`)

This is the heart of the look and the most portable module. Header L1-34.

### 3.1 Constants
- `RES = [480, 270]` (L39) is the stage default (sample 006). The game passes `res: [640, 360]`.
- `PX_PER_M = 16` (L42).
- `GLOWS = [0xe7b84a, 0xf8e08a]` (L40): lit windows and shops, emissive at night. `COOL = [0xeaf2f6, 0xc8d8e2]` (L41) is strip light (police, hospital).
- `PALETTE` (L45-64), **50 colours** (sample 006): ramps of hue-shifted colours (shadows cooler, lights warmer) in families. Night greys (cool): `0x14151c … 0xf6f4ee`. Then greens, earth and wood, warm stone greys, reds and brick, blues, yellows and ochre, skin (4), and accents.
- `FINE_PALETTE` (L146-149), **116 colours**, **generated in OKLCH**. There are 14 families `[hue°, chroma]` (L99-100): `[60,0.016] [265,0.022] [55,0.05] [75,0.095] [35,0.11] [22,0.13] [50,0.07] [115,0.07] [145,0.09] [195,0.06] [250,0.08] [275,0.06] [325,0.07] [85,0.04]`. Each family has 8 lightness steps `STEPS = [0.2, 0.29, 0.38, 0.47, 0.56, 0.66, 0.76, 0.86]` (L101). Chroma is scaled by `1 − 0.9·|L − 0.55|` and the hue is shifted by `shiftHue(h, L − 0.55)`. Four fixed colours follow: ink `0x1a1214`, paper `0xf4efe6`, and the two glows.
- **Hue shift** (L93-94): darker tones turn toward hue 285° (violet) by `−dL·1.4`; lighter tones turn toward 85° (yellow) by `dL·1.6`.
- `tone(hex, dL)` (L119-126) gives any colour lighter or darker by dL of OKLCH L, hue-shifted, with chroma × `(1 − min(0.5, |dL|))`. Results are cached in a Map. Every painter uses it ("as a pixel artist does").
- `nearest(hex, palette)` (L103-113): the CPU twin of the shader's metric, `e = 0.30dr² + 0.59dg² + 0.11db² + 0.25(dr²+dg²+db²)` ("luma counts most").
- `noise(x, y, seed)` (L129) is smooth value noise. `tnoise(x, y, period, seed)` (L138) is the periodic version for seamless tiles. `rng(seed)` (L721) is an LCG, `s = s·1664525 + 1013904223`.

### 3.2 `pixelStage({ background, outline, palette, zoom, res, grade, parent, autoFit })` (L177-483)
- **Renderer.** `WebGLRenderer({ antialias: false })`, pixel ratio 1, sized to the low-res picture. `shadowMap.type = BasicShadowMap`: hard pixel shadows. The canvas is styled `imageRendering: 'pixelated'`. With `autoFit` (samples) the CSS scale is the **largest whole number** that fits: `floor(min(innerWidth/W, innerHeight/H))` (L186-191). The game uses `autoFit: false` and the sharp-bilinear blit instead.
- **Camera** (L201-204). Orthographic, looking straight north and 45° down. "A metre of ground (z) or of wall (y) projects to sin 45° camera units, so the camera's vertical span is H / PX_PER_M · sin 45°". Frustum: `left/right = ∓W/16/2`, `top/bottom = ±H/16·√½/2`, near 1, far 200. The result is **1 m = 16 px along the ground, up a wall and across**, so tiles and building fronts come out square, as in a 2D game. This is an **oblique (cabinet-like) projection made with a real 3D camera.**
- **`look(target)`** (L217-224) **snaps the camera to the pixel grid** (`round(x·16)/16`) so nothing shimmers as it moves. The camera sits at `(x, y + 60·√½, z + 60·√½)`. The sun is placed at `(x−8, 15, z+5)` relative to the target: from the upper left, a little in front.
- **Light calibration** (L206-215): `HemisphereLight(0xdde6ff, 0x9a8a78, 0.6π)` plus `DirectionalLight(0xfff2dc, 0.79π)`, shadow map 2048², frustum ±26 m, bias −0.0008. With the toon `RAMP` (L573-579: a 5-texel gradient `[0.55, 0.55, 1, 1, 1]`, so two bands), **a front face shows exactly 1.0 of its painted colour, a top 1.17, a face turned from the sun 0.69, shadows 0.3–0.5.** PIPELINE lesson, 2026-10-25: at 0.66 the palette snap moved every colour a step down ("a beige trench coat came out skin-coloured and read as a beard"). "What is painted is what shows."
- **Render targets** (L228-231): `rt` (HalfFloat colour plus a `DepthTexture`), `rtId` (the part-ID pass), and `rtOut` (the finished picture, linear filtered for the blit).
- **Part IDs.** `part(obj, id)` (L567) stamps `userData.part` on meshes. The ID pass (L448-463) swaps every mesh's material for a flat colour hashed from its part (`(id·2654435761 >>> 8) & 0xffffff`). Meshes with `userData.noId` (blob shadows, thin things, glass) are hidden from it. A mesh may bring its own `userData.idMaterial` (the crowd's cards, cut to their sprite's shape).
- **The post shader** (L238-395), in this order:
  1. Sample colour at the pixel centre and gamma-encode (`pow(1/2.2)`).
  2. **Fog of awareness** (L319-327). The world position is rebuilt from depth through `invVP`. A surface above the ground takes the fog of the ground half a metre south per metre of height, so a façade reads as the pavement at its foot (the user, 2026-11-03, "flickering shadows on the buildings"). Then `fv.r < bayer4x4 → dim(col)`: greyer, darker (`dimK`), slightly cold. `fv.g > bayer → feltTint`: a cold pale tint for what is felt but not seen.
  3. **Outline** (L328-343), over the 4 neighbours. If another part sits more than 0.35 m behind, or depth jumps more than 0.6 m, the pixel is multiplied by **0.12** (a silhouette, near black). If another part sits between 0.02 and 0.35 m behind, it is multiplied by **0.4** (a softer line between touching parts). "A pixel further down a wall, or up the ground, is 0.044 m further: hence 0.02."
  4. **Weather in the air** (L344-386): the haze, then halos (gaussian, `vec3(0.91,0.72,0.29)·strength`), rain (two streak layers: cells 9×34 and 6×23 px, 380 and 270 px/s, length 4+5·density), snow (flakes of 1–2 px in 15 and 9 px cells, 42 and 28 px/s, swaying by `sin`), dust (streaks turned sideways, 140 px/s), and splashes (a 2-px spark in 0.25 m ground cells, a moment each). Falls are **in screen pixels pinned to the world** (`wxTime.zw`, the camera offset in pixels) so they don't slide as the camera pans. A **roof rect** keeps the air dry over the shop you're in.
  5. **Grade** (L387-392, fine look `grade: 1`): mix 18% toward luma, multiply by `(1.05, 1.0, 0.9)`, push shadows under luma 0.35 toward violet by `(0.03, −0.01, 0.05)`.
  6. **Palette snap**: a loop over up to 128 uniforms. The array is padded to 128 because "three uploads the array at the declared size", which threw on 50 colours in a `vec3[64]` (L251, lesson 2026-10-25).
- **Blit, sharp-bilinear** (L401-414): `t = uv·res; c = fract(t) − 0.5; edge = 0.5 − 0.5/scale; f = (c − clamp(c, −edge, edge))·scale + 0.5; sample (floor(t) + f)/res` with linear filtering. Each picture pixel is a solid square, and where a non-integer scale puts an edge inside a screen pixel, that one screen pixel blends the two. "Nearest-neighbour would make some a screen pixel wider than others, and they'd crawl as the camera moves."
- **`size(w, h, outW, outH)`** (L418-428) resizes the picture and the output canvas separately. **`dispose()`** (L471-481) frees targets, materials and the shadow map, then calls `renderer.forceContextLoss()`: "a browser keeps 16 or so; left to the garbage collector, a seventeenth new game lost the oldest's".
- **`render()`** (L444-468): scene → `rt`; the ID pass → `rtId` (background nulled, clear black); the post quad → `rtOut`; the blit → canvas. That is **2 scene passes plus 2 fullscreen quads a frame**, plus the shadow map when flagged.

### 3.3 Materials and shapes
- `mat(color, map)` (L699-703) is a shared `MeshToonMaterial` with the RAMP gradient and the weather patch (`onBeforeCompile = wxPatch`, `customProgramCacheKey = 'wx1'`, so one program for all). `vmat()` (L708) is the vehicle variant (`WX_VEHICLE` define: no street-pattern snow and no frost glints on cars). `glow(color, map)` (L714) is an unlit `MeshBasicMaterial`.
- `paint(w, h, draw, { repeat, glows })` (L734) and `paintSteps` (L743-767): `draw(px)` fills a `Uint32Array` with `px(x, y, w, h, colour)` (negative sizes run left or up, clipped), then one `putImageData` makes a `CanvasTexture`. Nearest filtering, no mipmaps, sRGB, `userData.size = [w/16, h/16]` metres. When `glows` is set, `glowRuns` records `[start, end, which]` runs of glowing pixels, so `emissiveOf()` never reads the texture back. The move from `fillRect` with CSS strings to a typed array took a street's painting from 25–85 ms down. A generator `draw` yields between layers, so painting spreads over frames.
- `tile(kind, m)` (L788-850): repeating tiles of m metres (grass, cobble, asphalt, brick, plaster, roof, planks, leaves, gravel, water, awning). `FINE_TILES` (L869-983) add bevelled bricks, setts, slabs, squares, granite, pavers, York stone, PCC, terrazzo, broken flags, road slabs, concrete with grass joints, tarmac, patched asphalt, dirt, and winter beds (kale, spruce boughs, stalks). `fineBricks()` (L856) gives 7×3 bricks with a lit top row, a shaded bottom and right, random ±tones and darker specks. `stones()` (L985) gives bevelled flags with mottling and moss in the joints.
- `box(w, h, d, faces)` (L1023) takes a material per face (`sides, top, bottom, front(+z), back, left, right`). **Its UVs are scaled to face size over the texture's metres**, so a texture painted to the face's exact size maps **one texel to one screen pixel**. `roundedBox` (L1034) does the same with rounded corners. `ground(x0, z0, x1, z1, material, y)` (L1045) is a flat rectangle.
- **The pixel font** (L1059-1103): `GLYPHS` are 3×5 (M, W and N are 4–5 wide), with digits, `& . , - / ! %`, É and Ô shown as E and O, and **Cyrillic**. `text(px, x, y, str, c)` draws it. Arabic goes to `src/art/arabic.js` (a 9-row joined script, right to left, with initial, medial, final and isolated forms).

### 3.4 Night and lamps
- `nightfall(stage)` (L489-516) is the samples' night: a dark background, a cool moon, emissive maps made from GLOWS pixels, and `stage.lightAt(x, z)` for sprites (a night base `(0.061, 0.118, 0.193)` linear plus the pools).
- `pool(x, y, z, { r=2, color, core=0.5, ring=0.2 })` (L551-561): **two spotlights with no falloff**, a core of radius r and a ring to 1.5 r, giving hard edges "as pixel art draws a pool of light, not a smooth falloff the palette would band".

### 3.5 Weather on surfaces: `WX` and `wxPatch` (L583-693)
Uniforms are shared by every toon material and set by the view each frame: `wxCover` (snow 0–1.5), `wxDirt`, `wxRime` (frost), `wxWet`, `wxPuddles`, `wxSky` (what wet ground mirrors), `wxRoad` z bands (snow churned to slush there), wheel tracks A/B (snow melted along them, the user, 2026-11-04), `wxDry` (the shop rect you're in), and `wxLamps[10]`.
- The shader patch adds `vWxPos` and `vWxUp` (world position, up-ness of the normal, instancing-aware).
- **Frost**: what faces up is mixed 40% toward `(0.72,0.78,0.86)`, with glints at about 1 cell in 55 (`step(0.982, hash)`) on 1/8 m cells. Lesson, 2026-10-27: "a frost drawn as a little snow lying … read as litter. Frost is a veil, not patches."
- **Wet**: × `(1 − 0.38·wet)` facing up (× 0.35 of that on walls). **Puddles** where `noise(g·0.8)·0.7 + noise(g·2.6)·0.3 > 1 − 0.26·puddles`, with a lit rim on the far edge.
- **Snow**: lies where `smoothstep(n ± 0.05, c)`, with roofs ×1.5, roads ×0.9 minus tracks, and dirt greying old snow (`vec3(0.47,0.45,0.42)`). SNOW is `[0.8, 0.83, 0.88]`, SLUSH `[0.5, 0.48, 0.46]`.
- **Reflections**: wet ground adds `wxSky·(0.12·wet + 0.55·puddle + 1.2·rim)` and each lamp's head as a rippled vertical streak toward the camera, offset south by the head's height (because at 45° a head h up is mirrored h further south).

### 3.6 Lessons recorded in PIPELINE.md that OLYMPUS should keep
- A smooth gradient in the composite bands into **rings** under the palette snap; **dither it with the 4×4 Bayer matrix** (2026-10-27).
- `tone()` lightens toward yellow, and the warm grade pushes the same way, so a road painted slightly paler came out brown. **Check what a colour snaps to in the game by sampling the screenshot, not in the painter** (2026-10-26).
- A tile drawn with `noise()` doesn't repeat; use `tnoise()`. Make tiles of patches big (6 m) so they don't beat (2026-10-26).
- The 116-colour palette makes night mottling louder. **Keep noise steps about 0.03 OKLCH L on big flat things** (2026-10-26).
- Bare trees: branches by **space colonisation**, and a twig haze in an ordered dither, thick toward the rim (2026-10-26).
- Sprite skin inner lines in the darkest skin tone read as wounds. Spectacles must frame the eyes; sunglasses need a gap (2026-10-26).
- Sprite cards' sun shadows need `shadowSide: DoubleSide`. **Sun shadows under people read as smears: use a blob** (2026-10-25).
- **Glow must be opted into colour by colour**: a yellow taxi painted the colour of a lit window lit up whole (2026-10-25).
- The gallery's 800 px JPEG thumbnails blur pixel art. Shoot at 3×, bring back to native with point sampling, and keep PNG at 2× (`"pixel": "480x270"` in sample.json).

---

## 4. People: `src/art/sprites.js` (1587 lines; imports `PX_PER_M` and `sim/paper.js` KINDS)

### 4.1 Grid, frames and facings
- `PAD = 2`, `CELL = [24 + 2·PAD, 34] = [28, 34]` (L68-69). Feet at the bottom row. The figure is placed at template x + PAD, so blades and guns held out have room to go.
- `FRAMES` (L72-73), **38 in all**: `idle0 idle1 walk0-3 run0-3 sit guard punch grab reel chamber swing hook elbow knee kick highkick lowkick throw sweep parry slip stagger stun hail phone kneel`, plus `GUN_FRAMES` = `aim aimhi aimlo fire firehi firelo` (L71). `FIGHT_FRAMES` = slice 11 to `aim`.
- `DIRS = ['down','up','right','left']` (L76). **Left is right mirrored** (`frames()` L1476-1484 draws it once). `FPS = 8` (L77).
- **Templates** `T` (L111-773) are `[x, y, rows]` in cell coordinates, with `'.'` meaning "leave what's under". There are views `down` (facing the camera), `up` (the back) and `right`. Parts: head (15 wide from the front, 14 from the side, 12 rows), face (eyes `e`, brows `b`, a mouth `z`, nose and cheek shade), **hair styles** (short, long, bun, crew, side, bob, ponytail, bald…), hood, umbrella, **hats** (fedora, cap, beanie, hijab, skullcap, peaked, **helmet**), beard, moustache, **glasses** (shades, specs).
- **Role letters** (header L5-13): `s` skin, `h` hair, `t` top, `p` legs, `f` shoes, `a` hat, `r` beard, `y` trim (tie, collar, belt), `w` white (shirt), `x` carried thing, `ø` **plate-carrier cloth**. Fixed colours (`FIXED` L100): `e`/`k` ink `0x14151c`, `b` the hair's darkest, `g` gold, `l` lens glint, `m` frame, `z` the skin's darkest, `V` a lit phone screen, `q`/`Q` blood. **An upper-case role letter is forced into shade.**
- **Bodies** are built in code per top kind (`torsoFront` L778: tee, suit, coat, dress, robe, **uniform** with belt and gold buttons, sweater), with `armFront` (L837: reach −1/0/1, 'up', umbrella, phone), `legsFront` (L863: stand, step, sit), `torsoSide` (L872), `armSide` (L889: swing −2..2 plus fight shapes), and `legsSide` (L918: stand, fwd, back, lift, runfwd, runback, runlift, runtrail, sit, **kneel**, kneelup, kick, highkick, lowkick, knee, sweep; the far leg is upper-cased into shade).
- **`POSES`** (L947-983): per frame `{ bob, reach:[l,r], swing:[near,far], front, side:[near,far], lean, sit, over, legOver, armOver, head, phone }`. Examples: `walk0: bob 1, reach [1,−1], swing [−1,1], side ['fwd','back']`; `run0: bob 1, swing [−2,2], side ['runfwd','runback'], lean 1`. **Frames are poses of parts, not drawings of their own, so a new hat or coat animates for free.**
- **`compose(spec, dir, frame)`** (L985-1090): side view draws the far arm, far leg, near leg, torso, armour, near arm. Front and back views draw legs, torso, armour, arms. Then come the head, face, beard, hair (a cropped cut under a hat shows only at the temples, the user, 2026-11-03), glasses, blood and hood or hat. Each template is a new **part** (for inner lines and shadows) unless `same` (the face is painted on the head).

### 4.2 Shading by rule: `shade(cells, col)` (L1378-1418)
- Each role colour gets a **ramp** from `RAMPS` (L80-92): its palette neighbours give `dark` (−2), `shade` (−1), `base` and `light` (+1). There is an olive-drab ramp `[0x14151c, 0x2b3020, 0x3d4530, 0x545e40, 0x6f7a55, 0x919b72]` "a soldier's, a plate carrier's".
- Tone rules: upper case → shade. A pixel just under a higher-numbered part → shade ("in its shadow"). A pixel on the right or bottom edge of its own role-and-part → shade. A top edge → light. **An edge lying over an earlier part → the role's darkest** (an inner line, softer than the outline).
- Held-weapon roles (`v` steel, `n` dark grip, `o` wood, `d` green glass, `j` brick, `i` yellow, `u` black) keep their base colour "or it'd vanish into a coat".
- **Outline**: ink on every empty 4-neighbour of the silhouette.

### 4.3 What's in the hand, and guns
- `HELD` (L1094-1106) holds one-pixel-wide shapes: penknife, boxcutter, switchblade, kitchen, finka, combat knife, screwdriver, bottle, broken bottle, brick, hammer, spanner, pipe, crowbar, stick, umbrella, shovel, bike lock, chain, **pistol** (`'nnnn'` plus a grip), **rifle** (`'nnnnnnnnnn'` plus stock, grip and magazine). `HOLD` (L1124) gives the direction per fight frame. `heldIcon(kind)` (L1133) is also used for the inventory's icons.
- **Gun rigs** (L1160-1356, the user, 2026-11-03). Carried at the **low ready** in the street frames; aimed straight, high or low; fired with **kick**.
  - `AIM_TILT = { pistol: 0.42, rifle: 0.28 }` rad, `KICK_TILT = { pistol: 0.3, rifle: 0.14 }`, `CARRY_TILT = { pistol: 0.8, rifle: 0.6 }` (L1167).
  - **Side on** (`SIDE_RIG` L1215-1237), each part is a shape `[along, across]` turned about a pivot by `turned()` (L1182: an inverse-mapped rotation so a turned line "steps cleanly and never breaks up"). The **pistol** is held at arm's length in both hands, `at [10,20]`, `armK 0.5` (the wrists take half the turn so a high aim keeps the hands under the chin), reach 6 aimed and 4 carried, muzzle `[7,−1]`. The **rifle** is shouldered and turns as one piece about the butt, `at [9,19]`, `armK 1`, muzzle `[16,0]`. Its parts are stock, receiver, handguard, barrel, front sight, a magazine curving forward, and a lit receiver top; the far hand sits under the handguard.
  - **From the front** (`frontRig` L1268): hands together before the chest, the muzzle at you as a **ring of steel round a black bore** (a long gun's at the right cheek). Carried: a handgun low before the belt, muzzle down; a long gun across the body, butt at the right shoulder, muzzle at the left knee.
  - **From behind** (`backRig` L1305): the arms up along the jaw into the head's shadow, a long gun's barrel up past the head on the right.
  - **Muzzle flash** (`FLASH` L1330-1333): white-hot `0xf6f4ee`, then yellow `0xf8e08a`, then an orange tip `0xe7b84a`. A forward burst with prongs side on, a star front and back. It is not part of the sheet: `flashOf(gun, dir, frame)` (L1340) returns pixels and offset, and the crowd draws it as its own unlit instanced card.
- **Plate carrier** (`carrier()` L827-833, spec.armour `{ color, patch }`): the slab from collarbones to belt, shoulder straps, three pouches, a patch strip (police). From behind: the back plate and drag handle. Side on: the plates a pixel proud. A soft vest under the top isn't drawn.
- **Blood worn** (`BLOOD` L103-106): under the nose and down the chin, spots down the front.
- **Paper target** (`paperFrame` L1432): a stand, a cardboard backer, a chest silhouette or bull, rings, and **holes plotted from cm** (`PAPER_PX 1.2` px a ring).
- `spritePerson(spec)` (L1553), the samples' single-sprite version: one card with a canvas texture of the whole sheet, an ink blob shadow (`CircleGeometry(0.42)`, opacity 0.4, scaled 0.6 in z), and `pose(state, t)` picking direction by a 90° sector of `turn.rotation.y`.
- `drawSprite(w, h, layers, col)` (L1500) is the same shading for any prop. `card(canvas, { ox, frames })` (L1528) is an upright animated card whose shadow is its silhouette.

### 4.4 The finer people (samples only): `samples/lib/finepeople.js`
- `CELL [24, 40]`, a 12 × 12 head, 2 × 2 eyes with a glint, brows, nose shadow, cheeks, mouth and a blink.
- **Six hue-shifted tones** per colour, and a **selective outline** (top and left in the part's own darkest tone, bottom and right in a warm near-black).
- **Limbs drawn as capsules between joints**, "so the in-between frames cost nothing: an 8-frame walk, a 6-frame run, a breathing idle". `FPS = { idle: 3, walk: 10, run: 12 }`.
- The user **preferred the chibi figures** in the game (2026-10-26). But the joint-capsule approach is the cheapest route to many new poses (reloads, prone, kneeling aim), and it is how OLYMPUS could add frames without drawing them.

### 4.5 No skeletal or MoCap animation in the game
MPFB bodies, Mixamo clips and CMU BVH appear **only in samples 000–004**, under the realistic look. The tools exist: `tools/blender/person.py` (MPFB to glTF, gltf-transform optimise, 13 MB → 0.9 MB), `animlib.py` (a Mixamo library fitted once to MPFB's mixamo rig, with pose checks), `retarget.py` (the rest-pose swing and world-delta transfer `wanted = [clip·clipRest⁻¹]·personRef`, hip travel scaled by thigh + shin), `kit.py` (window, door, shop and stair pieces with glTF extras `opening`, `sill`, `kind`), and `mpfb_packs.py`. The CMU walk scored "about 60/100" with the user even after fixes. The game's people are **2D templates, 8 fps, 4 facings**.

---

## 5. The crowd: `src/render/crowd.js` (293 lines; depends on `sprites.js` and `pixelart.js` only)

This renders everyone on the map in one draw.
- **Atlas** (L43, L98-105): `ATLAS_PX = 4096`, a `THREE.DataTexture(null, 4096, 4096)` with `source.dataReady = false`. It is **allocated on the GPU, never sent whole**. Each person's sheet goes into a slot by `renderer.copyTextureToTexture()` (a `texSubImage2D` of about half a megabyte). Before this, a 64 MB canvas was re-sent whenever a new face came into view: almost a second on Windows (ANGLE over D3D11), the user, 2026-10-29.
- **Layout**: `BANDS = 3` bands of `PER = ceil(38/3) = 13` frames across × 4 facings, so `SW = 28·13 = 364`, `SH = 34·4·3 = 408`. That gives `COLS = 11`, `ROWS = 10`, **`SLOTS = 110` people**. LRU: a full atlas reuses the slot unseen longest.
- **Budget**: `SHEETS_PER_FRAME = 2`, `SHEET_MS = 1.5` (a second new face only while the first took under 1.5 ms). The player's own figure is never deferred.
- **Lazy frames**: a new face gets only the `STREET` frames (idle, walk, run, sit, reel, hail, phone). The fight frames are painted the first time they fight ("over half the work spared"), and the gun frames only when armed.
- **One `InstancedMesh`** of an upright card, `MAX_PEOPLE = 160`. Per instance: matrix, `aCell` (the frame's top-left in atlas pixels) and `aTint` (the light where they stand, linear RGB from `sim/light.js` lightAt). The fragment shader discards below alpha 0.5 and outputs `rgb·tint`. A matching **ID material** puts every sprite in the ID pass as one part cut to its shape, "so a building's sill drew a line through heads" no longer.
- **Blobs**: a second instanced mesh, an ink ellipse at opacity 0.4, `noId`.
- **Flashes**: a third instanced mesh (`MAX_FLASHES = 24`) of cards from a strip texture of every gun × facing × fire frame, placed at the muzzle, nudged 0.15 m along the camera's line (back behind the head from behind), unlit, `renderOrder 2`, no depth write. The fragment shader picks the texel an edge begins on, to avoid smearing.
- **Frames follow the sim, not a clock**: `walk${floor(stride / 0.16) % 4}` and `run${floor(stride / 0.45) % 4}` (`STEP_M`, L50), so feet never slide. Idle frames run on time at 2 fps with a per-person phase.
- **Postures without frames**: a sitter's card is lifted to the seat (`SEAT { y: 0.24, z: −0.2 }`). A crouch or a slump is the `sit` frame on the ground. **Someone down is the card turned 90° on its side** (`DOWN { y: 0.35, x: 0.9 }`), head away from what they faced; crawling slides the same card. The screenshot `tradecraft-gun-fired-closeup.png` shows it.
- **`gunPose(a, ms)`** (L87-96) reads runtime marks `$aim {x,z,ms}` and `$shot ms`. It turns the aim up or down when off the facing by more than `TURN_RAD { side: 0.2, front: 0.35 }`, holds the first `RAISE_MS 120` a turn lower (the gun coming up), and applies `KICK_MS 140`, `AFTER_MS 600` (arms kept up) and `FLASH_MS 70`. The view lights anyone within `FLASH_LIT_M 3` m by `FLASH_LIGHT (1.0, 0.85, 0.55)`. Everything runs on the sim's clock, so a stopped clock (shooting's "time stands still") holds the frame.
- Positions are snapped to 1/16 m (`snap()`).

---

## 6. The close-up figure: `src/art/doll.js` (903 lines; imports `SKIN` and `heldIcon` from sprites, `sizeOf` from `sim/weapons.js`)

This is the figure on the inventory (I), the character sheet (C), and first aid's and the read's body cards.
- **`W = 64, H = 140`** (L48), drawn "at half the size of the picture's pixels" (so on screen it is twice as fine as the world). It has a real proportion, "six and a half heads tall", and `PX_PER_CM = 0.72` (175 cm over 126 rows), so held things are drawn **to their real length**. Rows: `WAIST_Y 52, BELT_Y 58, CROTCH_Y 72, KNEE_Y 101, ANKLE_Y 124, FLOOR_Y 132` (L54).
- **How it is drawn** (header L7-12): "As a pixel artist would, in shapes and clusters, not by a formula across every row (shading each span like a cylinder is what made its first arms and legs look turned on a lathe)."
  - Each part is a **polygon scan-converted** to spans (`scan()` L91), its contour placed by hand and **smoothed by Catmull-Rom** (`smooth()` L105).
  - Light and shadow are **shapes within the part** (`g.on()`). Folds use `ribbon()` (L117: a tapering stroke).
  - Each colour has **five tones**: `cloth(c)` (L62: light, soft, base, shade, deep; dark cloth is lifted 13% toward grey "or black reads as a hole") and `flesh(c)` (L68: warm shadows toward `0x6b2f2a`, not grey).
  - The figure stands **easy, weight on the viewer's left leg**, so it isn't a mirror image. A part laid over an earlier one gets a dark seam, and ink goes round the lot.
- **What's worn**: open tops (coat, suit, jacket: `CUT` L217-221 with hem, ease, flare, front-edge contour) show the shirt, tie, belt, the pockets on the skirts and the inside pocket. Closed tops (tee, jumper) and dresses are also drawn. Hair, hat, glasses, beard and skin come from the **same spec as the sprite**.
- **Pockets as marks**: 'free' (seam only), 'used' (a gold bag under the lip), 'shows' (rust; the cloth swells on a bare hip).
- **Plate carrier** (`carrier()` L639): cut for the arms, straps, cummerbund, three pouches, a patch.
- **Wounds** (the user, 2026-11-03, L32-44, `wounds()` L765): blood in four tones (`BL` L689: `0xe0574a 0xb3282c 0x6b1a20 0x3a0c12`). Soaked stains are ragged at the edge; fresh bleeding drips; a bullet entry is a dark hole with a wet rim and a glint; a hole a vest stopped shows grey lead and frayed cover; cuts, gashes, an artery spurting, a bruise, a break shown as a jag. Treatments: a **dressing** (a taped pad, or turns round a limb), a **tourniquet** (strap and buckle high on the limb, `TOURNIQUET_Y { arm: 37, leg: 65 }`), a **splint** (two staves outside the line, tied in three places, `SPLINT_Y`), and internal bleeding as a dashed ring round the belly. `rows.spots` gives each numbered wound's position for its plaque.
- **Backdrop** (L843): a flat wall `0x383c4a`, floor `0x2b2e3a`, and the figure's shadow ellipse `0x1f2029` thrown a little right.

For OLYMPUS this is the template for the **soldier close-up**: kit on the body (plates, pouches, magazines, hydration, radio), wounds and field dressings, and a vac suit. It ties directly to the user's ask for medical aid and healing.

---

## 7. Buildings, streets and props: `src/art/pixeltown.js` (2312 lines; depends on `pixelart.js` and three's `mergeGeometries`)

- **Principle** (header L3-9): "Flat things are painted, things that stand out are boxes." The street's ground is **one painted texture per section** (`streetSteps` L901: pavements, kerbs, asphalt, lane marks, a zebra, drains, a manhole, cracks, tree pits). A building is a box with a **painted façade**. Whatever projects (an awning, a hanging sign) is its own box and casts a shadow.
- **`painter(px, wM, hM, seed, night, wall, split)`** (L52) gives per-surface tools in metres with y up: `rect, window, door, shopfront, sign, cornice, bricks, plaster, arch, concrete, weathered, ashlar, official` (police and hospital glass), bevels, and dirt streaks under sills. **`split`** draws the lit windows from their own random stream, so day and night faces are identical apart from the lights.
- **`facadeSteps`** (L1281) is a generator: the wall, then a yield, then the ops a few at a time (`runSteps`, `OPS_PER_STEP = 6` in town.js). The night face is painted later, a step at a time.
- **`building({...})`** (L1322): `box(w, h, d, { front: painted, sides: tile, top: roof colour })`, a parapet, and roof kit (`ac`, `pots`, `dishes/tanks/pigeons/rebar/solar`, `chimneys`, `hut`, `antenna`) or a pitched roof. `userData.body.material[4]` is the front, swapped at dusk.
- **`keep(key, make)`** (L1310): materials shared by make, flagged `keep` so freeing a section leaves them. **`compact(g, except)`** (L1540) merges a prop's plain single-colour parts into one mesh per colour: "a lamp of nine boxes draws as two or three" (a quarter fewer draw calls).
- **Makes**: six lamps (lantern, crook, twin, modern, globe, torch; lit heads are `glow` materials, `userData.heads`), five railings (painted on a thin box with alpha-tested gaps, pattern laid from world x so pieces meet), benches, bins, café tables and chairs, cars (`CARS`, a taxi, livery), buses, hedges, phone boxes, shelters, notice boards, Belisha beacons, pub signs (emblems), carts, stalls, souk stalls, minarets, generators, slung cables.
- **`cell(i, j, s)`** (L955) is a world-position hash, so a slab's tone is the same across sections. Patterns repeat in whole periods of the section's 720 px (45 m).
- **Signs that flip into English** (`signFlips` L1431, the user, 2026-11-03): 8 frames of a dithered wipe, painted once per sign, one new sign a frame.

**`src/art/townsprites.js`** (464 lines): trees and street props as **pixel-art cards**.
- `foliage(w, h, clumps, seed, palette)` (L45) draws overlapping leaf clumps back to front, each shaded round from the upper left: `t = (−dx·0.55 − dy·0.83)/r`, minus a top-to-bottom darkening, plus leafy noise, with a lit rim over the clump behind and shade under the rim, quantised into the 6-tone `LEAF` ramp.
- `SPECIES` (L102) covers lime, maple, birch, poplar, oak, spruce, plane, chestnut, cherry, ficus, flame, jacaranda, eucalyptus, pine, olive, palm, royal, fan. `leafState(species, month)` sets the season. Bare crowns are grown by space colonisation with a twig-haze dither.
- `propCard(name)` (L443): potted shrub, post boxes, a chalkboard, a bistro set, bicycle, scooter, a pigeon (2 frames), reeds.

**`src/render/town.js`** (474 lines): `buildSection(S, { month, night })` is a generator returning `{ group, fronts, heads, sprites, dispose }`.
- It builds the ground a layer at a time, fronts a few ops at a time, and furniture a few pieces at a time, with "no step over ~6 ms on a machine six times slower than an ordinary one, 2026-11-04".
- Sections are **45 m** (`SECTION_M`) and ground tiles repeat every 1, 3 or 3.75 m, so they join seamlessly.
- **See-through cards**: a tree or post box in front of the player discards a checkerboard of its pixels (`seeThrough()` L45), "as pixel art shows something behind".

---

## 8. Interiors and the cutaway

### 8.1 `src/render/interior.js` (198 lines): the dollhouse
Header L4-11: "The cutaway, as a dollhouse is seen from above".
- **Floors** (`floorMat` L24-68): repeating 1 m textures: straight parquet in staggered boards, herringbone, planks, carpet, lino, chequered lino, small white tiles with grout, terrazzo chips, patterned cement tiles (quatrefoils), and a range's sealed concrete ("a soft mottle, no seam").
- **The back (north) wall** stands to the ceiling (`WALL_H = 2.8` m, `src/sim/interiors/plan.js:23`). It is painted room by room with `finish()` (L72: paint, stripes, damask or flowers, a skirting) and a cornice. Its windows onto the courtyard, the front door, and **what hangs there** are painted on (`hang()` L89: carpets, notice boards, wanted posters, range rules, lane numbers, clocks, calendars, mirrors, landscape pictures).
- **Side walls** stand to the ceiling, seen edge-on. **Every other wall is cut to `CUT_H = 1.0` m**: its top in the dark cut colour `0x3a3f4b`, its face painted as the room in front of it, so the room behind shows.
- Wall thickness: `WALL_T 0.16`, `OUTER_T 0.3`. Thresholds go in doorways. Plan marks (a range's firing line, its distance lines) lie flat on the floor. Around everything is the dark (`0x14151c`).
- Furniture comes from `furniture()`.
- The camera in a flat (`src/render/view.js:437-439`): x is the plan's centre, z is `plan.z0 + INTERIOR_CAM_M (3.2)`, held still. In the dojo, the near wall is cut to a sill.
- Light indoors comes from `indoors(S, mood)` (`src/sim/light.js:101-112`): lamps lit whatever the hour (glow 0.75), a warm fill, and the windows adding a little sky by day. Moods: warm, soft, cool (a kitchen tube).

### 8.2 `src/render/cutaway.js` (56 lines): the shop you're in, opened up
- The view hides the building's body and whatever overhangs the shop (pipes, ivy, parapet, awnings, signs). `buildCut(S, b, u, body)` rebuilds it with **a slot the shop's width, from the pavement to the roof and back to the shop's back wall**.
- Either side, the building stands as it was, its façade the same pixels (the UVs are remapped to the façade's stretch).
- Down the slot is the shop's floor plan (`drawPlan(..., { inset: true })`). The cut faces are **hatched as a section drawing**: an 8×8 diagonal hatch, `CUT 0x3a3f4b` / `LINE 0x4a4f5c`. Each floor above is marked by a slab edge every `STOREY_M = WALL_H + 0.3 = 3.1` m (`SLAB 0x6a7182`).
- In the view, rain stops falling over the roof rect, and the floor rect is dry (`wxRoof`, `wxDry`).
- Screenshots: `tradecraft-shop-cutaway.png` and `-night.png` (a bakery: a counter, a display case and bread racks, a shopkeeper, the slot through a four-storey façade).

### 8.3 `src/art/furniture.js` (1700 lines; imports `pixelart`, `keep` from pixeltown, and `FURNITURE` footprints from `sim/interiors/furniture.js`)
Header L1-56, a model to copy:
- "A piece is a few boxes with painted faces, measured in pixels". **Every box edge falls on whole pixels and the piece stands on the pixel grid** (x, z rounded to 1/16 m), so a face's texture painted to its exact size puts one texel on one screen pixel. "A box an odd number of pixels wide, centred on the grid, would have its texels astride two and smear."
- "The camera looks north and 45° down, so what reads is the **top and the south (+z) face** of each box: that's where the detail goes … painted rather than modelled." Sides and the backs of freestanding pieces are painted too, for turned pieces. Chairs are **mirrored rather than turned** to stay on the grid.
- **Parts for outlines**: a sofa's frame and each cushion, a bed's frame, bedding and pillows, a table and each chair.
- **THIN** materials (L110: transparent, no depth write, no ID) keep thin things (brass poles, ropes, chrome rails) their colour, because the outline pass inks anything under 3 px across in front of something far. **GLASS** (L105: toon, opacity 0.22, `renderOrder 2`) is outlined with its part, so a display case reads as one box with goods inside.
- **`kit()`** (L154-195) API: `comp()` starts a part with `box(w,h,d,faces,x,y,z)` in **pixels**, `round()`, `glass()`, `thin()`, `beam(a,b,t,colour)`, then `done()` compacts and numbers the parts.
- Textures: `tex(key, w, h, draw, { lit, glows })` is made once a key, seeded by the key. `rep(key, n, draw)` is a repeating fabric.
- Painting helpers: `bevel`, `sunk`, `grain`, `cloth`, `oval`, `cabinet(rows, handle, plinth)`, `GOODS` on shelves (groceries, books, boxes, shoes, bottles, phones, tins) and `shelfFront`.
- **67 kinds** (`MAKERS` L1665): bed, single bed, bedside table, wardrobe, drawers, sofa, armchair, coffee table, TV, bookshelf, dining table, chair, desk, rug, counter, sink, cooker, fridge, kitchen shelf, **bathtub, toilet, washbasin**, radiator, floor lamp, plant, phone table, coat rack, shoe rack, stairs, mailboxes, lift door, shelving, gondola, shop counter, checkout, drinks fridge, chest freezer, baskets, crates, cartons, pallet, clothes rail, fitting room, mirror, display case, bread rack, deck oven, work table, café counter, bar, bar shelf, bar stool, window bar, restaurant table, range (cooker), steel sink, flower buckets, bank counter, office desk, office chair, filing cabinet, security desk, **metal detector, X-ray**, stanchions, flag, waiting chairs, **vault door**, water cooler, and a **shooting range's booth divider, range bench and bullet trap** (L1607-1650).
- **Lit pieces**: a lamp's shade, a TV, a monitor, fridges and a till are painted `glow`. Signs, ovens' fires and a back bar's strip are GLOWS colours. A lamp that's on reports `userData.light` for the view to give it a pool. The phone table exposes `userData.phone` to shake as it rings.
- Footprints and semantics (`block`, `wall`, `use: 'sleep'|'store'…`, `seats`) live in the sim (`src/sim/interiors/furniture.js`, e.g. `bed: { w: 1.6, d: 2.1, h: 1.0, use: 'sleep' }`). The art only draws.

---

## 9. Light, day and night, weather in the view: `src/render/view.js` (710 lines) and `src/sim/light.js` (143 lines)

- **One helper for what the scene shows and what the dice read** (light.js header): the renderer only copies `sky()`'s numbers into three.js, and the same `lightLevel()` is what checks read ("So what you see is what's rolled").
- **The sun** (`sun()` L28-44): NOAA short solar-position formulas from the city's latitude, longitude and UTC offset (Moscow 55.75° N, 37.62° E).
- **Keyframes by elevation** (L46-52), each `sun` colour, `sunK`, `sky`, `ground`, `skyK` and sprite `tint`:
  - 18° day `0xfff2dc` 0.79 / sky `0xdde6ff` 0.6
  - 7° golden `0xffe2b4` 0.74
  - 0.5° sunset `0xffb685` 0.48, tint `[0.76, 0.66, 0.6]`
  - −4° blue hour, the moon `0x95c1e3` 0.16 / sky `0x6a8fc4` 0.32
  - −9° night, sky `0x5d8fc2` 0.26, tint `[0.061, 0.118, 0.193]`
- `glow = clamp((2 − elev)/5)` (windows and lamps on from 2° above to 3° below the horizon). `shadow = clamp(elev/4)`.
- **Cloud**: sun × (1 − 0.7·cloud), sky × (1 + 0.9·cloud), colours 60% toward grey, tint − 0.12·cloud − 0.05 a level of what falls.
- **The sun's direction on screen stays the art's (upper left)**: "sprites are shaded that way, and a sun swinging round them would contradict their drawing". Height, colour and strength move.
- `lightAt(lamps, x, z, ms)` (L124) is the open-air tint plus lamp pools (core to r, ring to 1.5 r, × glow). `LAMP = { r: 2.0, color: 0xe7b84a, core: 0.5, ring: 0.2 }`. `lightBand`: day ≥ 0.6, dim ≥ 0.25, otherwise dark.
- **The view's frame** (`frame()` L407-578), in order: cutaway check; sky; interpolated positions (jumps over `JUMP_M 1.5` aren't glided); camera on the focus with lean (`LEAD_M walk [1, 2.5]`, `look [1.5, 8]` m, eased `LEAD_S 0.35` s, clamped to `SCREEN_HALF_M [24, 22]`) and the **fight jolt** (1–3 px for `SHAKE_TICKS 4`); building sections within `BUILD_MS 6` (what's on screen whole); building ahead (`AHEAD_M 15` from a lane's end); lights; night faces (`NIGHT_MS 2` a frame); **per-building dusk** (lights come on house by house); lamp slots; weather; sprite tints; **fog of awareness** (L307-396: `FOG_N [96, 128]` cells of `FOG_CELL_M 0.5` m = 48 × 64 m, an RG8 `DataTexture`; visibility from `sim/perception.js` recomputed only when the eyes move or turn, light once a game second; ease in `0.08` s, out `0.4` s, felt `1.1` s; a building takes its walls' feet; `dimK = 0.18 + 0.3·air`); people as remembered (frozen where last seen, in the dimmed street); crowd, blood, prints, traffic, tape, items; `stage.render()`.
- **Lamp slots** (L237-244): `LAMP_SLOTS = 10` spotlight pairs moved to the nearest lamps each frame, "so the scene's light count never changes (no shader rebuilds)". Shops' lamps only light inside the shop you're in.
- **Shadows** (L250-257): `shadowMap.autoUpdate = false`. The shadow camera follows in steps of `SHADOW_STEP` (an even number of texels, about 2 m). "Nothing that moves casts a sun shadow (people have blobs)", so the map is redrawn only when the step changes or a section comes or goes. This was two thirds of the draw calls: 962 down to 333.
- **Weather drawn** (L581-624, from `sim/weather.js weatherAt()`):
  - `FALL = { rain: [0, .25, .6, 1], snow: [0, .3, .65, 1], dust: [0, 0, .5, 1] }` by level
  - `SPLASH [0, .15, .4, .7]`
  - `HAZE`, e.g. `fog: [0, .45, .7, .85]`, `dust: [0, .35, .6, .8]`
  - `SLANT` px/px by wind
  - haze colours by day (dust `[0.78, 0.64, 0.44]`, fog `[0.72, 0.74, 0.77]`) blending to night (`[0.13, 0.15, 0.21]`), out to `sightM(w)`
  - halos where the air is wet (radius `8 + 16·haze` px)
  - "Nothing on a map indoors"
  - falls loop every 10 minutes (`FALL_LOOP_MS`) to keep GPU numbers small
- **Other decals** (one instanced draw each): `blood.js` (spatters a pixel each, seeded, drying darker), `items.js` (things lying about as pixel templates "drawn bigger than life": a penknife 7 px, a pipe 14), `prints.js` (footprints in snow, a ring buffer, `STEP_M`, fade), `tape.js` (police tape, glowing a little), `traffic.js` (cars built per make, lights at night via emissive copies).

---

## 10. The render loop and performance

- **Stack**: vanilla ES modules, no build step, an import map to the **vendored three.js 0.186.1** (`index.html`, `vendor/three/`, 2.4 MB; `tools/vendor-three.mjs` copies the core plus `GLTFLoader`, `HDRLoader`, `meshopt_decoder`, and the add-ons actually used by the game, `RoundedBoxGeometry` and `BufferGeometryUtils`). "The game loads nothing from `node_modules`." It is WebGL through three.js, not Canvas2D (Canvas2D is used only to compose textures), and not hand-written WebGL like longhaul's (DESIGN.md Stack: "A departure from longhaul's hand-written WebGL2, made for skinned characters, glTF, shadows and post-processing").
- **The main loop** (`src/main.js:466-489`): `requestAnimationFrame`. A fixed-tick sim (`TICK_MS` 50 ms, 20 Hz) accumulates real time while nothing is open. The view draws every frame, **interpolating between the last two ticks** (`alpha`). `window.__ready` is set after 3 frames, for screenshots.
- **Measured today** (my probe sets `renderer.info.autoReset = false` across one rAF; numbers include the colour pass, ID pass, post and blit):

| Scene | Draw calls / frame | Triangles | Meshes | Textures | Programs | Frame (median / p95) |
|---|---|---|---|---|---|---|
| Moscow street, noon, 79 actors | **395** | 3,500 | 471 (6 instanced) | 92 | 24 | 16.7 / 18.3 ms (vsync) |
| Moscow street, 22:00 | 395 | 3,280 | 458 | 128 | 26 | 16.8 / 17.9 ms |
| London, heavy rain, 21:00 | 522 | 5,524 | 561 | 67 | 25 | 16.7 / 18.1 ms |
| The range (interior) | 490 | 3,048 | 96 | 51 | 16 | 16.7 / 17.9 ms |
| The campaign flat (furnished) | **821** | 7,256 | 161 | 144 | 18 | 16.6 / 18.0 ms |

  The view's own CPU time (`view.stats.frame`) is **about 2.3–3.4 ms** a frame, of which `render` is 2.2–3.0 ms. The worst frame (`stats.max.frame`) is the first compile: 75–85 ms, and 1.4 s on the very first run. The CHANGELOG reports, from the performance pass on a 6× throttled CPU: the worst frame running in Moscow went from 133 ms to 50; walking holds 60 fps with p99 16.8 ms; arriving on a new street takes 50–60 ms instead of half a second; the sim costs 0.13–0.36 ms a tick.
- **Why 400–800 calls with so few triangles**: every multi-material `box()` is up to 6 draw calls (one per face group), and the **ID pass doubles every opaque mesh**. The interior flat is the worst, because furniture is many small multi-face boxes. Draw calls, not fill, are the cost to watch (on Windows ANGLE/D3D11 especially).
- **No dirty rects.** The whole 640 × 360 picture is redrawn every frame, and the post shader runs on 230 k pixels. **Caching** is the strategy:
  - textures per make (`keep()`)
  - `tone()` memo
  - emissive maps in a WeakMap, from glow runs
  - looks per passer-by seed (600 LRU)
  - the sprite atlas LRU (110 slots)
  - shader programs warmed at build (`renderer.compile(group, camera, scene)`)
  - the previous street freed only after the next is drawn, so shared shaders aren't recompiled (`dying`, 60 ms otherwise)
  - generators spreading every costly build over frames
- **Windows lessons** (PIPELINE 2026-10-29; CHANGELOG): headless Chrome on a Mac hides upload stalls. **Count what goes to the GPU** (wrap `texImage2D`, `texSubImage2D`, `linkProgram`) and treat any big upload or mid-game compile as a Windows hitch.
- **Debug and measure**: `window.__tradecraft = { state, view (stats), step(n), start(state|JSON), newGame(opts), save(), pause(), skip(ms), autosave }`. URL parameters: `?play=<scenario>&seed=&hour=&city=&weather=&autoplay&armour=`.

---

## 11. Licences and provenance (PIPELINE.md, CREDITS.md, tools)

- **How a tool gets picked** (PIPELINE L5-13): (1) real before generated (CC0 libraries first); (2) **a script, never a hand edit**; (3) the least restrictive licence; (4) local before hosted (Hugging Face metered at $0.10 a month free, 2026-10-25); (5) every shipped asset says where it came from.
- **Ships only if** CC0, CC-BY (credited in `CREDITS.md` in the same change), or made by an allowed image model. Models (read 2026-10-25):
  - Z-Image-Turbo (Apache-2.0, ships)
  - FLUX.2 klein 4B (Apache, ships)
  - FLUX.2 klein 9B / FLUX.1 dev (FLUX Non-Commercial, hobby use: ships)
  - Krea 2 Turbo (Community licence: ships, needs a content filter)
  - Ideogram 4 (Non-Commercial hobby; "no real military or surveillance use (art for a spy fiction isn't that)": ships). For OLYMPUS, a military fiction, re-read this clause.
  - Qwen-Image 2.1 (**samples only**)
  - anything else: read it first
- **Provenance sidecars**: people get `<name>.credits.json`; generated images get `<name>.gen.json` (model, licence class, full command, prompt, seed, steps, size, quantisation, mflux version, date: written by `tools/gen.sh`); library assets get `<id>.source.json` (written by `tools/fetch-asset.mjs`).
- **Mixamo** FBX never enters the repo: games may use it, not redistribute it. **CMU** mocap is acknowledged in CREDITS. **Poly Haven and ambientCG** are CC0, and calls carry a recognisable User-Agent.
- **Secrets**: the HF token lives in `~/.cache/huggingface/token`, never in the repo and never printed. `ref/` (commercial screenshots) is gitignored.
- `tools/gen.sh` runs mflux from a **saved 8-bit copy** of each model (`~/Library/Caches/tradecraft/models/`). Z-Image-Turbo peaked at 25 GB loading full precision on the 24 GB Mac; the saved copy uses 7.5 GB and takes 32 s at 1216 × 832. Image models garble text (send words to Ideogram) and **don't draw cutaways ("that's the 3D renderer's job")**.
- **For the pixel look none of this binds**: no third-party art ships. three.js (MIT) is the only third-party code in the game.

---

## 12. The screenshots (tradecraft working tree, served read-only on :8791, headless Chrome with ANGLE Metal, 1600 × 1000 unless noted)

**Style common to all in-game shots**:
- **Palette**: muted, warm-leaning greys, ochres and brick reds by day. A strong cool-violet blue-black at night, with yellow `0xf8e08a` glows.
- **Line weight**: a 1 px near-black ink outline round every sprite and object silhouette, softer 1 px inner lines between touching parts.
- **Pixel density**: the picture is 640 × 400 at 1600 × 1000 (2.5×, sharp-bilinear) and 640 × 360 at 1280 × 720 (2×). People are about 28 px tall, so about 70 screen px at 2.5×.
- **The fog of awareness** dims everything the character doesn't see: a greyed, dithered vignette around a lit cone, with the dark edge drawn in a 4×4 Bayer dither.
- **The HUD**: "dark glass" panels (`rgba(20,21,28,0.78)`) in a system monospace (`ui-monospace, SF Mono, Menlo`): the watch at the top right (large time digits, date, place, sky in Courier), log lines at the top left with a coloured left border, the instinct line at the bottom centre in italics, and "? keys" at the bottom right.
- **In-picture labels** (plaques) use the **3×5 pixel font**.

| File | What it shows |
|---|---|
| `tradecraft-title.png` | The title as a **typed paper sheet** (`#f4efe6`) on a dark radial vignette. Letter-spaced bold Courier "TRADECRAFT", the version, dashed rules, menu items (a brass left bar marks the campaign), city buttons. "Papers, Please-cold". |
| `tradecraft-walk-moscow-day.png` | Noon, low cloud, wet. Façades in brick, ochre and pink plaster, weathered and fallen away to brick. Cyrillic shop fascias (ХЛЕБ, ОДЕЖДА). An arch with a gate, a poster (ЦИРК), a bus stop (ОСТАНОВКА 31), twin lamps, a parked car, a zebra in faded paint, bare trees as twig-haze cards, railing. Four chibi people on the pavement. The fog cone lights the pavement in front of the player and dims the rest. |
| `tradecraft-walk-moscow-dusk.png` | 16:12, broken cloud: warmer, lower light. Signs flipped into English (BAKERY, SHOOTING RANGE). |
| `tradecraft-walk-moscow-night.png` | 22:00, clear. Near-black street, a few lit windows (`0xe7b84a`), a hard two-ring lamp pool on the road, a green façade, the unseen street almost black. |
| `tradecraft-walk-day-1280.png`, `-day-closeup.png`, `-night-closeup.png` | 2× scale crops: the player (dark coat, bun), a passer-by in a cap, a bearded man in green. The 'F' interact keycap plaque, granite pavement flags bevelled one by one, moss specks, a drain. At night the same pavement in cold blue-grey with the lamp's orange pool to the right. |
| `tradecraft-walk-london-day.png` | London: red brick mansion block (ELGIN MANSIONS in the pixel font), stucco terraces with areas and black railings, a black cab and white van in bays, a zebra with zigzags, LOOK RIGHT, Belisha beacons (amber), York stone flags, plane trees. |
| `tradecraft-walk-cairo-dust.png` | Cairo in a **heavy dust storm**: everything veiled toward a sandy haze, the visible cone clear. Arabic shop signs in the pixel script, terrazzo walk, a fruit cart, sand-coloured drift in the gutter. **This is the best existing proxy for a Martian dust storm.** |
| `tradecraft-walk-beirut-day.png` | Beirut: cables slung across the fronts, canvas-striped awnings, Arabic and French signs (BOUTIQUE, BUTCHER), balconies with plants, painted kerb. A "Too hot" log line. |
| `tradecraft-walk-snow-day.png` | Heavy snow: flakes of 1–2 px falling, snow lying on the pavement in drifts, the road in grey slush with wheel tracks darker, white roofs on cars, the haze veil. |
| `tradecraft-walk-rain-night.png` | London, heavy rain at night: streaks, halos round lamps, **puddles** on the road mirroring the sky and lamps in vertical streaks, wet darkened ground. |
| `tradecraft-charsheet.png` | Character sheet (C) on the **dark glass**. Header plaque "PERSONNEL REBECCA PRICE" in the pixel font with a brass icon. The **doll** (64 × 140) in an open charcoal coat, white shirt, belt, standing easy. Columns: ON YOU (status lines), FITNESS, CARRYING; WHAT YOU ARE (Tradecraft 38/100 bar, skills with level words, dots, multipliers and values); THE FILE. Amber uppercase headings `#e7b84a`. |
| `tradecraft-inventory.png` | Inventory (I): the doll with pockets marked (gold where used), pocket tiles with fill bars (coat pockets, inside pocket, trouser pockets, beltline), pixel icons (wallet, phone, SIG), buttons "Take out" and "Drop" with numeric keycaps, IN YOUR HAND, WORN. |
| `tradecraft-mind.png` | Tab: I expected the mind panel but the shot shows the street. In the free walk Tab may not open it, or the key didn't reach the page. |
| `tradecraft-gun-drawn.png`, `-gun-steps2.png`, `-gun-steps2-closeup.png` | Shooting mode (G): "Time stands still. SIG: one in the chamber, a magazine with 13 of 13, the hammer down (no safety: a decocker)." A **numbered list of gun steps** with their times (1 draw SIG · 1.4 s; 2 aim at the man in the grey coat · 0.9 s; 3 drop the magazine · 0.7 s; 4 magazine out, in a pocket · 2.0 s; 5 put it away · 1.8 s). A **pixel-font reticle plaque** "BODY 12 M CLICK AIM 1.0 S" over corner brackets round the target. "SIG out. Weapon handling 15 against 8 · passed". |
| `tradecraft-gun-aimed-closeup.png` | The player **aiming side on**: arms out at shoulder height, two-handed, the pistol a few dark pixels. The target bracketed in red, plaque "75% 7 M CLICK FIRE". |
| `tradecraft-gun-fired-closeup.png`, `-gun-after-closeup.png` | After the shot: the target's card **laid on its side** (down), the recoil line "The recoil, the muzzle coming down…", the step list now offering "decock: the hammer down". (The 70 ms flash was missed.) |
| `tradecraft-gun-fired-night-closeup.png` | The same at night: a lit bakery window behind, lamp pools, a near-black fog. |
| `tradecraft-range.png`, `-range-closeup.png` | The range's brief, a paper sheet with a red "SECRET" stamp over the dark room. |
| `tradecraft-range-lanes.png`, `-range-lanes-closeup.png`, `-range-gun.png` | **A Moscow "tir"** in cutaway. Desk and instructor, ear defenders on a hook, a rules board, numbered booths 1–5, lanes on sealed concrete with **paper targets on stands at 7, 15 and 25 m**, ceiling lamp pools as orange two-ring discs, a bullet trap at the far wall. A direct template for an MCRN range. |
| `tradecraft-campaign-flat.png`, `-campaign-flat-in.png` | The posting paper ("STATION MOSCOW"). Then the **flat as a dollhouse**: kitchen, hall with the front door (plaque "FRONT DOOR"), bathroom, living room, bedroom. Herringbone floors, a bed, lamps' pools, the officer standing by the bed. The instinct line "Your bed. T: a nap, a rest, or the night." **This is the "base to go back to" pattern OLYMPUS needs.** |
| `tradecraft-shop-cutaway.png`, `-shop-cutaway-night.png` | Inside a bakery: the **slot cut through the four-storey building**, its sides hatched, the shop's floor and counter seen down the slot, a shopkeeper behind the display case. At night the shop's lamp pool and the street dark round it. |
| `tradecraft-dojo-day.png` | The Farm's dojo (2007): a pale hall, high windows, a flag and a DEFENSIVE TACTICS sign, blue mats edged red, trainees in a line in grey PT kit, heavy bags. **PT and CQC training hall template.** At 19:00 the dojo throws (see section 14). |
| `tradecraft-sample006-sheet.png` | Sample 006's sprite sheet: 8 people × idle, walk and run frames in 4 facings at 480 × 270 base. Fedora and trench, suit and glasses, dress and bun, bald and beard, police cap, hard hat, long hair, beanie. |
| `tradecraft-sample007-sheet.png`, `-sample007-lineup.png` | Sample 007's **finer people** (24 × 40): faces with eyes and cheeks, six tones, a selective outline; front and side lineup on bevelled pavers. |
| `tradecraft-sample007-chibi-day.png`, `-closer-day.png`, `-closer-night.png` | **The picked look**: chibi people in the fine town at 640 × 360. A café awning, HOTEL and NEWS TOBACCO, ivy, a taxi, pigeons, a leafy tree, a policeman. At zoom 2: brick by brick, slab by slab. The night: hard amber lamp pools, lit shopfronts, cool violet shadows. |
| `tradecraft-sample008-home.png`, `-scene-day.png`, `-scene-night.png`, `-flat-closer.png` | **Furniture**: a labelled contact sheet of home pieces in the 3×5 font. A flat over a corner shop, a bakery and a café-bar. At zoom 2: bookshelves with coloured spines, a TV, a radiator, a herringbone and plank floor, a kitchen with blue units and hood, a chequered lino, a sofa with a rug, the back wall with its paint and skirting. The **night** version has a TV glowing, bedside lamps' pools, drinks fridges glowing, and an oven's fire. |
| `tradecraft-sample003-building-cut.png` | The abandoned **realistic** pipeline: a PBR building from the Blender kit with the cutaway 'cut' mode (walls to stubs, storeys), low-poly trees, an MPFB man. It shows what was rejected. |

---

## 13. Reuse assessment for OLYMPUS

OLYMPUS wants top-down pixel art for close-up play (Martian bases, ship interiors, habitats, vac suits, rifles, planetary surfaces), realism, and performance with as much background generation as possible. Tradecraft's art code is mostly pure, small and dependency-light (three.js only), and it was tuned with this same user. Verdicts:

| Module / system | Verdict | Why |
|---|---|---|
| `src/art/pixelart.js` `pixelStage` (camera, light calibration, ID/outline pass, fog, weather composite, grade, palette snap, sharp-bilinear blit, `size`, `dispose`) | **Reuse, lightly adapted** | The look's engine, user-approved ("camera angle 95/100"). Only three.js. Adapt: palette families for Mars, ship and military; maybe the picture size (open question on "high-resolution"); and a **3D LUT palette snap** instead of the 116-iteration loop if the picture grows to 960 × 540 (60 M distance evaluations a frame). Consider writing part IDs to a second colour attachment (WebGL2 MRT) to drop the separate ID pass, which halves the draw calls. |
| `paint/paintSteps/tile/FINE_TILES/tone/oklch/fromOklch/shiftHue/nearest/noise/tnoise/rng/box/roundedBox/ground/part/mat/vmat/glow/pool/emissiveOf/RAMP` | **Reuse as is** | Generic, tested, fast (typed-array painting, glow runs). The tile kinds need new members (regolith, basalt, deck plate, grating, rubber matting, anti-slip, hydroponic trays). |
| `WX` surface weather and composite falls | **Adapt** | Mars: **dust** (sideways streaks plus haze exist: Cairo shot), **dust lying** (reuse the snow-cover shader with a regolith colour), **CO₂/H₂O frost at dawn** (the rime veil exists), no rain. Europa and Ganymede: ice. Vacuum: no haze, no falls at all (a realism cue). Lamp reflections on wet ground could be re-themed as polished deck plating. |
| 3×5 pixel font `text()`, `textWidth()`; `arabic.js` | **Reuse font; skip Arabic** | Signs, stencils ("DECK 4", "MCRN"), plaques. Expanse signage is Latin plus Belter creole. Hull and stencil markings could use a 4×6 or 5×7 variant for readability. |
| `src/art/sprites.js` (templates, roles, ramps, shading rules, poses, gun rigs, carrier, flash, `drawSprite`, `card`) | **Adapt (core of the soldier sprites)** | It already has pistol and rifle carried/aimed/fired rigs, a plate carrier, blood, a kneel, an olive-drab ramp, a helmet hat. Needed: tops for MCRN fatigues, PT kit and a **vac suit** (helmet with visor glint via `l`, life-support pack as its own part), webbing and mag pouches, rifle variants, **reload frames** (mag out, mag in, charging handle; the sprite currently holds the aim while the UI lists the step), prone, crouch-aim, low-g float, magboots stance. Note: **left is right mirrored**, so a right-handed rifle becomes left-handed facing left. Asymmetric kit needs a true left view, or accepted mirroring. |
| `src/render/crowd.js` (GPU atlas, slot LRU, sub-image uploads, one instanced draw, per-instance tint, frames by distance walked, laid-down cards, flash cards, `gunPose`) | **Reuse as is** | Pure render module; solves crowds and armed figures at one draw call. Grow `FRAMES`, `BANDS` and `SLOTS` as poses are added (110 slots × 38 frames at 28 × 34 in 4096²). |
| `src/art/doll.js` (64 × 140 close-up figure, pockets, carrier, wounds, dressings, tourniquets, splints) | **Adapt strongly** | Exactly the "close-up" body OLYMPUS needs for medical aid, hygiene state (grime and sweat stains could reuse `stain()`), kit and load-out. Add: vac suit and helmet, MCRN uniform, chest rig and plates, rifle on a sling, holster, hydration, NVGs, burns, decompression and barotrauma signs, injection sites. |
| `src/art/furniture.js` (kit in whole pixels, parts, GLASS, THIN, beam, `tex`/`rep`, cabinet, goods, 67 makers, lit pieces) | **Adapt: reuse the kit, write new makers** | The method is the asset. Reuse the bathroom (toilet, washbasin, bathtub → showers), kitchen and galley, beds (→ bunks, crash couches), lockers (wardrobe → lockers), filing cabinets, security desk, X-ray, metal detector, vault door, and **the whole range set** (booth divider, range bench, bullet trap). New: weapon racks, ammo cans, med bay bed, autodoc, consoles, airlock doors, EVA suit lockers, water recycler, galley, mess tables, hydroponics racks (with `foliage()`), gym equipment. |
| `src/render/interior.js` `drawPlan` (floors, painted north wall with decor, side walls full, others cut to 1 m, thresholds, marks, furniture) | **Adapt (ship decks, barracks, habitats)** | A ship deck under thrust is a floor plan; so is a barracks or a dome module. Keep the north-wall convention (the camera always looks north) and the 1 m cut. New finishes: deck plate, bulkhead panels with rivets, pipes and conduit, hazard striping, MCRN insignia. `floorMat` grows deck kinds. |
| `src/render/cutaway.js` (a building opened with a slot, hatched cuts, slab marks) | **Adapt / reference** | For entering a structure seen from outside on a planetary surface (a base module, a hangar). Ship interiors are better shown as their own map (`buildInterior`). |
| `src/art/pixeltown.js` (`painter` helpers, `facade`, `building`, `keep`, `compact`, lamps, railings, cars) | **Reference; port helpers** | The street specifics (bricks, shops, cities' furniture) don't fit Mars. Port `keep()`, `compact()`, `bevel`, `streaks`, `window`, `sign`, `fineBricks` and `stones` (for bulkhead panels and regolith flags), and the lamp and railing approach (railings with alpha gaps → catwalk handrails, gratings). |
| `src/art/townsprites.js` (`foliage`, trees, `propCard`) | **Reference / adapt** | Trees only inside domes and greenhouses. `foliage()` serves hydroponic crops and dome parks. `propCard` serves small props: crates, rocks, cables, fire extinguishers. |
| `src/render/town.js` (generator sections, see-through cards, PAVE and LANE tile tables) | **Reference** | The generator pattern (yield every ~6 ms, build ahead, warm compile, free after next frame) is the reusable part. The street cross-section is tradecraft's. |
| `src/render/view.js` (frame orchestration, build budget, lamp slots, shadow-step snapping, fog of awareness, remembered people, interpolation, flash lighting, weather feed) | **Adapt by rewriting around OLYMPUS's sim** | It is tightly coupled to tradecraft's sim (cities, scenarios, street Z bands, signs). Its patterns are the value; rebuild a slimmer OLYMPUS view with the same order of operations. |
| `src/render/blood.js`, `items.js`, `prints.js` | **Reuse** | Blood (medical), items lying about (**brass casings, dropped magazines**, kit), prints (**boot prints in regolith dust** that fade). One instanced draw each. |
| `src/render/traffic.js`, `tape.js` | **Skip / reference** | Rovers and carts could borrow traffic's lit-copy emissive trick. |
| `src/render/dojo.js` | **Reference** | A PT and CQC hall. Fix its missing `nightSteps` if ported. |
| `src/sim/light.js` (`sky`, `indoors`, `lightAt`, `lightLevel`, `lightBand`) | **Adapt** | Keep the "one helper for screen and dice" rule and the keyframes-by-elevation shape. Replace the NOAA Earth sun with a **Mars sol solar model** (Mars24 / Allison & McEwen), and Martian sky colours (butterscotch day, blue sunset). Add ship and base lighting moods (day cycle, night red, battle-stations red, emergency strobes) to `indoors()`. Keep the sun's screen direction fixed (upper left) as the art requires. |
| `src/ui/style.css`, `ui.js fit()`, `plaque.js`, `pockets.js` | **Adapt** | The visual language (dark glass HUD, typewriter paper for orders and briefs, the 3×5 plaques, amber headings, `--ui` scaling 0.85–1.5 with the picture) suits military paperwork and HUDs. Change the accents (brass → amber or MCRN red, a stencil font for orders). System fonts only; PIPELINE lists "UI fonts (vendored, offline)" as still needed. |
| `tools/shot.mjs`, `tools/gallery.mjs`, `samples/index.html` + `sample.json` | **Reuse as is** | Screenshots that fail on page errors. The **look gallery with ★ picks and "Copy my picks"** is how this user chooses a look. Use it for OLYMPUS's first art round. |
| `tools/gen.sh` (mflux + provenance) | **Reference** | Only if OLYMPUS wants generated posters or portraits. Re-read Ideogram's "no real military" clause for a military fiction. |
| `tools/fetch-asset.mjs` | **Skip (for the pixel look)** | It serves the PBR pipeline. Keep its provenance pattern. |
| `tools/blender/*.py` (MPFB, Mixamo/CMU retarget, kit) | **Skip** | The realistic pipeline the user rejected; not used by the game. Only revisit if OLYMPUS ever renders sprites from 3D. |
| `samples/lib/finepeople.js` | **Adapt selectively** | The joint-capsule limbs make new poses cheap (reloads, prone, low-g). The user picked the chibi figures, so use the technique, not the 24 × 40 proportions, unless "high-resolution pixel art" says otherwise. |
| `samples/lib/building.js`, `looks.js`, `stage.js` | **Skip** | Realistic and cartoon looks that were rejected. |

### 13.1 Concrete guidance for OLYMPUS's settings

- **Martian bases and habitats**: dome and module boxes with painted panel façades (seams, rivets, hazard chevrons, stencilled numbers in the pixel font, porthole windows as glows at night). The regolith ground is one painted texture per section, as the street is: iron-oxide ochre families in OKLCH (for example hue 35–50°, chroma 0.08–0.12), dust drifts reusing snow cover, rocks as cards, rover tracks as `prints`. The sky has no "background" in view (the camera looks down), so the sky's colour comes through the light keyframes. Dust storms reuse the dust fall and haze (`tradecraft-walk-cairo-dust.png`).
- **Ship interiors** (thrust gravity, decks stacked): each deck is a `drawPlan` map with the 1 m cut. Corridors, crash couches, lockers, galley, med bay, armoury and an airlock cycle as a "use" with time skipped. Lighting comes from `indoors()` moods plus emissive console glows. Under battle stations, red mood plus strobes via lamp slots.
- **Zero-g**: no tradecraft equivalent. A floating person could be a card rotated like the "down" card, plus a few float frames.
- **Vac suits**: a new top kind plus a helmet in 3 views; a visor glint (`l`) and a dark visor; a life-support pack as a part (`over` the body from behind); suit lights as GLOW colours; in the doll, the suit's seals and readouts.
- **Rifles and handling**: the rifle rig exists (carried at the low ready, shouldered, kick, flash). Add reload frames (mag out/in, charging handle), a safety selector shown only in the UI or doll (it is under a pixel at 28 px), a sling-carry frame, a prone frame, and brass ejection as `items`. Tradecraft's shooting UI (numbered steps with times, the reticle plaque with hit % and distance, "time stands still") is the user-approved pattern.
- **Different scales** (the user's "mostly top-down at different scales"): tradecraft has one world scale (16 px/m) plus `zoom` (the stage divides `res` by it; samples use zoom 2 for close views). Tactical and telescope scales are longhaul's domain (another research slice). Tradecraft's 'mind' map (`src/ui/mind.js`, Tab) is a separate UI canvas, not the world renderer.

---

## 14. Bugs and discrepancies noticed today (tradecraft working tree, v0.2.0-rc3)

1. **The dojo crashes after dusk.** `?play=dojo&hour=19` throws `pageerror: fr.nightSteps is not a function`. `src/render/view.js:460` calls `fr.nightSteps()` on any front without a night face, but `src/render/dojo.js:57` builds its front with only the older `paintNight()`. Interior fronts are empty, so only the dojo is hit. By day the dojo renders (`tradecraft-dojo-day.png`). Not to be fixed here (read-only); flagged for the user.
2. **DESIGN.md and code disagree on the widest picture**: DESIGN says "up to 736 × 430", while `src/ui/ui.js:94` computes `RES_MAX = [2·SCREEN_HALF_M[0]·16, 430] = [768, 430]` with `SCREEN_HALF_M = [24, 22]` (`src/sim/crowd.js:49`).
3. **Tab in the free walk** didn't open the mind panel in my shot (it may be gated by the scenario or need focus). Not investigated.

---

## 15. Method lessons from tradecraft worth carrying over

- **Look samples first, the user picks.** Each sample has `sample.json` with views; `node tools/gallery.mjs` shoots every view (failing on page errors) into a contact sheet; the gallery has ★ picks and "Copy my picks". The user scored looks numerically ("characters 35", "a solid 70"), and those scores drove the pivots.
- **Measure, don't describe.** Measure references in pixels, sample screenshots for snapped colours, count GPU uploads.
- **When the user catches something the checks missed, add a check** in the same change (PIPELINE, How to judge motion).
- **Never explain an oddity away unchecked** ("probably the suit"). Look bigger, from the front and the side, against the truth.
- **Shots**: `tools/shot.mjs` with `--use-angle=metal` so WebGL renders on the GPU as the player sees it. `window.__ready` is set after 3 frames, and `view.flush()` builds everything at once for a shot.

---

## 16. Open questions for the user (OLYMPUS)

- **"High-resolution pixel art for close-up gameplay"**: does it mean tradecraft's 640 × 360 at 16 px/m with chibi 28 px people (the user's tradecraft pick), Stoneshard's finer 960 × 540, or a finer world scale (for example 24 or 32 px/m) so rifles, safeties and hands read? It changes sprite cells, the doll, palette-snap cost and the whole kit.
- **Figures**: chibi (2.4 heads, the tradecraft pick of 2026-10-26) or the finer 24 × 40 people with faces? A soldier's kit (helmet, plates, rifle) reads better at a larger scale.
- **Facings**: 4 (left mirrored) as in tradecraft, or true left views (or 8 directions) for right-handed weapons and asymmetric kit?
- **Camera**: keep tradecraft's fixed north-facing 45° oblique view for all close-up play (ship decks laid out to suit), or a straight-down view for some scales?
- **UI tone**: keep tradecraft's dark glass plus typewriter paper, or a military variant (stencil type, MCRN colours)? Same 3×5 in-picture plaques?
- **Generated imagery**: posters, portraits or ship insignia from image models, given Ideogram's "no real military" clause and a military setting? Tradecraft had "No portraits".
