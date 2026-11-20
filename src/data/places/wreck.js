// OLYMPUS data: the Wreck at Phobos, decks 5 and 6, the place of "Hold to hold" (ROADMAP §4.2's 0.0.7e; PLACES §5.4, §5.7; the build sheet v0.0.25 §0 items 1 to 4, item 2, §3.1, §5).
//
// The Wreck is a Tharsis-class corvette stripped of its reactor and drive and moored stern to the rock in Yard Shed 3 of the
// Void Operations School (PLACES §5.7): pressurised, at the rock's micro gravity (the site's 0.0006 G, free fall for a body),
// every face of every compartment steel a mag boot holds on (PLACES §2.7's `plateGrid`: ferrous, its holds a rule, a rung every
// 1.5 m along every face and a pad-eye every 3 m in the deck, src/sim/places/model.js holdNear). A Tharsis deck is 9.2 × 7.2 m
// inside under a 2.2 m deckhead, 2.8 m deck to deck (PLACES §5.4). Two decks are built, the cadre's lane through them:
//   deck 5, the brig: a passage 1.2 m wide (wide enough to wedge across) athwart the deck, three cells of about 3 × 3 m either
//          side of it, each through a bulkhead hatch; the cadre opened two (cell 2 to dorsal, cell 5 to ventral, their hatches
//          beside the trunk, both stripped bare for the drill) and dogged the other four shut (drawn, never offered, each with its
//          berth couches racked on end); the trunk's scuttle in the passage's deck.
//   deck 6, the hold: the cargo deck, its cargo stacked and lashed deck to deckhead, the store in its dorsal-starboard corner
//          through a bulkhead hatch, the port collar's lock in its dorsal-port corner (the cadre's way aboard at Stop), the
//          trunk's scuttle in its deckhead, straight under deck 5's.
// The trunk (PLACES §5.4's spine) runs through both at one point; the School's cadre stripped its ladder for hold-to-hold drills
// (the build sheet §0 item 3, my call), so nothing blocks the passage at it. Every fixture stands deck to deckhead (the cargo,
// the cells' couches racked on end): a body standing on the deck spans 0 to 1.75 m and one inverted on the deckhead 0.45 to 2.2 m,
// so one nav grid, one sight grid and one collision serve both faces (the play lens, [computed]).
//
// One area holds both decks (§0 item 2 as checked, my call): deck 5 at x 0 to 9.2, deck 6 at x 60 to 69.2 of the area's plan, each
// written in its own deck frame (x starboard, z ventral, from the deck's dorsal-port inner corner; y toward the bow, off the deck)
// and moved into the area's by its origin, WRECK_DECKS[n].origin. The 60 m between them is more than the stage's widest window
// (src/render/scale.js MAX_VIEW_M, 48 m), so from anywhere on one deck the other is never in the picture, and every reader of a
// lane's one area (the actors, the boards, the plans, the funnels) works unchanged. A deck change is a cut: src/sim/places/hatch.js
// crossHatch moves the bodies through the trunk by the decks' offset in one tick, the only writer of it. The decks are the
// area's `decks`, so the cutaway stands each deck's own dorsal, port and starboard bulkheads (src/sim/places/plan.js wallsOf), to the
// deckhead (`look.wallsToCeiling`: 2.2 m, not the 2.8 m every shipped area draws).
// The bulkhead hatches are the area's openings, a door with a hatch's leaf: 0.8 m wide, a coaming of 0.3 m, four dogs, locked
// while dogged (`lock`, which src/sim/combat/bundle.js lockedOf reads; undogged by src/sim/combat/op.js breakOpening), each one's
// middle on the hold rule's lattice (0.75 m + 1.5 m k) so the rule's rungs fall either side of it as a ship's grab bars do. A deck
// hatch is no line in the plane: the trunk is its own record (WRECK_TRUNK) and a fixture on each deck (the `scuttle`, mounted on
// the deck or the deckhead), its state the save's (hatch.js).
// WRECK_SET_A is the cadre's arrangement "A" (§5, provisional: A's places, the lane's roles and count), every face met at least
// once, each stand in the house's form (the leg's number and a letter), its card's name, its room, its base on its face and its
// board's centre (out from a bulkhead as a man standing on it would be, 0.9 m), its height, whether it pops up. WRECK_SPOTS names
// the start, your #2's place, the cadre's way in, the 1MC speakers and the deck plaques. Frozen literals (the hub, 2026-11-05: the
// world is handcrafted); no seed.

import { hatch as shipHatch, HATCH_W_M, COAMING_M, HATCH_DOGS } from './ship-parts.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
const r2 = (v) => Math.round(v * 100) / 100;

/** The area's id and its code (the ids' prefix). */
export const WRECK_ID = 'phobos.void.wreck', WRECK_CODE = 'wk';
/** A deck's inside, metres, its deckhead (clear height) and the deck pitch, deck to deck (PLACES §5.4). */
export const WRECK_DECK_M = Object.freeze([9.2, 7.2]), WRECK_CEILING_M = 2.2, WRECK_PITCH_M = 2.8;
/** A board on a bulkhead stands its centre this far out from the face, metres (a man standing on it: the play lens §8). */
export const BOARD_OFF_FACE_M = 0.9;
/** A bulkhead hatch: its width, its coaming and its dogs (the play lens §5; v0.0.27: ship-parts.js's, every ship's builder). */
export { HATCH_W_M, COAMING_M, HATCH_DOGS };
/** The trunk's scuttle, metres across (PC§2.3). */
export const TRUNK_DIA_M = 0.8;

/** The two decks (§5): each one's origin in the area's plan and its rect there. */
export const WRECK_DECKS = deepFreeze({
  5: { n: 5, name: 'the brig', origin: [0, 0], rect: [0, 0, WRECK_DECK_M[0], WRECK_DECK_M[1]] },
  6: { n: 6, name: 'the hold', origin: [60, 0], rect: [60, 0, 60 + WRECK_DECK_M[0], WRECK_DECK_M[1]] },
});
// (a deck's point or rect moved into the area's plan)
const at = (n, x, z) => [r2(x + WRECK_DECKS[n].origin[0]), r2(z + WRECK_DECKS[n].origin[1])];
// (the deck a plan x lies on is src/data/places/ships.js shipDeckAt's, the one test of which deck on any ship: v0.0.25's fixer kept one,
// this module's wreckDeckAt, and v0.0.27's stage 0 moved it to the registry, scenes/assemble.js wreckDeckAt the Wreck's alias)
const rectAt = (n, [x0, z0, x1, z1]) => [...at(n, x0, z0), ...at(n, x1, z1)];

// (the floor: the void's plate in 1.5 m panels with the rule's pad-eyes, as Well A's; a darker plate in the brig)
const FLOOR_5 = Object.freeze({ kind: 'deckPlate', color: 0x5c6268, seed: 31, plateM: 1.5, rings: false, metres: 3, padEyeM: 3, padEyeAtM: 0.75 });
const FLOOR_6 = Object.freeze({ kind: 'deckPlate', color: 0x657974, seed: 32, plateM: 1.5, rings: false, metres: 3, padEyeM: 3, padEyeAtM: 0.75 });

// The rooms, each in its deck's frame: [key, kind, name, rect]
const D5 = [
  ['passage', 'passage', 'Deck 5, the passage', [0, 3.0, 9.2, 4.2]],
  ['cell-1', 'cell', 'Deck 5, cell 1', [0, 0, 3.0, 3.0]], ['cell-2', 'cell', 'Deck 5, cell 2', [3.0, 0, 6.2, 3.0]], ['cell-3', 'cell', 'Deck 5, cell 3', [6.2, 0, 9.2, 3.0]],
  ['cell-4', 'cell', 'Deck 5, cell 4', [0, 4.2, 3.0, 7.2]], ['cell-5', 'cell', 'Deck 5, cell 5', [3.0, 4.2, 6.2, 7.2]], ['cell-6', 'cell', 'Deck 5, cell 6', [6.2, 4.2, 9.2, 7.2]],
];
const D6 = [
  ['hold', 'hold', 'Deck 6, the hold', [0, 2.4, 9.2, 7.2]], ['hold-far', 'hold', 'Deck 6, the hold', [1.6, 0, 6.8, 2.4]],
  ['store', 'store', 'Deck 6, the store', [6.8, 0, 9.2, 2.4]], ['lock', 'lock', 'Deck 6, the port collar\'s lock', [0, 0, 1.6, 2.4]],
];
const roomId = (n, key) => `${WRECK_CODE}.d${n}.${key}`;
const zoneId = (n) => `${WRECK_CODE}.z.d${n}`;
const ROOMS = [
  ...D5.map(([key, kind, name, rect]) => ({ id: roomId(5, key), kind, name, deck: 5, rect: rectAt(5, rect), ceilingM: WRECK_CEILING_M, zone: zoneId(5), surface: 'plateGrid', floor: { ...FLOOR_5 } })),
  ...D6.map(([key, kind, name, rect]) => ({ id: roomId(6, key), kind, name, deck: 6, rect: rectAt(6, rect), ceilingM: WRECK_CEILING_M, zone: zoneId(6), surface: 'plateGrid', floor: { ...FLOOR_6 } })),
];

/**
 * A bulkhead hatch (see the header): an opening on a z line (axis 'x') of its deck, its middle at mid (deck frame), its rooms
 * [the side it is worked from, the compartment], its leaf hinged at 'a' (the port end) or 'b', opening into the compartment;
 * offered false where the cadre dogged it for good, or (the lock's) dogged until he comes aboard through it at Stop (drawn, never
 * offered: the lane's planner leaves it alone).
 */
// (the boarding round's stage 0: the record is ship-parts.js hatch's, every ship's builder, called with the Wreck's deck frame moved into the
// area's plan here and no axis (a z line), so each of the eight is the object it was, key for key)
function hatch(n, key, zAt, mid, rooms, hinge, { offered = true } = {}) {
  const [a] = at(n, mid - HATCH_W_M / 2, 0), [b] = at(n, mid + HATCH_W_M / 2, 0), [, z] = at(n, 0, zAt);
  return shipHatch(`o:${WRECK_CODE}:d${n}:${key}`, z, [a, b], rooms.map(k => roomId(n, k)), { hinge, coamingM: COAMING_M, dogs: HATCH_DOGS, offered });
}

/** The bulkhead hatches (see the header): the brig's six cells', the store's and the lock's inner hatch. */
export const WRECK_HATCHES = deepFreeze([
  hatch(5, 'cell-1', 3.0, 2.25, ['passage', 'cell-1'], 'a', { offered: false }),
  // (cell 2's hatch to starboard of the trunk, hinged at its port end: its latch side, where the stack stands, away from the trunk)
  hatch(5, 'cell-2', 3.0, 5.25, ['passage', 'cell-2'], 'a'),
  hatch(5, 'cell-3', 3.0, 8.25, ['passage', 'cell-3'], 'a', { offered: false }),
  hatch(5, 'cell-4', 4.2, 2.25, ['passage', 'cell-4'], 'b', { offered: false }),
  // (cell 5's to port of it, hinged at its port end: the stack to starboard, the side the lane comes from out of cell 2, so your #2's
  // stack point is behind yours on the way; hinged at its starboard end his stood past yours, and in the 1.2 m passage he could not get
  // by you to it (C's lane, v0.0.25: 55 to 60 s lost there on every sheet))
  hatch(5, 'cell-5', 4.2, 3.75, ['passage', 'cell-5'], 'a'),
  hatch(5, 'cell-6', 4.2, 8.25, ['passage', 'cell-6'], 'b', { offered: false }),
  hatch(6, 'store', 2.4, 8.25, ['hold', 'store'], 'b'),
  // (the lock's inner hatch: the cadre's way in at Stop, worked from the lock (shoothouse.js wreckCadre undogs and opens it); dogged
  // until then, so never offered to the lane (the review of C and D: its undog and pull were offered from the hold and the bot opened
  // it, "Hold that door." at the cadre's way aboard))
  hatch(6, 'lock', 2.4, 0.75, ['lock', 'hold'], 'a', { offered: false }),
]);
// (the hold's two parts, one compartment: joined their whole width, so the nav and sight grids see one floor)
const DOORWAYS = [{ id: `o:${WRECK_CODE}:d6:hold-far`, kind: 'doorway', axis: 'x', at: 2.4, a: at(6, 1.6, 0)[0], b: at(6, 6.8, 0)[0], rooms: [roomId(6, 'hold-far'), roomId(6, 'hold')], state: 'open' }];

/**
 * The trunk (§3.1): its id, its area (one holds both ends), its scuttle's diameter, its two ends (the deck's scuttle on deck 5, the deckhead's on deck 6, at one
 * point of each deck's frame), each end's fixture; the offset from deck 5's end to deck 6's is the decks' origins' (60, 0).
 */
export const WRECK_TRUNK = deepFreeze({
  id: 'h:wreck:trunk', area: WRECK_ID, diaM: TRUNK_DIA_M,
  ends: [
    { at: at(5, 4.6, 3.6), deck: 5, face: 'deck', room: roomId(5, 'passage'), fixture: `f:${WRECK_CODE}:d5:scuttle` },
    { at: at(6, 4.6, 3.6), deck: 6, face: 'deckhead', room: roomId(6, 'hold'), fixture: `f:${WRECK_CODE}:d6:scuttle` },
  ],
  // (its state at the template: dogged; the lane undogs it, opens it, and the save holds the change: hatch.js)
  state: 'dogged',
});

// (a fixture spec in a deck's frame: id, kind, make, x, z, face, room, seed, and what else the kit reads)
const fx = (n, key, kind, make, x, z, face, room, seed, more = {}) => { const [ax, az] = at(n, x, z); return { id: `f:${WRECK_CODE}:d${n}:${key}`, kind, make, x: ax, z: az, face, room: roomId(n, room), seed, ...more }; };
/** The lamps' height under the deckhead, metres. */
const LAMP_Y_M = r2(WRECK_CEILING_M - 0.1);
// (a speaker of the 1MC under a compartment's deckhead)
const speaker = (n, room, x, z) => fx(n, `speaker-${room}`, 'speaker', 'onemc', x, z, 'down', room, 41, { y: r2(WRECK_CEILING_M - 0.1) });

/** The fixtures (see the header): the trunk's two scuttles, the couches racked on end in every cell, the hold's cargo stacks, the 1MC speakers. */
const FIXTURES = [
  fx(5, 'scuttle', 'scuttle', 'deck', 4.6, 3.6, 'down', 'passage', 1, { mount: 'deck', trunk: WRECK_TRUNK.id }),
  fx(6, 'scuttle', 'scuttle', 'deckhead', 4.6, 3.6, 'down', 'hold', 1, { mount: 'deckhead', y: WRECK_CEILING_M, trunk: WRECK_TRUNK.id }),
  // (the brig's couches, racked on end deck to deckhead along the hull of each dogged cell; cells 2 and 5 stripped for the drill,
  // the cadre's set A, as bare as the shoot house's rooms, so their plans' corners and hot spots stand in the open: my call)
  fx(5, 'couch-1', 'berthRack', 'grey', 1.125, 0.475, 'right', 'cell-1', 2),
  fx(5, 'couch-3', 'berthRack', 'steel', 7.825, 0.475, 'right', 'cell-3', 4),
  fx(5, 'couch-4', 'berthRack', 'grey', 1.125, 6.725, 'left', 'cell-4', 5),
  fx(5, 'couch-6', 'berthRack', 'grey', 7.825, 6.725, 'left', 'cell-6', 2),
  // (the hold's cargo, stacked and lashed deck to deckhead: cover from every face alike; the hold's middle round the trunk open)
  fx(6, 'cargo-1', 'cargo', 'lashed', 3.75, 0.9, 'down', 'hold-far', 1),
  fx(6, 'cargo-2', 'cargo', 'netted', 1.5, 6.3, 'down', 'hold', 2),
  fx(6, 'cargo-3', 'cargo', 'lashed', 6.0, 6.0, 'down', 'hold', 3),
  fx(6, 'cargo-4', 'cargo', 'lashed', 7.4, 6.0, 'down', 'hold', 4),
  // (the 1MC: one speaker on every compartment's deckhead, where the cadre's and the 1MC's bubbles are drawn)
  speaker(5, 'passage', 7.0, 3.6), speaker(5, 'cell-2', 3.6, 2.4), speaker(5, 'cell-5', 5.6, 4.8),
  speaker(6, 'hold', 2.4, 4.2), speaker(6, 'hold-far', 5.6, 1.6), speaker(6, 'store', 7.4, 1.8), speaker(6, 'lock', 0.8, 1.2),
];

/** The area `phobos.void.wreck` (see the header): two decks of the Wreck in one plan, the School's micro gravity (the site's), no sky. */
export const WRECK = deepFreeze({
  id: WRECK_ID, site: 'phobos-void', kind: 'deck', code: WRECK_CODE, name: 'The Wreck', short: 'The Wreck', originM: [0, 0, 0],
  boundsM: { x0: 0, z0: 0, x1: WRECK_DECKS[6].rect[2], z1: WRECK_DECK_M[1] }, sky: 'none', surface: 'plateGrid',
  decks: [5, 6].map(n => ({ n, rect: [...WRECK_DECKS[n].rect] })),
  spawn: { x: 8.0, z: 3.6, face: 'left' },
  rooms: ROOMS,
  openings: [...WRECK_HATCHES, ...DOORWAYS],
  fixtures: FIXTURES,
  zones: [5, 6].map(n => ({ id: zoneId(n), rooms: ROOMS.filter(r => r.deck === n).map(r => r.id) })),
  portals: [],
  // (the faces' holds as a rule (PLACES §2.7's plateGrid; the sim's holdNear): a rung every 1.5 m on every face, a pad-eye every 3 m in the deck)
  holds: { gridM: 1.5, padEyeM: 3, faces: true },
  speakers: FIXTURES.filter(f => f.kind === 'speaker').map(f => ({ room: f.room, x: f.x, y: f.y, z: f.z })),
  look: {
    palette: 'mars',
    finish: { kind: 'bulkhead', c1: 0x6f747a, c2: 0x4a4f55, outside: 0x2c2f33, floor: 'deck', floorColor: 0x5c6268 },
    // (no decor: a deck's plaque is WRECK_SPOTS' (the stage's), and the cutaway's decor stands on full-height walls only)
    decor: [],
    // (the bulkheads stand to the deckhead, 2.2 m: src/sim/places/plan.js wallsOf)
    wallsToCeiling: true,
    // (a working lamp in each compartment on shore power, two in the passage, four in the hold; the store's out but its emergency lamp;
    // each under the deckhead, LAMP_Y_M 2.1 m, not the 2.7 m a lamp is hung at where none is said)
    lamps: [
      ...[[2.0, 3.6], [7.2, 3.6]].map(([x, z]) => ({ x: at(5, x, z)[0], z, y: LAMP_Y_M, r: 1.8 })),
      ...[[1.5, 1.5], [4.6, 1.5], [7.7, 1.5], [1.5, 5.7], [4.6, 5.7], [7.7, 5.7]].map(([x, z]) => ({ x: at(5, x, z)[0], z, y: LAMP_Y_M, r: 1.6 })),
      ...[[2.5, 3.8], [6.5, 3.8], [4.2, 1.2], [3.5, 4.6]].map(([x, z]) => ({ x: at(6, x, z)[0], z, y: LAMP_Y_M, r: 2.4 })),
      { x: at(6, 8.0, 1.2)[0], z: 1.2, y: LAMP_Y_M, r: 0.9 }, { x: at(6, 0.8, 1.2)[0], z: 1.2, y: LAMP_Y_M, r: 1.2 },
    ],
  },
});

// ---- the cadre's set A ----

// (a stand: its id (the leg's number and a letter), its card's name, its deck and room, its face, its base on the face and the
// board's centre, both in the deck's frame, its height, whether it pops up, its role, its slot; facing toward fx, fz)
const FACE_NORMAL = Object.freeze({ deck: [0, 0], deckhead: [0, 0], dorsal: [0, 1], ventral: [0, -1], port: [1, 0], starboard: [-1, 0] });
function stand(n, s, name, room, onFace, [bx, bz], y, role, { pop = false, slot = 1, toward } = {}) {
  const [nx, nz] = FACE_NORMAL[onFace], off = nx || nz ? BOARD_OFF_FACE_M : 0;
  const base = at(n, bx, bz), board = at(n, bx + nx * off, bz + nz * off), t = at(n, ...toward);
  return { stand: s, name, deck: n, room: roomId(n, room), onFace, base, at: board, y, pop, role, slot,
    faceRad: Math.round(Math.atan2(t[1] - board[1], t[0] - board[0]) * 1e4) / 1e4 };
}
// (a deck board's centre and a hanging one's: the bay's turner's centre, 1.35 m, and the same from the deckhead, 0.85 m)
const DECK_Y_M = 1.35, HEAD_Y_M = r2(WRECK_CEILING_M - DECK_Y_M), BULK_Y_M = 1.1;

/**
 * Set A (§5; see the header): ten stands, every face met at least once (the deck, the deckhead, the dorsal, ventral, port and
 * starboard bulkheads). Each faces its compartment's way in: the cells' and the store's hatches, the hold's trunk.
 */
export const WRECK_SET_A = deepFreeze([
  stand(5, '1a', 'C2a', 'cell-2', 'dorsal', [4.4, 0], BULK_Y_M, 'threat', { slot: 1, toward: [5.25, 3.0] }),
  stand(5, '1b', 'C2b', 'cell-2', 'port', [3.0, 1.2], BULK_Y_M, 'noshoot', { slot: 1, toward: [5.25, 3.0] }),
  stand(5, '2a', 'C5a', 'cell-5', 'deckhead', [5.7, 6.7], HEAD_Y_M, 'threat', { pop: true, slot: 1, toward: [3.75, 4.2] }),
  stand(5, '2b', 'C5b', 'cell-5', 'ventral', [4.2, 7.2], BULK_Y_M, 'threat', { slot: 2, toward: [3.75, 4.2] }),
  stand(6, '3a', 'H1', 'hold', 'deckhead', [4.6, 5.0], HEAD_Y_M, 'threat', { slot: 2, toward: [4.6, 3.6] }),
  stand(6, '3b', 'H2', 'hold-far', 'deckhead', [6.2, 0.6], HEAD_Y_M, 'threat', { pop: true, slot: 1, toward: [4.6, 3.6] }),
  stand(6, '3c', 'H3', 'hold-far', 'dorsal', [2.3, 0], BULK_Y_M, 'noshoot', { slot: 1, toward: [4.6, 3.6] }),
  stand(6, '3d', 'H4', 'hold', 'deck', [4.8, 6.4], DECK_Y_M, 'threat', { slot: 2, toward: [4.6, 3.6] }),
  stand(6, '4a', 'S1', 'store', 'starboard', [9.2, 0.6], BULK_Y_M, 'threat', { pop: true, slot: 2, toward: [8.25, 2.4] }),
  stand(6, '4b', 'S2', 'store', 'deck', [7.4, 0.6], DECK_Y_M, 'hostage', { slot: 1, toward: [8.25, 2.4] }),
]);

/**
 * What the lane reads of the Wreck (§3.1): the start (you, locked on your boots in deck 5's passage, at its starboard end) and your
 * #2's place behind you, the cadre's way in at Stop (inside the port collar's lock on deck 6, its inner hatch), the 1MC's speakers
 * (one a compartment, on its deckhead), and the deck plaques by the trunk (the stage's words).
 */
export const WRECK_SPOTS = deepFreeze({
  area: WRECK_ID,
  start: { x: 8.0, z: 3.6, face: 'left' }, two: { x: 8.65, z: 3.6, face: 'left' },
  cadreIn: { hatch: `o:${WRECK_CODE}:d6:lock`, x: at(6, 0.8, 1.2)[0], z: 1.2, face: 'down' },
  speakers: WRECK.speakers,
  plaques: [
    { deck: 5, x: at(5, 4.6, 3.1)[0], z: 3.1, text: 'DECK 5 · BRIG' },
    { deck: 6, x: at(6, 4.6, 2.5)[0], z: 2.5, text: 'DECK 6 · HOLD' },
  ],
});
