// OLYMPUS places: the fixture catalogue's core kinds, their footprints and the spots where one uses them.
//
// Adapted from tradecraft v0.2.0-rc3 `src/sim/interiors/furniture.js` (145 lines: `FURNITURE`,
// `footprint()`, `seatsOf()`), on PLACES §1.5's shape. A kind is { w, d, h, block, wall, mount,
// uses, spots }: w across and d deep in metres as the piece stands facing 'down' (its front toward
// +z, the camera), h its height; block whether it stops a walker (PLACES §2.1's blockers: a chair,
// a stool and anything hung on a wall do not, build sheet §8 item 12); wall whether it stands with
// its back to a wall; mount 'wall' for what hangs on one (a board, a sign, a window, a night light:
// it lies on the wall's face, so it is checked by its centre, not its footprint); uses what it is
// for (PLACES's italics); spots where one stands or sits to use it, each { n, dx, dz, use, face }
// from the piece's centre as it faces 'down', turned with it (tradecraft's seatsOf()).
//
// Sizes are the kit's (src/art/kit/index.js FOOTPRINTS: what is drawn is what blocks, build sheet
// §8 item 6), pinned equal by places-validate; PLACES §1.5's own numbers (a rack2 1.75 m tall, a
// wall locker 0.60 deep, a desk 1.60 × 1.40 with its chair) are to be settled in one place later.
// The sim may not import the art (TECH §2.2), so the numbers are written twice and the test is the
// one place that reads both.
//
// Spots are standing places outside the footprint where the piece blocks (inside it where it does
// not: you sit on a chair), so a walker can reach them on the grid (PLACES §9.6: "every spot is
// reachable"). A rack's is at its foot past the footlocker that stands there in every barracks
// layout (PLACES §4.4, layout A), 0.5 m clear of it (my call); a locker's 0.55 m in front of it
// (PLACES: "spot 0.55 in front"); the rest 0.35 to 0.5 m before their fronts (my calls). A spot's
// id is `<fixture id>#<n>` (TECH §2.3.1). What changed from tradecraft: uses are lists, spots carry
// their use, the kinds are the barracks' and the base's (the military catalogue grows with each
// template), seats and staff spots wait for booking (0.0.5) and PEOPLE's posts (0.0.9).
// Pure.

const S = (n, dx, dz, use, face = 'up') => Object.freeze({ n, dx, dz, use, face });
const K = (w, d, h, block, wall, uses, spots = [], mount = null) => Object.freeze({ w, d, h, block, wall, mount, uses: Object.freeze(uses), spots: Object.freeze(spots) });

/** The core kinds (PLACES §1.5; sizes equal to the kit's FOOTPRINTS). */
export const CATALOGUE = Object.freeze({
  // berthing
  rack2: K(0.95, 2.05, 1.7, true, true, ['sleep', 'rest'], [S(1, 0, 1.975, 'sleep')]),
  rack1: K(0.95, 2.05, 0.75, true, true, ['sleep', 'rest'], [S(1, 0, 1.975, 'sleep')]),
  rack3: K(0.8, 2.0, 2.15, true, true, ['sleep', 'store'], [S(1, 0, 1.5, 'sleep')]),
  wallLocker: K(0.6, 0.55, 1.9, true, true, ['store', 'dress'], [S(1, 0, 0.825, 'dress')]),
  footlocker: K(0.8, 0.45, 0.4, true, false, ['store', 'sit'], [S(1, 0, 0.625, 'store')]),
  // arms and work
  rifleRack: K(1.4, 0.45, 1.85, true, true, ['stow', 'draw'], [S(1, 0, 0.725, 'draw')]),
  desk: K(1.2, 0.65, 0.76, true, false, ['work'], [S(1, 0, 0.775, 'work')]),
  chair: K(0.5, 0.5, 0.9, false, false, ['sit'], [S(1, 0, 0, 'sit', 'down')]),
  stool: K(0.36, 0.36, 0.47, false, false, ['sit'], [S(1, 0, 0, 'sit', 'down')]),
  studyTable: K(1.6, 0.8, 0.76, true, false, ['study', 'clean'], [S(1, -0.4, -0.75, 'study', 'down'), S(2, 0.4, -0.75, 'study', 'down')]),
  dutyDesk: K(1.8, 0.8, 1.12, true, false, ['checkIn'], [S(1, 0, 0.85, 'checkIn'), S(2, 0, -0.85, 'staff', 'down')]),
  tableSmall: K(1.2, 0.8, 0.76, true, false, ['eat', 'sit'], [S(1, 0, 0.8, 'eat')]),
  // leisure and life
  sofa: K(1.9, 0.85, 0.85, true, true, ['sit', 'watch'], [S(1, 0, 0.775, 'sit')]),
  vending: K(0.9, 0.8, 1.85, true, true, ['buy'], [S(1, 0, 0.85, 'buy')]),
  bin: K(0.4, 0.4, 0.6, true, true, ['dispose'], [S(1, 0, 0.6, 'dispose')]),
  board: K(1.4, 0.05, 1.0, false, true, ['read'], [S(1, 0, 0.725, 'read')], 'wall'),
  sign: K(1.0, 0.03, 0.3, false, true, ['read'], [], 'wall'),
  window: K(1.2, 0.1, 1.0, false, true, ['look'], [], 'wall'),
  emergencyLight: K(0.4, 0.12, 0.15, false, true, [], [], 'wall'),
  // hygiene
  showerStall: K(0.95, 1.0, 2.0, true, true, ['shower'], [S(1, 0, 0.85, 'shower')]),
  toiletStall: K(0.95, 1.5, 1.85, true, true, ['toilet'], [S(1, 0, 1.1, 'toilet')]),
  urinal: K(0.6, 0.4, 1.2, true, true, ['urinate'], [S(1, 0, 0.6, 'urinate')]),
  sinkRow: K(1.8, 0.6, 1.9, true, true, ['wash', 'shave'], [S(1, -0.6, 0.7, 'wash'), S(2, 0, 0.7, 'wash'), S(3, 0.6, 0.7, 'wash')]),
  washer: K(0.65, 0.65, 0.9, true, true, ['launder'], [S(1, 0, 0.775, 'launder')]),
  waterFountain: K(0.5, 0.35, 1.2, true, true, ['drink'], [S(1, 0, 0.575, 'drink')]),
});

/** The catalogue's kinds, in its order. */
export const KINDS = Object.freeze(Object.keys(CATALOGUE));

/** An offset (dx, dz) from a piece's centre as it faces 'down', turned to its face (tradecraft's turn()). */
export function turn(face, dx, dz) {
  if (face === 'up') return [-dx, -dz];
  if (face === 'left') return [-dz, dx];                           // (its front, +z, to −x)
  if (face === 'right') return [dz, -dx];
  return [dx, dz];
}
const FACES = Object.freeze({ down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] });
const faceOfVec = (x, z) => (Math.abs(x) > Math.abs(z) ? (x < 0 ? 'left' : 'right') : (z < 0 ? 'up' : 'down'));
const r4 = (v) => { const r = Math.round(v * 10000) / 10000; return r === 0 ? 0 : r; };

/** The catalogue record of a fixture's kind; throws on a kind it lacks. */
export function kindOf(kind) {
  const k = CATALOGUE[kind];
  if (!k) throw new Error(`places: no fixture kind '${kind}' in the catalogue (${KINDS.join(', ')})`);
  return k;
}

/** What a fixture { kind, x, z, face, w?, d? } covers on the floor: { x0, z0, x1, z1 } (w and d swapped facing left or right). */
export function footprintOf(fx) {
  const k = kindOf(fx.kind), face = fx.face ?? 'down';
  const W = fx.w ?? k.w, D = fx.d ?? k.d;
  const side = face === 'left' || face === 'right';
  const w = side ? D : W, d = side ? W : D;
  return { x0: r4(fx.x - w / 2), z0: r4(fx.z - d / 2), x1: r4(fx.x + w / 2), z1: r4(fx.z + d / 2) };
}

/** Whether a fixture stops a walker (its kind's block; a fixture may say otherwise with its own block). */
export const blocks = (fx) => fx.block ?? kindOf(fx.kind).block;

/** A fixture's spots in the area: [{ id: '<fixture>#<n>', fixture, x, z, use, face }], turned with it. */
export function spotsOf(fx) {
  const k = kindOf(fx.kind), face = fx.face ?? 'down';
  return k.spots.map(s => {
    const [dx, dz] = turn(face, s.dx, s.dz);
    const [fx0, fz0] = turn(face, ...FACES[s.face]);
    return { id: `${fx.id}#${s.n}`, fixture: fx.id, x: r4(fx.x + dx), z: r4(fx.z + dz), use: s.use, face: faceOfVec(fx0, fz0) };
  });
}

/** Every spot of an area's fixtures, in the fixtures' order. */
export const spotsOfArea = (area) => (area.fixtures ?? []).flatMap(spotsOf);
