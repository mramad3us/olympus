# The pixel stage: sample and API

The close-up view, tradecraft's look ported to OLYMPUS (DESIGN.md, Space and scales). This page is for the agents who build on it. The stage is `src/render/stage.js`, and the painters are in `src/art/`. This folder holds a test room that exercises all of it (`index.html`, `main.js`, `kit.js`), a page of GPU checks (`check.html`, `check.js`) and screenshots (`shots/`).

## Run it

Serve the repository on your own port (`python3 tools/serve.py 8231 .`) and open `http://127.0.0.1:8231/samples/stage/`.

- **URL parameters:**
  - `ppm=16|24`: the density (default 24).
  - `mood=1..7`, or a mood's name.
  - `palette=tradecraft|mars|ship|europa`.
  - `deck=1`: the same plan as a ship's deck.
  - `fog=1`: the fog of awareness round the figure.
  - `see=0`: no see-through.
  - `stress=N`: N more boxes, to count draw calls.
  - `snap=lut|loop|off`, `gamma=2.2|srgb`.
  - `zoom=2`: a closer picture.
  - `fx`, `fz`: where the figure stands.
  - `hud=0`, `bench=1`.
- **Keys:**
  - 1 to 6: the moods (day, dusk, night, battle red, emergency amber, blackout with floor strips). 7 is the ship's normal light.
  - F fog, S see-through, P palette, L snap mode, O outlines, D deck.
  - R rebuilds the area (dispose and build: the leak check). B runs a bench.
  - The arrow keys move the figure.
- **The overlay** at the top left prints the draw calls (scene and post), triangles, the batch, and the CPU, frame and GPU milliseconds.
- **Handles:** `window.__stage` (the stage), `window.__report` (the numbers) and `window.__ready` (true after three frames).
- **`check.html?ppm=16|24&palette=…`** runs the GPU checks and puts the results in `window.__report` (see Numbers).

## The density is one number

`src/render/scale.js` exports `PX_PER_M` and the frame:

- 16 px/m at 640 × 360, or 24 px/m at 960 × 540. Both show 40 × 22.5 m.
- On a window of another shape the picture widens to it, up to `RES_MAX` (48 × 26.9 m), and a border shows beyond that.
- It fills the window at any scale, sharp-bilinear.
- The query is read once, at load. Never write 16 or 24 anywhere else. Size things in metres, and convert at the edge with `PX_PER_M` (painters get `ppm` as an argument).

## A frame

```js
import { createStage } from '../../src/render/stage.js';
const stage = createStage({ palette: 'tradecraft', mood: 'day' });   // fills the window, refits on resize
// each frame:
stage.setLead(dx, dz);              // the eye-lead hook: where the eyes go, metres off the focus (eased, LEAD_S 0.35 s)
stage.follow(x, z, dtS);            // the camera on the focus plus the lead, snapped to the pixel grid
stage.setFocus({ x, z, h, w });     // the figure to see through to (things between it and the camera are dithered), or null
stage.render();                     // stage.stats: calls { scene, post, total }, triangles, cpuMs, gpuMs, shadowDrawn
```

Other calls:

- `stage.setMood(name | mood)`: see `src/render/moods.js` (MOODS, `skyMood(name, elevDeg, SKY.mars)`).
- `stage.setPalette(name | colours)`: the lookup is re-baked on the GPU, about 0.1 ms.
- `stage.setFog(texture, x0, z0, w, h, dimK)`: the fog mask (see Fog).
- `stage.lightAt(x, z)`: the linear RGB a sprite standing there takes (the mood, the lamp pools, the strip light). It is the same light the scene puts there.
- `stage.dispose()`: frees the targets and gives back the WebGL context.

## An area: boxes, painted faces, lamps

The static kit of a live area is batched: every box of it goes into one geometry with one material reading one atlas, so it costs one draw call.

```js
import { createArea, runFor } from '../../src/render/batch.js';
import { tile } from '../../src/art/tiles.js';
const area = createArea({ name: 'deck-2' });
const crate = (px, w, h, ppm) => { px(0, 0, w, h, 0x9a7048); /* … painted to the face's exact size */ };
area.box({ x: 2, z: 3, w: 1.0, d: 0.8, h: 0.75,            // metres: the footprint's centre, bottom at y = 0
           faces: { front: crate, top: crateTop, sides: 0x7a5838 } });
area.ground({ x0, z0, x1, z1, top: tile('deck', { metres: 1 }) });   // a floor: a repeating tile, world-anchored
area.lamp({ x: 4, z: 3, r: 2, kind: 'ceiling' });          // a pool when the mood lights 'ceiling' lamps
area.buildNow();                     // or: const g = area.build(); each frame runFor(g, 6) until done
area.upload(stage.renderer);         // at load: all of it now; mid-play: area.upload(renderer, 256 * 1024) a frame until true
stage.setArea(area);                 // its group in the scene, its lamps and strip light in use
// leaving:
area.dispose();                      // geometry, material, atlas, strip-light map, and its extras
```

**Faces** are written as tradecraft's `box()` takes them: `{ sides, top, bottom, front, back, left, right }`. Unset faces take `sides`, and bottom takes top. Each face is one of:

- a colour (`0xrrggbb`), flat;
- a Pixmap (`paint()`);
- a painter function `(px, w, h, ppm)`, painted at the face's exact pixel size, once per size, and shared by every face of that size;
- `{ color | pixmap | paint, glow, anchor: 'local' | 'world', tint }`.

**What the camera sees.** It sees only the top and the front (+z), so the detail goes there. The sides are seen edge-on but still cast the sun's shadows.

**Boxes and the pixel grid.** Every box snaps to the pixel grid (west, north and bottom edges round to whole pixels, and so do the sizes), so a texture painted to a face's size puts one texel on one screen pixel.

**Parts.** Pass `part: area.part()` to several boxes to make them one part: outlines are inked where different parts meet. Floors and decals are part 0, like the background.

**Flat decals** (strips, marks, thresholds) lie on a floor with `lift: 0.002` (metres, not snapped). Without it, a decal snaps to the floor's own height and z-fights with it.

**Glow classes** (`GLOW` in `src/art/paint.js`): ALWAYS, LAMP, NIGHT, STRIP, BATTLE, EMERGENCY, SCREEN.

- A surface of a class shows its painted colour unlit, at the strength the mood gives that class.
- Set a class on a box (`glow`), on a face, or per pixel: `px(x, y, w, h, colour, GLOW.SCREEN)`, or `paint(…, { glows: { 0xe7b84a: GLOW.NIGHT } })`.
- Moods switch glows on and off without repainting: the class rides in the texel's alpha byte.

**Painting** (`src/art/`):

- `paint(w, h, draw)` returns a Pixmap: plain pixels in a Uint32Array, with no GPU object.
- `px(x, y, w, h, colour)` fills rectangles of pixels, y from the top. `null` punches a hole, which is alpha-tested away.
- Brushes: `bevel`, `mottle`, `speckle`, `plate`, `rivet`, `hazard`, `boards`, `vents`, and `pxOf(metres, ppm)` to size things.
- `tone(hex, dL)` makes the tones; `text` and `stencil` write in the 3 × 5 font.
- `tile(kind, { metres, ppm, c })` paints the floors: concrete, slab, tiles, checker, planks, deck, grating, rubber, block, regolith.
- Keep noise steps near 0.03 OKLCH L on big flat things (tradecraft, 2026-10-26). Check what a colour snaps to in a screenshot, not in the painter.

## A card sprite

```js
import { createCard } from '../../src/render/cards.js';
const card = createCard(pixmap, { x, z });   // upright, facing the camera, its foot column on (x, z), a blob shadow under it
area.add(card.group);                        // freed with the area (or stage.scene.add and card.dispose())
// each frame:
card.place(x, z); card.setTint(stage.lightAt(card.x, card.z));
```

A card is pre-shaded, so the scene's lights don't light it; it is tinted by `lightAt`. It writes the people's part (`PEOPLE_PART`) and is dithered when it stands in front of the focus. The crowd (one instanced draw for everyone, tradecraft's `src/render/crowd.js`) is still to be ported. Its shaders take `FRAG_DECL`, `olyId()` and `olySee()` from `src/render/materials.js`, as `cards.js` does.

## A lamp, and the moods

**Lamps** are area data: `{ x, z, y = 2.7, r = 2, color, core = 0.5, ring = 0.2, kind }`, with kind `'ceiling'`, `'emergency'` or `'desk'`.

- Ten slots, each a pair of spotlights with no falloff (a core to r and a ring to 1.5 r, hard-edged), go to the lit lamps nearest the camera each frame. Add as many lamps as you like.
- The mood says how strongly each kind shines, and in what colour: `mood.lamps`, `mood.lampColour`.

**Floor strips and battle strips** are glow lines (`area.glowLine({ kind: 'strip' | 'battle', x0, z0, x1, z1, toward })`). They are baked into a strip-light map (0.125 m cells) that adds their spill to whatever stands there, only on the side they shine toward. `buildCutaway` puts them along every wall.

**The moods** (`src/render/moods.js`):

| Mood | What it is |
|---|---|
| day, dusk, night | the open sky at 18°, 0.5° and −9° (tradecraft's keyframes; `SKY.mars` is a first cut, to be scored) |
| battle | panels dimmed to about a third, red strips at 1.3 m |
| emergency | panels at a tenth, amber emergency lamps, floor strips |
| blackout | floor strips only |
| ship | cool-white panels |

The three ship states follow LONGHAUL's room cameras. A mood is plain data, so a mood of your own is an object with the same fields (`moodOf()` fills the missing ones from the day's).

**The light is tradecraft's.** A hemisphere fill of 0.6π and a sun of 0.79π from the upper left, a little in front, with a two-band toon ramp. A front face shows its painted lightness, and the warm grade (tradecraft's fine look) shifts its hue a step warmer. See Numbers.

## Cutaway rooms and decks

```js
import { buildCutaway } from '../../src/render/cutaway.js';
buildCutaway(area, plan, { deck: false });   // deck: true gives deck plate, bulkheads and hazard-striped frames
```

The plan is plain data:

```js
{ x0, z0, x1, z1,
  rooms: [{ x0, z0, x1, z1, floor, floorColor, finish }],
  openings: [{ axis: 'x' | 'z', at, a, b, kind: 'door' | 'gap', label }],
  decor: [{ kind: 'emergency' | 'sign' | 'board' | 'clock' | 'stencil', x, y, w, h, text }],
  lamps: [...] }
```

tradecraft's wall rule (`src/render/walls.js`):

- the north wall stands full height (2.8 m), painted room by room, with its doors, decor, battle strip and emergency lamps;
- the side walls stand full height, seen edge-on;
- every other wall is cut to 1.0 m with a dark top, its face the finish of the room in front of it.

A door on the north wall is painted on it; anywhere else an opening is a gap with a threshold. Furniture goes into the same area with `area.box`.

## Plain three.js meshes

Add any `THREE.Mesh` to `stage.scene`, or to an area with `area.add`. On its first frame the stage gives its geometry a part attribute (`userData.part`, set with `setPart(mesh, id)`) and patches its material.

The patch writes the part ID in the same pass as the colour, as a second render target (WebGL2 MRT), and gives it see-through, glow and strip light. It is the same program for every material of a kind, so nothing recompiles when moods change.

- `userData.noId = true`: a mesh with no outline (it is drawn blended, so the ID under it stays).
- `userData.see = false`: never dithered.
- Lines, points and three's Sprites are not supported (no ID output); use meshes.
- Materials of your own: build them with `toon()` or `unlit()` from `src/render/materials.js`, or patch them with `olyMaterial()`.

## Fog of awareness

```js
import { createFogMask } from '../../src/render/fog.js';
const fog = createFogMask();                 // 96 × 128 cells of 0.5 m, RG8: seen, felt
fog.place(x0, z0); fog.fill((x, z) => [seen, felt]); fog.ease(dtS);
stage.setFog(...fog.upload(), stage.mood.dimK);
```

The mask is the sim's to fill (its perception). The stage only dims and dithers what is unseen (4 × 4 Bayer) and tints what is felt.

## Palettes

`src/art/palette.js`:

- `TRADECRAFT` is tradecraft's FINE_PALETTE exactly (116 colours).
- `PALETTES.mars`, `.ship` and `.europa` are built from parameters by `buildPalette({ families: [[hue°, chroma, steps?], …], fixed })`. They are my first cut, to be scored.
- Every pixel of the picture is snapped to the active palette. The post pass reads a 64-level lookup holding each cell's four nearest palette colours, and measures the pixel against those four only.
- A palette holds at most 256 colours.

## Numbers (2026-11-05, headless Chrome, ANGLE Metal, Apple M5 Pro)

**Draw calls and triangles:**

- 5 draw calls a frame: the batch, the card, its blob, the composite and the blit. The shadow map is redrawn only when the sun's step changes or the area does.
- The test room is 36 boxes, 224 quads and 470 triangles in 1 batch draw. `stress=300` gives 336 boxes, 2,024 quads and 4,070 triangles, still in 1 batch draw.
- tradecraft's furnished flat drew 821 calls a frame.

**Frame time** (200 frames forced to finish, CPU and GPU together):

| | room, 16 px/m | room, 24 px/m | 336 boxes, 24 px/m |
|---|---|---|---|
| lookup snap | 0.24 ms | 0.35 ms | 0.37 ms |
| tradecraft's loop | 0.35 ms | 0.65 ms | 0.66 ms |

The palette snap alone costs 0.017 ms by the lookup and 0.39 ms by the loop (calibration page, 24 px/m). `stage.stats.cpuMs` is 0.3 to 0.8 ms a frame.

**Building and uploads:**

- Building the room takes 6 to 10 ms and uploading it 0.5 ms (the atlas is 512 × 112, 224 KB, at 24 px/m).
- Steady frames upload nothing: 0 `texImage2D` or `texSubImage2D` calls over 60 frames.
- The budgeted upload sends the same atlas in 16 KB bands (5 calls at 24 px/m), and the picture comes out identical byte for byte.

**Exactness** (`check.html`):

- The GPU lookup equals its CPU twin on 262,144 of 262,144 cells (all four candidates in all but 1 to 15 cells: ties).
- Part IDs read back from the second attachment are exact (116 of 116).
- Every pixel of every shot in `shots/` is a palette colour, and every shot is an exact integer scale of the picture.

**Calibration** (one box a palette colour, the centre of its front face read back, day mood):

| Setting | Exact palette colour | Lightness within 0.05 OKLCH L |
|---|---|---|
| tradecraft's warm grade, pow 1/2.2 (default) | 57 of 116 | 116 of 116 |
| no grade, pow 1/2.2 | 100 of 116 | 116 of 116 |
| no grade, exact sRGB | 105 of 116 | 116 of 116 |

The warm grade moves cool greys one family warmer, as it did in tradecraft.

**Leaks:** after ten rebuilds, every key, walking and a resize, the counts stay at 6 geometries, 13 textures and 7 programs.

## Shots

`shots/`, all 1920 × 1080: 16 px/m at ×3 and 24 px/m at ×2, so both are integer-scaled and the same size on screen.

- `ppmNN-M-<mood>.png`: the six moods at both densities, full frame, overlay on.
- `ppmNN-close-*.png`: zoom 2, closer. Day, night, the deck at battle stations, the fog by day and night, the ship mood, and the Mars palette.
- `ppmNN-stress-300.png`: 336 boxes, 5 draw calls.

## three.js

`vendor/three/` holds the files tradecraft's game loads, copied from its own vendored tree (three 0.186.1, MIT, `LICENSE` kept, checksums equal): `build/three.module.js`, `build/three.core.js`, `examples/jsm/geometries/RoundedBoxGeometry.js` and `examples/jsm/utils/BufferGeometryUtils.js`. Pages load them through the import map `{ "three": "…/vendor/three/build/three.module.js", "three/addons/": "…/vendor/three/examples/jsm/" }`.

## Not ported yet (and where it is)

- tradecraft's weather: on surfaces (`WX` in its `src/art/pixelart.js`) and in the air (the composite's falls, haze and halos). Mars dust storms and dawn frost want it.
- The sprite system and the crowd's instanced draw (`src/art/sprites.js`, `src/render/crowd.js`).
- The close figure (`src/art/doll.js`) and the furniture kit (`src/art/furniture.js`).
- The shop-in-a-building cutaway (`src/render/cutaway.js` there: a slot through a façade, hatched).
- A Mars sol solar model to drive `skyAt()`: it belongs to the sim's light, which the dice read too.
