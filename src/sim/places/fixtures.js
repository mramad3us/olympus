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
//
// 0.0.6 adds the barber's pole (barberPole: on its own stand, 0.36 m square, its one spot 0.65 m beside it,
// used for 'haircut'; the PX's chairs wait for its building, PLACES §4.13).
// 0.0.3 (the build sheet 0.0.3 §2.1) adds the building's own kinds: wallClock (hung on a wall, or
// standing on a desk, `mount: 'desk'` on the fixture), stairs (a flight a floor walks, at cost 15),
// stairsWell (the floor above's view of it: blocks but its top STAIR_TOP_M 1.0 m, openTopOf, the
// landing) and lampPost; a flight's front (+z as it faces down) is its foot and its back its top (the
// kit's rule, src/art/kit/structure.js stairEnd, which draws a well's landing where blockRectOf leaves
// it open: v0.0.4 drew it at the front, and the user stood on a drawn landing the sim blocked,
// 2026-11-06). From 0.0.6 a flight is entered only at its foot (PLACES §1.5; the user, 2026-11-07,
// playing v0.0.5: "we can get on the upwards staircase from the wrong end", since v0.0.5's flight
// blocked nothing and its open side beside its top lay one step from the floor's band): flightGuardOf
// gives what it stops walkers on, its closed high end (FLIGHT_END_M across its back) and a rail
// FLIGHT_RAIL_M wide along each long side from the top to the foot, but on the side the fixture names
// `open` ('left', its −x as it faces down; 'right', its +x; both when it names none), where the rail
// stops FLIGHT_FOOT_M short of the foot so the foot is stepped onto from that side. A flight that names
// its open side is stepped onto from that side only: a rail runs across its foot too (Echo's feet stand
// 0.42 m from a wall, too close to walk in front of, and a fresh pair of eyes on the shots took that
// strip for the way on). The walker on it walks its lane (flightLaneOf), and its band, near the top
// (flightFarOf), is reached only up the lane; the kit draws the rails and the end from the same rule
// (structure.js flightGuard), and the stairs test holds the two equal. A flight that goes down from its
// floor (dir 'down') is the same turned end for end. A stairsWell's rail runs on along its landing's
// two long sides (landingRailsOf, from 0.0.6: v0.0.5's open sides let a walker crossing the room past
// the landing slide onto it and down), so its landing is walked onto only across its far edge.
// blockRectsOf is every rect a fixture stops walkers on, the one list the nav grid and collision read.
// Kinds gain `seats`, numbered after the spots: { n, dx, dz, y, use,
// head } (rack2: #2 the lower berth at y 0.45 and #3 the upper at 1.35; rack1 #2; a footlocker #2
// at 0.40; a stool's and a chair's #1 spot is its seat, at 0.47 and 0.45), head the end the sleeper's
// head lies at as the piece faces down ('n': its back), turned with it. Seats are not walking spots.
// `sightH` is what a piece hides from PEOPLE's sight grid (src/sim/places/sight.js): its h, unless the
// kind says otherwise (racks 1.0, so a standing eye sees over a bay's racks: the sheet's §8 item 12;
// wall pieces, chairs, stools, stairs and lamp posts none). `cost` is the nav cost of the cells it
// stands on (stairs 15, PLACES §2.1), where it does not block.
//
// seatOf, berthOf and postOf read every area's data (src/sim/places/areas.js), built into an index
// on first use: a rack lists its berths (billets of its room's owner, lower first, null a spare) and
// each berth's locker and footlocker, so a person's berth is found from data alone (PEOPLE §3.2).
// Pure.

import { AREA_LIST } from './areas.js';

const S = (n, dx, dz, use, face = 'up') => Object.freeze({ n, dx, dz, use, face });
const K = (w, d, h, block, wall, uses, spots = [], mount = null, more = {}) => Object.freeze({ w, d, h, block, wall, mount, uses: Object.freeze(uses), spots: Object.freeze(spots), seats: Object.freeze(more.seats ?? []), sightH: more.sightH ?? (mount === 'wall' ? 0 : h), cost: more.cost ?? null });
// (a seat: its number after the spots, its offset as the piece faces down, its height, its use, where the head lies)
const ST = (n, dx, dz, y, use, head = null) => Object.freeze({ n, dx, dz, y, use, head });

/** A stair's walkable top in the well above, metres (the sheet's §4; the kit's STAIR_TOP_M). */
export const STAIR_TOP_M = 1.0;
/**
 * A flight's guard, metres (the kit's FLIGHT_*): its rails' width (the handrail's stringer as drawn), the
 * stretch of its foot left open on its open side, and the depth of its closed high end (my calls: the
 * foot open over its first 1.2 m, four treads, so the widest clearance class, C2's 0.8 m, passes on the
 * 0.25 m grid between the rail across its foot and the newel (1.14 m: at 1.0 m the grid shut C2 out),
 * and the opening shows on the screen past the handrail's picture; the end thin).
 */
export const FLIGHT_RAIL_M = 0.06, FLIGHT_FOOT_M = 1.2, FLIGHT_END_M = 0.06;
/** A stairsWell's guard rail's width by make, metres (the kit's: a rail's bar 0.05, a parapet 0.12); it runs on along the landing's two sides. */
export const WELL_RAIL_M = Object.freeze({ rail: 0.05, wall: 0.12 });

/** The core kinds (PLACES §1.5; sizes equal to the kit's FOOTPRINTS). */
export const CATALOGUE = Object.freeze({
  // berthing
  rack2: K(0.95, 2.05, 1.7, true, true, ['sleep', 'rest'], [S(1, 0, 1.975, 'sleep')], null, { sightH: 1.0, seats: [ST(2, 0, 0, 0.45, 'sleep', 'n'), ST(3, 0, 0, 1.35, 'sleep', 'n')] }),
  rack1: K(0.95, 2.05, 0.75, true, true, ['sleep', 'rest'], [S(1, 0, 1.975, 'sleep')], null, { sightH: 1.0, seats: [ST(2, 0, 0, 0.45, 'sleep', 'n')] }),
  rack3: K(0.8, 2.0, 2.15, true, true, ['sleep', 'store'], [S(1, 0, 1.5, 'sleep')], null, { seats: [ST(2, 0, 0, 0.30, 'sleep', 'n'), ST(3, 0, 0, 0.95, 'sleep', 'n'), ST(4, 0, 0, 1.60, 'sleep', 'n')] }),
  wallLocker: K(0.6, 0.55, 1.9, true, true, ['store', 'dress'], [S(1, 0, 0.825, 'dress')]),
  footlocker: K(0.8, 0.45, 0.4, true, false, ['store', 'sit'], [S(1, 0, 0.625, 'store')], null, { seats: [ST(2, 0, 0, 0.40, 'sit')] }),
  // arms and work
  rifleRack: K(1.4, 0.45, 1.85, true, true, ['stow', 'draw'], [S(1, 0, 0.725, 'draw')]),
  desk: K(1.2, 0.65, 0.76, true, false, ['work'], [S(1, 0, 0.775, 'work')]),
  chair: K(0.5, 0.5, 0.9, false, false, ['sit'], [S(1, 0, 0, 'sit', 'down')], null, { sightH: 0, seats: [ST(1, 0, 0, 0.45, 'sit')] }),
  stool: K(0.36, 0.36, 0.47, false, false, ['sit'], [S(1, 0, 0, 'sit', 'down')], null, { sightH: 0, seats: [ST(1, 0, 0, 0.47, 'sit')] }),
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
  // the building's own (0.0.3)
  wallClock: K(0.30, 0.05, 0.30, false, true, ['read'], [], 'wall'),
  stairs: K(1.2, 4.8, 3.4, false, false, ['climb'], [], null, { sightH: 0, cost: 15 }),
  stairsWell: K(1.2, 4.8, 1.0, true, false, ['climb'], [], null, { cost: 15 }),
  lampPost: K(0.25, 0.25, 4.0, true, false, [], [], null, { sightH: 0 }),
  // (0.0.6: the PX barber's pole on its stand; its spot 0.65 m beside it (0.47 m clear of its stand), on its left as it
  // faces you (the door's side by the PX), facing it, so the pole never stands between you and the camera; it hides
  // nobody: my calls)
  barberPole: K(0.36, 0.36, 2.2, true, false, ['haircut'], [S(1, 0.65, 0, 'haircut', 'left')], null, { sightH: 0 }),
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

/** Where a fixture is mounted: 'wall' or 'desk' (checked by its centre, never by its footprint), else null (on the floor). */
export const mountOf = (fx) => fx.mount ?? kindOf(fx.kind).mount;

/**
 * The rect a blocking fixture stops walkers on: its footprint, but a stairsWell's open top (the last
 * STAIR_TOP_M of the flight, at its back) is left out, so one walks onto the landing and no further.
 * The kit draws a well's landing, its DOWN mark and its guard from the same rule (src/art/kit/
 * structure.js stairEnd: the back is the top), and the stairs test holds the two equal in every area.
 */
export function blockRectOf(fx) {
  const r = footprintOf(fx);
  if (fx.kind !== 'stairsWell') return r;
  const face = fx.face ?? 'down';
  // (the back, the top, is −z of the piece as it faces down: north facing down, south facing up, east facing left, west facing right)
  if (face === 'down') return { ...r, z0: r4(r.z0 + STAIR_TOP_M) };
  if (face === 'up') return { ...r, z1: r4(r.z1 - STAIR_TOP_M) };
  if (face === 'left') return { ...r, x1: r4(r.x1 - STAIR_TOP_M) };
  return { ...r, x0: r4(r.x0 + STAIR_TOP_M) };
}

// (a rect in a piece's own frame, as it faces down, put into the area by its centre and face)
function placed(fx, r) {
  const face = fx.face ?? 'down', [ax, az] = turn(face, r.x0, r.z0), [bx, bz] = turn(face, r.x1, r.z1);
  return { x0: r4(fx.x + Math.min(ax, bx)), z0: r4(fx.z + Math.min(az, bz)), x1: r4(fx.x + Math.max(ax, bx)), z1: r4(fx.z + Math.max(az, bz)) };
}
// (a flight's width and length as it faces down, and its rects in its own frame as one that climbs from
// its floor has them: stepped onto at its front, closed at its back; one that goes down (dir 'down', a
// flight drawn on its upper floor) is the same turned end for end, stepped onto at its top)
const flightWD = (fx) => { const k = kindOf(fx.kind); return [fx.w ?? k.w, fx.d ?? k.d]; };
const flightRect = (fx, r) => placed(fx, fx.dir === 'down' ? { x0: r.x0, x1: r.x1, z0: -r.z1, z1: -r.z0 } : r);

/**
 * What a flight stops walkers on (see the header): [its closed far end, its −x rail, its +x rail, and
 * where it names an open side, the rail across its foot] as area rects, in that order (the kit draws
 * them in the same order: structure.js flightGuard). Empty for any other kind.
 */
export function flightGuardOf(fx) {
  if (fx.kind !== 'stairs') return [];
  const [W, D] = flightWD(fx), far = -D / 2 + FLIGHT_END_M, short = D / 2 - FLIGHT_FOOT_M, open = fx.open ?? null;
  const foot = open ? D / 2 - FLIGHT_RAIL_M : D / 2;
  return [
    { x0: -W / 2, z0: -D / 2, x1: W / 2, z1: far },
    { x0: -W / 2, z0: far, x1: -W / 2 + FLIGHT_RAIL_M, z1: open === 'right' ? D / 2 : short },
    { x0: W / 2 - FLIGHT_RAIL_M, z0: far, x1: W / 2, z1: open === 'left' ? D / 2 : short },
    ...(open ? [{ x0: open === 'right' ? -W / 2 + FLIGHT_RAIL_M : -W / 2, z0: foot, x1: open === 'right' ? W / 2 : W / 2 - FLIGHT_RAIL_M, z1: D / 2 }] : []),
  ].map(r => flightRect(fx, r));
}

/** A flight's lane, the treads between its rails from the end one steps onto (or the rail across it) to its closed end: an area rect; null for any other kind. */
export function flightLaneOf(fx) {
  if (fx.kind !== 'stairs') return null;
  const [W, D] = flightWD(fx);
  return flightRect(fx, { x0: -W / 2 + FLIGHT_RAIL_M, z0: -D / 2 + FLIGHT_END_M, x1: W / 2 - FLIGHT_RAIL_M, z1: fx.open ? D / 2 - FLIGHT_RAIL_M : D / 2 });
}

/**
 * A stairsWell's guard along its landing's two long sides (the rail round the well carried on to the
 * floor's edge, so the landing is walked onto only across its far edge, from 0.0.6): [its −x, its +x]
 * as area rects, WELL_RAIL_M wide by make; empty for any other kind.
 */
export function landingRailsOf(fx) {
  if (fx.kind !== 'stairsWell') return [];
  const k = kindOf(fx.kind), W = fx.w ?? k.w, D = fx.d ?? k.d, t = WELL_RAIL_M[fx.make] ?? WELL_RAIL_M.rail;
  return [{ x0: -W / 2, x1: -W / 2 + t }, { x0: W / 2 - t, x1: W / 2 }].map(r => placed(fx, { ...r, z0: -D / 2, z1: -D / 2 + STAIR_TOP_M }));
}

/** A flight's far end, its last STAIR_TOP_M (the top of one that climbs from its floor), where its band may fire: an area rect; null for any other kind. */
export function flightFarOf(fx) {
  if (fx.kind !== 'stairs') return null;
  const [W, D] = flightWD(fx);
  return flightRect(fx, { x0: -W / 2, z0: -D / 2, x1: W / 2, z1: -D / 2 + STAIR_TOP_M });
}

/** Every rect a fixture stops walkers on: a flight's guard, a blocking piece's blockRectOf (a well's with its landing's rails), else none (the nav grid's and collision's one list). */
export function blockRectsOf(fx) {
  if (fx.kind === 'stairs') return flightGuardOf(fx);
  if (fx.kind === 'stairsWell') return [blockRectOf(fx), ...landingRailsOf(fx)];
  return blocks(fx) ? [blockRectOf(fx)] : [];
}

/** A stairsWell's open top, the landing one walks onto from its floor: its footprint less blockRectOf, { x0, z0, x1, z1 }; null for any other kind. */
export function openTopOf(fx) {
  if (fx.kind !== 'stairsWell') return null;
  const r = footprintOf(fx), b = blockRectOf(fx);
  if (b.z0 > r.z0) return { ...r, z1: b.z0 };
  if (b.z1 < r.z1) return { ...r, z0: b.z1 };
  if (b.x0 > r.x0) return { ...r, x1: b.x0 };
  return { ...r, x0: b.x1 };
}

/** What a fixture hides from the sight grid, metres (its kind's sightH; a fixture may say its own). */
export const sightHOf = (fx) => fx.sightH ?? (mountOf(fx) ? 0 : kindOf(fx.kind).sightH);

const HEADS = Object.freeze({ down: { n: 'n', s: 's', e: 'e', w: 'w' }, up: { n: 's', s: 'n', e: 'w', w: 'e' }, left: { n: 'e', s: 'w', e: 's', w: 'n' }, right: { n: 'w', s: 'e', e: 'n', w: 's' } });

/** A fixture's seats in the area: [{ id: '<fixture>#<n>', fixture, x, z, y, use, head }], turned with it. */
export function seatsOf(fx) {
  const k = kindOf(fx.kind), face = fx.face ?? 'down';
  return k.seats.map(s => {
    const [dx, dz] = turn(face, s.dx, s.dz);
    return { id: `${fx.id}#${s.n}`, fixture: fx.id, x: r4(fx.x + dx), z: r4(fx.z + dz), y: s.y, use: s.use, head: s.head ? HEADS[face][s.head] : null };
  });
}

// ---- the berths and posts index, from every area's data (built once) ----

let index = null;
/** Forget the berths index (TECH §2.3). */
export function resetCaches() { index = null; }
function indexOf() {
  if (index) return index;
  const fixtures = new Map(), byUnit = new Map(), posts = new Map();
  for (const area of AREA_LIST) {
    const rooms = new Map((area.rooms ?? []).map(r => [r.id, r]));
    for (const fx of area.fixtures ?? []) fixtures.set(fx.id, { fx, area });
    for (const fx of area.fixtures ?? []) {
      if (!fx.berths) continue;
      const unitId = rooms.get(fx.room)?.owner?.unitId;
      if (!unitId) continue;
      const m = byUnit.get(unitId) ?? byUnit.set(unitId, new Map()).get(unitId);
      fx.berths.forEach((billet, i) => { if (billet && !m.has(billet)) m.set(billet, `${fx.id}#${i + 2}`); });
    }
    for (const p of area.posts ?? []) posts.set(p.id, Object.freeze({ id: p.id, unitId: p.unitId, area: area.id, seatId: p.seatId }));
  }
  return (index = { fixtures, byUnit, posts });
}

/** A seat by its id, from data alone: { id, fixture, area, room, x, z, y, use, head, lockerId, footlockerId } | null. */
export function seatOf(seatId) {
  const m = /^(.*)#([0-9]+)$/.exec(seatId ?? '');
  if (!m) return null;
  const hit = indexOf().fixtures.get(m[1]);
  if (!hit) return null;
  const { fx, area } = hit, s = seatsOf(fx).find(x => x.id === seatId);
  if (!s) return null;
  const berth = Number(m[2]) - 2;                                  // (a rack's seats #2, #3… are its berths in order)
  return { ...s, area: area.id, room: fx.room, lockerId: fx.lockerIds?.[berth] ?? null, footlockerId: fx.footlockerIds?.[berth] ?? null };
}

/** The seat of a billet's berth: the rack in the room the unit owns that lists the billet, '<rack>#<n>'; null if none. */
export const berthOf = (unitId, billet) => indexOf().byUnit.get(unitId)?.get(billet) ?? null;

/** A post by its id ('fire-watch:2/4-E-2'): { id, unitId, area, seatId } | null. */
export const postOf = (postId) => indexOf().posts.get(postId) ?? null;
