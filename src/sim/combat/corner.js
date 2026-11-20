// OLYMPUS combat: your corner, the rule written once: for each man of the stack by slot, which way he turns on crossing the threshold, his corner (the first danger area he clears), his point of domination and the sector he holds after (COMBAT §25.7.3, §25.5.1; the user, 2026-11-15: "there should be rigorous definition of which is our corner, because there is currently no indication at to where we're supposed to be looking when entering a room").
//
// Read from a room plan's geometry alone (src/sim/combat/room.js roomPlanOf: its door's plane, its rooms' rects, its door's
// swing from the stack's side, src/sim/places/swing.js swingFrom, and its stack), so a generated room gets it as house 1 does;
// where the plan authors points and sectors (src/data/places/x4-plans.js) the rule keeps them and the tests hold that it
// derives the same sides. The frame is the door's, as seen going in: f the facing into the room, `left` (f.z, -f.x) with x
// east and z south; a point's depth d past the door's plane and its side s of the door's middle (+ left).
//
// The door (doorKindOf), from the room it opens into (the entered rect: the one holding the plan's threshold):
//   centre-fed  both side walls more than CORNER_FED_M 1.0 m past their jambs
//   corner-fed  one side wall within it (the fed side: room 2, its west wall 0.15 m past the hinge jamb)
//   passage     both within it: an opening as wide as its room (the hall's gate)
// Who goes which way (FM 3-06.11 §3-29: "the path of least resistance"; MCWP 3-35.3 §19; each step my call where the manuals
// leave it open, and every one agrees with X4's authored plans):
//   1. a passage: each man straight down his own side, #1 on his stack's side (the hall: north)
//   2. corner-fed: #1 turns to the open side, along the door's wall; #2 goes straight in along the fed side's wall
//   3. centre-fed, the room's shape: where the room reaches further to one side than the other by more than SHAPE_TOL_M 1.0 m
//      (room 3's L: 2.0 m west, 5.5 m east by its far leg), #1 turns to the deeper side (he walks it later: the far leg)
//   4. centre-fed and even, a push door: #1 to the hinge side, the corner the leaf hides (room 1: he crosses to it, "behind
//      the door"), so the deadliest place is the first man's
//   5. centre-fed and even, a pull door: #1 to the latch side, his own (he hooks: the leaf stands in the hall on the hinge side
//      and nothing hides behind it in the room); a doorway with no leaf: he crosses (the drill's default entry, x4-plans.js)
//   and #2 turns the other way (but in 1 and 2). His entry is 'hook' where he turns to his stack's side, 'cross' where he
//   turns across the door, 'straight' where he goes straight in.
// His corner, the first danger area he clears: a man who turns takes the near corner on his side (on the door's wall: he
// walks into it, and a hot spot there is covered by his standing in it, room.js NEAR_M); a man who goes straight takes the
// far corner on his side (down the wall he follows), but in a passage, where each man watches the far end of the other
// wall (the hallway's cross-cover, as X4's hall plan already aimed its sectors), the far corner across (`look`). Named by the plan's hot spot within CORNER_HOT_M of it, else the corner
// itself 0.5 m in.
// His point of domination: the plan's where it authors one; derived otherwise by COMBAT §25.7.3's method (a turning man
// POINT_ALONG_M 1.0 m back along the door's wall from his corner and POINT_OFF_M 0.5 m off it; a straight one POINT_OFF_M
// off his side wall, a third of the room's depth in).
// His sector, held from his point once his corner is cleared: the arc from the far corner on his side (down his wall) to the
// far wall's middle (COMBAT §7.7: "each takes the sector from its point to the far wall's middle"), widened to hold the plan's
// own sector (its yaw, SECTOR_HALF_DEG either side) where it authors one: { fromRad, toRad (fromRad + arc, the yaw growing
// from east toward south), yawRad (its middle), arcDeg }. The bundle's corner look (bundle.js cornerOf: the hot spot nearest
// the sector's yaw) lies inside it, so the eyes the drill moves and the wedge the floor shows agree (the tests hold it).
// cornerRuleOf(plan, slot) is the rule for a slot (1 or 2: the shoot house's two-man team; #3 and #4 come with 0.1's fire
// team); cornerTableOf(plan) both; cornerWordsOf(rule) the side in the marine's own frame ("left", "the far right"), and
// screenWordsOf(rule) the same side as the screen shows it, the DI's words (0.0.16: room 2, entered going south, "right"). Cached by the
// frozen plan (a WeakMap), so the stage's look reads it every frame for nothing. roomFromOpening(o, rects, side) is a plan's
// geometry made from an opening and its rooms alone (a generated room: the tests' and 0.3's). Pure.
import { swingFrom, stackPointsOf, sideOfPoint } from '../places/swing.js';

/** A side wall this close past its jamb or closer makes the door corner-fed on that side, metres (my call: no point of domination fits between, at POINT_ALONG_M and a body's width). */
export const CORNER_FED_M = 1.0;
/** The room reaching this much further to one side than the other leads #1 there, metres (my call: room 3's far leg). */
export const SHAPE_TOL_M = 1.0;
/** A point within this of the door's middle line goes straight in, metres (bundle.js HOT_AHEAD_M's 0.3). */
export const STRAIGHT_M = 0.3;
/** The point of domination: this far back along the wall from the corner, and this far off it, metres (COMBAT §25.7.3). */
export const POINT_ALONG_M = 1.0, POINT_OFF_M = 0.5;
/** A plan's hot spot this close to a corner names it, metres (x4-plans.js: each corner's hot spot 0.5 m in on both walls). */
export const CORNER_HOT_M = 1.0;
/** A plan's sector half-width, degrees (room.js SECTOR_HALF_DEG). */
export const SECTOR_HALF_DEG = 20;

const D2R = Math.PI / 180;
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const other = (side) => (side === 'left' ? 'right' : 'left');
const sgn = (side) => (side === 'left' ? 1 : -1);
const bearing = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]);
const inRect = (r, x, z) => x >= r[0] - 1e-9 && x <= r[2] + 1e-9 && z >= r[1] - 1e-9 && z <= r[3] + 1e-9;

/**
 * The door's frame as seen going in (see the header): { mid, f, left, halfW, to(x, z) → { d, s }, at(d, s) → [x, z] }, from
 * the plan's plane ({ axis, at, a, b, into }), or null.
 */
export function frameOf(plan) {
  const P = plan?.plane;
  if (!P) return null;
  const f = P.axis === 'x' ? [0, P.into] : [P.into, 0], left = [f[1], -f[0]];
  const mid = P.axis === 'x' ? [(P.a + P.b) / 2, P.at] : [P.at, (P.a + P.b) / 2];
  return {
    mid, f, left, halfW: Math.abs(P.b - P.a) / 2,
    to: (x, z) => ({ d: (x - mid[0]) * f[0] + (z - mid[1]) * f[1], s: (x - mid[0]) * left[0] + (z - mid[1]) * left[1] }),
    at: (d, s) => [r4(mid[0] + f[0] * d + left[0] * s), r4(mid[1] + f[1] * d + left[1] * s)],
  };
}
// (a rect's extent in the frame: { d0, d1, sR (the right wall's side, the least), sL (the left's, the most) })
function rectIn(F, r) {
  const cs = [[r[0], r[1]], [r[2], r[1]], [r[0], r[3]], [r[2], r[3]]].map(([x, z]) => F.to(x, z));
  return { d0: Math.min(...cs.map(c => c.d)), d1: Math.max(...cs.map(c => c.d)), sR: Math.min(...cs.map(c => c.s)), sL: Math.max(...cs.map(c => c.s)) };
}
/** The rect a plan's threshold stands in (the room entered), else its first. */
const enteredOf = (plan) => (plan.rects ?? []).find(r => plan.threshold && inRect(r, plan.threshold[0], plan.threshold[1])) ?? plan.rects?.[0] ?? null;

/**
 * The door's kind and the room round it (see the header): { kind: 'centre-fed' | 'corner-fed' | 'passage', fed ('left' |
 * 'right' | null: the corner-fed side), near: { left, right } (each side wall past its jamb, m), reach: { left, right } (the
 * room's reach each side of the door's middle past its plane, over all its rects, m), depthM (the entered room's far wall) }.
 */
export function doorKindOf(plan) {
  const F = frameOf(plan), E = enteredOf(plan);
  if (!F || !E) return null;
  const e = rectIn(F, E), near = { left: r4(e.sL - F.halfW), right: r4(-e.sR - F.halfW) };
  const reach = { left: 0, right: 0 };
  for (const r of plan.rects ?? []) { const q = rectIn(F, r); if (q.d1 <= 0) continue; reach.left = Math.max(reach.left, q.sL); reach.right = Math.max(reach.right, -q.sR); }
  const fl = near.left <= CORNER_FED_M, fr = near.right <= CORNER_FED_M;
  const kind = fl && fr ? 'passage' : fl || fr ? 'corner-fed' : 'centre-fed';
  return { kind, fed: kind === 'corner-fed' ? (fl ? 'left' : 'right') : null, near, reach: { left: r4(reach.left), right: r4(reach.right) }, depthM: r4(e.d1) };
}

/** The stack's side of the door's middle as seen going in ('left' | 'right'): the swing's latch side, else #1's stack point's. */
function stackSideOf(plan, F) {
  if (plan.swing?.stackSide) return plan.swing.stackSide;
  const st = plan.stack?.[0];
  return st && F.to(st[0], st[1]).s < 0 ? 'right' : 'left';
}

/**
 * #1's side and why (see the header's steps 1 to 5): { side, why: 'passage' | 'open side' | 'shape' | 'behind the door' |
 * 'latch side' | 'no leaf' }.
 */
export function firstSideOf(plan) {
  const F = frameOf(plan), K = doorKindOf(plan);
  if (!F || !K) return null;
  const stackSide = stackSideOf(plan, F);
  if (K.kind === 'passage') return { side: stackSide, why: 'passage' };
  if (K.kind === 'corner-fed') return { side: other(K.fed), why: 'open side' };
  if (Math.abs(K.reach.left - K.reach.right) > SHAPE_TOL_M) return { side: K.reach.left > K.reach.right ? 'left' : 'right', why: 'shape' };
  const sw = plan.swing;
  if (sw?.how === 'push') return { side: sw.hinge, why: 'behind the door' };
  if (sw?.how === 'pull') return { side: sw.stackSide, why: 'latch side' };
  return { side: other(stackSide), why: 'no leaf' };
}

const RULES = new WeakMap();
/** Both slots' rules for a plan (see cornerRuleOf), cached by the plan. */
export function cornerTableOf(plan) {
  if (!plan || typeof plan !== 'object') return [];
  let t = RULES.get(plan);
  if (!t) { t = Object.freeze([1, 2].map(slot => Object.freeze(build(plan, slot))).filter(r => r.side)); RULES.set(plan, t); }
  return t;
}
/**
 * A slot's rule in a plan (see the header): { slot, door (doorKindOf's kind), why, stackSide, side ('left' | 'right': the
 * side of the room he works), look (the side he looks to: his own, the other in a passage), turn ('left' | 'right' | 'straight'), entry ('hook' | 'cross' | 'straight'), corner: { x, z,
 * hot (the plan's hot spot id, or null), hx, hz (where to look: the hot spot, or the corner 0.5 m in), along, back (unit
 * vectors along its two walls, away from it), near (the door's wall's corner: true; the far one: false) }, point [x, z],
 * pointFrom ('plan' | 'derived'), derived [x, z] (the method's, for the tests), sector: { fromRad, toRad, yawRad, arcDeg },
 * words ("left", "the far right") }, or null.
 */
export function cornerRuleOf(plan, slot = 1) {
  return cornerTableOf(plan).find(r => r.slot === slot) ?? null;
}

function build(plan, slot) {
  const F = frameOf(plan), K = doorKindOf(plan), first = firstSideOf(plan), E = enteredOf(plan);
  if (!F || !K || !first || !E || (slot !== 1 && slot !== 2)) return { slot, side: null };
  const e = rectIn(F, E), stackSide = stackSideOf(plan, F);
  const side = slot === 1 ? first.side : other(first.side);
  const straight = K.kind === 'passage' || (K.kind === 'corner-fed' && slot === 2);
  const turn = straight ? 'straight' : side, entry = straight ? 'straight' : side === stackSide ? 'hook' : 'cross';
  // (the side he looks to: his own, but in a passage, where each man watches the far end of the other wall (cross-cover))
  const look = K.kind === 'passage' ? other(side) : side;
  const wallS = side === 'left' ? e.sL : e.sR, k = sgn(side), lookS = look === 'left' ? e.sL : e.sR, kl = sgn(look);
  // (the corner: the door's wall's on his side for a man who turns, the far wall's for one who goes straight; its walls' ways
  // away from it: along its wall toward the room's middle, and along the side wall)
  const cd = straight ? e.d1 : Math.max(0, e.d0), cXZ = F.at(cd, lookS);
  const along = [-kl * F.left[0], -kl * F.left[1]], back = straight ? [-F.f[0], -F.f[1]] : [...F.f];
  const hot = nearestHot(plan, cXZ);
  const hxz = hot ? [hot.x, hot.z] : [r4(cXZ[0] + 0.5 * (along[0] + back[0])), r4(cXZ[1] + 0.5 * (along[1] + back[1]))];
  // (the point: the method's; the plan's where it has one)
  const derived = straight ? F.at(Math.max(POINT_OFF_M, e.d1 / 3), wallS - k * POINT_OFF_M) : F.at(cd + POINT_OFF_M, wallS - k * POINT_ALONG_M);
  const authored = plan.points?.[slot - 1] ?? null, point = authored ? [...authored] : derived;
  // (the sector: from the far corner on his side to the far wall's middle, the plan's own sector held inside it)
  const farSide = F.at(e.d1, lookS), farMid = F.at(e.d1, (e.sL + e.sR) / 2), ref = bearing(point, farMid);
  const rels = [0, wrap(bearing(point, farSide) - ref)];
  const sec = plan.sectors?.find(s => s.slot === slot);
  if (sec) for (const dz of [-1, 1]) rels.push(wrap(sec.yawRad + dz * (sec.halfDeg ?? SECTOR_HALF_DEG) * D2R - ref));
  const lo = Math.min(...rels), hi = Math.max(...rels);
  const sector = { fromRad: r4(wrap(ref + lo)), toRad: r4(wrap(ref + lo) + (hi - lo)), yawRad: r4(wrap(ref + (lo + hi) / 2)), arcDeg: Math.round((hi - lo) / D2R * 10) / 10 };
  return {
    slot, door: K.kind, why: first.why, stackSide, side, look, turn, entry,
    corner: { x: cXZ[0], z: cXZ[1], hot: hot?.id ?? null, hx: hxz[0], hz: hxz[1], along: along.map(r4), back: back.map(r4), near: !straight },
    point, pointFrom: authored ? 'plan' : 'derived', derived, sector, words: cornerWordsOf({ turn, look }), screen: screenWordsOf({ turn, look, f: F.f, left: F.left }),
  };
}
// (the plan's hot spot naming a corner: the nearest within CORNER_HOT_M, never the far leg's middle)
function nearestHot(plan, c) {
  let best = null;
  for (const h of plan.hot ?? []) {
    if (h.why === 'far leg') continue;
    const d = Math.hypot(h.x - c[0], h.z - c[1]);
    if (d <= CORNER_HOT_M && (!best || d < best.d)) best = { h, d };
  }
  return best?.h ?? null;
}

/** A rule's side in the DI's words (the side he looks to): "left", "right", or "the far left" for a man who goes straight in. */
export function cornerWordsOf(rule) {
  const side = rule?.look ?? rule?.side;
  if (!side) return null;
  return rule.turn === 'straight' ? `the far ${side}` : side;
}

/**
 * A rule's side as the screen shows it (the fixer's of 0.0.16, the play review's: "Your corner: left." was said in the marine's
 * own frame, and room 2, entered going south down the screen, has its corner on the screen's right): the side he looks to turned
 * into the view's frame (x east is the screen's right, z south its bottom), "left" or "right" for an entry up or down the screen,
 * "the top" or "the bottom" for one across it; "the far ..." for a man who goes straight in. rule: { turn, look, f, left } (the
 * door's frame, frameOf). The DI says these; `words` stay the marine's own for the rule's tables.
 */
export function screenWordsOf(rule) {
  const side = rule?.look ?? rule?.side;
  if (!side || !rule.f || !rule.left) return cornerWordsOf(rule);
  const k = sgn(side), v = [k * rule.left[0], k * rule.left[1]];
  const w = Math.abs(v[0]) >= Math.abs(v[1]) ? (v[0] > 0 ? 'right' : 'left') : (v[1] > 0 ? 'the bottom' : 'the top');
  return rule.turn === 'straight' ? (w.startsWith('the ') ? `the far corner, ${w.slice(4)}` : `the far ${w}`) : w;
}

/** Whether a bearing (rad) lies in a rule's sector, within tolDeg. */
export function inSectorOf(rule, yawRad, tolDeg = 0) {
  const S = rule?.sector;
  if (!S) return false;
  const rel = wrap(yawRad - S.fromRad), arc = S.toRad - S.fromRad, tol = tolDeg * D2R;
  return (rel >= -tol && rel <= arc + tol) || (rel + 2 * Math.PI <= arc + tol);
}

/**
 * A plan's geometry made from an opening and its rooms alone (a generated room; see the header): { door, plane, rects,
 * threshold, swing, stack, hot, corners }: the plane's `into` the side away from the stack, the threshold THRESHOLD 0.3 m in
 * from the door's middle, the stack the swing's (swing.js stackPointsOf), a hot spot 0.5 m in from each corner of the rooms,
 * "behind the door" on a push door's hinge side. side: the stack's side of the line (+1 or -1, or a room id with rects);
 * roomIds: the rooms entered (the first holds the threshold). No points or sectors: the rule derives them.
 */
export function roomFromOpening(o, rects, side, roomIds) {
  const s = typeof side === 'number' ? Math.sign(side) : sideOfPoint(o, ...centreOf(rects[side]));
  const into = -s, mid = o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2];
  const threshold = o.axis === 'x' ? [mid[0], r4(o.at + into * 0.3)] : [r4(o.at + into * 0.3), mid[1]];
  const R = roomIds.map(id => [...rects[id]]), swing = o.swing || o.leaf ? swingFrom(o, s, rects) : null;
  const corners = [], hot = [];
  const plan = { door: o.id ?? 'gen', plane: { axis: o.axis, at: o.at, a: o.a, b: o.b, into }, rects: R, threshold, swing, stack: stackPointsOf(o, s, rects, 2) };
  const F = frameOf(plan);
  for (const r of R) for (const [x, z] of [[r[0], r[1]], [r[2], r[1]], [r[0], r[3]], [r[2], r[3]]]) {
    const q = F.to(x, z);
    if (q.d < -1e-6 || corners.some(c => Math.hypot(c.x - x, c.z - z) < 1e-6)) continue;
    const id = `c${corners.length}`, cx = x + 0.5 * Math.sign((r[0] + r[2]) / 2 - x), cz = z + 0.5 * Math.sign((r[1] + r[3]) / 2 - z);
    corners.push({ id, x, z });
    const behind = swing?.behindSide && q.d < 0.6 && Math.sign(q.s) === sgn(swing.behindSide);
    hot.push({ id: `gen:${id}`, x: r4(cx), z: r4(cz), why: behind ? 'behind the door' : 'corner' });
  }
  return { ...plan, hot, corners };
}
const centreOf = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];

// ---- the training aid: your corner and your sector shown (the user, 2026-11-15; graphics over words) ----
//
// From the read of the door (or, where nothing reads it, the stack: the boot recruit's single steps, a door found open, the
// hall's leg), a mark of your corner and your point (and your #2's, fainter); on entry your sector, a thin wedge from your
// point; each held AID_HOLD_MS by the room rung from its start (the boot recruit to domination, the tier one 2.5 s: a
// training aid, the trained man's eyes need it least), and gone over AID_FADE_MS at the end of its hold or at domination (every
// hot spot of the room covered, or its "Clear!"), whichever comes first. aidK(startMs, endMs, ms) is its strength, 0 to 1.
/** The aid's hold by the room's rung (templates.js RUNG_OF_TIER: the boot recruit 0, the private 1, the corporal 2, the sergeant 3, the Raider and the tier one 4), lived ms. */
export const AID_HOLD_MS = Object.freeze([Infinity, 20000, 10000, 5000, 2500]);
/** The aid's fade at the end of its hold or at domination, lived ms (v0.0.28: 400 from 800, the floor clean as you work: the user's note of 2026-11-20 on the angles drawn on the floor, "we need a slicker way of doing it"). */
export const AID_FADE_MS = 400;
/** The sector's wedge: its edges run to the room's walls, at most this far, and its arc is drawn this far out, metres. */
export const SECTOR_RAY_M = 4.0, SECTOR_ARC_M = 1.0;
/** v0.0.28: how far an edge is followed to the wall it meets, for the aid's marks at the foot of the wall (m: past any room of the house). */
export const WALL_RAY_M = 15;
/** The aid's strength at ms (0 to 1): 1 from startMs to endMs, then down over AID_FADE_MS; 0 before startMs or with none. */
export function aidK(startMs, endMs, ms) {
  if (!Number.isFinite(startMs) || ms < startMs) return 0;
  if (!Number.isFinite(endMs) || ms <= endMs) return 1;
  return Math.max(0, 1 - (ms - endMs) / AID_FADE_MS);
}
// ---- v0.0.20, the room's numbers (the build sheet's items 12, 17 and 18; drill.md items 3 to 5): the leaving of a room, the far
// leg covered, the #2's call-outs. Here, beside the rule they read, so bundle.js, combat/two.js and react.js share one table ----
/** Your "Room clear!" waits on your #2's status ("Up.") at most this long (ms; drill D3). */
export const STATUS_MS = 600;
/** The last man's mark: this far outward of the door's plane, this high on the latch-side jamb (m; THRESHOLD_M's 0.3, drill D3). */
export const MARK_AT_M = 0.3, MARK_H_M = 1.5;
/** His "Move!" this long after your "Moving!" once he is on nobody; your far walk waits on it at most MOVE_WAIT_MAX_MS (CLEAR_HOLD_MS's), then hands back (ms; drill D4). */
export const MOVE_ANSWER_MS = 300, MOVE_WAIT_MAX_MS = 4000;
/** His eyes on the far leg within this of farCoverOf's point count as covering it (degrees; SECTOR_HALF_DEG's, drill D4). */
export const FAR_COVER_DEG = 20;
/** A man within TOLD_DEG of a place your #2 called, inside TOLD_MS of the call, is expected (react.js expectOf: 'sector'; drill D5). */
export const TOLD_MS = 3000, TOLD_DEG = 20;
/**
 * Where the #2's eyes go while you walk the far leg (drill D4): the plan's far hot spot (the far leg's mouth, room 3's (21.25, 7.2)),
 * seen from his point; null on a plan with no far leg. Derived from the plan, so a generated L gets it.
 */
export function farCoverOf(plan) {
  if (!plan?.far) return null;
  const h = (plan.hot ?? []).find(x => x.id === plan.far.hot) ?? null;
  return h ? { x: h.x, z: h.z } : null;
}
/**
 * A place in your frame as the screen shows it, for a call-out (drill D5): "far leg" where it is the plan's far leg's hot spot or
 * nearer it than any other (within 2.5 m), else the side of the screen from where you stand ("left", "right", "top", "bottom", x
 * east the screen's right as screenWordsOf has it), "far " before it past FAR_PLACE_M. from [x, z], at [x, z].
 */
/** A call-out's place is "far" past this from you (m; my call: a room's half-depth). */
export const FAR_PLACE_M = 4;
export function placeWordsOf(plan, from, at) {
  const near = (plan?.hot ?? []).reduce((b, h) => { const d = Math.hypot(h.x - at[0], h.z - at[1]); return !b || d < b.d ? { h, d } : b; }, null);
  if (near?.h?.why === 'far leg' && near.d <= 2.5) return 'far leg';
  const dx = at[0] - from[0], dz = at[1] - from[1], w = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz > 0 ? 'bottom' : 'top');
  return Math.hypot(dx, dz) > FAR_PLACE_M ? `far ${w}` : w;
}

/** The aid's settings (the build sheet v0.0.20 item 24; the Esc menu's "Corner aid: by rung / always / off", state.$aid). */
export const AID_SETTINGS = Object.freeze(['rung', 'always', 'off']);
/**
 * The hold for a room rung (AID_HOLD_MS, the last for any above) under the player's setting (the user, 2026-11-15: "there
 * is currently no indication at to where we're supposed to be looking"): 'rung' as built, 'always' AID_HOLD_MS[0] (to domination on
 * every sheet), 'off' 0 (nothing drawn: shoothouse.js cornerAidLook draws no mark at all).
 */
export const aidHoldMs = (rung, setting = 'rung') => (setting === 'always' ? AID_HOLD_MS[0] : setting === 'off' ? 0 : AID_HOLD_MS[Math.max(0, Math.min(AID_HOLD_MS.length - 1, rung | 0))]);
/**
 * Where #1's point of domination is taken from (the build sheet v0.0.20 §0 item 33; question 15, open since v0.0.17): 'authored'
 * the plan's point where it has one (room 2's drawn point, as every lane so far), 'derived' the rule's own (COMBAT §25.7.3's method,
 * 1.90 m deeper at room 2). The default stays authored this round (my call); pointOfRule reads it.
 */
export const CORNER_POINT = 'authored';
/** A rule's point of domination under a CORNER_POINT setting: the plan's (rule.point) when authored, the rule's derived point when derived. */
export const pointOfRule = (rule, mode = CORNER_POINT) => (mode === 'derived' && rule?.derived ? [...rule.derived] : rule?.point ? [...rule.point] : null);
/**
 * The sector's wedge for a rule in its plan: { x, z (its point), fromRad, toRad, rays: [[x, z], [x, z]] (each edge's end:
 * where it meets the room's walls, at most SECTOR_RAY_M), walls: [[x, z] | null, …] and along: [[ux, uz] | null, …] (v0.0.28: where
 * each edge meets its wall, followed to WALL_RAY_M, and the unit step along that wall into the sector; null where none is met), arcM }. A ray runs while it stays inside the plan's rects. Cached by the rule.
 */
const WEDGES = new WeakMap();
export function sectorWedgeOf(plan, rule) {
  if (!rule?.sector || !rule.point) return null;
  if (WEDGES.has(rule)) return WEDGES.get(rule);
  const w = Object.freeze(wedge(plan, rule));
  WEDGES.set(rule, w);
  return w;
}
function wedge(plan, rule) {
  const [px, pz] = rule.point, S = rule.sector;
  const ray = (a) => {
    const c = Math.cos(a), s = Math.sin(a);
    let t = 0;
    for (let k = 1; k <= SECTOR_RAY_M / 0.05; k++) { const u = k * 0.05; if (!(plan.rects ?? []).some(r => inRect(r, px + c * u, pz + s * u))) break; t = u; }
    return [r4(px + c * t), r4(pz + s * t)];
  };
  // (where each edge meets the room's wall, marched past SECTOR_RAY_M to WALL_RAY_M, and the wall there as the unit step along
  // it into the sector: the step in x alone leaving the plan's rects is a wall along z, else along x; the side the one whose turn about
  // the point goes from this edge toward the other; null for an edge that meets no wall in reach)
  const sense = Math.sign(S.toRad - S.fromRad) || 1;
  const meet = (a, toward) => {
    const c = Math.cos(a), s = Math.sin(a);
    let t = 0;
    for (let k = 1; k <= WALL_RAY_M / 0.05; k++) { const u = k * 0.05; if (!(plan.rects ?? []).some(r => inRect(r, px + c * u, pz + s * u))) break; t = u; }
    if (t >= WALL_RAY_M - 1e-3) return { at: null, along: null };
    const outX = !(plan.rects ?? []).some(r => inRect(r, px + c * (t + 0.05), pz + s * t)), u = outX ? [0, 1] : [1, 0];
    const turn = c * u[1] - s * u[0];
    return { at: [r4(px + c * t), r4(pz + s * t)], along: (Math.sign(turn) || 1) === toward ? u : [-u[0], -u[1]] };
  };
  const rays = [ray(S.fromRad), ray(S.toRad)], m0 = meet(S.fromRad, sense), m1 = meet(S.toRad, -sense);
  return { x: px, z: pz, fromRad: S.fromRad, toRad: S.toRad, rays, walls: [m0.at, m1.at], along: [m0.along, m1.along], arcM: SECTOR_ARC_M };
}
