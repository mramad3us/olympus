// OLYMPUS data: the battalion armoury's front, its porch and the cleaning canopy, the place of "The window and the canopy" (the build sheet v0.0.28 §1 C, item 19; PLACES §4.2, §4.6).
//
// (This is the place's armoury.js. Three more share the name: src/sim/arms/armoury.js holds the rifle's records, src/art/kit/armoury.js
// paints the five kinds below, src/sim/skills/instinct/armoury.js holds T's lines; the scene is src/sim/scenarios/armoury-day.js.)
// The armoury stands after the compaction at [444, 190, 476, 212] on Base Melas's ground (melas.ground, src/data/places/melas.js
// b:armoury), its front door at (460, 212) on its south face, its porch the apron melas.apron-armoury [444, 212, 476, 216], and the
// cleaning canopy b:canopy [446, 216, 472, 238] across the lines walk from it, open on its posts. No interior is built this round (the
// sheet's §0 item 11: the scene never goes inside; the issue hall, the cages, the shop and the vault wait for the career):
//   FRONT    the two issue windows let into the south face either side of the door, at x 451.875 and 468.125 (symmetric about the
//            door, each on a nav cell's centre), each an issueWindow (1.2 × 0.6 × 1.1 m: its counter straddling the wall line, half
//            in, half out) in a bay BAY_M 1.2 m deep cut from the building (src/sim/places/ground.js takes the bays out of the
//            massing, so the armourer stands inside the wall, and the window's own piece draws the wall over the opening); its
//            customer spot (CUSTOMER_M: 1.0 m east of the window's middle and 0.625 m out from the wall line, beside the counter
//            so you never hide the window from the camera, your back to it) and its staff spot (STAFF_M: 0.625 m behind the wall
//            line, facing you: through the opening, 1.1 to 2.1 m up, the camera's rule shows him from the hip to the chest, as
//            samples/armoury-day W-a draws him); and the rack's place, inside the massing behind window 1, where the two rifles lie;
//   PORCH    the two clearing barrels on the apron either side of the door, 3.375 m from it at z 213.625, each a clearingBarrel
//            (0.6 × 0.6 × 1.0 m, the sand drum with its tube at 45° into the sand toward the canopy) with its spot on its north
//            side facing south, so the marine at it faces the camera over the drum; and the sign "CLEAR YOUR WEAPON" stencilled
//            on the wall over the west barrel;
//   ARM_RANK the rank on the apron's west part: two ranks of six, 1.0 m between files and 1.25 m between ranks (the front at
//            z 213.125, the rear at 214.375), facing south, the files from x 445.125, and your place at the rear rank's east end
//            (x 451.125), the thirteenth; clear of window 1's customer spot by 2.47 m and of the barrels' spots by more than 5 m,
//            the door's path (x 459 to 461) untouched (the sheet's §0 item 12; F187 holds it);
//   CANOPY   in the canopy's frame (origin its north-west corner (446, 216), x east, z south; ground.js puts it into the world):
//            eight cleanTables (2.4 × 0.9 × 0.9 m) in two rows of four, centres x 5, 10, 16 and 21 at z 6 and 13 (the walk down
//            the middle, x 11.2 to 14.8, keeps the canopy's point w:canopy at (13, 11) and its path clear, and the lines walk
//            across the canopy's north strip, z 0 to 4, clear of the tables), each with four spots (TABLE_SPOTS_M: two on its
//            north side facing south, so the camera sees your face, your hands and the mat, the scene's booking, and two on its
//            south side), 0.875 m out from its middle on nav cells' centres (0.425 m clear of the table, a C1 walker's 0.33 m with
//            room); two solventTanks (0.6 × 0.6 × 1.0 m) at the canopy's west and east ends and four airHose reels on their
//            posts (0.3 × 0.3 × 1.6 m), all between the tables' rows at z 9.5; six lamps under the roof at x 5, 13 and 21 by z 6 and 13, street
//            lamps' pools (lit while the sun is down, PLACES §3.9's evening cleaning), hung at LAMP_Y_M under the 3.4 m roof.
// The ammunition point's table at KD_AMMO is the KD's own (src/data/places/range.js f:kd:canopy, its issuing bench drawn by the kit's
// kdCanopy), so nothing is added there. Every coordinate is my call; the offsets are written once, here, and the catalogue's kinds
// (src/sim/places/fixtures.js) take their spots from them, so the data and the sim's spotsOf agree by construction. Frozen data.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The armoury's building on the site plan (melas.js), its south face's line and the bays' depth behind it, metres. */
export const ARMOURY_BUILDING = 'b:armoury', FRONT_Z_M = 212, BAY_M = 1.2;
/** An issue window's opening: its counter's top and its head, metres off the ground (the sample's W: 1.1 and 2.1). */
export const WINDOW_SILL_M = 1.1, WINDOW_HEAD_M = 2.1;
/** An issue window's spots from its middle as it faces down (its front, the apron's side, toward +z): the customer's beside the counter, the armourer's behind it. */
export const CUSTOMER_M = Object.freeze([1.0, 0.625]), STAFF_M = Object.freeze([0, -0.625]);
/** A clearing barrel's spot from its middle as it faces down: on its north side, facing south over the drum. */
export const BARREL_SPOT_M = Object.freeze([0, -0.75]);
/** A cleaning table's four spots from its middle as it faces down: [dx, dz, facing] (#1 and #2 north, facing south; #3 and #4 south, facing north). */
export const TABLE_SPOTS_M = deepFreeze([[-0.625, -0.875, 'down'], [0.625, -0.875, 'down'], [-0.625, 0.875, 'up'], [0.625, 0.875, 'up']]);
/** The canopy's lamps' height under its roof, metres. */
export const LAMP_Y_M = 3.3;

const at = (x, z, [dx, dz], face) => ({ x: x + dx, z: z + dz, face });
const window_ = (n, x) => ({ id: `f:armoury:window-${n}`, x, z: FRONT_Z_M, face: 'down', customer: at(x, FRONT_Z_M, CUSTOMER_M, 'up'), staff: at(x, FRONT_Z_M, STAFF_M, 'down'), bay: { x0: x - 0.6, z0: FRONT_Z_M - BAY_M, x1: x + 0.6, z1: FRONT_Z_M } });

/** The south front: the two issue windows (window 1 the rifles', the scene's; window 2's armourer idle) and the rack's place inside. */
export const FRONT = deepFreeze({
  building: ARMOURY_BUILDING,
  windows: [window_(1, 451.875), window_(2, 468.125)],
  rack: { x: 451.875, z: 209.5 },
});

const barrel = (side, x) => ({ id: `f:armoury:barrel-${side}`, x, z: 213.625, face: 'down', spot: at(x, 213.625, BARREL_SPOT_M, 'down') });
/** The porch: the two clearing barrels either side of the door and the sign over the west one. */
export const PORCH = deepFreeze({
  barrels: [barrel('w', 456.625), barrel('e', 463.375)],
  sign: { id: 'f:armoury:sign-clear', x: 456.625, z: 212.015, y: 2.4, face: 'down', text: 'CLEAR YOUR WEAPON' },
});

/** The rank on the apron (see the header): the front rank's six, the rear rank's six, then yours; each { id, x, z, face, rank, file }. */
export const ARM_RANK = deepFreeze([
  ...[0, 1, 2, 3, 4, 5].map(i => ({ id: `arm:rank:${i + 1}`, x: 445.125 + i, z: 213.125, face: 'down', rank: 'front', file: i + 1 })),
  ...[0, 1, 2, 3, 4, 5].map(i => ({ id: `arm:rank:${i + 7}`, x: 445.125 + i, z: 214.375, face: 'down', rank: 'rear', file: i + 1 })),
  { id: 'arm:rank:you', x: 451.125, z: 214.375, face: 'down', rank: 'rear', file: 7 },
]);

/** The cleaning canopy in its own frame (see the header): its origin, the tables, the tanks, the hose reels and the lamps. */
export const CANOPY = deepFreeze({
  origin: [446, 216],
  tables: [5, 10, 16, 21].flatMap((x, i) => [{ n: i + 1, x, z: 6 }, { n: i + 5, x, z: 13 }]).sort((a, b) => a.n - b.n).map(t => ({ id: `f:canopy:t${t.n}`, x: t.x, z: t.z })),
  tanks: [{ id: 'f:canopy:tank-w', x: 1.2, z: 9.5 }, { id: 'f:canopy:tank-e', x: 24.8, z: 9.5 }],
  hoses: [2.5, 7.5, 18.5, 23.5].map((x, i) => ({ id: `f:canopy:hose-${i + 1}`, x, z: 9.5 })),
  lamps: [5, 13, 21].flatMap(x => [6, 13].map(z => ({ x, z }))),
});
