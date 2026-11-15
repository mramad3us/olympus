// OLYMPUS places: a hinged door's swing read from its opening's data, and what it decides for a stack on it (PLACES §1.6; COMBAT §25.5.1, §25.19.2.1; the user, 2026-11-15: "doors should have a direction they open (pull or push) and it should affect our options for entry").
//
// Every leafed opening records `swing: { hinge: 'a' | 'b', into: <its rooms' index> }` (PLACES §1.6: the end its hinges are
// at and the room its leaf swings into; without one, v0.0.3's rule: hinged at a, into the first room, as the stage builds it,
// src/art/jobs.js leafProp). Read from one side of its line (the room a man stands in, or a side's sign), that is two facts a
// stack lives by:
//   how     'push' where the leaf swings away from you (into the other side), 'pull' where it swings toward you
//   hinge   'left' or 'right' as seen facing the door from that side (x east, z south: left of a facing f is (f.z, -f.x))
// and the doctrine's answers to them (each my call, from FM 3-06.11 §3-22 and the house's authored stacks, which already obeyed
// it: every lane door's stack stood 0.5 m past its latch jamb):
//   - **the stack forms on the latch side** (`stackSide`, the side away from the hinge), on a push and a pull alike: the leaf
//     always swings toward its hinge, so the latch side's view and way stay clear while it moves; on a pull the open leaf stands
//     square to the wall at the hinge jamb, a screen across the hinge side of the hall, so a stack there would be shut out
//   - **#1 opens it**, the man at the latch jamb: a push he shoves with his support hand and flows in behind it (from rung 3 the
//     way is his at two thirds open: the bundle's PASS_SHARE); a pull he draws toward him and steps back off its arc, and the
//     leaf must swing clear before anyone goes in (the order adjusted: stop, pull, step back, then in, never hands over feet)
//   - **a kick only on a push**: a pull door's leaf bears on its stop in the frame, so a boot drives it shut (`kickable`)
//   - **behind the door** is a push door's: its leaf folds back against the room's near wall on the hinge side, the near corner
//     there hidden until you are past it (`behindSide`, the room's side as seen going in); a pull door's leaf stands in the
//     hall, nothing behind it in the room
// The stack's points (stackPointsOf): #1 STACK_OFF_FRAME_M 0.5 past the latch jamb along the wall and STACK_OFF_WALL_M 0.45
// off it, each man after STACK_BEHIND_M 0.65 further along (COMBAT §25.5.1; the authored plans' numbers exactly).
// The leaf's arc (arcOf): the quarter disc its free edge sweeps, centred on the hinge, its radius the leaf's width (the
// opening's b − a) plus ARC_PAD_M for a body's half-width, from the closed line toward the side it swings into; sweepAt(o,
// f0, f1) the part of it a leaf moving from open fraction f0 to f1 has still to sweep, which places/zones.js makes a no-stop
// zone while it moves. doorWords(o, side) is the read in a marine's words: "Pull door, hinge left.".
// Pure functions of the frozen opening (and the rooms' rects for a side by room); nothing here reads or writes a state.

/** The stack's #1 this far past the latch jamb along the wall, metres (COMBAT §25.5.1). */
export const STACK_OFF_FRAME_M = 0.5;
/** The stack this far off the wall, metres (COMBAT §25.5.1). */
export const STACK_OFF_WALL_M = 0.45;
/** Each man of the stack this far behind the one before, metres (COMBAT §25.5.1, x4-plans.js). */
export const STACK_BEHIND_M = 0.65;
/** The leaf's arc reaches this past its free edge, metres: a body's half-width, so a man whose centre lies outside is clear of it (my call; nav.js C0 0.27). */
export const ARC_PAD_M = 0.25;
/** Why a pull door's Kick is struck (the panel's words). */
export const KICK_PULL_WHY = 'opens toward you';

// (the line's ends and its geometry: u along it from a to b, n the normal toward + across it)
const ends = (o) => (o.axis === 'x' ? [[o.a, o.at], [o.b, o.at]] : [[o.at, o.a], [o.at, o.b]]);
const midOf = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);
const normalOf = (o, s) => (o.axis === 'x' ? [0, s] : [s, 0]);
const r4 = (v) => Math.round(v * 1e4) / 1e4;
/** The side of an opening's line a point lies on: +1 past it (z or x greater than `at`), -1 before it, 0 on it. */
export const sideOfPoint = (o, x, z) => Math.sign((o.axis === 'x' ? z : x) - o.at);
/** The side of an opening's line a rect [x0, z0, x1, z1] lies on, by its middle (+1 or -1; 0 for none). */
export const sideOfRect = (o, r) => (r ? sideOfPoint(o, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2) : 0);

/**
 * A leafed opening's leaf (see the header): { hingeEnd, hinge: [x, z], latch: [x, z], widthM, intoSide (+1 | -1: the side of
 * the line it swings into) }, or null for an opening with no line. rects: { roomId: rect } for its rooms (the side of `into`).
 */
export function leafOf(o, rects = {}) {
  if (!o || !Number.isFinite(o.at) || !Number.isFinite(o.a) || !Number.isFinite(o.b)) return null;
  const [A, B] = ends(o), hingeEnd = o.swing?.hinge === 'b' ? 'b' : 'a';
  const intoRoom = o.rooms?.[Number.isInteger(o.swing?.into) ? o.swing.into : 0] ?? null;
  // (the side it swings into: its room's rect's, else the opening's own record of it (`intoSide`), else + (the first room's
  // side is not known without its rect: a generated door gives its rooms' rects, or says intoSide))
  const intoSide = (Number.isFinite(o.intoSide) && o.intoSide !== 0 ? Math.sign(o.intoSide) : sideOfRect(o, rects[intoRoom])) || 1;
  return { hingeEnd, hinge: hingeEnd === 'a' ? A : B, latch: hingeEnd === 'a' ? B : A, widthM: r4(Math.abs(o.b - o.a)), intoRoom, intoSide };
}

/**
 * The door read from one side (see the header): side +1 or -1 of its line (the stack's), or a room id with rects. Returns
 * { how: 'push' | 'pull', hinge: 'left' | 'right', latch, stackSide (the latch's, 'left' | 'right'), kickable, kickWhy,
 * behindSide (a push door's hinge side as seen going in, else null), side, intoSide, hingeXZ, latchXZ, widthM, words }, or null.
 */
export function swingFrom(o, side, rects = {}) {
  const L = leafOf(o, rects);
  if (!L) return null;
  const s = typeof side === 'number' ? Math.sign(side) : sideOfRect(o, rects[side]);
  if (!s) return null;
  const how = L.intoSide === s ? 'pull' : 'push';
  // (facing the door from side s: the facing is -n(s); its left (f.z, -f.x))
  const f = normalOf(o, -s), left = [f[1], -f[0]], m = midOf(o);
  const hinge = (L.hinge[0] - m[0]) * left[0] + (L.hinge[1] - m[1]) * left[1] > 0 ? 'left' : 'right', latch = hinge === 'left' ? 'right' : 'left';
  // (going in, the facing is the same, so the hinge keeps its side: a push door's hinge side is behind the door)
  return {
    how, hinge, latch, stackSide: latch, kickable: how === 'push', kickWhy: how === 'push' ? null : KICK_PULL_WHY,
    behindSide: how === 'push' ? hinge : null, side: s, intoSide: L.intoSide, hingeXZ: [...L.hinge], latchXZ: [...L.latch], widthM: L.widthM,
    words: doorWordsOf(how, hinge),
  };
}

/** The read's words (see the header): "Pull door, hinge left.". */
export const doorWordsOf = (how, hinge) => `${how === 'pull' ? 'Pull' : 'Push'} door, hinge ${hinge}.`;
/** The read of a door from one side in a marine's words, or null (see swingFrom). */
export const doorWords = (o, side, rects = {}) => swingFrom(o, side, rects)?.words ?? null;

/**
 * The stack's points on a door from one side (see the header): [[x, z] × n], #1 first, on the latch side: STACK_OFF_FRAME_M past
 * the latch jamb along the wall, STACK_OFF_WALL_M off it, each after STACK_BEHIND_M further along. Rounded to 0.1 mm.
 */
export function stackPointsOf(o, side, rects = {}, n = 2) {
  const L = leafOf(o, rects), s = typeof side === 'number' ? Math.sign(side) : sideOfRect(o, rects[side]);
  if (!L || !s) return [];
  const ux = L.latch[0] - L.hinge[0], uz = L.latch[1] - L.hinge[1], len = Math.hypot(ux, uz) || 1, u = [ux / len, uz / len], nn = normalOf(o, s);
  return Array.from({ length: n }, (_, i) => {
    const along = STACK_OFF_FRAME_M + i * STACK_BEHIND_M;
    return [r4(L.latch[0] + u[0] * along + nn[0] * STACK_OFF_WALL_M), r4(L.latch[1] + u[1] * along + nn[1] * STACK_OFF_WALL_M)];
  });
}

/**
 * The leaf's arc (see the header): { door, hinge: [x, z], rM, u (the closed leaf's way from the hinge), n (the way it opens
 * toward) }, or null. A point's angle round it is 0 on the closed leaf, π/2 on the open one (angleIn).
 */
export function arcOf(o, rects = {}) {
  const L = leafOf(o, rects);
  if (!L) return null;
  const ux = L.latch[0] - L.hinge[0], uz = L.latch[1] - L.hinge[1], len = Math.hypot(ux, uz) || 1;
  return Object.freeze({ door: o.id ?? null, hinge: Object.freeze([...L.hinge]), rM: r4(L.widthM + ARC_PAD_M), widthM: L.widthM, u: Object.freeze([ux / len, uz / len]), n: Object.freeze(normalOf(o, L.intoSide)) });
}
/** A point's angle round an arc (radians: 0 on the closed leaf, π/2 on the open one; outside 0 to π/2 off its quarter) and its distance from the hinge: { phi, dM }. */
export function angleIn(A, x, z) {
  const dx = x - A.hinge[0], dz = z - A.hinge[1];
  return { phi: Math.atan2(dx * A.n[0] + dz * A.n[1], dx * A.u[0] + dz * A.u[1]), dM: Math.hypot(dx, dz) };
}
/**
 * Whether a point lies in the part of an arc a leaf moving from open fraction f0 to f1 has still to sweep (see the header):
 * within its radius, at an angle between the two (each fraction a quarter turn's share), never past the hinge's own side.
 */
export function inSweep(A, x, z, f0, f1) {
  if (!A) return false;
  const { phi, dM } = angleIn(A, x, z), lo = Math.min(f0, f1) * Math.PI / 2, hi = Math.max(f0, f1) * Math.PI / 2;
  return dM <= A.rM && phi >= lo - 1e-9 && phi <= hi + 1e-9;
}
/** The arc's points along its free edge's way for a drawing (closed to open), every stepM of the arc's length: [[x, z], …]. */
export function arcPoints(A, stepM = 1 / 16, f0 = 0, f1 = 1) {
  if (!A) return [];
  const R = A.widthM, a0 = f0 * Math.PI / 2, a1 = f1 * Math.PI / 2, n = Math.max(1, Math.ceil((R * Math.abs(a1 - a0)) / stepM)), out = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + (a1 - a0) * (i / n), c = Math.cos(t), s = Math.sin(t);
    out.push([A.hinge[0] + R * (c * A.u[0] + s * A.n[0]), A.hinge[1] + R * (c * A.u[1] + s * A.n[1])]);
  }
  return out;
}
