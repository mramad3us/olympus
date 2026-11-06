// OLYMPUS arms: how the rifle is carried, where its muzzle points, the habit that keeps it off people, the range's safety rules and where a negligent discharge goes (WEAPONS §6; the build sheet 0.0.5 §2.1).
//
// **Postures** (POSTURES, WEAPONS §6.1): the muzzle's direction is the holder's heading plus the
// posture's yaw and pitch (tradecraft had only the heading); its height at the holder is the posture's
// standing height × STANCE_H for a kneeling or prone shooter; the cone is a half-angle out to a reach
// (a downward muzzle's reach is where its line meets the floor, plus a body's radius: the table's
// numbers); inHand says whether the rifle is in the hands (slung is not). The heading is actor.headRad
// in the weapon mode, else the actor's facing (0 east, +π/2 south: x east, z south). The muzzle's tip
// (muzzleOf's x, y, z: the stage's flash, the sound's source, a discharge's start) is the posture's
// tipM, ahead along the heading and up, its height × STANCE_H.
//
// **The cone** (inCone): a person is in it when their body (a BODY_R_M circle in plan) overlaps the
// cone in plan and the muzzle's line, widened by the half-angle, passes through their body's height
// span there (standing 0 to 1.75 m, kneeling 1.0, prone 0.4: tradecraft's cover spans), so a low ready
// flags shins within 1.8 m, a high ready a face within 0.6 m, a rifle slung front only toes.
//
// **The habit** (habitStep, WEAPONS §6.3): for each armed person on the live area (a rifle on its sling,
// in hand or not), against each other person within the cone's reach + 0.5 m: a person entering the
// cone opens an approach record (kit.carry.near[pid], saved), rolled once for as long as the approach
// lasts (they stay within APPROACH_M; it closes when they leave or the posture changes to one with a
// higher habit DC: a fresh decision, a fresh roll). The DC is the posture's (+2 in a crowd of three or
// more within APPROACH_M, +2 under fire); v is the holder's Weapon handling with their modifiers. When
// dc ≤ v + 1 the habit is automatic: no roll. Else d20 + v against dc with naturals as their numbers
// only (like SKILLS' opposed rolls): a success indexes the muzzle away; a failure by 1 or 2 by someone
// who passes on an average roll (v + 10 ≥ dc) is a near miss, seen and fixed ('muzzle' kind 'near');
// any other failure flags them if they stay in the cone FLAG_MS ('flag'). Aimed (the weapon mode), no
// roll: a person in the cone who is not the aim's target for FLAG_MS is pointed at ('point'). One line
// an approach in J, under the habit filter; the rolls on their own stream (rngOf 'habit'), so a habit's
// roll never shifts the game's main dice. A slung rifle at the habit's DCs (2 and 4) is automatic for
// anyone trained.
//
// **Range safety** (rangeSafety, WEAPONS §6.4: tradecraft's scenarios/range.js safety(), adapted, and
// three of the Corps'): a pure verdict for a person on a firing line, read each tick by the scene's
// rules: in hand and more than WARN_DEG off downrange a warning, more than UPRANGE_DEG the stop (Rule 1:
// loaded or not); aimed at a person the stop; another lane's card aimed a warning, fired at the stop;
// off the firing point's box with the rifle in hand a warning, after OUT_GRACE_S the stop; a shot with
// the line cold a warning, a second the stop; a command acted on before the tower gave it a warning;
// the finger on while moving or changing posture or stance a warning; flagging the coach a warning; a
// negligent discharge the stop. A warning again no sooner than WARN_AGAIN_S after the last of its rule
// (the caller's record, line.warned). A slung rifle is never checked by it.
//
// **A negligent discharge** (ndOf, WEAPONS §6.5, §6.6): the round goes along the posture's muzzle
// line (the action's own posture where it has one: a function check is pulled shouldered, ND_POSTURE,
// and deliberately, so no fumble's flinch spreads it, ND_STEADY), spread by DISCHARGE_SPREAD × (1 − muzzleSafe(Weapon handling)) on a stream of its own (the
// gun's and its round count's: it decides where the round goes, so not a hash), into the ground where
// a downward line meets it, into the range's berm, or past. Graded (§6.6 for this round): someone in
// the cone or within ND_NEAR_M of the round's path is ND-3, and the round passes them (no wound can land
// before 0.0.7: the build sheet's §8 item 19); a line uprange is ND-3 (the ready line and the tower are
// there); into the berm or the ground ahead downrange of the firing line, ND-1; anything else ND-2.
// Never ND-4 this round. Angles are radians, positions metres, rounded to 1e-4 m.
import { stream, range, rngOf, d20 } from '../../core/rng.js';
import { q } from '../../core/num.js';
import { logEntry } from '../log.js';
import { rollerOf } from '../combat/roll.js';
import { grade } from '../skills/checks.js';
import { KD_RANGE, RANGE_KINDS } from '../../data/places/range.js';

const RAD = Math.PI / 180;
/**
 * The postures (WEAPONS §6.1): { yawDeg, pitchDeg, hM (the muzzle line's height at the holder,
 * standing), halfDeg, reachM, toAimS, habitDC (null: no roll), inHand, tipM: [ahead, up] (the muzzle's
 * tip as drawn, standing: metres ahead of the holder along the heading and above the ground; my calls,
 * from a 92 cm rifle held as each posture holds it) }.
 */
export const POSTURES = Object.freeze({
  slungBack: Object.freeze({ yawDeg: 180, pitchDeg: 60, hM: 1.5, halfDeg: 15, reachM: 0.5, toAimS: 2.5, habitDC: 2, inHand: false, tipM: Object.freeze([-0.15, 1.75]) }),
  slungFront: Object.freeze({ yawDeg: 0, pitchDeg: -75, hM: 1.0, halfDeg: 15, reachM: 0.6, toAimS: 1.0, habitDC: 4, inHand: false, tipM: Object.freeze([0.25, 0.55]) }),
  lowReady: Object.freeze({ yawDeg: 0, pitchDeg: -40, hM: 1.25, halfDeg: 8, reachM: 1.8, toAimS: 0.15, habitDC: 10, inHand: true, tipM: Object.freeze([0.7, 0.77]) }),
  highReady: Object.freeze({ yawDeg: 0, pitchDeg: 45, hM: 1.45, halfDeg: 8, reachM: 0.6, toAimS: 0.15, habitDC: 8, inHand: true, tipM: Object.freeze([0.45, 1.85]) }),
  aimed: Object.freeze({ yawDeg: 0, pitchDeg: 0, hM: 1.4, halfDeg: 3, reachM: 50, toAimS: 0, habitDC: null, inHand: true, tipM: Object.freeze([0.9, 1.4]) }),
});
/** The slung postures: the rifle not in the hands. */
export const SLUNG = new Set(['slungBack', 'slungFront']);
/** The muzzle's height × this by the holder's stance. */
export const STANCE_H = Object.freeze({ stand: 1.0, kneel: 0.68, prone: 0.2 });
/** A body's height span by its stance (m), and its radius in plan. */
export const SPAN_M = Object.freeze({ stand: Object.freeze([0, 1.75]), kneel: Object.freeze([0, 1.0]), prone: Object.freeze([0, 0.4]) });
export const BODY_R_M = 0.25;
/** The habit (WEAPONS §6.3): an approach lasts while the other stays within APPROACH_M; a failed habit flags after FLAG_MS in the cone; the context's DCs. */
export const APPROACH_M = 3, FLAG_MS = 300, CROWD_N = 3, CROWD_DC = 2, FIRE_DC = 2, NEAR_BY = 2;
/** Range safety (WEAPONS §6.4, tradecraft's): degrees off downrange, the grace off the box, a warning's repeat. */
export const WARN_DEG = 60, UPRANGE_DEG = 100, OUT_GRACE_S = 8, WARN_AGAIN_S = 20;
/** A negligent discharge: the spread (rad) an untrained hand gives the posture's line; within ND_NEAR_M of the path is near someone; ND_PAST_M how far a line that meets nothing is followed. */
export const DISCHARGE_SPREAD = 0.5, ND_NEAR_M = 1.5, ND_PAST_M = 200;
/** An action done in a posture of its own: the function check is pulled shouldered, level, downrange (its frame is the aim). */
export const ND_POSTURE = Object.freeze({ functionCheck: 'aimed' });
/** A deliberate pull (the holder meant to press the trigger, on a gun believed empty): its line is the posture's, no fumble's flinch spreads it. */
export const ND_STEADY = new Set(['functionCheck']);

/** A facing's angle (0 east, +π/2 south). */
export const faceRad = (face) => ({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[face] ?? 0);
/** The angle a − b brought into (−π, π]. */
export const angleDiff = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d <= -Math.PI) d += 2 * Math.PI; return d; };
/** The chance a discharging gun was pointed where its posture puts it (tradecraft's muzzleSafe): clamp((WH − 4) / 24, 0, 0.97). */
export const muzzleSafe = (wh) => Math.max(0, Math.min(0.97, (wh - 4) / 24));

const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;

/** How a person carries: { gunId, posture, finger, stance, headRad, actor }, or null with no rifle on its sling. */
export function carryOf(state, pid, actor = actorOf(state, pid)) {
  const kit = state.people?.[pid]?.kit, gunId = kit?.worn?.sling;
  if (!gunId) return null;
  return { gunId, posture: kit.carry?.posture ?? 'slungFront', finger: kit.carry?.finger ?? 'off', stance: actor?.stance ?? 'stand', headRad: actor?.headRad ?? faceRad(actor?.face), actor };
}

/** Where the muzzle is and points: { x, y, z (the tip), ox, oz, oy (the line at the holder), yawRad, pitchRad, halfRad, reachM, posture, inHand, stance }, or null. posture: the one to read instead of the carry's (an action's own, ND_POSTURE). */
export function muzzleOf(state, pid, actor = actorOf(state, pid), posture = null) {
  const c = carryOf(state, pid, actor);
  if (!c || !actor) return null;
  if (posture) c.posture = posture;
  const P = POSTURES[c.posture] ?? POSTURES.slungFront, k = STANCE_H[c.stance] ?? 1;
  const yaw = c.headRad + P.yawDeg * RAD, pitch = P.pitchDeg * RAD, oy = P.hM * k, head = c.headRad;
  return {
    x: q(actor.x + P.tipM[0] * Math.cos(head), 1e-4), y: q(P.tipM[1] * k, 1e-4), z: q(actor.z + P.tipM[0] * Math.sin(head), 1e-4),
    ox: actor.x, oz: actor.z, oy, yawRad: yaw, pitchRad: pitch, halfRad: P.halfDeg * RAD, reachM: P.reachM, posture: c.posture, inHand: P.inHand, stance: c.stance,
  };
}

/** Whether a body is in a cone (muzzleOf's): a BODY_R_M circle at (x, z) whose height span [y0, y1] the muzzle's widened line passes through. */
export function inCone(cone, { x, z, spanM = SPAN_M.stand }) {
  if (!cone) return false;
  const dx = x - cone.ox, dz = z - cone.oz, d = Math.hypot(dx, dz);
  if (d > cone.reachM + BODY_R_M || d < 1e-6) return false;
  const half = cone.halfRad + Math.asin(Math.min(1, BODY_R_M / d));
  if (Math.abs(angleDiff(Math.atan2(dz, dx), cone.yawRad)) > half) return false;
  // (the line's height over the body's depth, the cone's spread on it; a downward line stops at the floor)
  const lo = Math.max(0.01, d - BODY_R_M), hi = d + BODY_R_M, t = Math.tan(cone.pitchRad), spread = Math.tan(cone.halfRad);
  let yMin = Infinity, yMax = -Infinity;
  for (const s of [lo, (lo + hi) / 2, hi]) {
    const y = cone.oy + s * t;
    yMin = Math.min(yMin, y - s * spread); yMax = Math.max(yMax, y + s * spread);
  }
  yMin = Math.max(0, yMin);
  return yMax >= spanM[0] && yMin <= spanM[1] && yMax >= 0;
}

// ---- the habit ----

const nameOf = (state, pid) => { const p = state.people?.[pid]; return p?.name ? `${p.service?.rank ? `${p.service.rank} ` : ''}${p.name.family}` : pid; };
const POSTURE_WORDS = Object.freeze({ slungBack: 'slung on your back', slungFront: 'slung front', lowReady: 'low ready', highReady: 'high ready', aimed: 'aimed' });

/** The people the habit check runs for: those with a rifle on its sling and an actor on the live area. */
function armedActors(state) {
  const out = [];
  for (const a of state.actors?.list ?? []) if (state.people?.[a.who]?.kit?.worn?.sling) out.push(a);
  return out;
}

// (the person a holder is aiming at in the weapon mode, if the aim's key is an actor's)
function aimTargetOf(state, pid) {
  const key = state.stop?.who === pid ? state.stop?.aim?.key : null;
  return key && isPersonKey(key) ? state.actors?.list?.find(a => a.id === key)?.who ?? null : null;
}

/**
 * The habit check, a tick (w; fast 'rules', live area only: WEAPONS §6.3, see the header). Records on
 * kit.carry.near (saved); logs one line an approach (filter 'habit'); emits 'muzzle' { who, at, kind:
 * 'near' | 'flag' | 'point', posture, atMs }. ctx: { pressure, mods (the moment's on the habit, as
 * doAction's: a test's exhaustion) }.
 */
export function habitStep(state, input, bus, ctx = {}) {
  const ms = state.clock.ms, armed = armedActors(state);
  if (!armed.length) return;
  const list = state.actors.list;
  for (const A of armed) {
    const pid = A.who, cone = muzzleOf(state, pid, A);
    if (!cone) continue;
    const carry = state.people[pid].kit.carry ??= { posture: 'slungFront' };
    const near = carry.near ?? {};
    const P = POSTURES[cone.posture], aimTarget = aimTargetOf(state, pid);
    // (the approaches: closed when the other leaves APPROACH_M, or the posture turns to a stricter one or to or from the aim)
    for (const other of Object.keys(near)) {
      const B = list.find(a => a.who === other), rec = near[other];
      const stricter = (P.habitDC ?? 99) > (POSTURES[rec.posture]?.habitDC ?? 99) || (rec.posture === 'aimed') !== (cone.posture === 'aimed');
      if (!B || Math.hypot(B.x - A.x, B.z - A.z) > APPROACH_M || stricter) delete near[other];
    }
    for (const B of list) {
      if (B === A || B.who === aimTarget) continue;
      const d = Math.hypot(B.x - A.x, B.z - A.z);
      if (d > cone.reachM + 0.5) continue;
      const inside = inCone(cone, { x: B.x, z: B.z, spanM: SPAN_M[B.stance ?? 'stand'] ?? SPAN_M.stand });
      let rec = near[B.who];
      if (!rec) {
        if (!inside) continue;
        rec = near[B.who] = openApproach(state, bus, A, B, cone, ms, ctx, list);
      }
      // (in the cone: the clock toward a flag or a point; out of it, the clock stops)
      if (inside) rec.inMs ??= ms; else delete rec.inMs;
      if (inside && (rec.result === 'fail' || rec.result === 'point') && !rec.told && ms - rec.inMs >= FLAG_MS) {
        rec.told = true;
        const kind = rec.result === 'point' ? 'point' : 'flag';
        if (kind === 'flag') rec.result = 'flag';
        logEntry(state, bus, { kind: 'habit', tone: 'warn', filter: 'habit', who: pid, other: B.who, posture: cone.posture, result: kind, text: kind === 'point' ? `You pointed your rifle at ${nameOf(state, B.who)}.` : `You flagged ${nameOf(state, B.who)}: your muzzle stayed on them.` });
        bus?.emit('muzzle', { who: pid, at: B.who, kind, posture: cone.posture, atMs: ms });
      }
    }
    if (Object.keys(near).length) carry.near = near; else delete carry.near;
  }
}

// (an approach opened: the habit's one roll, or none)
function openApproach(state, bus, A, B, cone, ms, ctx, list) {
  const pid = A.who, P = POSTURES[cone.posture], who = nameOf(state, B.who), word = POSTURE_WORDS[cone.posture];
  if (P.habitDC === null) return { atMs: ms, result: 'point', posture: cone.posture };
  const crowd = list.filter(o => o !== A && Math.hypot(o.x - A.x, o.z - A.z) <= APPROACH_M).length >= CROWD_N;
  const dc = P.habitDC + (crowd ? CROWD_DC : 0) + (ctx.pressure === 'fire' ? FIRE_DC : 0);
  const roller = rollerOf(state, pid, { ms }), mods = [...(roller.mods('weapons', {}) ?? []), ...(ctx.mods ?? [])];
  const v = roller.value('weapons') + mods.reduce((s, m) => s + m.v, 0);
  const ctxWords = crowd ? `${word}, crowd` : word;
  if (dc <= v + 1) {
    logEntry(state, bus, { kind: 'habit', tone: 'note', filter: 'habit', who: pid, other: B.who, posture: cone.posture, result: 'auto', text: `Muzzle past ${who} (${ctxWords}): automatic.` });
    return { atMs: ms, result: 'auto', posture: cone.posture, dc: P.habitDC };
  }
  // (one d20, naturals as their numbers only: a habit is not decided by a die's face)
  const die = d20(rngOf(state, 'habit')), total = die + v, margin = total - dc;
  const roll = { kind: 'check', skill: 'weapons', value: roller.value('weapons'), roll: die, mods, total, nat: 0, dc, dcParts: [{ why: word, v: P.habitDC }, ...(crowd ? [{ why: 'a crowd', v: CROWD_DC }] : []), ...(ctx.pressure === 'fire' ? [{ why: 'under fire', v: FIRE_DC }] : [])],
    hook: false, tempo: 'normal', steady: false, routine: false, pressure: ctx.pressure ?? 'none', ok: margin >= 0, margin, grade: grade(margin, 0), by: pid, them: false, hidden: false, verb: 'habit' };
  const result = margin >= 0 ? 'pass' : (margin >= -NEAR_BY && v + 10 >= dc) ? 'near' : 'fail';
  logEntry(state, bus, { kind: 'roll', tone: result === 'pass' ? 'note' : 'warn', filter: 'habit', roll, step: 'habit', who: pid, other: B.who, posture: cone.posture, result,
    text: result === 'near' ? `Muzzle past ${who} (${ctxWords}): a near miss, your muzzle drifted toward them. You fixed it.` : result === 'pass' ? `Muzzle past ${who} (${ctxWords}): kept off.` : `Muzzle past ${who} (${ctxWords}): it stayed on them.` });
  bus?.emit('roll', { roll, who: pid });
  if (result === 'near') bus?.emit('muzzle', { who: pid, at: B.who, kind: 'near', posture: cone.posture, atMs: ms });
  return { atMs: ms, result, posture: cone.posture, dc: P.habitDC };
}

// ---- range safety ----

const inBox = (box, x, z) => !!box && x >= box[0] && x <= box[2] && z >= box[1] && z <= box[3];
const isPersonKey = (k) => typeof k === 'string' && /^a[1-9][0-9]*$/.test(k);
const laneOfKey = (k) => (typeof k === 'string' && k.startsWith('paper:') ? Number(k.slice(6)) : null);
const TEXT = Object.freeze({
  uprange: 'Cease fire! Cease fire! Muzzle uprange.', person: 'Cease fire! Cease fire! You do not point a weapon at a person.',
  muzzle: 'Muzzle downrange. Always downrange.', lane: 'That\'s another lane\'s card. Yours only, ever.', laneShot: 'Cease fire! Cease fire! You fired on another lane.',
  walk: 'Not off the point with it in your hands. Back on your lane.', walkStop: 'Cease fire! Cease fire! Off the line with a weapon up.',
  cold: 'The line is cold. You do not fire on a cold line.', coldStop: 'Cease fire! Cease fire! Two rounds on a cold line.',
  ahead: 'Wait for the tower. You do nothing before the command.', finger: 'Finger off the trigger when you move.', coach: 'Watch your muzzle. Not on me.',
  nd: 'Cease fire! Cease fire!',
});

/**
 * Range safety's verdict for a person on a firing line (pure: see the header). line: { downrangeRad
 * (0: east), box (the firing point's [x0, z0, x1, z1]), lane, hot, targetKey (the aim's key), people,
 * coachId, warned ({ rule: ms of the last warning }), outAtMs (lived ms the rifle left the box, the
 * caller's), shot (a shot fired this tick: { lane }), coldShots (shots fired with the line cold, this
 * one included), ahead (a command acted on before the tower gave it), moving (moving, or a posture or
 * stance changed, this tick), nd (a negligent discharge this tick) }. Returns { warn: [{ rule, text }],
 * stop: { rule, text } | null }.
 */
export function rangeSafety(state, pid, ms, line = {}) {
  const out = { warn: [], stop: null }, warned = line.warned ?? {};
  const warn = (rule, text = TEXT[rule]) => { if (warned[rule] === undefined || ms - warned[rule] >= WARN_AGAIN_S * 1000) out.warn.push({ rule, text }); };
  const stop = (rule, text) => { out.stop ??= { rule, text }; };
  if (line.nd) stop('nd', TEXT.nd);
  const m = muzzleOf(state, pid);
  const kit = state.people?.[pid]?.kit, finger = kit?.carry?.finger ?? 'off';
  if (line.shot && line.lane !== undefined && line.shot.lane !== undefined && line.shot.lane !== line.lane) stop('lane', TEXT.laneShot);
  if (line.shot && !line.hot) { if ((line.coldShots ?? 1) >= 2) stop('cold', TEXT.coldStop); else warn('cold'); }
  if (line.ahead) warn('ahead');
  if (!m || !m.inHand) return out;
  // (in the hands: where the muzzle points, what it's aimed at, where the holder stands)
  const off = Math.abs(angleDiff(m.yawRad, line.downrangeRad ?? 0)) / RAD;
  if (off > UPRANGE_DEG) stop('uprange', TEXT.uprange);
  else if (off > WARN_DEG) warn('muzzle');
  if (isPersonKey(line.targetKey)) stop('person', TEXT.person);
  if (m.posture === 'aimed') {
    for (const a of state.actors?.list ?? []) {
      if (a.who === pid) continue;
      if (inCone({ ...m, reachM: 60 }, { x: a.x, z: a.z, spanM: SPAN_M[a.stance ?? 'stand'] ?? SPAN_M.stand })) { stop('person', TEXT.person); break; }
    }
  }
  const lane = laneOfKey(line.targetKey);
  if (lane !== null && line.lane !== undefined && lane !== line.lane) warn('lane');
  const a = state.actors?.list?.find(x => x.who === pid);
  if (line.box && a && !inBox(line.box, a.x, a.z)) {
    if (line.outAtMs !== null && line.outAtMs !== undefined && ms - line.outAtMs > OUT_GRACE_S * 1000) stop('walk', TEXT.walkStop);
    else warn('walk');
  }
  if (line.moving && finger === 'on') warn('finger');
  if (line.coachId && kit?.carry?.near?.[line.coachId]?.result === 'flag') warn('coach');
  return out;
}

// ---- a negligent discharge ----

/** The KD range's 25 m bay as ndOf reads it, when the person stands in it (its walk rect on its area), else null. */
export function bayAt(state, pid) {
  const a = actorOf(state, pid), area = state.actors?.area ?? state.places?.live?.area, B = KD_RANGE.bay;
  if (!a || area !== KD_RANGE.area || !inBox(B.walk, a.x, a.z)) return null;
  return { berm: B.berm, heightM: RANGE_KINDS.berm.h, lineX: B.lineX, downrangeRad: KD_RANGE.downrangeRad };
}

/**
 * Where a negligent discharge went and its grade (see the header): { grade: 'ND-1' | 'ND-2' | 'ND-3',
 * into: 'berm' | 'ground' | 'past', nearId, at: { x, z }, path: [{ x, z }, { x, z }], yawRad }. opts:
 * { during (the action), bay ({ berm: [x0, z0, x1, z1], heightM, lineX, downrangeRad }: the range's;
 * by default the KD bay when the person stands in it, bayAt) }.
 */
export function ndOf(state, pid, gunId, { during = null, bay = bayAt(state, pid) } = {}) {
  const m = muzzleOf(state, pid, undefined, ND_POSTURE[during] ?? null);
  const gun = state.items?.[gunId];
  if (!m) return { grade: 'ND-2', into: 'ground', nearId: null, at: null, path: [], yawRad: 0, during };
  const wh = rollerOf(state, pid).value('weapons');
  const spread = ND_STEADY.has(during) ? 0 : DISCHARGE_SPREAD * (1 - muzzleSafe(wh));
  const r = stream(state.meta?.seed ?? 0, 'nd', pid, gunId, gun?.rounds ?? 0, state.clock?.ms ?? 0);
  const yaw = m.yawRad + range(r, -spread, spread), pitch = m.pitchRad;
  const ux = Math.cos(yaw), uz = Math.sin(yaw);
  // (where the line ends: the floor for a downward line, the berm if it reaches it under its top, else far past)
  let dist = ND_PAST_M, into = 'past';
  if (pitch < -1e-6) { dist = m.y / Math.tan(-pitch); into = 'ground'; }
  if (bay?.berm) {
    const [x0, z0, x1, z1] = bay.berm, H = bay.heightM ?? RANGE_KINDS.berm.h;
    // (the line in plan entering the berm's rect: the first crossing of its near face)
    const tx = ux > 1e-9 ? (x0 - m.x) / ux : ux < -1e-9 ? (x1 - m.x) / ux : Infinity;
    if (tx > 0 && tx < dist) {
      const zAt = m.z + uz * tx, yAt = m.y + Math.tan(pitch) * tx;
      if (zAt >= z0 && zAt <= z1 && yAt <= H && yAt >= 0) { dist = tx; into = 'berm'; }
    }
  }
  const at = { x: q(m.x + ux * dist, 1e-4), z: q(m.z + uz * dist, 1e-4) };
  const path = [{ x: m.x, z: m.z }, at];
  // (who is near it: in the posture's cone, or within ND_NEAR_M of the round's path)
  let nearId = null, best = Infinity;
  for (const a of state.actors?.list ?? []) {
    if (a.who === pid) continue;
    const vx = a.x - m.x, vz = a.z - m.z, t = Math.max(0, Math.min(dist, vx * ux + vz * uz));
    const dd = Math.hypot(vx - ux * t, vz - uz * t);
    const inside = inCone(m, { x: a.x, z: a.z, spanM: SPAN_M[a.stance ?? 'stand'] ?? SPAN_M.stand });
    if ((inside || dd <= ND_NEAR_M) && dd < best) { best = dd; nearId = a.who; }
  }
  const down = bay?.downrangeRad ?? 0, offDeg = Math.abs(angleDiff(yaw, down)) / RAD;
  const ahead = bay ? (into === 'berm' || (into === 'ground' && offDeg <= 90 && (bay.lineX === undefined || at.x >= bay.lineX - 0.5))) : false;
  const grade = nearId || (bay && offDeg > 90) ? 'ND-3' : ahead ? 'ND-1' : 'ND-2';
  return { grade, into, nearId, at, path, yawRad: q(yaw, 1e-6), during };
}
