# The figures: sample and API

OLYMPUS's people on the pixel stage: two proportion candidates for the user to score, seven outfits, every pose the brief lists, four facings, the instanced draw that puts everyone on screen at once, and the close figure (the doll). This page is for the agents who build on them.

- The art is in `src/art/figures/`: `body.js`, `poses.js`, `outfits.js`, `templates.js`, `compose.js`, `shade.js`, `atlas.js`.
- The close figure is in `src/art/doll/`: `grid.js`, `doll.js`.
- The renderer is `src/render/figures.js`.
- This folder holds the sample (`index.html`, `main.js`) and its screenshots (`shots/`).

## Run it

Serve the repository on your own port (`python3 tools/serve.py 8232 .`) and open `http://127.0.0.1:8232/samples/figures/`.

- **`?view=sheets`** (the default): every frame of every outfit in all four facings, as the render's sheets hold them.
  - `prop=chibi|soldier` and `ppm=16|24` pick the candidate and density.
  - `outfits=a,b` picks the outfits, each `name` or `name:weapon:carry` (for example `utilities:rifle:slung`).
  - `scale=N` sets the integer scale (2 at 16 px/m, 1 at 24).
- **`?view=lineup`**: both candidates on a concrete floor in the stage.
  - The top rows are A (chibi) and the bottom rows B (soldier). Each candidate has a row standing (every outfit, plus three carries) and a row in action:
    - walking at the low ready, running in PT kit, walking at the high ready;
    - an aimed shot with its flash (which lights its neighbours), kneeling, the magazine out, prone;
    - sitting on a stool with the rifle slung, a vac suit floating 0.9 m up, asleep on a rack.
  - `mood=day|dusk|night|battle|emergency|blackout|ship` sets the light; `zoom=2` the closer picture; `focus=a|b` centres one candidate.
  - `t=` (seconds) freezes a moment; `hud=0` hides the overlay; `budget=1` brings everyone in within the render's budget (nobody is "own").
- **`?view=doll`**: the close figure at the density's scale (`s=` for another).
- **Handles:** `window.__ready` (true once everyone is drawn), `window.__report` (the numbers), `window.__figures` and `window.__stage`.

## The two candidates (DESIGN.md: "figures likewise come down to chibi (tradecraft's pick) or taller proportions, by sample")

Both are life-size in height, so they fit doors, racks and benches drawn to scale. They differ in how the height is shared out (`body.js PROPORTIONS`, metres, turned to pixels by `bodyOf(prop, ppm)`).

| | Height | Head (px) | Heads tall | Rifle | Pistol |
|---|---|---|---|---|---|
| A chibi, 16 px/m | 28 px (1.75 m) | 15 × 12 | 2.33 | 16 px | 7 px |
| A chibi, 24 px/m | 43 px (1.79 m) | 23 × 18 | 2.39 | 24 px | 10 px |
| B soldier, 16 px/m | 31 px (1.94 m with hair) | 7 × 8 | 3.88 | 15 px | 4 px |
| B soldier, 24 px/m | 46 px (1.92 m with hair) | 11 × 12 | 3.83 | 22 px | 6 px |

- **A, the chibi,** is tradecraft's figure: its template rows divided by 16 px/m. At 16 px/m it draws tradecraft's heads, hair and hats pixel for pixel; at 24 px/m the same figure half as fine again.
- **B, the soldier,** has the stylised soldier's proportions (my call on every number): a 0.48 m head, a neck, broad shoulders, a torso long enough for a plate carrier with three pouches, legs with knees.
- **The chibi's guns are drawn bigger than life**, as tradecraft's 16-px rifle and 7-px pistol were, or they would not read. The soldier's are near life.

**Cells** (VIEWS.md 2.2): 2.0 × 2.25 m for standing (32 × 36 px at 16, 48 × 54 at 24).

- A body lying side on takes a long cell, 3.0 × 1.75 m. That is 1.75 m, not VIEWS.md's 1.5 (my call): a prone chibi holds its big head up.
- A body lying end on takes the long cell stood up, 1.75 × 3.0 m.
- A tumble takes a 2.25 m square.

Each cell's anchor (`ax`, `ay`) is the pixel over the sim's spot: the ground under the pelvis, or a floater's pelvis.

## How a figure is made

tradecraft's paper doll, kept where it shows: role letters, parts in draw order, and shading by rule (`shade.js`).

- **Shading:** a lit top edge, shaded right and bottom edges, the shadow of a part above, an inner line where a part lies over another, and an ink outline. tradecraft's numbers were "a solid 70" and the user's pick of 2026-10-26.

What is new is where the parts come from (`compose.js`):

- **A frame is a small 3D pose** (`poses.js POSE`: joint angles, a stance, a weapon rig). It is solved into joints, and the hands go onto the gun by two-bone IK.
- **It is projected through the stage's own camera, softened for sprites.** Depth moves a point down the picture by 0.4 of what the camera would along the facing and 0.12 across it (my call). An arm reaching toward the camera drops a little, without a ball looking like an egg. A body lying along the depth is foreshortened as the floor is (1.0).
- **The parts are drawn far to near:**
  - capsules for limbs (snapped so a 2-px arm is 2 px wide everywhere);
  - a slice polygon for the torso;
  - projected boxes for boots and the pack;
  - head templates;
  - the gun's shape turned with tradecraft's inverse-mapped `turned()`, or, end on, its muzzle a ring of steel round the bore.
- **One pose table serves both candidates, both densities and all four facings.**
- **Facings: four, and the left view is a TRUE left view, composed from the same 3D pose.** It is not the right view mirrored, so the rifle stays in the right hand and its stock in the right shoulder whichever way a marine faces. Facing left, the shouldered rifle is on the far side, half behind the head. The test `figures-art › the rifle stays in the right hand` checks it.

**Heads, hair and hats** (`templates.js`) are tradecraft's templates on its 15 × 12 head, the reference.

- The gear tradecraft never drew is drawn at the same reference size, in the same letters: the utility cover, the vac helmet with its visor and neck ring, the miner's hard hat with its lamp, and a nape line under a hat.
- `headKit()` resamples them to every head size.
- Faces are laid on by rule at the reference's fractions: eyes one by two pixels on the reference, two by three with a glint on the 24-px chibi, one pixel on the small soldier.

**Role letters** (VIEWS.md 3.1's alphabet):

- **The people:** s skin, h hair, t top, p legs, f boots, a hat, y trim, belt, straps and sling, ø plate carrier, æ pouches.
- **The suit:** c the vac suit's shell, ð seal rings, þ visor glass, j the pack, i accent bands, d gloves, ŝ socks.
- **The weapons:** n, v and u; they keep their base tone.
- **Fixed:** e and k ink, o an eye's glint, l a lens glint, b a brow, z a mouth, g gold, m a pin's lit edge.
- **Glows:** ¤ a lamp, ° a green light, ¦ an amber one. These are drawn unlit: the render reads the glow class in the alpha.
- An upper-case role letter is in shade.

## Looks

A look is plain data a person carries; `outfits.js wear(look)` expands it into layers:

```js
{ outfit: 'utilities' | 'nco' | 'pt' | 'vac' | 'vacOpen' | 'carrier' | 'civilian',
  skin: 'light' | 'tan' | 'brown' | 'dark' | 0xrrggbb, hair: { style: 'highTight' | 'lowReg' | 'medReg' | 'shaved' | 'bun' | 'short' | 'braid', color, step: 0 to 3 },
  weapon: 'rifle' | 'pistol' | null, carry: 'low' | 'high' | 'slung', rank, head: null (bare-headed), seed }
```

The outfits follow SETTING.md 5.7 (all colours are my call, to be scored):

- **utilities**, in the Valles pattern ("a blocky disruptive pattern of rust, ochre, umber, basalt grey and dust pink"), with the soft utility cover;
- **nco**, the same with rank pins on both collar points (SETTING 5.5);
- **pt**, an oxblood shirt with the emblem, grey shorts and running shoes;
- **vac**, the light vac suit sealed: a dark counter-pressure skin, a pale hard shell, the Corps' red on the shoulders, seal rings, the chest display lit, the pack, and the helmet with its visor down;
- **vacOpen**, the same suit with the helmet off and clipped to the pack, over the bare neck ring;
- **carrier**, a drab plate carrier with three pouches over utilities, and a drab combat helmet;
- **civilian**, a Europa ice miner: safety-orange coveralls, reflective bands, a dosimeter, and a hard hat with its lamp lit.

**The Valles pattern** (`valles()`) is value noise cut into bands, in blocks of 1 px at 16 px/m and 2 at 24.

- Its coordinates are the body part's own, so it moves with a sleeve and never swims over a walking figure.
- Its colours are darker and redder than they look in a painter. A lighter first set came out yellow through the stage's warm grade and palette snap, and a camouflaged cover read as blond hair. The test checks they land on rust, ochre, umber, basalt and dust pink.

**A carry is part of the look:** slung on the back (a sling across the chest), patrol carry or low ready, or high ready.

- A squad walking with slung rifles therefore shares a sheet. Changing carry is a new sheet, at most two a frame.
- A pistol "slung" is holstered on the right thigh.

## Frames (`poses.js`)

| Band | Frames | Painted |
|---|---|---|
| gait | `idle0-1`, `walk0-3`, `run0-3`, `bound0-3` (the low-g lope: push-off, rise, apex tucked, landing) | with a new face |
| arms | `aim`, `aimhi`, `aimlo`, `fire`, `firehi`, `firelo`, `kneel`, `kneelfire`, `magout`, `magin`, `prone`, `pronefire` | the first time they aim |
| rest | `sit`, `couch` (strapped, on the back), `sleep` (on the back, eyes shut) | the first time they sit or lie |
| float | `float0-1` (zero g's neutral body posture), `tumble1-7` (`float0` turned 45° at a time, shaded after the turn so the light stays upper left) | the first time they float |

- **Frames follow the sim:**
  - `gaitFrame(gait, { stride, tS, phase })` picks walks, runs and bounds by distance (`STEP_M` 0.16, 0.45 and 0.7 m a frame), and idles at 2 fps;
  - `tumbleFrame(rollRad)` picks a tumble;
  - `gunPose(actor, ms)` is tradecraft's: aimed, turned up or down the picture (or to its sides from the front), `KICK_MS` 140, `FLASH_MS` 70, `AFTER_MS` 600, `RAISE_MS` 120, and prone and kneeling fire their own frames.
- **Lying in this projection** (VIEWS.md 3.5): a body on its back with the head north looks like a body standing and facing the camera. So `couch` and `sleep` facing `down` are that front view, and prone facing `up` is the back view. The renderer gives lying frames a long blob, so they read as lying.

## The renderer

```js
import { createFigures } from '../../src/render/figures.js';
const figs = createFigures({ renderer: stage.renderer, prop: 'chibi' });   // ppm, atlasPx (4096), budgetMs, sheetsPerFrame, maxPeople
area.add(figs.group);                                 // or stage.scene.add(); freed with the area
// each frame, before stage.render():
figs.update(people.map(p => ({
  key: lookKey(p), look: p.look,                       // people dressed alike may share a key (and a sheet)
  x: p.x, z: p.z, y: p.liftM,                          // y: a seat, a bound's height, a float (metres)
  face: 'down' | 'up' | 'right' | 'left',
  gait: 'walk', stride: p.strideM, tS, phase: p.phase, // or frame: 'aim' (gunPose().frame), flash: true
  tint: stage.lightAt(p.x, p.z),                       // the light where they stand (lit by a flash within FLASH_LIT_M: the caller's)
  own: p.isPlayer,                                     // never put off
})));
```

- **The atlas** is one 4096² texture allocated on the GPU and never sent whole (tradecraft's crowd, and the user's report of 2026-10-29: "each time I turn it staggers almost a second").
  - A look takes a slot the size of its sheet; a full atlas reuses the slot unseen longest.
  - A slot is filled a band at a time. Each band is painted by a resumable job (`atlas.js bandSteps()`) within `BUDGET_MS` a frame (1.5 at 16 px/m, 3 at 24: VIEWS.md 3.7), and sent alone into its rectangle (`copyTextureToTexture`), at most `SHEETS_PER_FRAME` (2) a frame.
  - Someone whose band isn't up yet stands in a gait frame meanwhile, or, new, appears a frame or two on.
- **Composed frames are shared by shape** (`atlas.js composeCached()`, keyed by `shapeKey()`). A second face in the same outfit pays only for its shading.
- **One draw for everyone:** an `InstancedMesh` of upright cards, with per instance the matrix, the frame's rectangle and the tint.
  - It writes the people's part ID (`PEOPLE_PART`) through the stage's MRT and is seen through like any card (`olySee`).
  - Blobs are a second draw. Each shrinks with height (1 / (1 + 0.6 h), opacity 0.4 down to 0.15) and lengthens under a lying body.
  - Flashes are a third draw: cards from `flashStrip()`, unlit, nudged toward the camera (behind the head from behind).
- **Placing a card:** the cell's anchor row lands on the sim's spot. The card stands as many rows nearer the camera as the cell has below its anchor, so its toes never sink into the floor.

**Seats and racks** are the caller's: lift the card (`y`) to the seat or mattress top. A stool as high as `bodyOf(prop).seatM` takes a sitter with no lift.

## The close figure (`src/art/doll/doll.js`)

```js
import { doll, DOLL_SCALE, woundSpot } from '../../src/art/doll/doll.js';
const pm = doll({ look: { outfit: 'carrier', skin: 'brown' }, hand: 'rifle',
  marks: { carrier: ['used', 'used', 'free'], radio: ['used'], belt: ['used', 'free'], trousers: ['free', 'shows'], chest: ['free', 'free'] },
  wounds: { wounds: [{ n: 1, part: 'torso', kind: 'hole', bleed: 2 }], tourniquets: ['legL'], splints: ['legR'] }, scale: DOLL_SCALE });
// pm: a Pixmap (w × h, opaque, the backdrop round it), pm.spots: where each numbered wound is
```

- **What it is:** tradecraft's doll (the user's redrawn figure of 2026-10-31), ported onto a grid that scales its reference coordinates (`grid.js`). At scale 1 it is tradecraft's 64 × 140; at 1.5 (24 px/m) the same shapes are drawn finer, 96 × 210.
- **`DOLL_SCALE` is `PX_PER_M / 16`** (my call: the same size against the picture at either density, its pixels half the stage's). VIEWS.md 4.1 proposes 9 × `PX_PER_M` doll pixels a metre, which is scale 2 at 16 px/m and 3 at 24. That is one argument: `?view=doll&s=2`.
- **What OLYMPUS puts on it:**
  - **Utilities:** the Valles pattern (each cloth tone becomes that tone of the pattern, so folds and light survive), chest pockets with flaps, name tapes, the collar's points with rank pins, cargo pockets, trousers bloused into tan boots, and the cover or the combat helmet.
  - **The plate carrier's load-bearing slots:** three magazine pouches, the radio with its antenna, and the IFAK and the dump pouch at the belt. Each is marked as tradecraft marked a pocket: free a seam, used a gold bag, showing rust.
  - **The light vac suit:** the skin, the shell, the Corps' red, the seal rings, the lit chest display, the pack's straps, and the helmet sealed (a visor with a glint, no face) or off.
  - **A rifle in hand,** to its length (85 cm).
- **Wounds are tradecraft's:**
  - holes, stopped rounds, cuts, gashes, grazes, splits, bruises, breaks and bleeding inside;
  - dressings, tourniquets and splints;
  - blood worn.

## Numbers (2026-11-05, headless Chrome, ANGLE Metal, Apple M5 Pro; node 22 for the pure ones)

**Sheets and the atlas**, by density. The sheet is the same size for both candidates, since the cells are in metres.

| | 16 px/m | 24 px/m |
|---|---|---|
| A look's sheet | 512 × 480 px (960 KB) | 768 × 720 (2.1 MB) |
| gait band | 448 × 144 (252 KB) | 672 × 216 (567 KB) |
| arms band | 416 × 168 (273 KB) | 624 × 252 (614 KB) |
| rest band | 128 × 168 (84 KB) | 192 × 252 (189 KB) |
| float band | 324 × 144 (182 KB) | 486 × 216 (410 KB) |
| looks in a 4096² atlas (64 MB) | 64 | 25 |
| flash strip | 216 × 6, 36 flashes | 324 × 9, 36 flashes |

**Uploads** (the lineup's 28 looks, both candidates):

- 34 bands, 7.9 MB at 16 px/m and 17.7 MB at 24.
- Each band is about 232 KB at 16 px/m and 522 KB at 24, at 0.05 to 0.1 ms of CPU apiece.
- In budget mode no frame sends more than 2 bands (at most 0.5 MB at 16 px/m, 1.1 MB at 24).
- Everyone is in after 77 to 135 frames, and nothing is sent after: steady frames upload nothing.

**Painting** (node, warm):

- A gait band (14 frames × 4 facings) costs 8 to 17 ms the first time a shape is seen, then 4 to 5 ms (16 px/m) and 5 to 8 ms (24 px/m) for each further face, which is its shading alone.
- The budget is checked between cells. Painting therefore peaked at 4 to 7.4 ms in a frame for the two renderers together (one a candidate), when the first faces of a shape came in.
- A whole sheet costs 25 to 35 ms (16 px/m) and 55 to 90 ms (24 px/m).
- The close figure costs 7 to 9 ms at scale 1 and 10 to 13 ms at 1.5.

**Draw calls:** the figures cost 3 instanced draws a renderer at most (cards, blobs, flashes). The lineup, with two candidates, an area and the post, is 7 to 9 draw calls in all.

## Shots (`shots/`, all PNG)

- **`sheet-<prop>-<ppm>-<outfit>.png`:** every frame of a look in all four facings (rows: down, up, right, left), at an integer scale (×2 at 16 px/m, ×1 at 24).
  - The seven outfits carry the rifle at the low ready.
  - Three more show `utilities-rifle-slung`, `carrier-rifle-high` and `utilities-pistol-low`.
  - That is 40 sheets.
- **`lineup-<ppm>-day.png`:** the whole lineup at zoom 1, with the overlay and its numbers.
- **`lineup-<ppm>-zoom2-*.png`:** closer: A by day and at battle stations, B by day and at night (the lamp pools, the glows, a flash lighting its neighbours).
- **`doll-<ppm>.png`:** the close figures.

## Open (for the user to score or decide)

1. **The candidate:** A (chibi) or B (soldier). They are best compared at 24 px/m (`lineup-24-*`, `sheet-*-24-*`).
2. **The Valles pattern's colours and scale,** and every outfit colour (my calls, from SETTING.md's words).
3. **The doll's scale:** the picture's density (`PX_PER_M / 16`, mine) or VIEWS.md's 9 × `PX_PER_M`.
4. **The depth factors:** 0.4 along a facing, 0.12 across (mine). More reads more top-down, less flatter.
5. **Not drawn yet** (VIEWS.md 3.4 lists them):
   - drill;
   - PT exercises;
   - the other reload steps (pouch, charging handle, press-check);
   - casualty frames (down, drag, carry);
   - mag boots, ladders, crawling;
   - the far-window's inset;
   - rank as more than a collar pin.
   They are new entries in `poses.js` and rigs in `compose.js`, painted in new bands.
