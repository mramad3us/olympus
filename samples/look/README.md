# The look samples: five scenes with their people, for the user to score

The first look round, put together. The kit's scenes (`samples/scenes/`) have the real figures in them (`src/render/figures.js`, one instanced draw), lit by the scene's mood. Each scene is a 2 × 2 of the open questions (DESIGN.md, Space and scales): the density by row (16 px/m at 640 × 360, or 24 px/m at 960 × 540) and the figures by column (A chibi or B soldier). The user scores them in the gallery, `samples/index.html`.

## The samples

| Sample | What it shows | Frame | Views (shots in `shots/`) |
|---|---|---|---|
| L1 | The squad bay at reveille: 13 marines getting up | zoom 1, 40 × 22.5 m | `l1-a` to `l1-d` |
| L2 | The head in the evening: one showering behind a drawn curtain, the wet head above it | zoom 2, the shower's splash | `l2-a` to `l2-d` |
| L3 | The mess hall at noon: a queue from the entry to the serving line, cooks, diners (25 people) | zoom 1 | `l3-a` to `l3-d` |
| L4 | The valley floor: two marines in vac suits, one walking, one in the low-g bound; a to d by day, e to h in a dust storm (τ 4) with the fog of awareness | zoom 1 | `l4-a` to `l4-h` |
| L5 | A frigate's deck 5 at battle stations: strapped into a crash couch | zoom 2, the couch's splash | `l5-a` to `l5-d` |

Letters run in reading order across each 2 × 2: a 16 px/m chibi, b 16 px/m soldier, c 24 px/m chibi, d 24 px/m soldier (then e to h the same, in L4's storm). The four pictures of a scene differ only in `ppm` and `prop`; `tests/samples-look.test.mjs` checks it.

## Run it

- **The gallery:** `./play.sh --dev`, then open `/samples/`. Star a view, give it a score out of 100, and write a note for each group. A picture opens large: ← → flip through the group's views, ↑ ↓ change group, S stars, Z magnifies 2 ×, 1 shows the shot pixel for pixel, O opens it live. "Copy my picks" puts the stars, scores and notes on the clipboard, with the stars and mean scores tallied by density and by figures.
- **One view live:** `/samples/look/?scene=bay|head|mess|chasm|deck&ppm=16|24&prop=chibi|soldier`.
  - Other parameters: `mood=`, `t=` (seconds: freeze the moment; without it time runs), `zoom`, `x`, `z`, `palette`, `weather=0`, `fog=0|1`, `see=0`, `hud=1`.
  - Keys: H overlay, D other density, P other figures, M next mood, Space freeze or run, W weather.
- **Reshooting:** `node tools/gallery.mjs [filter] [--port N] [--contact out.jpg]`. The port is 8212 by default; agents use their own 8230 to 8239. It shoots every view of every `samples/*/sample.json` and writes `samples/index.json`.
  - **Crisp shots:** each shot is taken at 3 × the picture, point-sampled back to the picture, and kept at 2 ×. A shot that isn't whole 3 × 3 pixels fails the run.

## How it's built

- **`cast.js`:** the five compositions as plain data: the scene, mood and camera, and the people. Each person has a look key, a place, a facing, and a gait or frame.
  - `seat` lifts a sitter by the seat's height less the candidate's own `seatM`. `bed` lays a lying frame on a bed's top.
  - One person per cast is `you`. The see-through and the fog of awareness are centred on them.
  - `placeAt(p, tS, seatM)` is where someone is at a moment. Walkers loop along their facing by distance, so a still is mid-stride. A bound's height is a parabola after the push-off.
- **`main.js`:** builds the scene's area (`samples/scenes/*.js build()`), adds one `createFigures` for the candidate, and draws everyone each frame.
  - Everyone is `own`, so they are painted at once: a sample shows the finished picture. The budget's numbers are the figures sample's (`?budget=1`).
  - `window.__ready` is set once everyone is drawn. `window.__report` holds the numbers.
- **`sample.json`:** the groups. A `matrix` expands each group (and each of its `sets`) into rows × columns of views, each its query plus the row's and column's parameter. `"pixel": "stage"` takes each view's picture size from its `ppm` and `zoom` (`src/render/scale.js DENSITIES`).

## Numbers (2026-11-05, headless Chrome, ANGLE Metal, Apple M5 Pro)

| | People | Looks | Draw calls | Bands sent (KB, 16 / 24 px/m) |
|---|---|---|---|---|
| L1 bay | 13 | 12 | 6 | 12 (2,520 / 5,670) |
| L2 head | 5 | 5 | 6 | 5 (1,092 / 2,457) |
| L3 mess | 25 | 12 | 6 | 17 (2,940 / 6,615) |
| L4 chasm | 2 | 2 | 6 (weather included) | 2 (504 / 1,134) |
| L5 deck | 5 | 4 | 5 | 4 (504 / 1,134) |

- Every scene draws in 5 or 6 calls: the area's batch, the figures' cards and blobs, and the post (with the weather pass when there is weather).
- Painting everyone at once took 25 to 130 ms at load on a quiet machine, and up to 4 × that while other tests ran.
- Every shot is on its scene's palette, every pixel (44 to 98 colours a shot), and whole 2 × 2 picture pixels (tested).

## My calls in these samples

- **Three looks made from `wear()`'s layers,** which `outfits.js` doesn't have:
  - a towel at the waist with shower shoes (olive, blue or grey: a white towel read as underwear);
  - bare, for the shower;
  - the galley's whites for the cooks.
- **L2 and L5 are at zoom 2,** as their splashes would frame them. The rest are at the game's frame.
- **The head:** the showerer stands at the back of the stall so the wet head clears the curtain's rail (VIEWS §3.4). Its steam is thinner and higher than the scene's, and the other stalls' steam is off.
- **The mess hall's camera is 0.7 m south of the scene's own,** so the second row of tables is in. The top of the galley wall is a little cut.
- **The storm:** the bounding marine is just inside your cone of sight, a shape in the haze.
- **The frigate:** no one stands in the passage or the corridor. The cut walls and the trunk's ladder hide whoever is there (only `you` is seen through).
