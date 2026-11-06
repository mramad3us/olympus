// OLYMPUS data: the sandbox's test rooms, a hallway, a squad bay and an office, as a places area record.
//
// The skeleton's free walk (ROADMAP §4.1, 0.0.3: "a free walk in a test room with the samples'
// figure") needs one small area with every kind of thing the nav and the movement layer meet: a
// doorway (always open), a hinged door (open in the template; closing it lives in data and tests
// only this round, build sheet §7), a corridor, two rooms, and fixtures from the kit's kinds. Its
// rooms, openings and spawn are the build sheet's (§2.2, fixed: the view's test walks them east 3 s
// then north 2 s, from the spawn through the bay's doorway into the hallway); its fixtures are
// PLACES's to author, after the barracks sample's layout A (PLACES §4.4): in the bay three units on
// the south wall facing up (a two-high rack, two wall lockers beside it, a footlocker at its foot),
// a desk and its chair by the north wall, a study table with two stools; in the office two desks
// with chairs, a rifle cabinet and two lockers on the south wall, an extinguisher; in the hallway
// two bins and the night lights at the foot of its north wall.
//
// Kept free on purpose (the sheet's rule): the line z 4.4 from x 24.9 to 29.2 and the column x 28.0
// to 29.0 from z 4.4 to 2.0 (the view test's walk), and every door's 0.9 m clear zone (PLACES §9.6).
// Both openings are placed so a 0.25 m cell centre lies 0.40 m or more from each jamb, so the
// suited class C2 passes them (the bay's doorway is 1.4 m, x 27.8 to 29.2; the office's door 0.9 m,
// x 37.4 to 38.3: its cell centre at x 37.875 clears the jambs by 0.475 and 0.425 m).
//
// Frame: the area's, x east and z south in metres, origin at the hallway's north-west corner. A
// rect is [x0, z0, x1, z1]; an opening on axis 'x' lies in a wall running east–west at z = at,
// from x = a to b. Fixtures are a kit place() spec (src/art/kit/index.js) plus their id and room;
// their sizes are the sim's catalogue (src/sim/places/fixtures.js, equal to the kit's FOOTPRINTS).
// look is the view's: the palette, the wall finish, what hangs on the hallway's north wall, the
// ceiling lamps (r in metres). Frozen literals (TECH §2.4). A fixture's seed is an authored constant,
// at most six a kind (the 0.0.3 sheet's SEEDS_PER_KIND: the office's two lockers take the bay's first
// two, 11 and 12, where they had 54 and 55).

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The sandbox's site: the test rooms on Melas's clock and gravity. */
export const TEST_SITE = deepFreeze({
  id: 'test', kind: 'base', template: 'test@1', name: 'Test rooms', geo: 'melas',
  gravity: { kind: 'surface', gG: 0.38 }, areas: ['test.rooms'],
});

// (a fixture spec: id, kind, make, x, z, face, room, seed, and what else the kit reads)
const fx = (id, kind, make, x, z, face, room, seed, more = {}) => ({ id, kind, make, x, z, face, room, seed, ...more });
const BAY = 't1.bay', OFFICE = 't1.office', HALL = 't1.hall';

/** The test rooms: a hallway 48 × 2.4 m, the bay 11.6 × 7.7 m and the office 11.6 × 7.7 m south of it. */
export const TEST_AREA = deepFreeze({
  id: 'test.rooms', site: 'test', kind: 'floor', code: 't1', name: 'Test rooms', level: 1, originM: [0, 0, 0],
  boundsM: { x0: 0, z0: 0, x1: 48, z1: 10.1 }, spawn: { x: 24.9, z: 4.4, face: 'right' },
  rooms: [
    { id: 't1.hall', kind: 'hall', name: 'Hallway', rect: [0, 0, 48, 2.4], ceilingM: 3.0, zone: 't1.z.hall', floor: { kind: 'vinyl', color: 0x9c917a, seed: 9 } },
    { id: 't1.bay', kind: 'squadBay', name: 'Bay', rect: [20, 2.4, 31.6, 10.1], ceilingM: 3.0, zone: 't1.z.hall', floor: { kind: 'vinyl', color: 0xc4ac97, seed: 3 } },
    { id: 't1.office', kind: 'office', name: 'Office', rect: [36.4, 2.4, 48, 10.1], ceilingM: 3.0, zone: 't1.z.office', floor: { kind: 'vinyl', color: 0xb7b0a8, seed: 6 } },
  ],
  openings: [
    { id: 'o:t1:bay', kind: 'doorway', axis: 'x', at: 2.4, a: 27.8, b: 29.2, rooms: ['t1.hall', 't1.bay'], state: 'open' },
    { id: 'o:t1:office', kind: 'door', axis: 'x', at: 2.4, a: 37.4, b: 38.3, rooms: ['t1.hall', 't1.office'], state: 'open', leaf: 'hinged' },
  ],
  fixtures: [
    // (the bay: three units on the south wall, facing up, heads to the wall; layout A's rhythm of 2.45 m)
    fx('f:t1:rack:01', 'rack2', 'steel', 20.625, 9.075, 'up', BAY, 1, { look: { made: true } }),
    fx('f:t1:rack:02', 'rack2', 'steel', 23.075, 9.075, 'up', BAY, 2, { look: { made: false } }),
    fx('f:t1:rack:03', 'rack2', 'steel', 25.525, 9.075, 'up', BAY, 3, { look: { made: true } }),
    fx('f:t1:locker:01', 'wallLocker', 'single', 21.4, 9.825, 'up', BAY, 11, { look: { colour: 'olive', n: 211 } }),
    fx('f:t1:locker:02', 'wallLocker', 'single', 22.0, 9.825, 'up', BAY, 12, { look: { colour: 'olive', n: 212 } }),
    fx('f:t1:locker:03', 'wallLocker', 'single', 23.85, 9.825, 'up', BAY, 13, { look: { colour: 'olive', n: 213 } }),
    fx('f:t1:locker:04', 'wallLocker', 'tier', 24.45, 9.825, 'up', BAY, 14, { look: { colour: 'olive', n: 214 } }),
    fx('f:t1:locker:05', 'wallLocker', 'single', 26.3, 9.825, 'up', BAY, 15, { look: { colour: 'olive', n: 215 } }),
    fx('f:t1:locker:06', 'wallLocker', 'single', 26.9, 9.825, 'up', BAY, 16, { look: { colour: 'olive', n: 216 } }),
    fx('f:t1:footlocker:01', 'footlocker', 'wood', 20.625, 7.825, 'up', BAY, 21, { look: { n: 211 } }),
    fx('f:t1:footlocker:02', 'footlocker', 'wood', 23.075, 7.825, 'up', BAY, 22, { look: { n: 213 } }),
    fx('f:t1:footlocker:03', 'footlocker', 'wood', 25.525, 7.825, 'up', BAY, 23, { look: { n: 215 } }),
    // (the squad leader's desk by the north wall, its chair south of it: the sitter faces north)
    fx('f:t1:desk:01', 'desk', 'steel', 21.0, 3.0, 'down', BAY, 31, { look: { screen: true } }),
    fx('f:t1:chair:01', 'chair', 'office', 21.0, 3.65, 'up', BAY, 31),
    // (the study table in the south-east of the bay's open floor, two stools on its north side)
    fx('f:t1:table:01', 'studyTable', 'wood', 30.6, 6.25, 'down', BAY, 41),
    fx('f:t1:stool:01', 'stool', 'round', 30.2, 5.5, 'down', BAY, 42),
    fx('f:t1:stool:02', 'stool', 'round', 31.0, 5.5, 'down', BAY, 43),
    // (the office: two desks and their chairs, the rifle cabinet and two lockers on the south wall, an extinguisher by the door's wall)
    fx('f:t1:desk:02', 'desk', 'wood', 41.0, 4.2, 'down', OFFICE, 51),
    fx('f:t1:chair:02', 'chair', 'office', 41.0, 4.85, 'up', OFFICE, 51),
    fx('f:t1:desk:03', 'desk', 'steel', 45.0, 4.2, 'down', OFFICE, 52, { look: { screen: true } }),
    fx('f:t1:chair:03', 'chair', 'office', 45.0, 4.85, 'up', OFFICE, 52),
    fx('f:t1:rifles:01', 'rifleRack', 'cabinet', 42.5, 9.875, 'up', OFFICE, 53),
    fx('f:t1:locker:07', 'wallLocker', 'single', 46.6, 9.825, 'up', OFFICE, 11, { look: { colour: 'grey', n: 301 } }),
    fx('f:t1:locker:08', 'wallLocker', 'single', 47.2, 9.825, 'up', OFFICE, 12, { look: { colour: 'grey', n: 302 } }),
    fx('f:t1:bin:01', 'bin', 'extinguisher', 36.7, 9.8, 'up', OFFICE, 56),
    // (the hallway: two bins against the north wall, the night lights at its foot every 12 m)
    fx('f:t1:bin:02', 'bin', 'bin', 12.0, 0.25, 'down', HALL, 61),
    fx('f:t1:bin:03', 'bin', 'bin', 45.5, 0.25, 'down', HALL, 62),
    fx('f:t1:elight:01', 'emergencyLight', 'night', 6, 0.03, 'down', HALL, 6, { y: 0.22 }),
    fx('f:t1:elight:02', 'emergencyLight', 'night', 18, 0.03, 'down', HALL, 18, { y: 0.22 }),
    fx('f:t1:elight:03', 'emergencyLight', 'night', 30, 0.03, 'down', HALL, 30, { y: 0.22 }),
    fx('f:t1:elight:04', 'emergencyLight', 'night', 42, 0.03, 'down', HALL, 42, { y: 0.22 }),
  ],
  zones: [
    { id: 't1.z.hall', rooms: ['t1.hall', 't1.bay'] },
    { id: 't1.z.office', rooms: ['t1.office'] },
  ],
  portals: [],
  look: {
    palette: 'mars',
    finish: { kind: 'block', c1: 0xd9d1b7, c2: 0x737949, outside: 0xa78c77, floor: 'slab', floorColor: 0xc4ac97 },
    decor: [
      { kind: 'emergency', x: 8 }, { kind: 'emergency', x: 24 }, { kind: 'emergency', x: 40 },
      { kind: 'stencil', x: 24, y: 1.6, text: 'TEST ROOMS' },              // (below the emergency lamp at 2.2 m: at 1.95 its housing covered the R)
      { kind: 'clock', x: 28.5, y: 2.3, w: 0.3, h: 0.3 },
      { kind: 'board', x: 33, y: 1.1, w: 1.2, h: 0.8 },
    ],
    lamps: [
      ...[3, 9, 15, 21, 27, 33, 39, 45].map(x => ({ x, z: 1.2, r: 1.6 })),
      { x: 23.2, z: 6.25, r: 2.2 }, { x: 28.4, z: 6.25, r: 2.2 },
      { x: 39.3, z: 6.25, r: 2.2 }, { x: 45.1, z: 6.25, r: 2.2 },
    ],
  },
});
