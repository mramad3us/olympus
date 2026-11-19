// OLYMPUS data: Well A of the Void Operations School at Phobos, the void range of "Anchor before you fire" (ROADMAP §9's test-voidrange brought forward; the anywhere note AW§4.4, §5; PLACES §5.7; the build sheet v0.0.24 §1 D, §3.4).
//
// The School is cut into Phobos (PLACES §5.7: the Corps' void training, 0.0006 G toward the rock, so free fall for a body's
// purposes); Well A is its range, a steel box 40 × 40 m and 12 m high (`ceilingM`), every face plate the mag boots hold on
// (PLACES §2.7's `plateGrid`, src/data/places/env.js: ferrous, its holds a rule, a hold every 1.5 m along a face and a pad-eye
// every 3 m in the deck, so the sim finds a hold by arithmetic, src/sim/places/model.js holdNear, never a fixture). The game's
// plane is the deck (y up off it): a body floating drifts over it at a height, a body on its boots walks it.
// The live face is the east bulkhead (bagged regolith behind steel louvres, x 38 to 40, not walked), the School's turners
// standing in front of it at 7 to 20 m from the stations; the cadre's post is in the north-west corner on the deck, booted (the
// note's gallery behind glass is not built: the sim has no glazing, so a wall there would hide him and a gap would let you
// in; my call). Two cover plates 2 × 2 m stand 1.2 m apart in the well's middle for the wedge (COMBAT §14.8: a body across a
// gap, back on one plate and boots on the other; the note's 1.0 m widened to the wedge's widest, so a body floating into the gap
// along the lattice passes within 0.33 m of its middle, not 0.23: my call), modelled as the places between rooms are, solid: the well is five rooms
// round them, joined edge to edge by doorways their full width, so the nav grid and the sight grid see the plates as walls
// and the open deck as one floor (the Wheel's apron's way, src/data/places/wheel.js); the plates' faces carry the rule's holds as
// every face does, so the floating station's drift ends at a hold on the first plate's north face (the note's tow line along the
// north face is the north bulkhead's own row of holds, the rule's: my call, so no hold is a fixture).
//
// VOID_RANGE is the course's ground as every role reads it (src/sim/scenarios/anchors.js): the start mark (boots locked on
// the deck), the cadre's post, the five stations in order (each a mark, the anchor it wants, the distance, the rounds of its
// string, the gun, the turner it fires at), the turners (the bay's stand and face, src/data/places/range.js), the plates and
// the start mark of the floating station. The stations (AW§5): (1) boots, the line at 10 m; (2) lanyard, a hold on the north
// face at 15 m; (3) one hand on a hold, the P-12 at 7 m; (4) the wedge between the plates at 20 m; (5) floating, pushed off the
// north face into the open over the plates, one round at 10 m, then the grab at the first plate's holds. Frame: x east, z south, metres; the well's north-west corner the origin. Frozen literals, no seed of the world
// (the hub, 2026-11-05: the world is handcrafted).
import { TURNER_FACE, TURNER_STAND } from './range.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
const r4 = (v) => Math.round(v * 1e4) / 1e4;

/** The well's size, metres, its deckhead's height, and the floors' look (P-a: plain plate in 1.5 m panels, void-look's default). */
export const WELL_M = Object.freeze([40, 40]), WELL_CEILING_M = 12;
// (the tile 3 m, the pad-eyes' period, so the rule's lattice (0.75 m + 3 m k, both ways: model.js holdNear) is painted in it)
const FLOOR = Object.freeze({ kind: 'deckPlate', color: 0x657974, seed: 11, plateM: 1.5, rings: false, metres: 3, padEyeM: 3, padEyeAtM: 0.75 });
/** The north bulkhead's rungs, the rule's (a rung every 1.5 m from 0.75 m), at a hand's height. */
const RUNGS = Object.freeze(Array.from({ length: 27 }, (_, k) => Object.freeze({ kind: 'rung', x: 0.75 + 1.5 * k, y: 1.0 })));
/** The two cover plates' rects (2 × 2 m, 1.2 m apart across z) and the passage between them, where the wedge is taken (its middle on the hold rule's lattice, z 15.75, so a run along the lattice enters it). */
export const PLATES = Object.freeze([Object.freeze([15, 13.15, 17, 15.15]), Object.freeze([15, 16.35, 17, 18.35])]);
export const PASSAGE = Object.freeze([15, 15.15, 17, 16.35]);
const WELL_ROOMS = Object.freeze([
  ['va.north', [0, 0, 40, 13.15]], ['va.south', [0, 18.35, 40, 40]], ['va.west', [0, 13.15, 15, 18.35]], ['va.east', [17, 13.15, 40, 18.35]], ['va.passage', [...PASSAGE]],
]);

/** The area `phobos.void.well-a` (see the header): five rooms of one well round the plates, the School's micro gravity (the site's), no sky. */
export const WELL_A = deepFreeze({
  id: 'phobos.void.well-a', site: 'phobos-void', kind: 'deck', code: 'va', name: 'Well A, the void range', short: 'Well A', originM: [0, 0, 0],
  boundsM: { x0: 0, z0: 0, x1: WELL_M[0], z1: WELL_M[1] }, sky: 'none', surface: 'plateGrid',
  spawn: { x: 21.75, z: 6.75, face: 'right' },
  rooms: WELL_ROOMS.map(([id, rect]) => ({ id, kind: 'range', name: 'Well A', rect, ceilingM: WELL_CEILING_M, zone: 'va.z.well', surface: 'plateGrid', floor: { ...FLOOR } })),
  openings: [
    { id: 'o:va:nw', kind: 'doorway', axis: 'x', at: 13.15, a: 0, b: 15, rooms: ['va.north', 'va.west'], state: 'open' },
    { id: 'o:va:ne', kind: 'doorway', axis: 'x', at: 13.15, a: 17, b: 40, rooms: ['va.north', 'va.east'], state: 'open' },
    { id: 'o:va:sw', kind: 'doorway', axis: 'x', at: 18.35, a: 0, b: 15, rooms: ['va.west', 'va.south'], state: 'open' },
    { id: 'o:va:se', kind: 'doorway', axis: 'x', at: 18.35, a: 17, b: 40, rooms: ['va.east', 'va.south'], state: 'open' },
    { id: 'o:va:pw', kind: 'doorway', axis: 'z', at: 15, a: 15.15, b: 16.35, rooms: ['va.west', 'va.passage'], state: 'open' },
    { id: 'o:va:pe', kind: 'doorway', axis: 'z', at: 17, a: 15.15, b: 16.35, rooms: ['va.passage', 'va.east'], state: 'open' },
  ],
  fixtures: [],
  zones: [{ id: 'va.z.well', rooms: WELL_ROOMS.map(([id]) => id) }],
  portals: [],
  // (the faces' holds as a rule (PLACES §2.7's plateGrid; the sim's holdNear): a rung every 1.5 m on every face, a pad-eye every 3 m in the deck)
  holds: { gridM: 1.5, padEyeM: 3, faces: true },
  look: {
    palette: 'mars',
    finish: { kind: 'bulkhead', c1: 0x6f747a, c2: 0x4a4f55, outside: 0x2c2f33, floor: 'deck', floorColor: 0x657974 },
    decor: [...RUNGS, { kind: 'stencil', x: 20, y: 1.6, text: 'WELL A' }],
    // (the well's floods: a grid of lamps under the deckhead, every 8 m; the plates' passage lit for the wedge)
    lamps: [...[4, 12, 20, 28, 36].flatMap(x => [4, 12, 20, 28, 36].map(z => ({ x, z, r: 4.0 }))), { x: 16, z: 15.75, r: 1.6 }],
  },
});

// ---- the course's ground ----

/** A stand's facing toward a point (radians, 0 east, π/2 south). */
const toward = (x, z, tx, tz) => r4(Math.atan2(tz - z, tx - x));
// (a turner: its key's lane, its place on the deck before the live face, facing its station's mark)
const turner = (lane, x, z, at, name) => ({ key: `turner:${lane}`, lane, x, z, y: TURNER_FACE.centreY, faceRad: toward(x, z, ...at), name });

/**
 * The stations in order (see the header): id, its mark [x, z], the anchor it wants (footing.js's anchor) and the hold it is taken
 * on, the gun, the rounds of its string, its turner's lane and place, the distance. Every mark is a point of the hold rule's lattice
 * (a pad-eye at 0.75 m + 3 m k both ways), so a body floating can stop there by a grab and push off again along one of the eight
 * directions the keys give, the lattice's own (my call: the moves between stations are runs from pad-eye to pad-eye).
 */
// (the user's report of 2026-11-19 ("translate what I have to do for the 0G shooting training"): each station's `via`, the
// pad-eyes its command's route stops at on the way from the station before it, each run along one of the keys' eight directions, so
// the cadre's words and the DI's next step (skills/instinct/void.js) name a push that arrives: down then left into the plates' gap,
// left out of it, up to the top wall and right along it to station five's ring)
export const STATIONS = deepFreeze([
  { n: 1, id: 'boots', mark: [27.75, 6.75], want: 'magBoots', hold: 'boots', gun: 'rifle', rounds: 2, lane: 1, dM: 10, turner: [37.75, 6.75], via: [] },
  { n: 2, id: 'lanyard', mark: [21.75, 0.75], want: 'handhold', hold: 'tether', gun: 'rifle', rounds: 2, lane: 2, dM: 15, turner: [36.75, 0.75], via: [] },
  { n: 3, id: 'onehand', mark: [27.75, 0.75], want: 'handhold', hold: 'handhold', gun: 'pistol', rounds: 2, lane: 3, dM: 7, turner: [34.75, 2.25], via: [] },
  { n: 4, id: 'wedge', mark: [15.75, 15.75], want: 'braced', hold: 'braced', gun: 'rifle', rounds: 2, lane: 4, dM: 20, turner: [35.75, 15.75], via: [[27.75, 15.75]] },
  { n: 5, id: 'floating', mark: [15.75, 0.75], want: 'floating', hold: 'none', gun: 'rifle', rounds: 1, lane: 5, dM: 10, turner: [25.75, 4.5], via: [[12.75, 15.75], [12.75, 0.75]] },
]);

/**
 * The void range (see the header): the area, the start (boots locked on the deck, 6 m short of station 1's line), the cadre's
 * post, the stations, the turners (each facing its station's mark), the plates, the passage, the turner's face
 * and stand (the bay's).
 */
export const VOID_RANGE = deepFreeze({
  area: WELL_A.id,
  start: { x: 21.75, z: 6.75, face: 'right' },
  cadre: { x: 3.0, z: 3.0, face: 'right' },
  stations: STATIONS,
  // (each turner faces its station's mark; the floating station's, the point 10 m from it on the drift south over the plates)
  turners: STATIONS.map(s => turner(s.lane, s.turner[0], s.turner[1], s.id === 'floating' ? [15.75, 4.0] : s.mark, `the station ${s.n} target`)),
  plates: PLATES, passage: PASSAGE,
  face: { ...TURNER_FACE }, standPiece: { ...TURNER_STAND },
});
