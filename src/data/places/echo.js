// OLYMPUS data: Echo Company's barracks, both floors, as PLACES §4.4 writes them (the build sheet 0.0.3 §2.1).
//
// Authored once, the same in every career (the user, 2026-11-05: "game world is handcrafted"): every
// room, opening, fixture, lamp and stencil below is placed by hand or by a rule of these tables' own
// numbers, and no seed of the world or the career reaches any of it. src/sim/places/echo.js builds
// the two frozen area records (melas.echo.1, melas.echo.2) from these tables: it mirrors the east
// wing about the core's centre line (x 42) for the west wing, lays each squad bay's layout in its
// room, names every piece, and gives each rack its berths.
//
// The frame is PLACES §4.4's building frame: origin at the building's north-west outer corner, x east,
// z south, metres; a rect is [x0, z0, x1, z1]. Rooms run from x 0.3 to 83.7 and z 0.3 to 23.7 (the
// outer walls' 0.3 m lies outside them: the floor's boundsM is the rooms' envelope, the sheet's §8
// item 23); the wings' rooms end at z 17.7, the lobby block (x 39 to 45 and the duty room and mail
// room either side) at 23.7. Floor 1 is 2nd Platoon's east wing and 1st Platoon's west wing round the
// company's core; floor 2 is the Weapons Platoon's east wing and 3rd Platoon's west wing round the
// classroom and the study room.
//
// What these tables hold, and the calls I made where PLACES leaves a number open (my calls):
//   WING_ROOMS     the east wing's rooms with the platoon's key in their ids ({p}); the west wing is
//                  its mirror. The stair room carries its dust vestibule on floor 1 (vest-e, z 15.7 to
//                  17.7: the exit pair 2.0 m apart, PLACES §1.6) and is the whole room on floor 2.
//   WING_DOORS     the wing's openings: the bays' doors on the hallway (from the layout), the south
//                  rooms' doors, the doorway to the core's hallway, the vestibule pair. Interior doors
//                  are 0.9 m with their west jamb at x mod 0.25 = 0.15 (or 0.40, 0.65, 0.90), the bays'
//                  1.0 m at 0.2 mod 0.25, the outside doors 1.1 m centred on the site plan's doors:
//                  so a 0.25 m cell centre lies 0.40 m or more from both jambs and the suited class C2
//                  passes every one of them on the nav grid (the test rooms' rule, kept).
//   WING_FIXTURES  the wing's other rooms' pieces in the east wing's frame (the platoon office, the HQ
//                  rack room, the two heads, the laundry, the cleaning locker, the lounge, the stair and
//                  its vestibule, the hallway's bins, night lights and drinking fountain: 0.0.4, on the
//                  south wall between Head A's door and the bin, so R has a fountain to drink at).
//   CORE_1, CORE_2 the core's rooms, doors and pieces on each floor (the company's offices, the lobby
//                  with the duty desk and its two-faced clock, the vestibule, the main stair, the duty
//                  room and the mail room; upstairs the classroom and the study room).
//   LAYOUTS        the squad bays' three layouts in the room's own frame (origin at its north-west
//                  corner, the door on its south wall), each placed once per bay by BAY_LAYOUTS:
//                    A, open bay: PLACES §4.4's rule (four units north, the squad leader's single in the
//                      north-east corner, three units south, the study table by the door);
//                    B, cubicles: three cubicles along the north wall, two two-high racks in each and
//                      their lockers back to back between them; the squad leader's single and desk in
//                      the south-west, the two spare singles by the door;
//                    C, pods: a column of single pods along each end wall (a rack and the locker at its
//                      foot), the squad leader's pod and one more on the north wall, the two spare
//                      berths in a two-high rack on the south wall.
//                  15 berths each (a squad of 13 and two spare), a locker each, footlockers in A, a
//                  study table and four stools, a wall clock, two windows, the squad's stencil above.
//                  Every piece fits a bay 11.5 m wide (x 0.1 to 11.42) and 7.22 m deep (the hallway's
//                  wall stands astride z 7.3, 0.08 m into the bay): PLACES's layout A put the south row
//                  against z 7.3, so its racks stand at 6.195 here and the aisle is 2.22 m (z 2.5 to 4.72).
//   BERTH_ORDER    the order billets take a layout's berth slots: the 1st Squad's berth table is the
//                  sheet's §2.1 (layout A: n0 ft2-tl and ft2-ar, n1 ft2-r (the player) and ft2-aar, …),
//                  and every layout lists its slots in the same order.
//   A head names how many it serves (PLACES §4.4: side A about 31 of the platoon's 44, side B the
//   other 13, SETTING §4.7's 30% women), which the validator holds to PLACES §9.6's standard.
//   The lamps: a bay's six ceiling panels (the fill, no pool: the sheet's §8 item 7), the halls' night
//   lights every 6 m at 0.3 m, the duty desk's lamp, the fire watch's red lamp at bay-2-1's study
//   table, and an exit sign at every way out.
// Seeds (a piece's look) are authored constants: each kind takes them in turn from SEEDS (6 values,
// the sheet's SEEDS_PER_KIND), never from a world. The layouts' pieces and the rooms' fixtures were
// laid out with a scratch tool from the rules above (the hub's way: a tool proposes, the literal is
// committed, looked at and finished by hand), so this module holds literals only (TECH §2.4).

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The building in the site frame (PLACES §4.2: b:echo at 480, 190), and its floors' heights. */
export const ECHO = deepFreeze({
  site: 'melas', building: 'b:echo', name: 'Echo Company barracks', originM: [480, 0, 190], storeyM: 3.4,
  mirrorX: 84,                                                     // (the west wing is the east wing mirrored: x' = 84 − x)
  floors: [
    { id: 'melas.echo.1', code: 'e1', level: 1, name: 'Echo Company barracks, ground floor', boundsM: { x0: 0.3, z0: 0.3, x1: 83.7, z1: 23.7 } },
    { id: 'melas.echo.2', code: 'e2', level: 2, name: 'Echo Company barracks, first floor', boundsM: { x0: 0.3, z0: 0.3, x1: 83.7, z1: 17.7 } },
  ],
});

/** The authored look seeds a kind takes in turn in an area (at most SEEDS_PER_KIND 6). */
export const SEEDS = Object.freeze([3, 11, 17, 29, 41, 53]);

/** The wings each floor holds: { east, west } → the platoon's key, unit, ordinal and the bays' names and stencils. */
export const WINGS = deepFreeze({
  'melas.echo.1': {
    east: { p: '2', unit: '2/4-E-2', platoon: '2nd Platoon', stair: 'e', bays: [
      { unit: '2/4-E-2-1', name: '1st Squad, 2nd Platoon', stencil: '1ST SQUAD' },
      { unit: '2/4-E-2-2', name: '2nd Squad, 2nd Platoon', stencil: '2ND SQUAD' },
      { unit: '2/4-E-2-3', name: '3rd Squad, 2nd Platoon', stencil: '3RD SQUAD' }] },
    west: { p: '1', unit: '2/4-E-1', platoon: '1st Platoon', stair: 'w', bays: [
      { unit: '2/4-E-1-1', name: '1st Squad, 1st Platoon', stencil: '1ST SQUAD' },
      { unit: '2/4-E-1-2', name: '2nd Squad, 1st Platoon', stencil: '2ND SQUAD' },
      { unit: '2/4-E-1-3', name: '3rd Squad, 1st Platoon', stencil: '3RD SQUAD' }] },
  },
  'melas.echo.2': {
    east: { p: 'w', unit: '2/4-E-4', platoon: 'Weapons Platoon', stair: 'e', bays: [
      { unit: '2/4-E-4-mg', name: 'Machine-gun section, Weapons Platoon', stencil: 'MG SECTION' },
      { unit: '2/4-E-4-mortar', name: 'Mortar section, Weapons Platoon', stencil: 'MORTARS' },
      { unit: '2/4-E-4-assault', name: 'Assault section, Weapons Platoon', stencil: 'ASSAULT' }] },
    west: { p: '3', unit: '2/4-E-3', platoon: '3rd Platoon', stair: 'w', bays: [
      { unit: '2/4-E-3-1', name: '1st Squad, 3rd Platoon', stencil: '1ST SQUAD' },
      { unit: '2/4-E-3-2', name: '2nd Squad, 3rd Platoon', stencil: '2ND SQUAD' },
      { unit: '2/4-E-3-3', name: '3rd Squad, 3rd Platoon', stencil: '3RD SQUAD' }] },
  },
});

/** Which layout each squad bay takes (the sheet's §2.1: every layout on every wing). */
export const BAY_LAYOUTS = deepFreeze({
  'bay-2-1': 'A', 'bay-2-2': 'B', 'bay-2-3': 'C', 'bay-1-1': 'C', 'bay-1-2': 'A', 'bay-1-3': 'B',
  'bay-3-1': 'B', 'bay-3-2': 'C', 'bay-3-3': 'A', 'bay-w-1': 'A', 'bay-w-2': 'B', 'bay-w-3': 'C',
});

/**
 * The billets a layout's berth slots take, in slot order (PEOPLE §2.6's squad: the squad leader, three
 * fire teams of four; null a spare). The weapons platoon's sections are not generated this round
 * (the sheet's §8 item 4), so their bays' berths stand empty.
 */
export const BERTH_ORDER = Object.freeze(['ft2-tl', 'ft2-ar', 'ft2-r', 'ft2-aar', 'ft1-tl', 'ft1-ar', 'ft1-aar', 'ft1-r', 'ft3-tl', 'ft3-ar', 'ft3-aar', 'ft3-r', null, null, 'sl']);
/** A platoon's HQ rack room: its two racks' berths (PEOPLE §2.6's billets on the platoon). */
export const HQ_BERTHS = Object.freeze([['guide', 'doc'], ['ro', null]]);

// ---- the squad bays' layouts (room frame) ----
// (a piece: name, kind, make, x, z, face, more: slots (berth slots, lower first), of (the berths it serves), y, look)
const P = (name, kind, make, x, z, face, more = {}) => ({ name, kind, make, x, z, face, ...more });

// (a bay's ceiling panels: the room's fill, no pool)
const CEILING_6 = [[2.0, 2.0], [5.8, 2.0], [9.6, 2.0], [2.0, 5.3], [5.8, 5.3], [9.6, 5.3]];

// A, open bay (PLACES §4.4's rule laid out): north, four units at x 0.15 + 2.45k, heads to the north
// wall (a rack, two lockers, a footlocker at its foot); the squad leader's single in the north-east
// corner; south, three units, heads to the hallway's wall; the study table by the door, four stools on
// its north side
const LAYOUT_A = {
  door: [8.2, 9.2], stencilX: 5.5, lamps: CEILING_6, table: 'table-1',
  pieces: [
    P('rack-n0', 'rack2', 'steel', 0.625, 1.025, 'down', { slots: [0, 1] }),
    P('locker-n0a', 'wallLocker', 'single', 1.4, 0.275, 'down', { of: [0] }),
    P('locker-n0b', 'wallLocker', 'single', 2, 0.275, 'down', { of: [1] }),
    P('footlocker-n0', 'footlocker', 'wood', 0.625, 2.275, 'down', { of: [0, 1] }),
    P('rack-n1', 'rack2', 'steel', 3.075, 1.025, 'down', { slots: [2, 3] }),
    P('locker-n1a', 'wallLocker', 'single', 3.85, 0.275, 'down', { of: [2] }),
    P('locker-n1b', 'wallLocker', 'single', 4.45, 0.275, 'down', { of: [3] }),
    P('footlocker-n1', 'footlocker', 'wood', 3.075, 2.275, 'down', { of: [2, 3] }),
    P('rack-n2', 'rack2', 'steel', 5.525, 1.025, 'down', { slots: [4, 5] }),
    P('locker-n2a', 'wallLocker', 'single', 6.3, 0.275, 'down', { of: [4] }),
    P('locker-n2b', 'wallLocker', 'single', 6.9, 0.275, 'down', { of: [5] }),
    P('footlocker-n2', 'footlocker', 'wood', 5.525, 2.275, 'down', { of: [4, 5] }),
    P('rack-n3', 'rack2', 'steel', 7.975, 1.025, 'down', { slots: [6, 7] }),
    P('locker-n3a', 'wallLocker', 'single', 8.75, 0.275, 'down', { of: [6] }),
    P('locker-n3b', 'wallLocker', 'single', 9.35, 0.275, 'down', { of: [7] }),
    P('footlocker-n3', 'footlocker', 'wood', 7.975, 2.275, 'down', { of: [6, 7] }),
    P('rack-sl', 'rack1', 'steel', 10.945, 1.025, 'down', { slots: [14] }),
    P('locker-sl', 'wallLocker', 'single', 10.06, 0.275, 'down', { of: [14] }),
    P('footlocker-sl', 'footlocker', 'wood', 10.945, 2.275, 'down', { of: [14] }),
    P('rack-s0', 'rack2', 'steel', 0.625, 6.195, 'up', { slots: [8, 9] }),
    P('locker-s0a', 'wallLocker', 'single', 1.4, 6.945, 'up', { of: [8] }),
    P('locker-s0b', 'wallLocker', 'single', 2, 6.945, 'up', { of: [9] }),
    P('footlocker-s0', 'footlocker', 'wood', 0.625, 4.945, 'up', { of: [8, 9] }),
    P('rack-s1', 'rack2', 'steel', 3.075, 6.195, 'up', { slots: [10, 11] }),
    P('locker-s1a', 'wallLocker', 'single', 3.85, 6.945, 'up', { of: [10] }),
    P('locker-s1b', 'wallLocker', 'single', 4.45, 6.945, 'up', { of: [11] }),
    P('footlocker-s1', 'footlocker', 'wood', 3.075, 4.945, 'up', { of: [10, 11] }),
    P('rack-s2', 'rack2', 'steel', 5.525, 6.195, 'up', { slots: [12, 13] }),
    P('locker-s2a', 'wallLocker', 'single', 6.3, 6.945, 'up', { of: [12] }),
    P('locker-s2b', 'wallLocker', 'single', 6.9, 6.945, 'up', { of: [13] }),
    P('footlocker-s2', 'footlocker', 'wood', 5.525, 4.945, 'up', { of: [12, 13] }),
    P('table-1', 'studyTable', 'wood', 10.3, 6.2, 'down'),
    P('stool-1', 'stool', 'round', 9.7, 5.45, 'down'),
    P('stool-2', 'stool', 'round', 10.1, 5.45, 'down'),
    P('stool-3', 'stool', 'round', 10.5, 5.45, 'down'),
    P('stool-4', 'stool', 'round', 10.9, 5.45, 'down'),
    P('clock-1', 'wallClock', 'school', 9.4, 0.025, 'down', { y: 2.35, faces: ['melas'] }),
    P('window-1', 'window', 'deep', 3.075, 0.05, 'down', { y: 1.75 }),
    P('window-2', 'window', 'deep', 7.975, 0.05, 'down', { y: 1.75 }),
    P('board-1', 'board', 'notice', 0.105, 3.6, 'right', { y: 1.1 }),
  ],
};

// B, cubicles: three cubicles of 3.55 m along the north wall, a lane of 1.1 m before their lockers
// (the first two's back to back); the squad leader's single, locker and desk in the south-west; the
// two spare singles by the door; the study table
const LAYOUT_B = {
  door: [8.2, 9.2], stencilX: 5.1, lamps: CEILING_6, table: 'table-1',
  pieces: [
    P('rack-c0a', 'rack2', 'grey', 0.575, 1.025, 'down', { slots: [0, 1] }),
    P('rack-c0b', 'rack2', 'grey', 1.525, 1.025, 'down', { slots: [2, 3] }),
    P('locker-c01', 'wallLocker', 'tier', 3.375, 0.3, 'left', { of: [0] }),
    P('locker-c02', 'wallLocker', 'tier', 3.375, 0.9, 'left', { of: [1] }),
    P('locker-c03', 'wallLocker', 'tier', 3.375, 1.5, 'left', { of: [2] }),
    P('locker-c04', 'wallLocker', 'tier', 3.375, 2.1, 'left', { of: [3] }),
    P('rack-c1a', 'rack2', 'grey', 6.725, 1.025, 'down', { slots: [4, 5] }),
    P('rack-c1b', 'rack2', 'grey', 5.775, 1.025, 'down', { slots: [6, 7] }),
    P('locker-c11', 'wallLocker', 'tier', 3.925, 0.3, 'right', { of: [4] }),
    P('locker-c12', 'wallLocker', 'tier', 3.925, 0.9, 'right', { of: [5] }),
    P('locker-c13', 'wallLocker', 'tier', 3.925, 1.5, 'right', { of: [6] }),
    P('locker-c14', 'wallLocker', 'tier', 3.925, 2.1, 'right', { of: [7] }),
    P('rack-c2a', 'rack2', 'grey', 7.675, 1.025, 'down', { slots: [8, 9] }),
    P('rack-c2b', 'rack2', 'grey', 8.625, 1.025, 'down', { slots: [10, 11] }),
    P('locker-c21', 'wallLocker', 'tier', 10.475, 0.3, 'left', { of: [8] }),
    P('locker-c22', 'wallLocker', 'tier', 10.475, 0.9, 'left', { of: [9] }),
    P('locker-c23', 'wallLocker', 'tier', 10.475, 1.5, 'left', { of: [10] }),
    P('locker-c24', 'wallLocker', 'tier', 10.475, 2.1, 'left', { of: [11] }),
    P('rack-sl', 'rack1', 'grey', 0.575, 6.195, 'up', { slots: [14] }),
    P('locker-sl', 'wallLocker', 'tier', 1.45, 6.945, 'up', { of: [14] }),
    P('desk-sl', 'desk', 'steel', 2.45, 6.895, 'up'),
    P('chair-sl', 'chair', 'folding', 2.45, 6.2, 'down'),
    P('rack-spare-1', 'rack1', 'grey', 6.6, 6.195, 'up', { slots: [12] }),
    P('locker-spare-1', 'wallLocker', 'tier', 7.475, 6.945, 'up', { of: [12] }),
    P('rack-spare-2', 'rack1', 'grey', 9.775, 6.195, 'up', { slots: [13] }),
    P('locker-spare-2', 'wallLocker', 'tier', 10.65, 6.945, 'up', { of: [13] }),
    P('table-1', 'studyTable', 'steel', 4.6, 6.4, 'down'),
    P('stool-1', 'stool', 'square', 4, 5.65, 'down'),
    P('stool-2', 'stool', 'square', 4.4, 5.65, 'down'),
    P('stool-3', 'stool', 'square', 4.8, 5.65, 'down'),
    P('stool-4', 'stool', 'square', 5.2, 5.65, 'down'),
    P('clock-1', 'wallClock', 'school', 11.05, 0.025, 'down', { y: 2.35, faces: ['melas'] }),
    P('window-1', 'window', 'deep', 1.05, 0.05, 'down', { y: 1.75 }),
    P('window-2', 'window', 'deep', 7.75, 0.05, 'down', { y: 1.75 }),
    P('board-1', 'board', 'notice', 0.105, 3.6, 'right', { y: 1.1 }),
  ],
};

// C, pods: six single pods on the west wall and five on the east (a rack, head to the wall, its locker
// at its foot; the east column's sixth row is the door's clear zone), the last rifleman's and the
// squad leader's pods on the north wall, the spare berths in a two-high rack on the south wall, the
// study table in the middle
const LAYOUT_C = {
  door: [8.2, 9.2], stencilX: 3, lamps: CEILING_6, table: 'table-1',
  pieces: [
    P('rack-w0', 'rack1', 'modular', 1.105, 0.475, 'right', { slots: [0] }),
    P('locker-w0', 'wallLocker', 'mesh', 2.405, 0.475, 'right', { of: [0] }),
    P('rack-w1', 'rack1', 'modular', 1.105, 1.675, 'right', { slots: [1] }),
    P('locker-w1', 'wallLocker', 'mesh', 2.405, 1.675, 'right', { of: [1] }),
    P('rack-w2', 'rack1', 'modular', 1.105, 2.875, 'right', { slots: [2] }),
    P('locker-w2', 'wallLocker', 'mesh', 2.405, 2.875, 'right', { of: [2] }),
    P('rack-w3', 'rack1', 'modular', 1.105, 4.075, 'right', { slots: [3] }),
    P('locker-w3', 'wallLocker', 'mesh', 2.405, 4.075, 'right', { of: [3] }),
    P('rack-w4', 'rack1', 'modular', 1.105, 5.275, 'right', { slots: [4] }),
    P('locker-w4', 'wallLocker', 'mesh', 2.405, 5.275, 'right', { of: [4] }),
    P('rack-w5', 'rack1', 'modular', 1.105, 6.475, 'right', { slots: [5] }),
    P('locker-w5', 'wallLocker', 'mesh', 2.405, 6.475, 'right', { of: [5] }),
    P('rack-e0', 'rack1', 'modular', 10.395, 0.475, 'left', { slots: [6] }),
    P('locker-e0', 'wallLocker', 'mesh', 9.095, 0.475, 'left', { of: [6] }),
    P('rack-e1', 'rack1', 'modular', 10.395, 1.675, 'left', { slots: [7] }),
    P('locker-e1', 'wallLocker', 'mesh', 9.095, 1.675, 'left', { of: [7] }),
    P('rack-e2', 'rack1', 'modular', 10.395, 2.875, 'left', { slots: [8] }),
    P('locker-e2', 'wallLocker', 'mesh', 9.095, 2.875, 'left', { of: [8] }),
    P('rack-e3', 'rack1', 'modular', 10.395, 4.075, 'left', { slots: [9] }),
    P('locker-e3', 'wallLocker', 'mesh', 9.095, 4.075, 'left', { of: [9] }),
    P('rack-e4', 'rack1', 'modular', 10.395, 5.275, 'left', { slots: [10] }),
    P('locker-e4', 'wallLocker', 'mesh', 9.095, 5.275, 'left', { of: [10] }),
    P('rack-n0', 'rack1', 'modular', 4.225, 1.025, 'down', { slots: [11] }),
    P('locker-n0', 'wallLocker', 'mesh', 5, 0.275, 'down', { of: [11] }),
    P('rack-sl', 'rack1', 'modular', 6.375, 1.025, 'down', { slots: [14] }),
    P('locker-sl', 'wallLocker', 'mesh', 7.15, 0.275, 'down', { of: [14] }),
    P('rack-spare', 'rack2', 'modular', 6.775, 6.195, 'up', { slots: [12, 13] }),
    P('locker-spare-1', 'wallLocker', 'mesh', 6, 6.945, 'up', { of: [12] }),
    P('locker-spare-2', 'wallLocker', 'mesh', 7.55, 6.945, 'up', { of: [13] }),
    P('table-1', 'studyTable', 'wood', 4.6, 4.1, 'down'),
    P('stool-1', 'stool', 'round', 4, 3.35, 'down'),
    P('stool-2', 'stool', 'round', 4.4, 3.35, 'down'),
    P('stool-3', 'stool', 'round', 4.8, 3.35, 'down'),
    P('stool-4', 'stool', 'round', 5.2, 3.35, 'down'),
    P('clock-1', 'wallClock', 'school', 5.6, 0.025, 'down', { y: 2.35, faces: ['melas'] }),
    P('window-1', 'window', 'deep', 1.1, 0.05, 'down', { y: 1.75 }),
    P('window-2', 'window', 'deep', 10.4, 0.05, 'down', { y: 1.75 }),
    P('board-1', 'board', 'notice', 11.395, 6.6, 'left', { y: 1.1 }),
  ],
};

/** The squad bays' layouts in the room's frame: { door: [a, b] on the south wall, pieces, stencilX, lamps, table }. */
export const LAYOUTS = deepFreeze({ A: LAYOUT_A, B: LAYOUT_B, C: LAYOUT_C });

// ---- the wings (east wing frame; the west wing is its mirror) ----

// (a room: key ({p} the platoon), kind, rect, name ({P} the platoon's name), lighting class, surface, floor colour)
const R = (key, kind, rect, name, lighting, surface, color, more = {}) => ({ key, kind, rect, name, lighting, surface, color, ...more });
/** The east wing's rooms ({p} the platoon's key, {P} its name); the stair room's vestibule only on floor 1. */
export const WING_ROOMS = deepFreeze([
  R('bay-{p}-1', 'squadBay', [49.0, 0.3, 60.6, 7.6], null, 'berthing', 'tile', 0xc4ac97, { bay: 0, windows: 2 }),
  R('bay-{p}-2', 'squadBay', [60.6, 0.3, 72.2, 7.6], null, 'berthing', 'tile', 0xbea692, { bay: 1, windows: 2 }),
  R('bay-{p}-3', 'squadBay', [72.2, 0.3, 83.7, 7.6], null, 'berthing', 'tile', 0xc8b09a, { bay: 2, windows: 2 }),
  R('hall-{p}', 'hall', [49.0, 7.6, 83.7, 10.0], 'Hallway, {P}', 'hall', 'vinyl', 0x9c917a),
  R('plt-{p}-office', 'office', [49.0, 10.0, 53.0, 17.7], 'Platoon office, {P}', 'office', 'vinyl', 0xb7b0a8),
  R('plt-{p}-hq', 'rackRoom', [53.0, 10.0, 57.0, 17.7], 'Platoon HQ, {P}', 'berthing', 'tile', 0xc4ac97, { hq: true }),
  R('head-{p}a', 'head', [57.0, 10.0, 64.6, 17.7], 'Head A, {P}', 'head', 'tile', 0xb8c0c4, { serves: 31 }),
  R('head-{p}b', 'head', [64.6, 10.0, 69.0, 17.7], 'Head B, {P}', 'head', 'tile', 0xb8c0c4, { serves: 13 }),
  R('laundry-{p}', 'laundry', [69.0, 10.0, 72.6, 17.7], 'Laundry, {P}', 'office', 'tile', 0xb0b4b0),
  R('closet-{p}', 'closet', [72.6, 10.0, 74.6, 17.7], 'Cleaning locker, {P}', 'office', 'concrete', 0xa09a90),
  R('lounge-{p}', 'lounge', [74.6, 10.0, 80.0, 17.7], 'Lounge, {P}', 'office', 'vinyl', 0xa89c86),
  R('stair-{s}', 'stairs', [80.0, 10.0, 83.7, 15.7], '{S} stair', 'hall', 'concrete', 0xa09a90, { floor1: true }),
  R('vest-{s}', 'vestibule', [80.0, 15.7, 83.7, 17.7], '{S} exit', 'hall', 'concrete', 0x9a948a, { floor1: true }),
  R('stair-{s}', 'stairs', [80.0, 10.0, 83.7, 17.7], '{S} stair', 'hall', 'concrete', 0xa09a90, { floor2: true }),
]);

// (an opening: key, kind, axis, at, a, b, the two rooms' keys, template state; outside doors name 'outside')
const O = (key, kind, axis, at, a, b, rooms, state, more = {}) => ({ key, kind, axis, at, a, b, rooms, state, ...more });
/** The east wing's openings (the bays' doors come from their layouts). */
export const WING_DOORS = deepFreeze([
  O('hall-{p}', 'doorway', 'z', 49.0, 7.6, 10.0, ['hall-core', 'hall-{p}'], 'open'),
  O('plt-{p}-office', 'door', 'x', 10.0, 51.4, 52.3, ['hall-{p}', 'plt-{p}-office'], 'closed'),
  O('plt-{p}-hq', 'door', 'x', 10.0, 53.65, 54.55, ['hall-{p}', 'plt-{p}-hq'], 'closed'),
  O('head-{p}a', 'door', 'x', 10.0, 58.15, 59.05, ['hall-{p}', 'head-{p}a'], 'closed'),
  O('head-{p}b', 'door', 'x', 10.0, 65.15, 66.05, ['hall-{p}', 'head-{p}b'], 'closed'),
  O('laundry-{p}', 'door', 'x', 10.0, 69.65, 70.55, ['hall-{p}', 'laundry-{p}'], 'open'),
  O('closet-{p}', 'door', 'x', 10.0, 72.9, 73.8, ['hall-{p}', 'closet-{p}'], 'closed'),
  O('lounge-{p}', 'door', 'x', 10.0, 76.15, 77.05, ['hall-{p}', 'lounge-{p}'], 'open'),
  O('stair-{s}', 'door', 'x', 10.0, 82.65, 83.55, ['hall-{p}', 'stair-{s}'], 'closed'),
  O('vest-{s}', 'extDoor', 'x', 15.7, 82.4, 83.4, ['stair-{s}', 'vest-{s}'], 'closed', { floor1: true }),
  O('{side}-exit', 'extDoor', 'x', 17.7, 81.45, 82.55, ['vest-{s}', 'outside'], 'closed', { floor1: true, exit: true }),
]);

// (a fixture in a wing's room: room key, name, kind, make, x, z, face, more)
const F = (room, name, kind, make, x, z, face, more = {}) => ({ room, name, kind, make, x, z, face, ...more });
/** The east wing's other pieces, in the east wing's frame. */
export const WING_FIXTURES = deepFreeze([
  F('plt-{p}-office', 'desk-1', 'desk', 'steel', 50.2, 13.2, 'down'),
  F('plt-{p}-office', 'chair-1', 'chair', 'office', 50.2, 13.85, 'up'),
  F('plt-{p}-office', 'desk-2', 'desk', 'steel', 51.9, 15.6, 'down'),
  F('plt-{p}-office', 'chair-2', 'chair', 'office', 51.9, 16.25, 'up'),
  F('plt-{p}-office', 'board-1', 'board', 'white', 49.105, 14.4, 'right', { y: 1.1 }),
  F('plt-{p}-office', 'files-1', 'wallLocker', 'tier', 52.4, 17.345, 'up'),
  F('plt-{p}-hq', 'rack-1', 'rack2', 'steel', 55.895, 12, 'left', { hq: 0 }),
  F('plt-{p}-hq', 'rack-2', 'rack2', 'steel', 55.895, 14.2, 'left', { hq: 1 }),
  F('plt-{p}-hq', 'locker-1', 'wallLocker', 'single', 54.2, 17.345, 'up', { hqOf: [0, 0] }),
  F('plt-{p}-hq', 'locker-2', 'wallLocker', 'single', 54.8, 17.345, 'up', { hqOf: [0, 1] }),
  F('plt-{p}-hq', 'locker-3', 'wallLocker', 'single', 55.4, 17.345, 'up', { hqOf: [1, 0] }),
  F('plt-{p}-hq', 'locker-4', 'wallLocker', 'single', 56, 17.345, 'up', { hqOf: [1, 1] }),
  F('head-{p}a', 'shower-1', 'showerStall', 'curtain', 58, 17.12, 'up'),
  F('head-{p}a', 'shower-2', 'showerStall', 'curtain', 58.95, 17.12, 'up'),
  F('head-{p}a', 'shower-3', 'showerStall', 'curtain', 59.9, 17.12, 'up'),
  F('head-{p}a', 'shower-4', 'showerStall', 'curtain', 60.85, 17.12, 'up'),
  F('head-{p}a', 'shower-5', 'showerStall', 'curtain', 61.8, 17.12, 'up'),
  F('head-{p}a', 'stall-1', 'toiletStall', 'steel', 63.77, 11.5, 'left'),
  F('head-{p}a', 'stall-2', 'toiletStall', 'steel', 63.77, 12.45, 'left'),
  F('head-{p}a', 'stall-3', 'toiletStall', 'steel', 63.77, 13.4, 'left'),
  F('head-{p}a', 'stall-4', 'toiletStall', 'steel', 63.77, 14.35, 'left'),
  F('head-{p}a', 'urinal-1', 'urinal', 'wall', 60.6, 10.28, 'down'),
  F('head-{p}a', 'urinal-2', 'urinal', 'wall', 61.3, 10.28, 'down'),
  F('head-{p}a', 'sinks-1', 'sinkRow', 'counter', 57.38, 12.3, 'right'),
  F('head-{p}a', 'sinks-2', 'sinkRow', 'counter', 57.38, 14.2, 'right'),
  F('head-{p}b', 'shower-1', 'showerStall', 'curtain', 65.6, 17.12, 'up'),
  F('head-{p}b', 'shower-2', 'showerStall', 'curtain', 66.55, 17.12, 'up'),
  F('head-{p}b', 'shower-3', 'showerStall', 'curtain', 67.5, 17.12, 'up'),
  F('head-{p}b', 'stall-1', 'toiletStall', 'steel', 68.17, 11.5, 'left'),
  F('head-{p}b', 'stall-2', 'toiletStall', 'steel', 68.17, 12.45, 'left'),
  F('head-{p}b', 'stall-3', 'toiletStall', 'steel', 68.17, 13.4, 'left'),
  F('head-{p}b', 'sinks-1', 'sinkRow', 'counter', 64.98, 13, 'right'),
  F('laundry-{p}', 'washer-1', 'washer', 'washer', 72.195, 12, 'left'),
  F('laundry-{p}', 'washer-2', 'washer', 'washer', 72.195, 12.65, 'left'),
  F('laundry-{p}', 'washer-3', 'washer', 'washer', 72.195, 13.3, 'left'),
  F('laundry-{p}', 'dryer-1', 'washer', 'dryer', 72.195, 13.95, 'left'),
  F('laundry-{p}', 'dryer-2', 'washer', 'dryer', 72.195, 14.6, 'left'),
  F('laundry-{p}', 'dryer-3', 'washer', 'dryer', 72.195, 15.25, 'left'),
  F('laundry-{p}', 'table-1', 'tableSmall', 'folding', 70, 16.6, 'up'),
  F('closet-{p}', 'mop-1', 'bin', 'mop', 74.2, 16.6, 'left'),
  F('closet-{p}', 'mop-2', 'bin', 'mop', 74.2, 17.1, 'left'),
  F('lounge-{p}', 'sofa-1', 'sofa', 'vinyl', 76, 17.195, 'up'),
  F('lounge-{p}', 'sofa-2', 'sofa', 'cloth', 78.4, 17.195, 'up'),
  F('lounge-{p}', 'screen-1', 'board', 'white', 79.895, 13.5, 'left', { y: 1.2 }),
  F('lounge-{p}', 'table-1', 'tableSmall', 'steel', 77, 13.5, 'down'),
  F('lounge-{p}', 'chair-1', 'chair', 'steel', 76.6, 12.75, 'down'),
  F('lounge-{p}', 'chair-2', 'chair', 'steel', 77.4, 12.75, 'down'),
  F('lounge-{p}', 'chair-3', 'chair', 'steel', 76.6, 14.25, 'up'),
  F('lounge-{p}', 'chair-4', 'chair', 'steel', 77.4, 14.25, 'up'),
  F('lounge-{p}', 'vending-1', 'vending', 'drink', 75.08, 11.5, 'right'),
  F('stair-{s}', 'flight', 'stairs', 'concrete', 80.95, 12.9, 'up', { floor1: {  }, dir: 'up' }),
  F('stair-{s}', 'flight', 'stairsWell', 'rail', 80.95, 12.9, 'up', { floor2: {  }, dir: 'down' }),
  F('stair-{s}', 'sign-1', 'sign', 'exit', 80.095, 14.7, 'right', { y: 2, floor1: {  } }),
  F('stair-{s}', 'sign-1', 'sign', 'exit', 80.095, 15.5, 'right', { y: 2, floor2: {  } }),
  F('stair-{s}', 'extinguisher-1', 'bin', 'extinguisher', 82.1, 10.3, 'down'),
  F('vest-{s}', 'sign-1', 'sign', 'exit', 83, 17.605, 'up', { y: 0.8, floor1: {  } }),
  F('hall-{p}', 'fountain-1', 'waterFountain', 'wall', 61, 9.775, 'up'),
  F('hall-{p}', 'bin-1', 'bin', 'bin', 63, 9.72, 'up'),
  F('hall-{p}', 'extinguisher-1', 'bin', 'extinguisher', 74.3, 9.72, 'up'),
  F('hall-{p}', 'night-1', 'emergencyLight', 'night', 51, 7.74, 'down', { y: 0.3 }),
  F('hall-{p}', 'night-2', 'emergencyLight', 'night', 56, 7.74, 'down', { y: 0.3 }),
  F('hall-{p}', 'night-3', 'emergencyLight', 'night', 62, 7.74, 'down', { y: 0.3 }),
  F('hall-{p}', 'night-4', 'emergencyLight', 'night', 67.5, 7.74, 'down', { y: 0.3 }),
  F('hall-{p}', 'night-5', 'emergencyLight', 'night', 74, 7.74, 'down', { y: 0.3 }),
  F('hall-{p}', 'night-6', 'emergencyLight', 'night', 79, 7.74, 'down', { y: 0.3 }),
]);

// ---- the core ----

/** The core's rooms on each floor. */
export const CORE_ROOMS = deepFreeze({
  'melas.echo.1': [
    R('co', 'office', [35.0, 0.3, 39.6, 7.6], 'Company commander', 'office', 'vinyl', 0xb7b0a8),
    R('1sg', 'office', [39.6, 0.3, 44.2, 7.6], 'First sergeant', 'office', 'vinyl', 0xb3aca4),
    R('xo', 'office', [44.2, 0.3, 49.0, 7.6], 'Executive officer and gunnery sergeant', 'office', 'vinyl', 0xb7b0a8),
    R('hall-core', 'hall', [35.0, 7.6, 49.0, 10.0], 'Company hallway', 'hall', 'vinyl', 0x9c917a),
    R('admin', 'office', [35.0, 10.0, 39.0, 17.7], 'Company office', 'office', 'vinyl', 0xb7b0a8),
    R('lobby', 'lobby', [39.0, 10.0, 45.0, 21.0], 'The quarterdeck', 'hall', 'tile', 0xa8a294),
    R('vestibule', 'vestibule', [39.0, 21.0, 45.0, 23.7], 'Vestibule', 'hall', 'concrete', 0x9a948a),
    R('stair-main', 'stairs', [45.0, 10.0, 49.0, 17.7], 'Main stair', 'hall', 'concrete', 0xa09a90),
    R('duty-room', 'rackRoom', [35.0, 17.7, 39.0, 23.7], 'Duty room', 'berthing', 'vinyl', 0xb7b0a8),
    R('mail', 'mail', [45.0, 17.7, 49.0, 23.7], 'Mail room', 'hall', 'vinyl', 0xb0a898),
  ],
  'melas.echo.2': [
    R('classroom', 'classroom', [35.0, 0.3, 49.0, 7.6], 'Company classroom', 'office', 'vinyl', 0xb7b0a8),
    R('hall-core', 'hall', [35.0, 7.6, 49.0, 10.0], 'Company hallway', 'hall', 'vinyl', 0x9c917a),
    R('study', 'study', [35.0, 10.0, 45.0, 17.7], 'Study room', 'office', 'vinyl', 0xb0a898),
    R('stair-main', 'stairs', [45.0, 10.0, 49.0, 17.7], 'Main stair', 'hall', 'concrete', 0xa09a90),
  ],
});

/** The core's openings on each floor. */
export const CORE_DOORS = deepFreeze({
  'melas.echo.1': [
    O('co', 'door', 'x', 7.6, 37.15, 38.05, ['co', 'hall-core'], 'closed'),
    O('1sg', 'door', 'x', 7.6, 41.4, 42.3, ['1sg', 'hall-core'], 'closed'),
    O('xo', 'door', 'x', 7.6, 46.15, 47.05, ['xo', 'hall-core'], 'closed'),
    O('admin', 'door', 'x', 10.0, 36.15, 37.05, ['hall-core', 'admin'], 'closed'),
    O('lobby', 'doorway', 'x', 10.0, 40.0, 44.0, ['hall-core', 'lobby'], 'open'),
    O('stair-main', 'door', 'x', 10.0, 47.65, 48.55, ['hall-core', 'stair-main'], 'closed'),
    O('duty-room', 'door', 'z', 39.0, 19.15, 20.05, ['duty-room', 'lobby'], 'open'),
    O('mail', 'door', 'z', 45.0, 19.15, 20.05, ['lobby', 'mail'], 'open'),
    O('vestibule', 'extDoor', 'x', 21.0, 41.45, 42.55, ['lobby', 'vestibule'], 'closed'),
    O('front', 'extDoor', 'x', 23.7, 41.45, 42.55, ['vestibule', 'outside'], 'closed', { exit: true }),
  ],
  'melas.echo.2': [
    O('classroom', 'door', 'x', 7.6, 37.15, 38.05, ['classroom', 'hall-core'], 'closed'),
    O('classroom-2', 'door', 'x', 7.6, 45.9, 46.8, ['classroom', 'hall-core'], 'closed'),
    O('study', 'door', 'x', 10.0, 40.15, 41.05, ['hall-core', 'study'], 'open'),
    O('stair-main', 'door', 'x', 10.0, 47.65, 48.55, ['hall-core', 'stair-main'], 'closed'),
  ],
});

/** The core's pieces on each floor. */
export const CORE_FIXTURES = deepFreeze({
  'melas.echo.1': [
    F('co', 'desk-1', 'desk', 'wood', 37.3, 2.6, 'up'),
    F('co', 'chair-1', 'chair', 'office', 37.3, 1.95, 'down'),
    F('co', 'chair-2', 'chair', 'office', 36.9, 3.55, 'up'),
    F('co', 'chair-3', 'chair', 'office', 37.7, 3.55, 'up'),
    F('co', 'screen-1', 'board', 'white', 37.3, 0.325, 'down', { y: 1.4 }),
    F('co', 'clock-1', 'wallClock', 'school', 38.8, 0.325, 'down', { y: 2.35, faces: ['melas'] }),
    F('1sg', 'desk-1', 'desk', 'steel', 42, 2.6, 'up'),
    F('1sg', 'chair-1', 'chair', 'office', 42, 1.95, 'down'),
    F('1sg', 'bench-1', 'sofa', 'vinyl', 40.105, 5.2, 'right'),
    F('1sg', 'board-1', 'board', 'plan', 42, 0.325, 'down', { y: 1.2 }),
    F('xo', 'desk-1', 'desk', 'steel', 45.5, 2.6, 'up'),
    F('xo', 'chair-1', 'chair', 'office', 45.5, 1.95, 'down'),
    F('xo', 'desk-2', 'desk', 'steel', 47.7, 2.6, 'up'),
    F('xo', 'chair-2', 'chair', 'office', 47.7, 1.95, 'down'),
    F('admin', 'desk-1', 'desk', 'steel', 36, 13, 'down'),
    F('admin', 'chair-1', 'chair', 'office', 36, 13.65, 'up'),
    F('admin', 'desk-2', 'desk', 'steel', 36, 15.6, 'down'),
    F('admin', 'chair-2', 'chair', 'office', 36, 16.25, 'up'),
    F('admin', 'files-1', 'wallLocker', 'tier', 38, 17.345, 'up'),
    F('admin', 'files-2', 'wallLocker', 'tier', 38.6, 17.345, 'up'),
    F('hall-core', 'night-1', 'emergencyLight', 'night', 36.3, 7.74, 'down', { y: 0.3 }),
    F('hall-core', 'night-2', 'emergencyLight', 'night', 39.4, 7.74, 'down', { y: 0.3 }),
    F('hall-core', 'night-3', 'emergencyLight', 'night', 44.8, 7.74, 'down', { y: 0.3 }),
    F('hall-core', 'night-4', 'emergencyLight', 'night', 48.4, 7.74, 'down', { y: 0.3 }),
    F('hall-core', 'bin-1', 'bin', 'bin', 38.5, 9.72, 'up'),
    F('lobby', 'duty-desk', 'dutyDesk', 'desk', 42, 15, 'down'),
    F('lobby', 'clock-1', 'wallClock', 'station', 42.6, 15, 'down', { mount: 'desk', y: 1.12, faces: ['melas', 'utc'] }),
    F('lobby', 'bench-1', 'sofa', 'vinyl', 39.505, 17.8, 'right'),
    F('lobby', 'honours-1', 'wallLocker', 'mesh', 44.645, 12, 'left'),
    F('vestibule', 'sign-1', 'sign', 'exit', 43.2, 23.605, 'up', { y: 0.8 }),
    F('stair-main', 'flight', 'stairs', 'concrete', 45.95, 12.9, 'up', { dir: 'up' }),
    F('stair-main', 'sign-1', 'sign', 'exit', 45.095, 14.7, 'right', { y: 2 }),
    F('duty-room', 'rack-1', 'rack1', 'steel', 36.105, 18.675, 'right'),
    F('duty-room', 'locker-1', 'wallLocker', 'single', 35.355, 20, 'right'),
    F('duty-room', 'desk-1', 'desk', 'steel', 36.6, 22.95, 'up'),
    F('duty-room', 'chair-1', 'chair', 'office', 36.6, 22.3, 'down'),
    F('mail', 'mail-1', 'wallLocker', 'tier', 48.645, 18.6, 'left'),
    F('mail', 'mail-2', 'wallLocker', 'tier', 48.645, 19.2, 'left'),
    F('mail', 'mail-3', 'wallLocker', 'tier', 48.645, 19.8, 'left'),
    F('mail', 'mail-4', 'wallLocker', 'tier', 48.645, 20.4, 'left'),
    F('mail', 'board-1', 'board', 'notice', 47, 23.675, 'up', { y: 1.1 }),
    F('mail', 'vending-1', 'vending', 'snack', 46, 23.22, 'up'),
  ],
  'melas.echo.2': [
    F('classroom', 'desk-1', 'tableSmall', 'steel', 36.2, 3.6, 'down'),
    F('classroom', 'chair-1a', 'chair', 'folding', 35.9, 4.25, 'up'),
    F('classroom', 'chair-1b', 'chair', 'folding', 36.5, 4.25, 'up'),
    F('classroom', 'desk-8', 'tableSmall', 'steel', 36.2, 5.6, 'down'),
    F('classroom', 'chair-8a', 'chair', 'folding', 35.9, 6.25, 'up'),
    F('classroom', 'chair-8b', 'chair', 'folding', 36.5, 6.25, 'up'),
    F('classroom', 'desk-2', 'tableSmall', 'steel', 38, 3.6, 'down'),
    F('classroom', 'chair-2a', 'chair', 'folding', 37.7, 4.25, 'up'),
    F('classroom', 'chair-2b', 'chair', 'folding', 38.3, 4.25, 'up'),
    F('classroom', 'desk-9', 'tableSmall', 'steel', 38, 5.6, 'down'),
    F('classroom', 'chair-9a', 'chair', 'folding', 37.7, 6.25, 'up'),
    F('classroom', 'chair-9b', 'chair', 'folding', 38.3, 6.25, 'up'),
    F('classroom', 'desk-3', 'tableSmall', 'steel', 39.8, 3.6, 'down'),
    F('classroom', 'chair-3a', 'chair', 'folding', 39.5, 4.25, 'up'),
    F('classroom', 'chair-3b', 'chair', 'folding', 40.1, 4.25, 'up'),
    F('classroom', 'desk-10', 'tableSmall', 'steel', 39.8, 5.6, 'down'),
    F('classroom', 'chair-10a', 'chair', 'folding', 39.5, 6.25, 'up'),
    F('classroom', 'chair-10b', 'chair', 'folding', 40.1, 6.25, 'up'),
    F('classroom', 'desk-4', 'tableSmall', 'steel', 41.6, 3.6, 'down'),
    F('classroom', 'chair-4a', 'chair', 'folding', 41.3, 4.25, 'up'),
    F('classroom', 'chair-4b', 'chair', 'folding', 41.9, 4.25, 'up'),
    F('classroom', 'desk-11', 'tableSmall', 'steel', 41.6, 5.6, 'down'),
    F('classroom', 'chair-11a', 'chair', 'folding', 41.3, 6.25, 'up'),
    F('classroom', 'chair-11b', 'chair', 'folding', 41.9, 6.25, 'up'),
    F('classroom', 'desk-5', 'tableSmall', 'steel', 43.4, 3.6, 'down'),
    F('classroom', 'chair-5a', 'chair', 'folding', 43.1, 4.25, 'up'),
    F('classroom', 'chair-5b', 'chair', 'folding', 43.7, 4.25, 'up'),
    F('classroom', 'desk-12', 'tableSmall', 'steel', 43.4, 5.6, 'down'),
    F('classroom', 'chair-12a', 'chair', 'folding', 43.1, 6.25, 'up'),
    F('classroom', 'chair-12b', 'chair', 'folding', 43.7, 6.25, 'up'),
    F('classroom', 'desk-6', 'tableSmall', 'steel', 45.2, 3.6, 'down'),
    F('classroom', 'chair-6a', 'chair', 'folding', 44.9, 4.25, 'up'),
    F('classroom', 'chair-6b', 'chair', 'folding', 45.5, 4.25, 'up'),
    F('classroom', 'desk-13', 'tableSmall', 'steel', 45.2, 5.6, 'down'),
    F('classroom', 'chair-13a', 'chair', 'folding', 44.9, 6.25, 'up'),
    F('classroom', 'chair-13b', 'chair', 'folding', 45.5, 6.25, 'up'),
    F('classroom', 'desk-7', 'tableSmall', 'steel', 47, 3.6, 'down'),
    F('classroom', 'chair-7a', 'chair', 'folding', 46.7, 4.25, 'up'),
    F('classroom', 'chair-7b', 'chair', 'folding', 47.3, 4.25, 'up'),
    F('classroom', 'desk-14', 'tableSmall', 'steel', 47, 5.6, 'down'),
    F('classroom', 'chair-14a', 'chair', 'folding', 46.7, 6.25, 'up'),
    F('classroom', 'chair-14b', 'chair', 'folding', 47.3, 6.25, 'up'),
    F('classroom', 'podium-1', 'dutyDesk', 'podium', 42, 1.75, 'down'),
    F('classroom', 'screen-1', 'board', 'white', 42, 0.325, 'down', { y: 1.2 }),
    F('classroom', 'clock-1', 'wallClock', 'school', 46, 0.325, 'down', { y: 2.35, faces: ['melas'] }),
    F('hall-core', 'night-1', 'emergencyLight', 'night', 36.3, 7.74, 'down', { y: 0.3 }),
    F('hall-core', 'night-2', 'emergencyLight', 'night', 39.4, 7.74, 'down', { y: 0.3 }),
    F('hall-core', 'night-3', 'emergencyLight', 'night', 44.8, 7.74, 'down', { y: 0.3 }),
    F('hall-core', 'night-4', 'emergencyLight', 'night', 48.4, 7.74, 'down', { y: 0.3 }),
    F('study', 'carrel-1', 'desk', 'field', 36, 17.295, 'up'),
    F('study', 'carrel-2', 'desk', 'field', 37.4, 17.295, 'up'),
    F('study', 'carrel-3', 'desk', 'field', 38.8, 17.295, 'up'),
    F('study', 'carrel-4', 'desk', 'field', 40.2, 17.295, 'up'),
    F('study', 'carrel-5', 'desk', 'field', 41.6, 17.295, 'up'),
    F('study', 'carrel-6', 'desk', 'field', 43, 17.295, 'up'),
    F('study', 'chair-1', 'chair', 'folding', 36, 16.65, 'down'),
    F('study', 'chair-2', 'chair', 'folding', 37.4, 16.65, 'down'),
    F('study', 'chair-3', 'chair', 'folding', 38.8, 16.65, 'down'),
    F('study', 'chair-4', 'chair', 'folding', 40.2, 16.65, 'down'),
    F('study', 'chair-5', 'chair', 'folding', 41.6, 16.65, 'down'),
    F('study', 'chair-6', 'chair', 'folding', 43, 16.65, 'down'),
    F('study', 'books-1', 'wallLocker', 'tier', 35.355, 12, 'right'),
    F('study', 'books-2', 'wallLocker', 'tier', 35.355, 12.6, 'right'),
    F('stair-main', 'flight', 'stairsWell', 'rail', 45.95, 12.9, 'up', { dir: 'down' }),
    F('stair-main', 'sign-1', 'sign', 'exit', 45.095, 15.5, 'right', { y: 2 }),
  ],
});

/** The lamps the tables place beside the rooms' ceiling panels: the duty desk's, the fire watch's red lamp. */
export const LAMPS = deepFreeze({
  'melas.echo.1': [
    { kind: 'desk', x: 41.4, z: 15.0, y: 1.25, room: 'lobby' },
    { kind: 'red', x: 59.3, z: 6.5, y: 0.85, room: 'bay-2-1' },
  ],
  'melas.echo.2': [],
});

/** The posts the places hold (PEOPLE's): the fire watch at bay-2-1's study table (the sheet's §8 item 9). */
export const POSTS = deepFreeze({
  'melas.echo.1': [{ id: 'fire-watch:2/4-E-2', unitId: '2/4-E-2', seat: ['bay-2-1', 'stool-1', 1] }],
  'melas.echo.2': [],
});

/**
 * The three stairs between the floors (a link's stops are the flight's middle on both floors, so the
 * stair keeps its place on screen) and the portals across each: on floor 1 a band across the flight
 * 0.8 m below its top, on floor 2 the well's top edge; each arrival 0.7 m past the other floor's band.
 */
export const STAIRS = deepFreeze([
  { key: 'stair-e', link: 'l:echo:stair-e', x: 80.95, z: 12.9, a: 80.35, b: 81.55, room: 'stair-e' },
  { key: 'stair-main', link: 'l:echo:stair-main', x: 45.95, z: 12.9, a: 45.35, b: 46.55, room: 'stair-main' },
  { key: 'stair-w', link: 'l:echo:stair-w', mirrorOf: 'stair-e', room: 'stair-w' },
]);
/** Where a flight's bands and arrivals lie, as z in the area frame (the flights run z 10.5 to 15.3, foot north, top south). */
export const STAIR_BANDS = deepFreeze({ upBandZ: 14.5, downBandZ: 15.3, arriveUpZ: 16.0, arriveDownZ: 13.8 });

/** The outside doors and the ground's points they lead to (the site frame: the ground's), with the faces. */
export const EXITS = deepFreeze([
  { door: 'front', ground: 'o:melas:echo-front', out: { x: 522.0, z: 214.9 }, in: { x: 42.0, z: 23.0 } },
  { door: 'east-exit', ground: 'o:melas:echo-east-exit', out: { x: 562.0, z: 208.9 }, in: { x: 82.0, z: 17.0 } },
  { door: 'west-exit', ground: 'o:melas:echo-west-exit', out: { x: 482.0, z: 208.9 }, in: { x: 2.0, z: 17.0 } },
]);

/** Where a floor's player stands when no billet decides (a sandbox-style start): the 1st Squad's n1 rack's foot, the east stair's top. */
export const SPAWNS = deepFreeze({ 'melas.echo.1': { x: 52.075, z: 3.3, face: 'down' }, 'melas.echo.2': { x: 80.95, z: 16.0, face: 'down' } });

/** The floors' wall finishes (the kit's). */
export const FINISH = deepFreeze({ kind: 'block', c1: 0xd9d1b7, c2: 0x737949, outside: 0xa78c77, floor: 'slab', floorColor: 0xc4ac97 });
