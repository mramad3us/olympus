# The scenes: Base Melas, the valley floor, a frigate's deck, and the kit

Look samples on the pixel stage (`samples/stage/README.md`), built from the kit (`src/art/kit/`), the painted materials (`src/art/materials/`), the terrain (`src/art/terrain/`) and the weather in the air (`src/render/weather.js`). Each scene is shown at both densities (DESIGN.md: "Pixel density is decided by look samples the user scores") and in its lighting moods.

## Run it

Serve the repository on your own port (`python3 tools/serve.py 8233 .`) and open `http://127.0.0.1:8233/samples/scenes/?scene=bay`.

- **URL parameters:**
  - `scene=bay|head|mess|chasm|deck|kit`.
  - `ppm=16|24`.
  - `mood=<name or 1..n>`.
  - `view=<the scene's camera>`: `full` is the game's frame (40 × 22.5 m), `close` a zoom 2 look.
  - `palette=tradecraft|mars|ship|europa`: otherwise the scene's own (Mars for the base and the valley, ship for the deck).
  - `weather=0`, `fog=1`, `see=0`, `hud=0`, `bench=1`, `t=<seconds>` (the clock of what falls and rises).
- **Keys:** 1 to 9 pick the scene's moods, M the next, W weather, F fog, S see-through, P palette, O outlines, B bench, arrows move the first figure.
- **Shots:** `node samples/scenes/shoot.mjs [--only bay,head] [--bench]`. It serves on 8233 if nothing answers there, shoots every scene at 1920 × 1080 (24 px/m at × 2, 16 px/m at × 3: exact integer scales), fails on page errors, and writes `shots/report.json`.

## The scenes

| Scene | What it is | Moods | Sources |
|---|---|---|---|
| `bay` | Echo Company's east wing, ground floor: three squad bays in layout A (racks, wall lockers, footlockers, the squad leader's corner, the study table), the hallway with the fire watch's post (desk, logbook, its lamp, a locked arms cabinet) and night lights, and across it the platoon office, the HQ rack room, two heads, the laundry, the closet, the lounge and the stair | reveille, evening, lightsOut (sleepers in the racks, the fire watch's red torch) | PLACES §4.4; VIEWS §2.7 |
| `head` | Head 2A as its own area so its north wall stands full height: five shower stalls with curtains and steam, the drying area's bench, an island of five basins under a fogged mirror, four toilet stalls, two urinals | evening, reveille, lightsOut | PLACES §4.4; VIEWS §2.8, §3.4 |
| `mess` | The mess hall's western 40 m: the galley (ranges under the hood, kettles, combi ovens, prep tables), two serving lines (tray start, hot wells, cold, heat lamps, steam), the dining rows with trays, the entry's basins and the headcount desk | noon, evening | PLACES §4.5 |
| `chasm` | The valley floor: regolith in chunks, rover tracks and boot prints, rocks, a station of sintered block (a personnel door in a dust vestibule, a vehicle dust lock, floods, roof plant), drifts in the lee, a scarp of layered deposits with its talus | day, storm (τ 4), heavy (τ 6) | PLACES §3.15, §4.1, §1.6; VIEWS §2.7 |
| `deck` | A Hellas-class frigate's deck 5: berthing (three-high racks), the gunnery sergeant's cabin, the ready room (crash couches, the threat board), the corridor with the trunk's ladder well and the deck's airlock, the escape hatch and the dogged escape door, the passage, the suit room, the arms cage, the head, the keel railgun's tube | normal, battle, emergency, night | PLACES §5.1, §5.3; LONGHAUL's room cameras |
| `kit` | Every kind of the kit in every make, labelled on the floor (tradecraft's sample 008 contact sheet) | day, evening, night, ship, battle, emergency | |

## The kit (`src/art/kit/`)

```js
import { place, KINDS, FOOTPRINTS } from '../../src/art/kit/index.js';
place(area, { kind: 'rack2', make: 'steel', x: 1.1, z: 1.0, face: 'down', seed: 7, look: { made: false } });
// wall pieces take their mounting height as y:
place(area, { kind: 'sign', make: 'plaque', x: 13.9, z: 0.015, y: 1.5, look: { text: 'DECK 5', sub: 'MARINES', style: 'deck', icon: 'helmet' } });
```

- **A piece** is `{ kind, x, z, y, face, make, look, seed, w, d }`.
  - x and z are the middle of its footprint, in metres.
  - `face` is `down` (front toward the camera), `right`, `up` or `left`.
  - `make` is how it is built, `look` its state, `seed` the cosmetic choices left open.
  - w and d stretch the pieces that run: a conduit, a serving line, a sink row.
- **What it returns:** `place()` returns the piece's world boxes and lamps. It needs only `box()`, `ground()`, `lamp()`, `glowLine()` and `part()` from the area, so the tests run it in node.
- **40 kinds, 115 makes** (`FOOTPRINTS`, each with its makes):

  | Group | Kinds |
  |---|---|
  | Quarters | `rack2`, `rack1`, `rack3`, `wallLocker`, `footlocker`, `rifleRack`, `desk`, `chair`, `stool`, `studyTable`, `dutyDesk` |
  | Mess | `messTable`, `servingLine`, `galleyUnit`, `tableSmall` |
  | Head | `showerStall`, `toiletStall`, `urinal`, `sinkRow`, `waterFountain`, `washer` |
  | Training | `gymRack`, `centrifuge`, `rangeBooth`, `targetCarrier` |
  | Ship | `suitLocker`, `airlockDoor`, `pressureDoor`, `hatch`, `ladderWell`, `crashCouch`, `conduit`, `handhold`, `emergencyLight` |
  | On the walls and in the lounge | `sign`, `window`, `board`, `sofa`, `vending`, `bin` |

  Each maker's header lists its makes and looks.
- **Writing a maker** (`kit.js builder()`):
  - It builds in the piece's own frame: x across, z toward its front, the origin on the floor at its middle.
  - `k.comp()` starts a part (an outline round it), and `k.box({ x, z, y, w, d, h, faces })` adds a box with its faces in the piece's own names. `k.lamp()`, `k.ground()` and `k.glowLine()` turn with the piece too.
  - A turn moves every box, hands each face to the face it becomes, and turns a top's painting with it.
  - Every edge snaps to the pixel grid, edge by edge, so boxes that meet in metres meet in pixels.
- **Painters** are `tex(key, (px, w, h, ppm) => …)`: the same key gives the same function, so the batch paints a make once a size and shares it in the atlas. The key must name everything the painting depends on.
- **Lettering** (`type.js`):
  - `fontFor(ppm)` gives tradecraft's 3 × 5 alphabet below 20 px/m and a 5 × 7 one from 20 (VIEWS §3.8), so letters are about the same size in the world at both densities.
  - `plaque()` is tradecraft's enamelled plaque (`src/ui/plaque.js`), its icons and its styles (deck, safety, warning, danger, info, corps, plate, brass).
  - A stencil is the letters worn at their top and foot.

## Materials (`src/art/materials/`)

- **The painters:** `concrete`, `vinyl`, `sinteredBrick`, `paintedSteel`, `deckPlate`, `rubberMat`, `ceramic`, `regolith`, `rock` and `ice`.
  - Each is `(px, x, y, w, h, o)`, with `o = { ppm, c, seed, wx, wy, period, … }`.
  - wx and wy put the rectangle in the world, in pixels, so faces painted apart continue each other.
  - `frostOver()` and `dustOver()` veil a painting already made.
- **Tiles:** `tile(kind, { metres, ppm, … })` paints a repeating tile, remembered by its options. `tileSizePx()` rounds a tile to whole repeats of its pattern, so it meets its own next copy without a seam (tested).
- **Wear** (`wear.js`): `grimeFoot`, `chips`, `scuffs`, `streaks`, `stain`, `crack`, `dustFoot`, `bevel`, `sunk`.
- **The rule learned here:** no broad low-frequency mottle on big flat things.
  - A ±0.02 L field flips between two palette steps in patches a metre across, and once snapped it reads as camouflage. It is worst in dim light, where the palette's dark steps are close.
  - Texture big flats with pixel-scale work instead: specks, stipple, joints, weave.

## Terrain (`src/art/terrain/`)

- **The ground:** `layGround(area, { x0, z0, x1, z1, chunkM, seed, dust, tracks, prints })` lays the valley floor in chunks.
  - Each chunk is a flat piece whose face is a painter of its own ground. The area paints it when it builds, a chunk a step, so streaming chunks fit a frame budget.
  - Painting is 4.6 ms a 12 m chunk at 16 px/m and 7.3 ms at 24.
  - Two halves painted apart equal the whole, pixel for pixel (tested).
- **Paths:** `slabPath()` lays a path of sinter slabs.
- **Rocks:** `boulder()` and `scatterRocks()` build them from boxes of one part, their corners eaten round. `drift()` heaps dust in a wall's lee.
- **Walls:** `scarp()` stands a south-facing face in columns, with its beds level across them and a talus apron at its foot.

## Weather (`src/render/weather.js`)

```js
import { createWeather, dustOf } from '../../src/render/weather.js';
const weather = createWeather(stage);
weather.set({ haze, hazeColour, farM, eye: [x, z], dust, drift, wind: [x, z], slant, puffs: [{ x, y, z, r, k }], steamColour, timeS });
weather.set(null);   // nothing in the air: the pass is skipped
```

- **What it is:** tradecraft's composite weather, adapted.
  - Haze by distance from the eye. The distance is 3D (my call), so a cliff fades upward. The haze is thick where the fog of awareness says unseen, and dithered.
  - Dust falls are sideways streaks pinned to the world.
  - Blowing dust streams along the ground with the wind.
  - Steam rises from puffs.
- **How it reaches the stage:** one pass after the stage's composite. It copies the finished picture on the GPU, lays the air over it, and snaps again with the stage's own lookup: 0 pixels off the palette in the storm, the steam and the deck (checked by reading the picture back).
  - It costs one draw call while there is weather, and none without.
  - It wraps `stage.post.compose`, because the stage has no hook for a pass yet. That is the one place to change when it grows one.
  - three.js comes from `stage.THREE`, so the module loads in node.
- **The storm table:** `dustOf(τ)` is VIEWS §2.7's storm table, interpolated (sight in its logarithm). It belongs to the sim's light module once that exists.

## Numbers (2026-11-05, headless Chrome, ANGLE Metal, Apple M5 Pro, 1920 × 1080)

**Draw calls a frame.**
- Every area is 1 batch draw.
- Each placeholder figure is 2 (its card and its blob). The crowd's instanced draw will make all of them 2.
- The post pass is 2, plus 1 with weather.

**Frame time,** CPU and GPU together, 120 frames forced to finish (`bench`):

| Scene (view) | Draw calls | Boxes | Atlas | Frame, 16 px/m | Frame, 24 px/m | Build (describe + build, 24 px/m) |
|---|---|---|---|---|---|---|
| bay (full, reveille) | 14 (1 batch, 5 figures, post 3) | 827 | 1024×148 / 1024×308 | 0.31 ms | 0.40 ms | 9 + 15 ms |
| bay (full, lights out) | 7 | 822 | | 0.27 ms | 0.40 ms | |
| head (close, evening) | 10 | 86 | 256×88 / 256×176 | 0.19 ms | 0.22 ms | 4 + 5 ms |
| mess (full, noon) | 22 (9 figures) | 378 | 1024×92 / 1024×212 | 0.30 ms | 0.40 ms | 7 + 9 ms |
| chasm (full, day) | 10 | 254 | 1024×696 / 2048×844 | 0.29 ms | 0.44 ms | 13 + 151 ms |
| chasm (full, storm) | 10 | 254 | | 0.31 ms | 0.48 ms | |
| deck (full, normal) | 11 | 448 | 512×136 / 512×300 | 0.29 ms | 0.38 ms | 7 + 11 ms |
| deck (full, battle) | 11 | 444 | | 0.27 ms | 0.45 ms | |
| kit sheet (full) | 3 to 7 | 645 | 1024×204 / 1024×464 | 0.29 ms | 0.39 ms | 9 + 17 ms |

- The stage's CPU time is 0.1 to 0.4 ms a frame.
- The atlas goes up in 0.4 to 1.1 ms at load. It is 6.6 MB for the valley floor at 24 px/m, most of it the ground.
- A scene holds 7 or 8 shader programs and 12 to 20 textures.

## Decisions to know about (my calls unless quoted)

- **The canyon wall.** PLACES §3.15 says "the walls are never in the stage's picture". The camera looks north, so a face shows only if it faces south and stands inside the frame, and Melas's south wall faces north, 10 km off.
  - The wall in the valley scene is therefore a scarp of the floor's layered deposits, and the station is a training-area outbuilding (the Talus), not a named Base Melas building.
  - If the user wants the real north wall, the scene is the same kit placed at its foot.
- **The barracks.** PLACES keeps rifles in the battalion armoury and the duty desk on the quarterdeck. The bay scene's arms cabinet and the fire watch's desk sit in the hallway for the sample.
- **The head.** It is built as its own area, so its north wall stands full height. Its layout departs from PLACES's default:
  - showers along the north wall, facing the camera;
  - basins on an island under a mirror partition, since the cut walls can't carry mirrors;
  - toilet stalls along the south wall, seen from behind.
- **The frigate's deck 5.** The ready room's 16 seats are crash couches, and a short corridor runs from the passage to the hull, carrying the trunk's ladder well and the deck's airlock.
- **Lettering.** It is 5 × 7 from 20 px/m. Stencils are worn, not cut: the stage's `src/art/font.js stencil()` cuts every glyph's middle row, which turns E into C and H into I ("VEHICLE" read "VCHICLC"). Its owner may want the same change.
- **Moods.**
  - Lights-out's fill is raised to sun 0.09 and sky 0.15 so the sleepers read. VIEWS gives "0.04 plus pools", which was black.
  - Indoor shadows are kept soft (0.12 to 0.28): a hard key-light shadow read as a stain on the floor.
  - The emergency mood lights no ceiling pools, since panels at a tenth made faint rings that read as stains.
  - Interior day moods keep ceiling pools at 0.1 to 0.14.
- **The valley floor's palette and light.** It uses the Mars palette and VIEWS §2.7's Martian day row, not the stage's first-cut `SKY.mars`.
- **Glass and shadows.**
  - Glass is drawn by leaving it out: the sneeze guard is a steel frame and a glint, so the food shows. The batch has one opaque material.
  - Holes in a face (a boulder's eaten corners, a stencil's gaps) are alpha-tested away, but the box still casts its whole shadow, since the shadow pass doesn't read the atlas.

## Shots (`shots/`)

There are 58 shots, `<scene>-<view>-<mood>-ppm<16|24>.png`, all 1920 × 1080:
- the bay full and close, at reveille and at lights out;
- the head close, at evening and at lights out;
- the mess full and close, at noon;
- the valley floor full and close by day, in the storm (τ 4), and full in the heavy storm (τ 6);
- the deck full and close, normal, battle and emergency;
- the kit sheet in ten views.
