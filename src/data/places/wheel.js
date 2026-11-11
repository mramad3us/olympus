// OLYMPUS data: the Wheel's sector 4, house 1 of the shoot houses in X4's design, layout A, and its apron (PLACES §4.15, §9.9; COMBAT §25.10.2, §25.10.4; the build sheet 0.0.12 §2.1).
//
// The Wheel is the 1 G training hall buried under Base Melas (PLACES §4.15): a ring of R 500 m turning at ω
// 0.1347 rad/s, its floor banked so the felt weight is 1.0 G with Mars's 0.38 under it. Its sectors are `deck`
// areas of Melas's site, each with gravity `spin` from its own record (the `wheel` preset's numbers, src/data/
// places/env.js, spread here so R and ω have one home) and no sky. This round authors the part a lane is run in:
// `melas.wheel.s4`, 40 × 28 m, holding house 1 and the apron round it (the sheet's §8 item 18); the rest of the
// sector, the transfer and the other sectors wait for the Wheel's join.
//
// The frame: x along the spin, prograde (east), z across the band, +z outboard (south), metres. House 1 is 30 ×
// 20 m of ballistic panel walls at (5, 4) to (35, 24); its hall runs along x, 2.4 m wide, at z 12 to 14.4, and its
// rooms' depths lie across the band (PLACES §4.15: "each house's hall and its rooms' depths laid across the band",
// the sheet's §8 item 17), so a long sight line takes 0.38 of the spin's offset. The lane runs east to west (the
// sheet's §8 item 3): the start mark at the hall's east end, room 1 north (centre-fed, COMBAT §25.5.1's reference
// room exactly), room 2 south (corner-fed, a pull, with a locked closet off its east wall), room 3 north (an L,
// dim), then the hall's west end. The other rooms of X4's eight are layouts B and C's, not built: their places
// stand solid between the lane's rooms.
//
// Authored as PLACES §9.9's chunk set (my call on its shape until src/sim/scenes/assemble.js exists): X4_CHUNKS
// are the house's pieces, each in its own frame (origin its rect's least corner, the same orientation as placed:
// mirroring waits for the assembler), with its rooms, its inner openings and its sockets (the door on its edge
// that joins it to the hall or the apron, with the swing and the kick); LAYOUT_A places them, and the area's
// rooms and openings are made from the placements at load, ids as PLACES §1.3 writes them ('w4.r1', 'o:w4:r1').
// An opening records `swing: { hinge: 'a' | 'b', into: <its rooms' index> }` (PLACES §1.6: the hinge end and the
// room it opens into; every leaf of the house has one), a door's `kickDc` (an unlocked door 8, the closet 14;
// COMBAT §25.5's kick) and the closet's `lock: { kind: 'key' }`. The lane's doors are closed at the template
// (the save holds a delta only once one moves), the apron's joins and the hall's east end are doorways.
//
// HOUSE1 is lane A as the sheet's §2.1 gives it to every role: the start mark (its path to room 1's #1 stack
// point 4.00 m), the #2's 0.65 m behind it; the stands (the scene hangs the faces on them, src/sim/arms/turners.js
// is the record), each with its room, its door, its slot (#1's or #2's sector), its trigger (from GO, a door
// opened and a gap, or the player into a zone and a gap: the gaps' ranges here, drawn by the scene), the faces
// it may carry and the facing it turns to (toward its room's threshold); the hall's west zone the last turner
// waits on; the catwalk at 3.0 m over the hall from the house's west end to the east apron and its stairs (drawn
// by the stage, walked by the instructor as the scene places him: not a floor the nav walks, so not a fixture of
// the catalogue: a flight would need a link, PLACES §9.6's stair-foot); the booth, the instructor's place at GO.
// The stands are range pieces (the bay's turner stand, src/data/places/range.js TURNER_STAND and TURNER_FACE),
// not fixtures: the nav walks round none of them (my call: each stands in a corner, off every path).
// Frozen literals, no seed of the world (the hub, 2026-11-05: the world is handcrafted).
import { ENV_PRESETS } from './env.js';
import { TURNER_FACE, TURNER_STAND } from './range.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
const r2 = (v) => Math.round(v * 100) / 100;

/** An interior door's leaf (PLACES §1.6): hinged, 0.4 s each way. */
const LEAF = Object.freeze({ kind: 'door', leaf: 'hinged', openS: 0.4, closeS: 0.4 });
/** COMBAT §25.5's kick against a door: an unlocked door's DC, and the locked closet's (the sheet's §4). */
export const KICK_DC = Object.freeze({ door: 8, locked: 14 });

/**
 * X4's chunks (see the header): { id, tags, needs, rooms: [{ key, kind, name, rect (local), lighting? }], openings
 * (inner): [{ key, kind, axis, at, a, b, rooms: [key, key], swing?, lock?, kickDc? }], sockets: [{ key, side ('n' |
 * 's' | 'e' | 'w': the chunk's edge), a, b (along it, local), swing: { hinge, into: 'self' | 'out' }, kickDc }] }.
 */
export const X4_CHUNKS = deepFreeze({
  'x4:centre': {
    id: 'x4:centre', tags: ['cqb-room'], needs: { gG: [0.3, 1.5] },
    rooms: [{ key: 'room', kind: 'cqbRoom', name: 'Room 1', rect: [0, 0, 5, 4] }],
    openings: [],
    sockets: [{ key: 'door', side: 's', a: 2.05, b: 2.95, room: 'room', swing: { hinge: 'a', into: 'self' }, kickDc: KICK_DC.door }],
  },
  'x4:corner': {
    id: 'x4:corner', tags: ['cqb-room'], needs: { gG: [0.3, 1.5] },
    rooms: [{ key: 'room', kind: 'cqbRoom', name: 'Room 2', rect: [0, 0, 5.5, 5] }, { key: 'closet', kind: 'closet', name: 'Closet', rect: [5.5, 1.75, 6.7, 3.25] }],
    openings: [{ key: 'closet', ...LEAF, axis: 'z', at: 5.5, a: 2.05, b: 2.95, rooms: ['room', 'closet'], state: 'closed', swing: { hinge: 'a', into: 1 }, lock: { kind: 'key', holder: 'house', log: false }, kickDc: KICK_DC.locked }],
    sockets: [{ key: 'door', side: 'n', a: 0.15, b: 1.05, room: 'room', swing: { hinge: 'a', into: 'out' }, kickDc: KICK_DC.door }],
  },
  'x4:ell': {
    id: 'x4:ell', tags: ['cqb-room'], needs: { gG: [0.3, 1.5] },
    rooms: [{ key: 'near', kind: 'cqbRoom', name: 'Room 3', rect: [0, 0, 4, 6.8], lighting: 'cqbDim' }, { key: 'far', kind: 'cqbRoom', name: 'Room 3, the far leg', rect: [4, 0, 7.5, 4], lighting: 'cqbDim' }],
    // (the bend: a wing wall from z 2.6 to 4.0 on the near leg's east side, so the far leg is seen only from past the near leg's middle)
    openings: [{ key: 'leg', kind: 'doorway', axis: 'z', at: 4, a: 0, b: 2.6, rooms: ['near', 'far'], state: 'open' }],
    sockets: [{ key: 'door', side: 's', a: 1.55, b: 2.45, room: 'near', swing: { hinge: 'a', into: 'self' }, kickDc: KICK_DC.door }],
  },
  'x4:booth': {
    id: 'x4:booth', tags: ['booth'], needs: { gG: [0, 3] },
    rooms: [{ key: 'room', kind: 'booth', name: 'Booth', rect: [0, 0, 3.5, 4] }],
    openings: [],
    sockets: [{ key: 'door', side: 'e', a: 1.6, b: 2.5, room: 'room', swing: { hinge: 'a', into: 'self' }, kickDc: KICK_DC.door }],
  },
  'x4:hall': {
    id: 'x4:hall', tags: ['hall'], needs: { gG: [0, 3] },
    rooms: [{ key: 'room', kind: 'hall', name: 'Hall', rect: [0, 0, 30, 2.4] }],
    openings: [],
    sockets: [{ key: 'east', side: 'e', a: 0.6, b: 1.8, room: 'room', doorway: true }],
  },
});

/**
 * Layout A (the sheet's §2.1): each chunk's placement (its local origin in the area's frame), its ids, and what its
 * socket joins (`to`, a room id; `door`, the opening's id). rooms maps a chunk's room keys to ids, openings its
 * inner openings' keys.
 */
export const LAYOUT_A = deepFreeze([
  { chunk: 'x4:hall', at: [5, 12], rooms: { room: 'w4.hall' }, sockets: { east: { id: 'o:w4:hall-e', to: 'w4.apron-e' } } },
  { chunk: 'x4:centre', at: [26.5, 8], rooms: { room: 'w4.r1' }, sockets: { door: { id: 'o:w4:r1', to: 'w4.hall' } } },
  { chunk: 'x4:booth', at: [31.5, 8], rooms: { room: 'w4.booth' }, sockets: { door: { id: 'o:w4:booth', to: 'w4.apron-e' } } },
  { chunk: 'x4:corner', at: [20, 14.4], rooms: { room: 'w4.r2', closet: 'w4.closet' }, openings: { closet: 'o:w4:closet' }, sockets: { door: { id: 'o:w4:r2', to: 'w4.hall' } } },
  { chunk: 'x4:ell', at: [15.5, 5.2], rooms: { near: 'w4.r3', far: 'w4.r3-far' }, openings: { leg: 'o:w4:r3-leg' }, sockets: { door: { id: 'o:w4:r3', to: 'w4.hall' } } },
]);

/** House 1's rect, the area's, metres. */
export const HOUSE1_RECT = Object.freeze([5, 4, 35, 24]);
const AREA_BOUNDS = Object.freeze({ x0: 0, z0: 0, x1: 40, z1: 28 });

const FLOOR_HOUSE = Object.freeze({ kind: 'concrete', color: 0x8a8a86, seed: 4 }), FLOOR_APRON = Object.freeze({ kind: 'deckPlate', color: 0x5c6268, seed: 5 });

// (a chunk's placement made into the area's rooms and openings: local rects moved by `at`, keys made ids)
function place(P) {
  const C = X4_CHUNKS[P.chunk], [ox, oz] = P.at, idOf = (key) => P.rooms[key];
  const rect = (r) => [r2(r[0] + ox), r2(r[1] + oz), r2(r[2] + ox), r2(r[3] + oz)];
  const rooms = C.rooms.map(r => ({ id: idOf(r.key), kind: r.kind, name: r.name, rect: rect(r.rect), ceilingM: 2.8, zone: 'w4.z.house', floor: { ...FLOOR_HOUSE }, ...(r.lighting ? { lighting: r.lighting } : {}) }));
  const openings = C.openings.map(o => ({ id: P.openings[o.key], ...o, at: r2(o.at + (o.axis === 'x' ? oz : ox)), a: r2(o.a + (o.axis === 'x' ? ox : oz)), b: r2(o.b + (o.axis === 'x' ? ox : oz)), rooms: o.rooms.map(idOf) }));
  for (const s of C.sockets) {
    const J = P.sockets[s.key], R = C.rooms.find(r => r.key === s.room).rect, axis = s.side === 'n' || s.side === 's' ? 'x' : 'z';
    const at = s.side === 'n' ? R[1] + oz : s.side === 's' ? R[3] + oz : s.side === 'w' ? R[0] + ox : R[2] + ox, off = axis === 'x' ? ox : oz;
    const base = { id: J.id, axis, at: r2(at), a: r2(s.a + off), b: r2(s.b + off), rooms: [J.to, idOf(s.room)] };
    openings.push(s.doorway ? { ...base, kind: 'doorway', state: 'open' } : { ...base, ...LEAF, state: 'closed', swing: { hinge: s.swing.hinge, into: s.swing.into === 'self' ? 1 : 0 }, kickDc: s.kickDc });
  }
  for (const o of openings) delete o.key;
  return { rooms, openings };
}
const PLACED = LAYOUT_A.map(place);

// The apron round the house: four strips of deck plate, joined at the corners by doorways their full width.
const APRON = [
  { id: 'w4.apron-n', rect: [0, 0, 35, 4] }, { id: 'w4.apron-e', rect: [35, 0, 40, 28] },
  { id: 'w4.apron-s', rect: [0, 24, 35, 28] }, { id: 'w4.apron-w', rect: [0, 4, 5, 24] },
].map(r => ({ ...r, kind: 'apron', name: 'The apron', ceilingM: 8.0, zone: 'w4.z.apron', floor: { ...FLOOR_APRON } }));
const APRON_JOINS = [
  { id: 'o:w4:apron-ne', kind: 'doorway', axis: 'z', at: 35, a: 0, b: 4, rooms: ['w4.apron-n', 'w4.apron-e'], state: 'open' },
  { id: 'o:w4:apron-se', kind: 'doorway', axis: 'z', at: 35, a: 24, b: 28, rooms: ['w4.apron-s', 'w4.apron-e'], state: 'open' },
  { id: 'o:w4:apron-nw', kind: 'doorway', axis: 'x', at: 4, a: 0, b: 5, rooms: ['w4.apron-n', 'w4.apron-w'], state: 'open' },
  { id: 'o:w4:apron-sw', kind: 'doorway', axis: 'x', at: 24, a: 0, b: 5, rooms: ['w4.apron-w', 'w4.apron-s'], state: 'open' },
];

const HOUSE_ROOMS = PLACED.flatMap(p => p.rooms);
// (a fixture spec: id, kind, make, x, z, face, room, seed, and what else the kit reads)
const fx = (id, kind, make, x, z, face, room, seed, more = {}) => ({ id, kind, make, x, z, face, room, seed, ...more });

/** The area `melas.wheel.s4` (the sheet's §2.1): house 1 and its apron, 1 G of spin from the `wheel` preset's numbers, no sky. */
export const WHEEL_S4 = deepFreeze({
  id: 'melas.wheel.s4', site: 'melas', kind: 'deck', code: 'w4', name: 'The Wheel, sector 4', short: 'The Wheel', originM: [0, 0, 0],
  boundsM: { ...AREA_BOUNDS },
  gravity: { ...ENV_PRESETS.wheel.gravity, spin: { ...ENV_PRESETS.wheel.gravity.spin, alongRad: 0 } }, sky: 'none',
  spawn: { x: 33.88, z: 13.2, face: 'left' },
  rooms: [...HOUSE_ROOMS, ...APRON],
  openings: [...PLACED.flatMap(p => p.openings), ...APRON_JOINS],
  fixtures: [
    // (the booth: the control desk and its chair facing the cameras' screens on the north wall, an extinguisher by the door)
    fx('f:w4:desk:01', 'desk', 'steel', 33.0, 8.5, 'down', 'w4.booth', 51, { look: { screen: true } }),
    fx('f:w4:chair:01', 'chair', 'office', 33.0, 9.15, 'up', 'w4.booth', 51),
    fx('f:w4:bin:01', 'bin', 'extinguisher', 34.6, 11.6, 'up', 'w4.booth', 56),
  ],
  zones: [
    { id: 'w4.z.house', rooms: HOUSE_ROOMS.map(r => r.id) },
    { id: 'w4.z.apron', rooms: APRON.map(r => r.id) },
    // (a trigger zone, no air zone: the hall's west end, where the last turner waits on the player; the sheet's w4.z.hallWest, an id in the place grammar)
    { id: 'w4.z.hall-west', kind: 'trigger', name: 'the hall\'s west end', rect: [5, 12, 13.5, 14.4], rooms: [] },
  ],
  portals: [],
  look: {
    palette: 'mars',
    finish: { kind: 'bulkhead', c1: 0x6f747a, c2: 0x4a4f55, outside: 0x2c2f33, floor: 'slab', floorColor: 0x8a8a86 },
    decor: [{ kind: 'stencil', x: 20, y: 1.6, text: 'SECTOR 4' }],
    lamps: [
      ...HOUSE_ROOMS.map(r => ({ x: r2((r.rect[0] + r.rect[2]) / 2), z: r2((r.rect[1] + r.rect[3]) / 2), r: 2.0 })),
      ...[9, 15, 21, 27, 33].map(x => ({ x, z: 13.2, r: 1.6 })),
      ...[5, 15, 25].map(z => ({ x: 37.5, z, r: 2.4 })),
    ],
  },
});

// ---- lane A: the start, the stands, the catwalk, the booth ----

/** The hall's axis (z) and the start mark's x: its path to room 1's #1 stack point (29.95, 12.45) is 4.00 m (the sheet's §2.1). */
const HALL_Z = 13.2, START_X = 33.88, BEHIND_M = 0.65;
/** A stand's facing: toward its room's threshold (radians, 0 east, π/2 south). */
const toward = (x, z, tx, tz) => Math.round(Math.atan2(tz - z, tx - x) * 1e4) / 1e4;
const stand = (n, { facing, ...s }) => ({ key: `turner:${n}`, lane: n, ...s, y: TURNER_FACE.centreY, faceRad: toward(s.x, s.z, ...facing) });

/**
 * Lane A of house 1 (see the header): the area, the hall, the start mark and the #2's, the stands, the hall's west
 * zone, the catwalk and its stairs, the booth; the turner's face and stand (the bay's).
 */
export const HOUSE1 = deepFreeze({
  area: WHEEL_S4.id, lane: 'A', rect: [...HOUSE1_RECT],
  hall: { room: 'w4.hall', rect: [5, 12, 35, 14.4], axisZ: HALL_Z },
  start: { x: START_X, z: HALL_Z, face: 'left' }, two: { x: r2(START_X + BEHIND_M), z: HALL_Z, face: 'left' },
  zones: { hallWest: { id: 'w4.z.hall-west', rect: [5, 12, 13.5, 14.4] } },
  face: { ...TURNER_FACE }, standPiece: { ...TURNER_STAND },
  stands: [
    stand(1, { stand: '1a', room: 'w4.r1', door: 'o:w4:r1', slot: 1, x: 26.8, z: 8.25, name: 'the far left target', faces: ['threat'], trigger: { kind: 'go' }, facing: [29.0, 11.7] }),
    stand(2, { stand: '1b', room: 'w4.r1', door: 'o:w4:r1', slot: 2, x: 31.2, z: 8.25, name: 'the far right target', faces: ['threat', 'noshoot'], trigger: { kind: 'go' }, facing: [29.0, 11.7] }),
    stand(3, { stand: '2a', room: 'w4.r2', door: 'o:w4:r2', slot: 1, x: 24.7, z: 18.7, name: 'the armoured target', faces: ['armoured'], trigger: { kind: 'door', id: 'o:w4:r2', gapMs: [300, 1200] }, facing: [20.6, 14.7] }),
    stand(4, { stand: '2b', room: 'w4.r2', door: 'o:w4:r2', slot: 1, x: 24.95, z: 15.6, name: 'the target by the door', faces: ['noshoot'], trigger: { kind: 'go' }, facing: [20.6, 14.7] }),
    stand(5, { stand: '3a', room: 'w4.r3', door: 'o:w4:r3', slot: 2, x: 16.0, z: 5.7, name: 'the far corner target', faces: ['threat', 'noshoot'], trigger: { kind: 'door', id: 'o:w4:r3', gapMs: [500, 1500] }, facing: [17.5, 11.7] }),
    stand(6, { stand: '3b', room: 'w4.r3', door: 'o:w4:r3', slot: 1, x: 22.5, z: 6.4, name: 'the hostage card', faces: ['hostage'], trigger: { kind: 'go' }, facing: [17.5, 8.0] }),
    stand(7, { stand: 'H', room: 'w4.hall', door: null, slot: 1, x: 7.57, z: HALL_Z, name: 'the hall target', faces: ['threat'], trigger: { kind: 'zone', id: 'w4.z.hall-west', gapMs: [1500, 3000] }, facing: [17.5, 12.0] }),
  ],
  catwalk: { y: 3.0, widthM: 1.0, path: [[6.0, HALL_Z], [36.6, HALL_Z], [36.6, 10.5]], stairs: { top: [36.6, 10.5], foot: [36.6, 6.5], widthM: 1.0 } },
  booth: { room: 'w4.booth', x: 33.0, z: 9.9, face: 'left' },
});
