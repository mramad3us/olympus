// OLYMPUS data: X4's chunk set, the shoot house's authored pieces (PLACES §9.9; COMBAT §25.7.3, §25.10.4; the build sheet v0.0.21 §1 items 1 to 4; house lens H2, H6).
//
// PLACES §9.9: "the shoot house is the first chunk set, authored as chunks from the start: layout A is four chunks and a hall,
// and layouts B and C are then assemblies rather than new maps". Until v0.0.21 the chunks lived in src/data/places/wheel.js,
// which placed them once as layout A; they move here so the assembler (src/sim/scenes/assemble.js) can place them anywhere
// along the hall, and wheel.js imports them back (with LEAF and KICK_DC, so this module imports nothing of wheel.js: no cycle).
// WHEEL_S4's place() reads only each chunk's rooms, openings and sockets, as it always has, so the set's goldens hold whatever
// else a chunk carries.
//
// A chunk is { id, tags, needs, rooms: [{ key, kind, name, rect (local), lighting? }], openings (inner): [{ key, kind, axis,
// at, a, b, rooms: [key, key], swing?, lock?, kickDc? }], sockets: [{ key, side ('n' | 's' | 'e' | 'w': the chunk's edge), a, b
// (along it, local), room, swing: { hinge, into: 'self' | 'out' }, kickDc }] }, each in its own frame: its origin its rects'
// least corner, oriented as layout A places it (the centre and the ell north of the hall, their doors on their south edge; the
// corner south of it, its door on its north edge). The three rooms a lane is run through carry three things more:
//   side      the side of the hall the chunk was authored on ('n' | 's'); a chunk placed on the other side is flipped across
//             the hall (its z mirrored about its depth: assemble.js)
//   plans     { [family]: plan }: the room plan of each swing family the chunk allows, in its own frame, every field X4_PLANS
//             has (src/data/places/x4-plans.js: parts and inner by key, the hot spots' and corners' ids local, no door or room
//             ids: the assembler names them for the lane). A family is what src/sim/combat/corner.js decides from the door:
//             the centre's `push` (#1 crosses, behind the door) and `pull` (#1 hooks, to his latch side); the corner's
//             `fed-hinge` (A's room 2, corner-fed: #1 to the open side, #2 straight down the fed wall, whatever the swing); the
//             ell's `shape` (#1 to the deeper side, the far leg). Each was authored once by subtracting layout A's `at` from
//             X4_PLANS.A's plan (the centre's push, the corner, the ell); the centre's pull from the lane rule written in
//             x4-plans.js's header (corner.js cornerRuleOf's points and sectors, the paths stack, outer middle, threshold, point
//             on each slot's lane, routed: the house lens's pull.mjs, which reproduced room 1's authored paths to 0.01 m), with
//             every hot spot a 'corner' (a pull door's leaf stands in the hall: nothing behind it in the room). Held by
//             tests/house-shapes.test.mjs's golden X4_CHUNK_PLANS and checked placed by tests/house-cases.test.mjs.
//   family    { push, pull }: the plan's key for each swing (data, so the chunks stay plain and pinned whole by their golden; the
//             x-mirror's families, stage 2's behind MIRROR_ROOMS, would add their own keys)
//   places    the stands' candidate places, PLACES_PER_ROOM 4 a room in its frame, each { x, z, why, name, face? }: the two far corners, the
//             far wall's middle or the far leg, and behind the door (the hinge side's near corner, a push door's only: on a pull
//             the leaf stands in the hall) or by the inner door. `why` is the place's word as seen going in on the authored side
//             ('far left', 'far right', 'far wall', 'far leg', 'behind the door', 'by the inner door'); a room flipped across the
//             hall is entered the other way, so its left and right swap (assemble.js). Layout A's two stands of the room are
//             places 0 and 1, so the chunk's set cast stands where HOUSE1's do; `name` the paper's and the DI's ('the far left
//             target', HOUSE1's names on A's places; left and right swapped with the room), `face` the point a stand faces (the
//             far leg's toward the near leg's middle, A's 3b), else the room's threshold.
//   stands    [{ role, letter, trigger: 'go' | 'door', place }]: the room's two stands by role (src/data/courses.js COURSES
//             .house.draws.cast gives each role's faces and its door gap), `letter` the stand id's ('1a' is lane room 1's a),
//             `place` layout A's (its set cast). The roles travel with the chunk, so the corner's armoured man and the ell's
//             hostage go where their rooms go (house lens H6).
// The house's frame is the area's (x along the spin, east; z across the band, south; metres). Frozen literals: nothing here is
// drawn; the assembler draws (from the seed, per lane), never per career (the hub, 2026-11-05: "game world is handcrafted").

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** An interior door's leaf (PLACES §1.6): hinged, 0.4 s each way. */
export const LEAF = Object.freeze({ kind: 'door', leaf: 'hinged', openS: 0.4, closeS: 0.4 });
/** COMBAT §25.5's kick against a door: an unlocked door's DC, and a locked one's (the closet's, a drawn locked lane door's). */
export const KICK_DC = Object.freeze({ door: 8, locked: 14 });
/** The stands' candidate places a room (house lens H6, C4 V2). */
export const PLACES_PER_ROOM = 4;

/**
 * X4's chunks (see the header): { id, tags, needs, rooms, openings (inner), sockets } as wheel.js has always placed them, and
 * for the lane's three rooms { side, plans, family: { push, pull }, places, stands }.
 */
export const X4_CHUNKS = deepFreeze({
  'x4:centre': {
    id: 'x4:centre', tags: ['cqb-room'], needs: { gG: [0.3, 1.5] },
    rooms: [{ key: 'room', kind: 'cqbRoom', name: 'Room 1', rect: [0, 0, 5, 4] }],
    openings: [],
    sockets: [{ key: 'door', side: 's', a: 2.05, b: 2.95, room: 'room', swing: { hinge: 'a', into: 'self' }, kickDc: KICK_DC.door }],
    side: 'n', family: { push: 'push', pull: 'pull' },
    plans: {
      push: {
        parts: ['room'], threshold: [2.5, 3.7], entry: 'cross',
        stack: [[3.45, 4.45], [4.1, 4.45]], points: [[1, 3.5], [4, 3.5]],
        corners: [{ id: 'nl', x: 0, z: 4 }, { id: 'nr', x: 5, z: 4 }, { id: 'fl', x: 0, z: 0 }, { id: 'fr', x: 5, z: 0 }],
        hot: [{ id: 'nl', x: 0.5, z: 3.5, why: 'behind the door' }, { id: 'nr', x: 4.5, z: 3.5, why: 'corner' }, { id: 'fl', x: 0.5, z: 0.5, why: 'corner' }, { id: 'fr', x: 4.5, z: 0.5, why: 'corner' }],
        sectors: [{ slot: 1, yawRad: -1.7829 }, { slot: 2, yawRad: -1.3587 }],
        dead: [],
        paths: { 1: [[3.45, 4.45], [2.38, 4.3], [2.38, 3.7], [2.08, 3.64], [1, 3.5]], 2: [[4.1, 4.45], [2.92, 4.36], [2.62, 4.3], [2.62, 3.7], [2.92, 3.64], [4, 3.5]] },
        inner: [], light: 'day',
      },
      pull: {
        parts: ['room'], threshold: [2.5, 3.7], entry: 'hook',
        stack: [[3.45, 4.45], [4.1, 4.45]], points: [[4, 3.5], [1, 3.5]],
        corners: [{ id: 'nl', x: 0, z: 4 }, { id: 'nr', x: 5, z: 4 }, { id: 'fl', x: 0, z: 0 }, { id: 'fr', x: 5, z: 0 }],
        hot: [{ id: 'nl', x: 0.5, z: 3.5, why: 'corner' }, { id: 'nr', x: 4.5, z: 3.5, why: 'corner' }, { id: 'fl', x: 0.5, z: 0.5, why: 'corner' }, { id: 'fr', x: 4.5, z: 0.5, why: 'corner' }],
        sectors: [{ slot: 1, yawRad: -1.6341 }, { slot: 2, yawRad: -1.5075 }],
        dead: [],
        paths: { 1: [[3.45, 4.45], [2.62, 4.3], [2.62, 3.7], [2.91, 3.65], [4, 3.5]], 2: [[4.1, 4.45], [2.93, 4.35], [2.38, 4.3], [2.38, 3.7], [2.09, 3.65], [1, 3.5]] },
        inner: [], light: 'day',
      },
    },
    places: [{ x: 0.3, z: 0.25, why: 'far left', name: 'the far left target' }, { x: 4.7, z: 0.25, why: 'far right', name: 'the far right target' }, { x: 2.5, z: 0.25, why: 'far wall', name: 'the target on the far wall' }, { x: 0.35, z: 3.0, why: 'behind the door', name: 'the target behind the door' }],
    stands: [{ role: 'centre-a', letter: 'a', trigger: 'go', place: 0 }, { role: 'centre-b', letter: 'b', trigger: 'go', place: 1 }],
  },
  'x4:corner': {
    id: 'x4:corner', tags: ['cqb-room'], needs: { gG: [0.3, 1.5] },
    rooms: [{ key: 'room', kind: 'cqbRoom', name: 'Room 2', rect: [0, 0, 5.5, 5] }, { key: 'closet', kind: 'closet', name: 'Closet', rect: [5.5, 1.75, 6.7, 3.25] }],
    openings: [{ key: 'closet', ...LEAF, axis: 'z', at: 5.5, a: 2.05, b: 2.95, rooms: ['room', 'closet'], state: 'closed', swing: { hinge: 'a', into: 1 }, lock: { kind: 'key', holder: 'house', log: false }, kickDc: KICK_DC.locked }],
    sockets: [{ key: 'door', side: 'n', a: 0.15, b: 1.05, room: 'room', swing: { hinge: 'a', into: 'out' }, kickDc: KICK_DC.door }],
    side: 's', family: { push: 'fed-hinge', pull: 'fed-hinge' },
    plans: {
      'fed-hinge': {
        parts: ['room'], threshold: [0.6, 0.3], entry: 'hook',
        stack: [[1.55, -0.45], [2.2, -0.45]], points: [[2.6, 0.5], [0.6, 1.8]],
        corners: [{ id: 'nw', x: 0, z: 0 }, { id: 'ne', x: 5.5, z: 0 }, { id: 'se', x: 5.5, z: 5 }, { id: 'sw', x: 0, z: 5 }],
        hot: [{ id: 'ne', x: 5, z: 0.5, why: 'corner' }, { id: 'se', x: 5, z: 4.5, why: 'corner' }, { id: 'sw', x: 0.5, z: 4.5, why: 'corner' }],
        sectors: [{ slot: 1, yawRad: 1.0659 }, { slot: 2, yawRad: 0.8983 }],
        dead: [],
        paths: { 1: [[1.55, -0.45], [0.74, -0.4], [0.72, -0.3], [0.72, 0.3], [0.74, 0.35], [2.6, 0.5]], 2: [[2.2, -0.45], [0.84, -0.46], [0.6, -0.3], [0.6, 0.3], [0.6, 1.8]] },
        inner: ['closet'], light: 'day',
      },
    },
    places: [{ x: 4.7, z: 4.3, why: 'far left', name: 'the far left target' }, { x: 4.95, z: 1.2, why: 'by the inner door', name: 'the target by the door' }, { x: 0.45, z: 4.55, why: 'far right', name: 'the far right target' }, { x: 2.75, z: 4.6, why: 'far wall', name: 'the target on the far wall' }],
    stands: [{ role: 'corner-a', letter: 'a', trigger: 'door', place: 0 }, { role: 'corner-b', letter: 'b', trigger: 'go', place: 1 }],
  },
  'x4:ell': {
    id: 'x4:ell', tags: ['cqb-room'], needs: { gG: [0.3, 1.5] },
    rooms: [{ key: 'near', kind: 'cqbRoom', name: 'Room 3', rect: [0, 0, 4, 6.8], lighting: 'cqbDim' }, { key: 'far', kind: 'cqbRoom', name: 'Room 3, the far leg', rect: [4, 0, 7.5, 4], lighting: 'cqbDim' }],
    // (the bend: a wing wall from z 2.6 to 4.0 on the near leg's east side, so the far leg is seen only from past the near leg's middle)
    openings: [{ key: 'leg', kind: 'doorway', axis: 'z', at: 4, a: 0, b: 2.6, rooms: ['near', 'far'], state: 'open' }],
    sockets: [{ key: 'door', side: 's', a: 1.55, b: 2.45, room: 'near', swing: { hinge: 'a', into: 'self' }, kickDc: KICK_DC.door }],
    side: 'n', family: { push: 'shape', pull: 'shape' },
    plans: {
      shape: {
        parts: ['near', 'far'], threshold: [2, 6.5], entry: 'hook',
        stack: [[2.95, 7.25], [3.6, 7.25]], points: [[3, 6.3], [1, 6.3]],
        corners: [{ id: 'nw', x: 0, z: 6.8 }, { id: 'ne', x: 4, z: 6.8 }, { id: 'fw', x: 0, z: 0 }, { id: 'bend', x: 4, z: 2.6 }, { id: 'far-ne', x: 7.5, z: 0 }, { id: 'far-se', x: 7.5, z: 4 }, { id: 'far-sw', x: 4, z: 4 }],
        hot: [{ id: 'nw', x: 0.5, z: 6.3, why: 'behind the door' }, { id: 'ne', x: 3.5, z: 6.3, why: 'corner' }, { id: 'fw', x: 0.5, z: 0.5, why: 'corner' }, { id: 'bend', x: 3.5, z: 3.1, why: 'corner' }, { id: 'far', x: 5.75, z: 2, why: 'far leg' }],
        sectors: [{ slot: 1, yawRad: -1.4848 }, { slot: 2, yawRad: -1.6568 }],
        dead: [[5.75, 2, 2.7]],
        paths: { 1: [[2.95, 7.25], [2.42, 7.16], [2.12, 7.1], [2.12, 6.5], [3, 6.3]], 2: [[3.6, 7.25], [2.31, 7.15], [1.88, 7.1], [1.88, 6.5], [1, 6.3]] },
        far: { path: [[3, 6.3], [3.2, 2.1]], hot: 'far' },
        inner: [], light: 'dim',
      },
    },
    places: [{ x: 0.5, z: 0.5, why: 'far left', name: 'the far corner target' }, { x: 7.0, z: 1.2, why: 'far leg', name: 'the target in the far leg', face: [2, 2.8] }, { x: 5.5, z: 0.4, why: 'far leg', name: "the target on the far leg's wall", face: [2, 2.8] }, { x: 3.4, z: 0.5, why: 'far right', name: 'the far right target' }],
    stands: [{ role: 'ell-a', letter: 'a', trigger: 'door', place: 0 }, { role: 'ell-b', letter: 'b', trigger: 'go', place: 1 }],
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

/** The lane's rooms, by the letter a house's code names them with (C centre, K corner, E ell). */
export const X4_LANE_CHUNKS = Object.freeze({ C: 'x4:centre', K: 'x4:corner', E: 'x4:ell' });
