// OLYMPUS data: MCRN Testudo's deck B, berthing compartment 2, the ship of "Secure for burn" (the anywhere note AW§4.4, §5; PLACES §5.2; the build sheet v0.0.24 §1 D, §3.4).
//
// Testudo is the assault transport that carries a company to Phobos for the void week (PLACES §5.2, CAREER §10.1). Only the
// one compartment the scene plays in is authored this round: a marine berthing compartment of 10 × 6 m under a 2.4 m deckhead,
// its deck plate a mag boot holds on (PLACES §2.7's `plateGrid`: ferrous, a hold every 1.5 m along a face and a pad-eye every
// 3 m in the deck, by rule), the racks along both bulkheads two high with their straps (a rack's berth is where a marine
// straps in for a burn: src/sim/scenarios/burn.js), a wall locker beside each rack, a hatch at each end (stood open, dogged
// back, onto the passage forward and the passage aft: my call), and the handholds along the deckhead's edge, the rule's faces.
// The ship's thrust is its gravity (the site's record: `thrust` at 0 G while it coasts); a burn presses every body toward
// the deck at the burn's g (the plane is the deck, y up off it).
// BERTH_SPOTS names what the scene reads: your rack (the first on the south bulkhead), your locker beside it, the berth's NCO's
// place by the forward hatch. Frame: x along the ship, forward west, z across it, metres; the compartment's north-west corner
// at (1.2, 0). Frozen literals (the hub, 2026-11-05: the world is handcrafted).

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The compartment's rect, metres, and its deckhead. */
export const BERTH_RECT = Object.freeze([1.2, 0, 11.2, 6]), BERTH_CEILING_M = 2.4;
// (the tile 3 m, the pad-eyes' period, so the hold rule's lattice is painted in it: model.js holdNear)
const FLOOR = Object.freeze({ kind: 'deckPlate', color: 0x5c6268, seed: 21, plateM: 1.5, rings: false, metres: 3, padEyeM: 3, padEyeAtM: 0.75 });
const PASSAGE_FLOOR = Object.freeze({ kind: 'deckPlate', color: 0x50555b, seed: 22, plateM: 1.5, rings: false, metres: 3, padEyeM: 3, padEyeAtM: 0.75 });
/** The handholds along the deckhead's edge (the rule's rungs on the north bulkhead, every 1.5 m from 0.75 m). */
const RUNGS = Object.freeze(Array.from({ length: 8 }, (_, k) => Object.freeze({ kind: 'rung', x: 2.25 + 1.5 * k, y: 2.2 })));
// (a fixture spec: id, kind, make, x, z, face, room, seed, and what else the kit reads)
const fx = (id, kind, make, x, z, face, room, seed, more = {}) => ({ id, kind, make, x, z, face, room, seed, ...more });
const ROOM = 'tb.berth-2';
// (the racks: four a bulkhead, heads to the bulkhead, 2.6 m apart; a locker between each two)
const RACK_X = Object.freeze([2.3, 4.9, 7.5, 10.1]), LOCKER_X = Object.freeze([3.6, 6.2, 8.8]);

/** The area `testudo.deck-b.berth-2` (see the header): the compartment and its two passages' ends, the ship's thrust (the site's), no sky. */
export const BERTH_2 = deepFreeze({
  id: 'testudo.deck-b.berth-2', site: 'mcrn-testudo', kind: 'deck', code: 'tb', name: 'Testudo, deck B, berthing 2', short: 'Berthing 2', originM: [0, 0, 0],
  boundsM: { x0: 0, z0: 0, x1: 12.4, z1: 6 }, sky: 'none', surface: 'plateGrid',
  spawn: { x: 3.0, z: 3.0, face: 'down' },
  rooms: [
    { id: ROOM, kind: 'berthing', name: 'Berthing 2', rect: [...BERTH_RECT], ceilingM: BERTH_CEILING_M, zone: 'tb.z.berth', surface: 'plateGrid', floor: { ...FLOOR } },
    { id: 'tb.fwd', kind: 'passage', name: 'The passage forward', rect: [0, 1.5, 1.2, 4.5], ceilingM: BERTH_CEILING_M, zone: 'tb.z.berth', surface: 'plateGrid', floor: { ...PASSAGE_FLOOR } },
    { id: 'tb.aft', kind: 'passage', name: 'The passage aft', rect: [11.2, 1.5, 12.4, 4.5], ceilingM: BERTH_CEILING_M, zone: 'tb.z.berth', surface: 'plateGrid', floor: { ...PASSAGE_FLOOR } },
  ],
  openings: [
    { id: 'o:tb:fwd', kind: 'doorway', axis: 'z', at: 1.2, a: 2.5, b: 3.5, rooms: ['tb.fwd', ROOM], state: 'open' },
    { id: 'o:tb:aft', kind: 'doorway', axis: 'z', at: 11.2, a: 2.5, b: 3.5, rooms: [ROOM, 'tb.aft'], state: 'open' },
  ],
  fixtures: [
    ...RACK_X.map((x, i) => fx(`f:tb:rack:${String(i + 1).padStart(2, '0')}`, 'rack2', 'grey', x, 1.025, 'down', ROOM, 1 + i, { look: { made: true } })),
    ...RACK_X.map((x, i) => fx(`f:tb:rack:${String(i + 5).padStart(2, '0')}`, 'rack2', 'grey', x, 4.975, 'up', ROOM, 5 + i, { look: { made: i !== 0 } })),
    ...LOCKER_X.map((x, i) => fx(`f:tb:locker:${String(i + 1).padStart(2, '0')}`, 'wallLocker', 'single', x, 0.275, 'down', ROOM, 11 + i, { look: { colour: 'grey', n: 201 + i } })),
    ...LOCKER_X.map((x, i) => fx(`f:tb:locker:${String(i + 4).padStart(2, '0')}`, 'wallLocker', 'single', x, 5.725, 'up', ROOM, 14 + i, { look: { colour: 'grey', n: 205 + i } })),
  ],
  zones: [{ id: 'tb.z.berth', rooms: [ROOM, 'tb.fwd', 'tb.aft'] }],
  portals: [],
  holds: { gridM: 1.5, padEyeM: 3, faces: true, lines: [] },
  look: {
    palette: 'mars',
    finish: { kind: 'bulkhead', c1: 0x7a8288, c2: 0x50575e, outside: 0x2c2f33, floor: 'deck', floorColor: 0x5c6268 },
    decor: [...RUNGS, { kind: 'stencil', x: 6.2, y: 1.7, text: 'B-2 BERTHING' }, { kind: 'clock', x: 1.6, y: 2.0, w: 0.3, h: 0.3 }],
    lamps: [{ x: 3.6, z: 3.0, r: 2.2 }, { x: 6.2, z: 3.0, r: 2.2 }, { x: 8.8, z: 3.0, r: 2.2 }, { x: 0.6, z: 3.0, r: 1.0 }, { x: 11.8, z: 3.0, r: 1.0 }],
  },
});

/**
 * What "Secure for burn" reads of the compartment (see the header): your rack (its fixture, the berth's foot where you strap in
 * from, the berth's height), your locker (its fixture and the spot before it), the start (by your rack's foot, in the aisle), the
 * berth's NCO's place by the forward hatch, the three items to stow (where they float at the start: x, z, a height), the
 * strap-in's reach from the rack's foot and the locker's reach.
 */
export const BERTH_SPOTS = deepFreeze({
  area: BERTH_2.id,
  rack: { id: 'f:tb:rack:05', x: RACK_X[0], z: 4.975, foot: [RACK_X[0], 3.0] },
  locker: { id: 'f:tb:locker:04', x: LOCKER_X[0], z: 5.725, spot: [LOCKER_X[0], 4.9] },
  start: { x: 4.2, z: 3.0, face: 'down' },
  // (the user's score of test-burn: beside the forward hatch, 0.9 m off your rack's foot (1.8, 3.0 before, 0.5 m: you stood in him to strap in))
  nco: { x: 1.5, z: 2.55, face: 'right' },
  items: [
    { key: 'helmet', word: 'your helmet', x: 5.4, z: 2.6, y: 1.1 },
    { key: 'bag', word: 'your seabag', x: 2.9, z: 3.4, y: 0.6 },
    { key: 'rifle', word: 'your R-7 in its case', x: 6.6, z: 3.5, y: 1.4 },
  ],
  reachM: 0.7,
});
