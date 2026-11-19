// OLYMPUS sim: the R-7's ballistic breach, the lock or the hinges shot with the house's frangible (COMBAT §25.20; FM 3-06.11's and TC 3-21.76's ballistic breach; the build sheet 0.0.19 §3.1, §5).
//
// The doctrine: the muzzle close to the door, 45 degrees down and 45 degrees inboard, on the lock or on each hinge in turn, so a
// round that goes through strikes the floor just inside and nobody in the room. Rifle rounds are poor for it (to check), so the
// odds here are honestly low. It is offered on a door locked (breach.js kitHas 'ballistic' on a breaching lane: the loadout
// carrying a charge or a tool, BALLISTIC_LANES; struck "not locked" on one that is not, "marking rounds" on a load that cannot).
//
// shootPlanOf(state, pid, plan) is the door's points: a push door's lock ({ key 'lock', yM 1.0 } a hand in from the latch jamb),
// a pull door's three hinges top down (h1 1.75, h2 1.0, h3 0.25 m: my call, to check), each on the leaf from the shooter's side,
// the muzzle BALLISTIC_STANDOFF_M 0.05 off it, the line yawed BALLISTIC_YAW_IN_DEG 45 inboard (toward the door's middle). The round
// resolves at the muzzle's real distance, the shooter's body's less MUZZLE_REACH_M 0.6 m and never under the stand-off (the hunt of
// v0.0.20, breach-4: the closet's lock shot from 5.53 m resolved at 0.05 m); the inner door's row walks him to its leaf first
// (bundle.js innerStandOf).
// **Each round is a real shot**: shootRound calls shot.js resolveShot with target { kind: 'door', door, dM: 0.05 }, part 'thing'
// (PART_DC +4) and the row 'shoot:door', so the magazine's count, the belief, a stoppage and the dummy round all run as for any
// shot; the scene records it (bundle.js useDoorShot: house-kit.js breachShot, the breach's tally, never a miss on the paper).
// **The angle and the defeat** come from the shot's roll: the pitch drawn in BALLISTIC_PITCH_DEG by its grade (a pass or better
// 40 to 50 degrees, a miss 20 to 40, a bad shot 6 to 18, a disaster 0 to 6) on stream 'house:ball' by the shot, and the point
// defeated at DEFEAT_P (a lock 0.25 at a pass, 0.45 good or better; a hinge 0.35 and 0.6: my calls, low by the doctrine), on the
// same stream. BALLISTIC_MAX_ROUNDS 4 a point, then the drill hands back "It won't give." (Again, Pry it, Kick it).
// **Past the leaf:** throughLeaf is penetrate.js throughMaterial on the leaf (honeycomb 25 mm, the frangible's hard-target
// break-up), about a quarter going through as fragments; strikeLine walks the round on into the room, y(s) = y0 − s tan(pitch),
// and a stand within FACE_HALF_M 0.5 of the line with the round between 0 and STAND_TOP_M 1.8 m at it is struck: at 45 degrees
// the floor is reached 1.0 m in from the lock, 1.75 m from the top hinge, 4.7 m at 12 degrees.
// Pure but shootRound, which fires the round (resolveShot) and hands it to the scene's recorder.
import { stream, next, range } from '../../core/rng.js';
import { q } from '../../core/num.js';
import { openingOf } from '../places/model.js';
import { throughMaterial, penOf } from '../arms/penetrate.js';
import { MODELS } from '../arms/models.js';
import { resolveShot } from '../arms/shot.js';
import { doorSwing } from './bundle.js';
import { sessionOf } from './op.js';

/** The muzzle off the leaf (m), the line's inboard yaw (degrees), a point's most rounds before the hand-back (TC 3-21.76; my call). */
export const BALLISTIC_STANDOFF_M = 0.05, BALLISTIC_YAW_IN_DEG = 45, BALLISTIC_MAX_ROUNDS = 4;
/** The muzzle this far before the shooter's body at the high ready (m; my call: the R-7's length past the shoulder): a body MUZZLE_REACH_M from the point or nearer has the muzzle on it (the hunt of v0.0.20, breach-4). */
export const MUZZLE_REACH_M = 0.6;
/** The lanes it is offered on (breach.js's own copy, the build sheet 0.0.19 §0 item 16; my call). */
export const BALLISTIC_LANES = Object.freeze(['breach']);
/** The points by the door's way (see the header): the lock a hand in from the latch jamb; the hinges top down (to check). */
export const BREACH_POINTS = Object.freeze({ lock: Object.freeze([Object.freeze({ key: 'lock', yM: 1.0 })]), hinge: Object.freeze([Object.freeze({ key: 'h1', yM: 1.75 }), Object.freeze({ key: 'h2', yM: 1.0 }), Object.freeze({ key: 'h3', yM: 0.25 })]) });
/** The pitch down by the roll's grade (degrees; see the header). */
export const BALLISTIC_PITCH_DEG = Object.freeze({ superb: [40, 50], good: [40, 50], pass: [40, 50], miss: [20, 40], bad: [6, 18], disaster: [0, 6] });
/** A point's defeat by the round (see the header; my calls, low by the doctrine). */
export const DEFEAT_P = Object.freeze({ lock: Object.freeze({ pass: 0.25, good: 0.45, superb: 0.45 }), hinge: Object.freeze({ pass: 0.35, good: 0.6, superb: 0.6 }) });
/** A stand is struck within this of the round's line (m), the round between the floor and this height at it (m). */
export const FACE_HALF_M = 0.5, STAND_TOP_M = 1.8;
/** The leaf the round meets (penetrate.js WALLS.cabin's: a honeycomb door, my call as practice.js LEAF_WALL). */
export const LEAF = Object.freeze({ material: 'honeycomb', mm: 25 });
/** The point's place a hand in from its jamb (m). */
export const POINT_IN_M = 0.1;

const D2R = Math.PI / 180;
const doorMid = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);

/**
 * The door's points for a person (see the header): { how: 'lock' | 'hinge', points: [{ key, yM, x, z }], into: [x, z] (the unit
 * normal into the room ahead), mid }, from the side the person stands; from: the room an inner door is seen from (bundle.js doorSwing's).
 */
export function shootPlanOf(state, pid, plan, { from = null } = {}) {
  const o = plan?.door ? openingOf(plan.door) : null, sw = o ? doorSwing(state, plan, from) : null;
  const how = sw?.how === 'pull' ? 'hinge' : 'lock';
  if (!o || !sw) return { how, points: BREACH_POINTS[how].map(p => ({ ...p })), into: [0, 1], mid: o ? doorMid(o) : [0, 0] };
  const a = pid === state.player?.id ? state.actors?.list?.find(x => x.who === pid) ?? null : state.actors?.list?.find(x => x.who === pid) ?? null;
  const [mx, mz] = doorMid(o), side = a ? Math.sign(o.axis === 'x' ? a.z - o.at : a.x - o.at) || 1 : 1;
  const into = o.axis === 'x' ? [0, -side] : [-side, 0];
  const edge = how === 'hinge' ? sw.hingeXZ : sw.latchXZ, other = how === 'hinge' ? sw.latchXZ : sw.hingeXZ;
  const u = [other[0] - edge[0], other[1] - edge[1]], L = Math.hypot(u[0], u[1]) || 1;
  const at = [edge[0] + u[0] / L * POINT_IN_M, edge[1] + u[1] / L * POINT_IN_M];
  return { how, into, mid: [mx, mz], inward: [u[0] / L, u[1] / L], points: BREACH_POINTS[how].map(p => ({ ...p, x: q(at[0], 1e-3), z: q(at[1], 1e-3) })) };
}
/** The pitch down (degrees) a grade gives, drawn on r (see the header). */
export function pitchOf(grade, r) { const b = BALLISTIC_PITCH_DEG[grade] ?? BALLISTIC_PITCH_DEG.disaster; return q(range(r, b[0], b[1]), 0.01); }
/** Whether the round defeats its point (see the header), drawn on r: never below a pass. */
export function defeatOf(how, grade, r) { const p = DEFEAT_P[how]?.[grade] ?? 0; return p > 0 && next(r) < p; }
/** The round through the leaf (see the header): { through, penLeftMm }, drawn on r. */
export function throughLeaf(r, round) {
  const t = throughMaterial(r, { penMm: round.penMm, material: LEAF.material, mm: LEAF.mm, frangible: round.frangible !== false });
  return { through: !t.stopped, penLeftMm: t.penLeftMm ?? 0, fragments: !!t.fragments };
}
/**
 * The round's line on into the room (see the header): { struck: T | null, floorM, along }. from [x, y, z] the leaf's point;
 * yawRad the line's heading; pitchRad down; the stands of the house past the door's plane.
 */
export function strikeLine(state, { from, yawRad, pitchRad, door }) {
  const [x0, y0, z0] = from, dir = [Math.cos(yawRad), Math.sin(yawRad)], t = Math.tan(Math.max(0, pitchRad));
  const floorM = t > 1e-6 ? y0 / t : Infinity, o = door ? openingOf(door) : null;
  let best = null;
  for (const T of sessionOf(state)?.turners ?? []) {
    const dx = T.x - x0, dz = T.z - z0, s = dx * dir[0] + dz * dir[1], lat = Math.abs(dx * dir[1] - dz * dir[0]);
    if (s <= 0 || lat > FACE_HALF_M || s > Math.max(floorM, 0)) continue;
    // (past the door's plane, on the room's side of it)
    if (o && Math.sign(o.axis === 'x' ? T.z - o.at : T.x - o.at) !== Math.sign(o.axis === 'x' ? dir[1] : dir[0])) continue;
    const y = y0 - s * t;
    if (y < 0 || y > STAND_TOP_M) continue;
    if (!best || s < best.s) best = { T, s };
  }
  return { struck: best?.T ?? null, floorM: Number.isFinite(floorM) ? q(floorM, 0.01) : null, along: best ? q(best.s, 0.01) : null };
}

/**
 * One round on a point (w; see the header): { ms, shot, defeated, struck, pitchDeg, through }. d: { who, door, how, atMs, tempo,
 * record (the scene's recorder: fn(state, bus, shot)) }; point: shootPlanOf's.
 */
export function shootRound(state, bus, d, point) {
  const pid = d.who, kit = state.people?.[pid]?.kit, gunId = kit?.worn?.sling ?? null, o = openingOf(d.door);
  if (!gunId || !o) return { ms: 0, shot: null, defeated: false, struck: null };
  const sp = shootPlanOf(state, pid, { ...(d.plan ?? {}), door: d.door, area: state.places?.live?.area }, { from: d.from ?? null });
  const P = sp.points.find(p => p.key === point.key) ?? { ...point, x: doorMid(o)[0], z: doorMid(o)[1] };
  // (the round at the muzzle's real distance from the point: the body's less MUZZLE_REACH_M, never under the stand-off (the hunt of
  // v0.0.20, breach-4: fired from 5.53 m across room 2 and resolved at 0.05 m; the rows now walk you to the leaf first))
  const me = state.actors?.list?.find(x => x.who === pid) ?? null, bodyM = me ? Math.hypot(me.x - P.x, me.z - P.z) : 0;
  const target = { kind: 'door', door: d.door, dM: q(Math.max(BALLISTIC_STANDOFF_M, bodyM - MUZZLE_REACH_M), 1e-3), x: P.x, z: P.z, key: null };
  const { ms, shot } = resolveShot(state, bus, { pid, gunId, target, part: 'thing', tempo: d.tempo ?? 'normal', atMs: d.atMs ?? state.clock.ms, row: { id: 'shoot:door' } });
  Object.assign(shot, { row: { id: 'shoot:door' }, door: d.door, point: P.key });
  let defeated = false, struck = null, pitchDeg = null, through = false;
  if (shot.fired) {
    const r = stream(state.meta.seed, 'house:ball', shot.id), grade = shot.roll?.grade ?? 'miss';
    pitchDeg = pitchOf(grade, r);
    defeated = defeatOf(sp.how, grade, r);
    const cal = MODELS[state.items[gunId]?.model]?.cal ?? '6.5x40r', round = { penMm: penOf(cal, shot.load ?? 'frangible', shot.flight?.vMs ?? 790), frangible: (shot.load ?? 'frangible') === 'frangible' };
    through = throughLeaf(r, round).through;
    if (through) {
      // (the line: into the room, yawed inboard toward the door's middle)
      const yaw0 = Math.atan2(sp.into[1], sp.into[0]), inb = Math.atan2(sp.inward?.[1] ?? 0, sp.inward?.[0] ?? 0);
      const yaw = yaw0 + Math.sign(Math.sin(inb - yaw0)) * BALLISTIC_YAW_IN_DEG * D2R;
      struck = strikeLine(state, { from: [P.x, P.yM, P.z], yawRad: yaw, pitchRad: pitchDeg * D2R, door: d.door }).struck;
    }
    Object.assign(shot, { breach: { pitchDeg, defeated, through, struck: struck?.key ?? null } });
  }
  d.record?.(state, bus, shot);
  return { ms, shot, defeated, struck, pitchDeg, through };
}
