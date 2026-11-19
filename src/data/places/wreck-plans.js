// OLYMPUS data: the room plans of the Wreck's lane, "Hold to hold" (COMBAT §25.7.3; the build sheet v0.0.25 item 2, §0 item 1, §3.1; src/data/places/wreck.js).
//
// The lane's plan set in X4_PLANS' shape (src/data/places/x4-plans.js's header has every field): { lane: 'W', area, order, plans },
// four compartment legs and no hall's (the house's four due slots: the build sheet §0 item 1), in the lane's order:
//   1  cell 2 through its bulkhead hatch (deck 5)        derived
//   2  cell 5 through its bulkhead hatch (deck 5)        derived
//   3  the hold through the trunk, from its deckhead     authored (below)
//   4  the store through its bulkhead hatch (deck 6)     derived
// The three bulkhead hatches are doors on a wall line, so their plans are src/sim/combat/derive.js derivePlan's (the corner rule's
// points and sectors, the lanes through the hatch, the hot spots), proposed by `node tools/derive-plans.mjs --wreck` and committed
// here between its two markers (the hub's "game world is handcrafted": a tool proposes, the author commits; tests/wreck-place.test.mjs
// holds them equal to what the deriver gives today), each hot spot's id its leg's ('r1:c0', as a drawn house's are).
// The hold is entered from its deckhead through the trunk, which is no line in the plane, so its plan is authored by hand (my calls),
// keyed by the trunk's id: no door; its `gate` a line across the scuttle (the plane a door would give, for room.js's derive), its
// `hatch` the trunk; the stack round the scuttle on deck 5 (#1 at its port coaming, #2 at its starboard, each 0.7 m from its centre,
// a body's 0.27 m clear of the open hole), its `threshold` and points the plants on the hold's deckhead a step (0.3 m) out from the
// scuttle on deck 6 (#1 to port, #2 to starboard: COMBAT §14.8, the first man plants on the hatch's own face); each slot's sector the hold's half on his side of the trunk's line (#1 the dorsal half, toward
// the store's bulkhead and the far dorsal corner, #2 the ventral, the cargo's side and behind the trunk); the hot spots the
// compartment's corners 0.5 m in that a plant sees (its two re-entrant corners at the hold's north part are the doorway's ends: none;
// the ventral corners, behind the cargo, are dead space, `dead`, as derive.js would have them); its paths
// begin at the landing, each man's stack point moved through the trunk by src/sim/places/hatch.js crossHatch (a path never
// crosses 60 m of the plan), and end at his point; inner none: the store's is the next leg's door, never an inner door of the hold (two
// inner doors are asked in turn, and your #2 holds one at a time, so "Hold it" went from one to the other with the clock still: C's lane,
// v0.0.25), and the lock's is dogged until the cadre comes aboard through it at Stop, never offered (the review of C and D: its undog
// and pull were offered from the hold, the bot opened it and was faulted 'door' for leaving it open).
// Frozen literals.
import { WRECK_ID, WRECK_TRUNK } from './wreck.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** A sector's half-width, degrees (as X4's). */
const HALF = 20;

// (the bulkhead hatches' plans: tools/derive-plans.mjs --wreck --write rewrites what stands between its two markers, nothing else)
// derive-plans:begin
const DERIVED = {
  'o:wk:d5:cell-2': {
    room: 'wk.d5.cell-2',
    parts: ['wk.d5.cell-2'],
    door: 'o:wk:d5:cell-2',
    threshold: [5.25, 2.7],
    entry: 'cross',
    stack: [[6.15, 3.45], [6.8, 3.45]],
    points: [[4, 2.5], [5.7, 2]],
    corners: [{ id: 'c0', x: 3, z: 0 }, { id: 'c1', x: 6.2, z: 0 }, { id: 'c2', x: 3, z: 3 }, { id: 'c3', x: 6.2, z: 3 }],
    hot: [{ id: 'r1:c0', x: 3.5, z: 0.5, why: 'corner' }, { id: 'r1:c1', x: 5.7, z: 0.5, why: 'corner' }, { id: 'r1:c2', x: 3.5, z: 2.5, why: 'behind the door' }],
    sectors: [{ slot: 1, yawRad: -1.6433, halfDeg: 20 }, { slot: 2, yawRad: -1.9149, halfDeg: 20 }],
    dead: [],
    paths: { 1: [[6.15, 3.45], [5.13, 3.3], [5.13, 2.7], [5.1, 2.67], [4, 2.5]], 2: [[6.8, 3.45], [5.38, 3.35], [5.25, 3.3], [5.25, 2.7], [5.7, 2]] },
    inner: [],
    light: 'day',
  },
  'o:wk:d5:cell-5': {
    room: 'wk.d5.cell-5',
    parts: ['wk.d5.cell-5'],
    door: 'o:wk:d5:cell-5',
    threshold: [3.75, 4.5],
    entry: 'hook',
    stack: [[4.65, 3.75], [5.3, 3.75]],
    points: [[5.2, 4.7], [3.5, 5.2]],
    corners: [{ id: 'c0', x: 3, z: 4.2 }, { id: 'c1', x: 6.2, z: 4.2 }, { id: 'c2', x: 3, z: 7.2 }, { id: 'c3', x: 6.2, z: 7.2 }],
    hot: [{ id: 'r2:c1', x: 5.7, z: 4.7, why: 'corner' }, { id: 'r2:c2', x: 3.5, z: 6.7, why: 'corner' }, { id: 'r2:c3', x: 5.7, z: 6.7, why: 'corner' }],
    sectors: [{ slot: 1, yawRad: 1.4983, halfDeg: 20 }, { slot: 2, yawRad: 1.2267, halfDeg: 20 }],
    dead: [],
    paths: { 1: [[4.65, 3.75], [3.88, 3.63], [3.87, 3.9], [3.87, 4.5], [3.9, 4.53], [5.2, 4.7]], 2: [[5.3, 3.75], [3.88, 3.63], [3.75, 3.9], [3.75, 4.5], [3.5, 5.2]] },
    inner: [],
    light: 'day',
  },
  'o:wk:d6:store': {
    room: 'wk.d6.store',
    parts: ['wk.d6.store'],
    door: 'o:wk:d6:store',
    threshold: [68.25, 2.1],
    entry: 'hook',
    stack: [[67.35, 2.85], [66.7, 2.85]],
    points: [[67.8, 1.8], [68.7, 1.6]],
    corners: [{ id: 'c0', x: 66.8, z: 0 }, { id: 'c1', x: 69.2, z: 0 }, { id: 'c2', x: 66.8, z: 2.4 }, { id: 'c3', x: 69.2, z: 2.4 }],
    hot: [{ id: 'r4:c0', x: 67.3, z: 0.5, why: 'corner' }, { id: 'r4:c1', x: 68.7, z: 0.5, why: 'corner' }, { id: 'r4:c2', x: 67.3, z: 1.9, why: 'corner' }],
    sectors: [{ slot: 1, yawRad: -1.769, halfDeg: 20 }, { slot: 2, yawRad: -1.8548, halfDeg: 20 }],
    dead: [],
    paths: { 1: [[67.35, 2.85], [68.11, 2.74], [68.13, 2.7], [68.13, 2.1], [67.8, 1.8]], 2: [[66.7, 2.85], [68.19, 2.82], [68.25, 2.7], [68.25, 2.1], [68.7, 1.6]] },
    inner: [],
    light: 'day',
  },
};
// derive-plans:end

/** The hold's plan (see the header), authored. */
const HOLD = {
  room: 'wk.d6.hold', parts: ['wk.d6.hold', 'wk.d6.hold-far'], door: null, hatch: WRECK_TRUNK.id,
  gate: { axis: 'x', at: 3.6, a: 64.2, b: 65.0 }, threshold: [63.6, 3.6], entry: null,
  stack: [[3.9, 3.6], [5.3, 3.6]], points: [[63.6, 3.6], [65.6, 3.6]],
  corners: [{ id: 'w', x: 60, z: 2.4 }, { id: 'e', x: 69.2, z: 2.4 }, { id: 'sw', x: 60, z: 7.2 }, { id: 'se', x: 69.2, z: 7.2 }, { id: 'nw', x: 61.6, z: 0 }, { id: 'ne', x: 66.8, z: 0 }],
  hot: [
    { id: 'r3:nw', x: 62.1, z: 0.5, why: 'corner' }, { id: 'r3:ne', x: 66.3, z: 0.5, why: 'corner' },
    { id: 'r3:w', x: 60.5, z: 2.9, why: 'corner' }, { id: 'r3:e', x: 68.7, z: 2.9, why: 'corner' },
  ],
  sectors: [{ slot: 1, yawRad: -1.5708, halfDeg: HALF }, { slot: 2, yawRad: 1.5708, halfDeg: HALF }],
  // (the hold's ventral corners lie behind cargo stacks 2 and 4, lashed deck to deckhead, and the dorsal bulkhead's middle behind
  // stack 1: neither plant sees them (perception.js clearLine on the stand's layer), so by derive.js hotOf's own rule they are no hot
  // spots but dead space, a circle round each unseen run of cells (its centroid, the farthest and half a cell). Before, r3:sw and r3:se
  // stood there as hot spots no look could cover: "Corner! You never looked." on every lane, and T offered the look at r3:sw again
  // each tick from the 'hold' and 'tug' setups until the lane timed out (the review of C and D, v0.0.25). The far walk that would
  // clear them is the drawn Wreck's (0.5).)
  dead: [[60.41, 6.26, 0.89], [63.43, 0.27, 1.17], [67.87, 6.37, 2.65]],
  paths: { 1: [[63.9, 3.6], [63.6, 3.6]], 2: [[65.3, 3.6], [65.6, 3.6]] },
  inner: [], light: 'day',
};

/** The Wreck's legs in the lane's order (see the header): the hatch or the trunk that leads into each. */
export const WRECK_ORDER = Object.freeze(['o:wk:d5:cell-2', 'o:wk:d5:cell-5', WRECK_TRUNK.id, 'o:wk:d6:store']);

/** The Wreck's plan set (see the header), X4_PLANS' shape: { lane: 'W', area, order, plans }. */
export const WRECK_PLANS = deepFreeze({
  lane: 'W', area: WRECK_ID, order: [...WRECK_ORDER],
  plans: Object.fromEntries(WRECK_ORDER.map(k => [k, k === WRECK_TRUNK.id ? HOLD : DERIVED[k]])),
});
