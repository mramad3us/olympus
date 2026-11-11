// OLYMPUS data: the room plans of X4's layout A, house 1 of the Wheel's sector 4, authored (COMBAT §25.7.3; PLACES §4.15; the build sheet 0.0.12 §2.1).
//
// The beats of a room's drill read a room plan: where the stack stands, where each man goes, the corners and the
// hot spots he must look at, his sector, the dead space, the paths in. COMBAT §25.7.3: "for the first scene the
// plans of X4's three layouts are authored as data", held by a golden hash; from 0.3 (Europa's buildings) they are
// derived from PLACES's room polygons by the systems proposal's method and checked against these. This round has
// layout A, the lane of src/data/places/wheel.js HOUSE1, in the area's frame (x along the spin, z across the band,
// metres; a yaw is an angle in that frame, 0 east, π/2 south, to 1e-4 rad).
//
// X4_PLANS.A: { lane: 'A', area, order: [door ids…, 'hall'], plans: { <door id or 'hall'>: plan } }, a plan:
//   room        the room's id; parts its rects' rooms (room 3's L is two: the near leg and the far leg)
//   door        the opening entered (null for the hall's leg); gate, for the hall, the line its leg begins at
//               ({ axis, at, a, b } as an opening's: the plane a door would give)
//   threshold   [x, z]: the door's middle, THRESHOLD_M 0.3 m into the room (src/sim/combat/room.js)
//   entry       'cross' (#1 crosses the door to the far side of his stack) or 'hook' (#1 turns back along the
//               near wall to his stack's side), the drill's default variant (COMBAT §25.7.2)
//   stack       [#1, #2]: #1 0.5 m from the door's frame on his side and 0.45 m off the wall, #2 0.65 m behind
//   points      [#1, #2]: the points of domination, 1.0 m along the near wall from the corner each goes to and
//               0.5 m off it (COMBAT §25.5.1, FM 3-06.11's "moves along the wall … to the first corner"), each
//               0.4 m or more off every wall's face (room.js, the test)
//   corners     [{ id, x, z }]: the room's corners (its rects' and its bends')
//   hot         [{ id, x, z, why }]: what must be looked at before "Clear!": each corner 0.5 m in ('corner'; the
//               hinge side's near corner 'behind the door'), the far leg's middle ('far leg')
//   sectors     [{ slot, yawRad, halfDeg: 20 }]: each man's sector from his point, toward his far corner (the
//               stands of his slot stand in it: wheel.js HOUSE1)
//   dead        [[x, z, rM]]: the dead space no point sees (room 3's far leg), cleared by moving past the near
//               leg's middle; with it, the points see 98% or more of the plan's floor cells (the test)
//   paths       { 1: [[x, z], …], 2: […] }: stack → threshold → point (room 1's #1 2.72 m: COMBAT §25.5.1)
//   far         { path: [[x, z], …], hot }: the far leg's walk, #1's, from his point to where the leg's dead space is
//               seen (room 3: 4.2 m up the near leg's east side to (18.7, 7.3), 0.94 m off the bend; the far leg's
//               middle and its stand first seen from z 7.9), and the hot spot it clears (0.0.12's integration, my call:
//               the bundle walks it as the room's own, and the panel's "Move: the far leg" by the keys or a press)
//   inner       [opening id]: a door inside the room the plan does not take (room 2's locked closet)
//   light       'day' | 'dim' (room 3: src/data/places/sky.js MOODS.dim)
// Room 1 is COMBAT §25.5.1's reference room exactly (5.0 × 4.0 m, the door 0.9 m in the middle of the near wall,
// inward, hinged on the left as seen from the hall); the path's door plane falls 0.73 m along it and the threshold
// 1.21 m (§25.5.1's 0.8 and 1.1 assume a step through the doorway's middle a body's half-width from the jamb, which
// these walls' 0.08 m half-thickness do not allow: my call, the path's 2.72 m kept). Frozen literals.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** A sector's half-width, degrees (COMBAT §25.7.3; the build sheet 0.0.12 §2.1: SECTOR_HALF_DEG). */
const HALF = 20;

/** X4's authored plans by layout (see the header): this round, layout A. */
export const X4_PLANS = deepFreeze({
  A: {
    lane: 'A', area: 'melas.wheel.s4',
    order: ['o:w4:r1', 'o:w4:r2', 'o:w4:r3', 'hall'],
    plans: {
      'o:w4:r1': {
        room: 'w4.r1', parts: ['w4.r1'], door: 'o:w4:r1', threshold: [29.0, 11.7], entry: 'cross',
        stack: [[29.95, 12.45], [30.6, 12.45]], points: [[27.5, 11.5], [30.5, 11.5]],
        corners: [{ id: 'nl', x: 26.5, z: 12 }, { id: 'nr', x: 31.5, z: 12 }, { id: 'fl', x: 26.5, z: 8 }, { id: 'fr', x: 31.5, z: 8 }],
        hot: [{ id: 'r1:nl', x: 27.0, z: 11.5, why: 'behind the door' }, { id: 'r1:nr', x: 31.0, z: 11.5, why: 'corner' }, { id: 'r1:fl', x: 27.0, z: 8.5, why: 'corner' }, { id: 'r1:fr', x: 31.0, z: 8.5, why: 'corner' }],
        sectors: [{ slot: 1, yawRad: -1.7829, halfDeg: HALF }, { slot: 2, yawRad: -1.3587, halfDeg: HALF }],
        dead: [],
        paths: { 1: [[29.95, 12.45], [29.0, 11.7], [27.5, 11.5]], 2: [[30.6, 12.45], [29.0, 11.7], [30.5, 11.5]] },
        inner: [], light: 'day',
      },
      'o:w4:r2': {
        room: 'w4.r2', parts: ['w4.r2'], door: 'o:w4:r2', threshold: [20.6, 14.7], entry: 'hook',
        stack: [[21.55, 13.95], [22.2, 13.95]], points: [[22.6, 14.9], [20.6, 16.2]],
        corners: [{ id: 'nw', x: 20, z: 14.4 }, { id: 'ne', x: 25.5, z: 14.4 }, { id: 'se', x: 25.5, z: 19.4 }, { id: 'sw', x: 20, z: 19.4 }],
        hot: [{ id: 'r2:ne', x: 25.0, z: 14.9, why: 'corner' }, { id: 'r2:se', x: 25.0, z: 18.9, why: 'corner' }, { id: 'r2:sw', x: 20.5, z: 18.9, why: 'corner' }],
        sectors: [{ slot: 1, yawRad: 1.0659, halfDeg: HALF }, { slot: 2, yawRad: 0.8983, halfDeg: HALF }],
        dead: [],
        paths: { 1: [[21.55, 13.95], [20.6, 14.7], [22.6, 14.9]], 2: [[22.2, 13.95], [20.6, 14.7], [20.6, 16.2]] },
        inner: ['o:w4:closet'], light: 'day',
      },
      'o:w4:r3': {
        room: 'w4.r3', parts: ['w4.r3', 'w4.r3-far'], door: 'o:w4:r3', threshold: [17.5, 11.7], entry: 'hook',
        stack: [[18.45, 12.45], [19.1, 12.45]], points: [[18.5, 11.5], [16.5, 11.5]],
        corners: [{ id: 'nw', x: 15.5, z: 12 }, { id: 'ne', x: 19.5, z: 12 }, { id: 'fw', x: 15.5, z: 5.2 }, { id: 'bend', x: 19.5, z: 7.8 }, { id: 'far-ne', x: 23, z: 5.2 }, { id: 'far-se', x: 23, z: 9.2 }, { id: 'far-sw', x: 19.5, z: 9.2 }],
        hot: [{ id: 'r3:nw', x: 16.0, z: 11.5, why: 'behind the door' }, { id: 'r3:ne', x: 19.0, z: 11.5, why: 'corner' }, { id: 'r3:fw', x: 16.0, z: 5.7, why: 'corner' }, { id: 'r3:bend', x: 19.0, z: 8.3, why: 'corner' }, { id: 'r3:far', x: 21.25, z: 7.2, why: 'far leg' }],
        sectors: [{ slot: 1, yawRad: -1.4848, halfDeg: HALF }, { slot: 2, yawRad: -1.6568, halfDeg: HALF }],
        dead: [[21.25, 7.2, 2.7]],
        paths: { 1: [[18.45, 12.45], [17.5, 11.7], [18.5, 11.5]], 2: [[19.1, 12.45], [17.5, 11.7], [16.5, 11.5]] },
        far: { path: [[18.5, 11.5], [18.7, 7.3]], hot: 'r3:far' },
        inner: [], light: 'dim',
      },
      hall: {
        room: 'w4.hall', parts: ['w4.hall'], door: null, gate: { axis: 'z', at: 16.9, a: 12, b: 14.4 }, threshold: [16.6, 13.2], entry: null,
        stack: [[17.3, 12.7], [17.95, 13.6]], points: [[11.5, 12.7], [12.2, 13.7]],
        corners: [{ id: 'nw', x: 5, z: 12 }, { id: 'sw', x: 5, z: 14.4 }],
        hot: [{ id: 'hall:nw', x: 5.5, z: 12.5, why: 'corner' }, { id: 'hall:sw', x: 5.5, z: 13.9, why: 'corner' }],
        sectors: [{ slot: 1, yawRad: 3.015, halfDeg: HALF }, { slot: 2, yawRad: -3.0671, halfDeg: HALF }],
        dead: [],
        paths: { 1: [[17.3, 12.7], [11.5, 12.7]], 2: [[17.95, 13.6], [12.2, 13.7]] },
        inner: [], light: 'day',
      },
    },
  },
});
