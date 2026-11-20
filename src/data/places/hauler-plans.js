// OLYMPUS data: the room plans of the Patient Mule's deck 2, "Away the boarding party" (COMBAT §25.7.3; the build sheet v0.0.27 §0 items 2, 12, 31, §1 D, item 3; src/data/places/hauler.js).
//
// The lane's plan set in X4_PLANS' shape (src/data/places/x4-plans.js's header has every field): { lane: 'M', area, order, plans }, four
// compartment legs and no hall's (the house's four due slots), in the lane's order (HAULER_ORDER, the stands' first digits):
//   1  the passage, from the lock's inner hatch            authored (below): the holders' leg
//   2  cabin 1 through its hatch                           derived
//   3  the bunk room through its hatch                     derived
//   4  cabin 2 through its hatch                           derived
// The three compartment hatches are doors on a wall line, so their plans are src/sim/combat/derive.js derivePlan's (the corner rule's
// points and sectors, the lanes through the hatch, the hot spots), proposed by `node tools/derive-plans.mjs --ship hauler` and committed
// here between its two markers (the hub's "game world is handcrafted": a tool proposes, the author commits; tests/hauler-plans.test.mjs
// holds them equal to what the deriver gives today), each hot spot's id its leg's ('r2:c1', as the Wreck's are). At each hatch your number
// two's stack point stands within 0.9 m of yours (the build sheet's item 17) as every door's swing already gives it (swing.js
// STACK_BEHIND_M 0.65 apart), so the deriver keeps no hatch rule of its own (tests/hauler-plans.test.mjs holds the gap).
// The passage is the holders' (the build sheet's item 4, §0 item 12; FT§6): the team leader and the automatic rifleman go through the
// lock's inner hatch to their posts (hauler.js HAULER_HOLDERS) and hold the passage; you and Four hold in the lock on your stack until
// the leader sends you to cabin 1 (shoothouse.js collarTick's send). Its plan is authored by hand (my calls) and keyed by the lock's
// hatch, with no door of its own (as the Wreck's hold is: the stack a door's swing gives stands on the hatch's latch side, outside the
// lock's 2.5 m, and nobody of yours opens it), its `gate` the hatch's line (the plane a door would give, for room.js's derive):
// `hold` true (the leg is held, never entered by your pair: the lane ends it at the send, 'held'), its stack your start and
// Four's in the lock (hauler.js HAULER_START #3 and #4, on the hinge side of the hatch, out of the holders' way through it), its points
// the same places (a hold, nobody's walk), its sectors down the passage through the hatch, no hot spot (the holders' sectors cover it),
// no dead space, paths of one place each. The lock's hatch is never offered to the planner (hauler.js), so no row of yours opens it:
// the leader does, at GO.
// Frozen literals.
import { HAULER_ID, HAULER_START } from './hauler.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** A sector's half-width, degrees (as X4's). */
const HALF = 20;
/** The lock's inner hatch, the passage leg's door. */
export const LOCK_HATCH_ID = 'o:mu:d2:lock';

// (the compartment hatches' plans: tools/derive-plans.mjs --ship hauler --write rewrites what stands between its two markers, nothing else)
// derive-plans:begin
const DERIVED = {
  'o:mu:d2:cabin-1': {
    room: 'mu.d2.cabin-1',
    parts: ['mu.d2.cabin-1'],
    door: 'o:mu:d2:cabin-1',
    threshold: [5.25, 3.7],
    entry: 'cross',
    stack: [[4.35, 4.45], [3.7, 4.45]],
    points: [[6, 3.5], [3.5, 3.5]],
    corners: [{ id: 'c0', x: 2.5, z: 0 }, { id: 'c1', x: 7, z: 0 }, { id: 'c2', x: 2.5, z: 4 }, { id: 'c3', x: 7, z: 4 }],
    hot: [{ id: 'r2:c1', x: 6.5, z: 0.5, why: 'corner' }, { id: 'r2:c2', x: 3, z: 3.5, why: 'corner' }, { id: 'r2:c3', x: 6.5, z: 3.5, why: 'behind the door' }],
    sectors: [{ slot: 1, yawRad: -1.6032, halfDeg: 20 }, { slot: 2, yawRad: -1.5384, halfDeg: 20 }],
    dead: [],
    paths: { 1: [[4.35, 4.45], [5.37, 4.3], [5.37, 3.7], [6, 3.5]], 2: [[3.7, 4.45], [5.12, 4.35], [5.13, 4.3], [5.13, 3.7], [5.11, 3.66], [3.5, 3.5]] },
    inner: [],
    light: 'day',
  },
  'o:mu:d2:bunks': {
    room: 'mu.d2.bunks',
    parts: ['mu.d2.bunks'],
    door: 'o:mu:d2:bunks',
    threshold: [8.25, 5.8],
    entry: 'hook',
    stack: [[7.35, 5.05], [6.7, 5.05]],
    points: [[6.3, 6], [10.2, 6]],
    corners: [{ id: 'c0', x: 2.5, z: 5.5 }, { id: 'c1', x: 12, z: 5.5 }, { id: 'c2', x: 2.5, z: 10 }, { id: 'c3', x: 12, z: 10 }],
    hot: [{ id: 'r3:c1', x: 11.5, z: 6, why: 'behind the door' }, { id: 'r3:c3', x: 11.5, z: 9.5, why: 'corner' }, { id: 'r3:far', x: 4.97, z: 9.16, why: 'far leg' }],
    sectors: [{ slot: 1, yawRad: 1.8341, halfDeg: 20 }, { slot: 2, yawRad: 1.6771, halfDeg: 20 }],
    dead: [[4.97, 9.16, 6.32]],
    paths: { 1: [[7.35, 5.05], [8.1, 5.17], [8.13, 5.2], [8.13, 5.8], [8.11, 5.84], [6.3, 6]], 2: [[6.7, 5.05], [8.18, 5.09], [8.37, 5.2], [8.37, 5.8], [8.39, 5.84], [10.2, 6]] },
    far: { path: [[6.3, 6], [3.2, 8.2]], hot: 'r3:far' },
    inner: [],
    light: 'day',
  },
  'o:mu:d2:cabin-2': {
    room: 'mu.d2.cabin-2',
    parts: ['mu.d2.cabin-2'],
    door: 'o:mu:d2:cabin-2',
    threshold: [9.75, 3.7],
    entry: 'cross',
    stack: [[8.85, 4.45], [8.2, 4.45]],
    points: [[11, 3.5], [8, 3.5]],
    corners: [{ id: 'c0', x: 7, z: 0 }, { id: 'c1', x: 12, z: 0 }, { id: 'c2', x: 7, z: 4 }, { id: 'c3', x: 12, z: 4 }],
    hot: [{ id: 'r4:c0', x: 7.5, z: 0.5, why: 'corner' }, { id: 'r4:c2', x: 7.5, z: 3.5, why: 'corner' }, { id: 'r4:c3', x: 11.5, z: 3.5, why: 'behind the door' }],
    sectors: [{ slot: 1, yawRad: -1.6341, halfDeg: 20 }, { slot: 2, yawRad: -1.5075, halfDeg: 20 }],
    dead: [],
    paths: { 1: [[8.85, 4.45], [9.87, 4.3], [9.87, 3.7], [9.9, 3.67], [11, 3.5]], 2: [[8.2, 4.45], [9.62, 4.35], [9.63, 4.3], [9.63, 3.7], [9.61, 3.66], [8, 3.5]] },
    inner: [],
    light: 'day',
  },
};
// derive-plans:end

// (your hold in the lock and Four's: HAULER_START's #3 and #4, each looking down the passage through the hatch's middle)
const HOLD_AT = [HAULER_START[2].at, HAULER_START[3].at];
const yawTo = (p, q) => Math.round(Math.atan2(q[1] - p[1], q[0] - p[0]) * 1e4) / 1e4;

/** The passage's plan (see the header), authored: the holders' leg, your pair holding in the lock. */
const PASSAGE = {
  room: 'mu.d2.passage', parts: ['mu.d2.passage'], door: null, gate: { axis: 'z', at: 2.5, a: 4.35, b: 5.15 }, hold: true,
  threshold: [2.8, 4.75], entry: null,
  stack: HOLD_AT.map(p => [...p]), points: HOLD_AT.map(p => [...p]),
  corners: [{ id: 'c0', x: 2.5, z: 4 }, { id: 'c1', x: 12, z: 4 }, { id: 'c2', x: 2.5, z: 5.5 }, { id: 'c3', x: 12, z: 5.5 }],
  hot: [],
  sectors: HOLD_AT.map((p, i) => ({ slot: i + 1, yawRad: yawTo(p, [12, 4.75]), halfDeg: HALF })),
  dead: [],
  paths: { 1: [[...HOLD_AT[0]], [...HOLD_AT[0]]], 2: [[...HOLD_AT[1]], [...HOLD_AT[1]]] },
  inner: [], light: 'day',
};

/** The hauler's legs in the lane's order (see the header): the hatch that leads into each. */
export const HAULER_ORDER = Object.freeze([LOCK_HATCH_ID, 'o:mu:d2:cabin-1', 'o:mu:d2:bunks', 'o:mu:d2:cabin-2']);

/** The hauler's plan set (see the header), X4_PLANS' shape: { lane: 'M', area, order, plans }. */
export const HAULER_PLANS = deepFreeze({
  lane: 'M', area: HAULER_ID, order: [...HAULER_ORDER],
  plans: Object.fromEntries(HAULER_ORDER.map(k => [k, k === LOCK_HATCH_ID ? PASSAGE : DERIVED[k] ?? null])),
});
