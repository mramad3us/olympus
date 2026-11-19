// OLYMPUS body: free fall, a body with nothing holding it (ROADMAP "anywhere" step 7; BODY §16.5, §16.6; WEAPONS §7.8; COMBAT §14.5, §14.8; CONTRACTS §21).
//
// The model is the plane the game is drawn in, plus a height (the build sheet v0.0.24 item 6, its question 8): a floating body
// moves in x and z and keeps actor.floatY, its centre of mass over the deck face (absent: on the deck; FREEFALL.FLOAT_Y_M 1.0 m, a
// standing man's, once it moves off the deck floating). A field of its own, never actor.y: actor.y is the floor a body stands or
// lies on (a rack, a seat, the catwalk: people/place.js, shoothouse.js), which the hit model (arms/penetrate.js) and the blast
// (combat/burst.js) read as the body's feet, so a floating man at FLOAT_Y_M is hit and blasted where a standing man is (the review
// of v0.0.24's A to C: with actor.y 1.0 a round at chest height took his legs, the body read as raised 1 m). Six faces, a
// deckhead to push from and a hatch in any face are 0.0.7e's. Every number is
// src/data/body/needs.js FREEFALL's. What a floating body keeps on its actor, plain data saved with it and absent at rest:
//   v [vx, vz]     the drift, m/s to 1 mm/s (places/move.js's own field, the Combat stance's inertia);
//   floatY         the centre of mass's height over the deck (m), set once it floats off it (FLOAT_Y_M at a standing man's);
//   push           a push-off under way: { fromMs, untilMs, x0, z0, v: [vx, vz], from: 'deck' | 'face' | 'hold' }, the speed
//                  ramping from rest to v over the step, the body's place a closed form of it (x0 + v t² / 2T);
//   tumble         the pitch's spin, rad/s (WEAPONS §7.8's "pitching the shooter back"), and tumbleRad its angle (rad, not wrapped:
//                  the turn since an aim is read off it), the view's tumble;
//   buddyOff       [dx, dz]: where a man holding another (anchor 'buddy') is kept from him, set by the grab;
//   aimFrom        { rad, ms }: the tumble's angle when the stop's aim now held was settled (its settledMs), so the aim is lost
//                  once the tumble has carried the muzzle past the arms' arc (WEAPONS §7.8: shot.js AIM's arc, 30° + 2° a point
//                  of Weapon handling, at most 100°), and the next shot needs a new aim.
// floatStep(state, a, feet, grid, pid, dt, record) is the mover's tick for a body whose footing is 'float' (footing.js
// footingOf), or held under 0.05 G by a hold, a lanyard or a brace (floatsNow: only the boots walk there; the keys push off a hand's
// hold, letting go of it, and with a lanyard or a brace only turn the head): places/move.js inertStep and the keys' free walk call it
// first and return after it (the build sheet's §0 item 5). In one tick, in order:
//   1. **A push-off under way** runs its closed form; at its end the body drifts at the push's speed.
//   2. **The keys**: from rest (under AT_REST_MS) with a face to push from (the deck while on it, a hold within REACH_M:
//      model.js holdNear, or a face behind within REACH_M along the push), the keys start a push-off along their direction
//      at their speed (Alt 0.3, none 0.6, Shift 1.2 m/s: BODY §16.6; 2.0 m/s is pushOff's own, a step's, never a key's), one
//      Zero-g roll at DC 6 (+4 at 2.0 m/s) on stream(seed, 'ff:push', pid, the push's ms): a miss turns the direction 5° a
//      point missed (its side drawn) and adds 0.1 rad/s a point to the tumble (its sense drawn). Anywhere else the keys only turn
//      the head (move.js faceOf): nothing to push from, nothing moves.
//   3. **The drift**: constant velocity, no friction and no air drag (my call: under 1% over 10 m in a compartment's still air),
//      each axis of the tick's step collided against the walls as a walker's circle is (collide.js), positions to 0.1 mm.
//   4. **A face met**: the speed into it (the blocked axes'), first by the body's facing (the head toward the travel: the hands;
//      else the body). At LAND_MS 1.5 m/s or less it lands (my call: the hands or the feet take it), above it impact.js impactOf
//      at that speed; either way the body stops there, its drift and tumble gone, floating, and may push off or take a hold.
//   5. **The tumble** turns tumbleRad, and the aim is lost past the arc (above).
//   6. **The record** (loco.js locoStep, gait 'float': no stride and no foot falls, the body's yaw the head's): mode 'float', floatY,
//      the drift's speed, the tumble.
// grab(state, pid) is BODY §16.6's grab, L by context (core/keys.js 'grab', routed here by grabAction): a hold within REACH_M or a
// person within it, nothing to fight there (a person in a fight, state.fights, is CQC's: the combat domain's grab, a stub today, is
// untouched). Under GRAB.HOLD_MS 1.5 m/s relative it holds; 1.5 to 3 m/s a Zero-g roll at DC 10 + 3 a m/s over 1.5 (a miss glances
// off, the drift kept; a miss by SPRAIN_BY 5 or more wrenches the wrist); over 3 m/s an impact on the hands (impactOf), after which
// the hold is taken. A grab stops the drift and the tumble and writes the anchor (footing.js setAnchor: a hold, or a person's brace,
// whose drift the two then share by their masses). The body is stopped before the anchor is written (footing.js setAnchor takes
// no hold from a drifting body by a step: the grab is what takes one on the move). A man holding another drifts as one with him
// for as long as he holds (floatStep: kept at the grab's offset from him, actor.buddyOff [dx, dz], collided, his drift shared,
// whatever moves him; a wall between them lets go): the review of v0.0.24's A to C found the two apart 4 m eighty ticks on.
// recoilFloat(state, pid, ...) is WEAPONS §7.8's push and spin a round, called by shot.js resolveShot: J by calibres.js impulseNs at
// the gun's muzzle speed (ballistics.js v0Of), m the body and its kit (motion.js BODY_KG + kit.js kitMassKg), I = 17 kg·m² × m / 95
// kg; the anchor's row keeps keepPush × J / m backward along the bore and keepSpin × J × 0.45 m / I of pitch (shot.js anchorOf). The
// drift and the tumble are a floating body's motion only: on an anchor (boots, a hold, a brace) the kept share is what the anchor
// takes, recorded on the shot and shown by its recovery (the anchor holds where it was taken), so no anchored body drifts.
// At 0.3 G and up no body's footing is 'float', so nothing here runs at Mars or in the Wheel.
// Pure but floatStep, pushOff, grab, grabAction and recoilFloat, which write the actor (and the body record through impactOf).
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, chance } from '../../core/rng.js';
import { playerActor, playerId } from '../../core/ids.js';
import { FREEFALL } from '../../data/body/needs.js';
import { check, checkShort } from '../skills/checks.js';
import { rollerOf } from '../combat/roll.js';
import { valueOf } from '../skills/templates.js';
import { logEntry } from '../log.js';
import { navOf } from '../places/nav.js';
import { standOk, sweep, overlaps, onFloor } from '../places/collide.js';
import { holdNear } from '../places/model.js';
import { footingOf, setAnchor } from './footing.js';
import { impactOf, impactWords } from './impact.js';
import { locoStep } from './loco.js';
import { BODY_KG } from './motion.js';
import * as KIT from '../arms/kit.js';
import { impulseNs } from '../arms/calibres.js';
import { v0Of } from '../arms/ballistics.js';
import { MODELS } from '../arms/models.js';
import { AIM } from '../arms/shot.js';
import { faceOf } from '../places/move.js';

const F = FREEFALL, POS_STEP_M = 0.0001, V_STEP_MS = 0.001, RAD_STEP = 1e-6, D2R = Math.PI / 180;
/** The walker's class whose grid a floating body collides on (places/move.js PLAYER_CLS). */
const CLS = 'C0';
/** The anchor a grab on a hold takes, and on a person (footing.js ANCHOR_KINDS). */
export const HOLD_ANCHOR = 'handhold', BUDDY_ANCHOR = 'buddy';
const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const actorOf = (state, pid) => { const me = playerActor(state); return me?.who === pid ? me : state.actors?.list?.find(x => x.who === pid) ?? null; };
const speedOfV = (a) => Math.hypot(a?.v?.[0] ?? 0, a?.v?.[1] ?? 0);
const isMe = (state, pid) => pid === playerId(state);

/** A person's mass with their kit (kg): motion.js BODY_KG and kit.js kitMassKg, recoil's m. */
export const massOf = (state, pid) => BODY_KG + KIT.kitMassKg(state, pid);
/** The pitch inertia at a mass (kg·m²): WEAPONS §7.8's 17 at 95 kg, scaled by mass (my call). */
export const inertiaOf = (massKg) => F.RECOIL.I_REF_KGM2 * massKg / F.RECOIL.I_REF_KG;
/** The arms' arc an aim survives a tumble within (rad): shot.js AIM's, at the person's Weapon handling (WEAPONS §7.8). */
export const aimArcRadOf = (state, pid) => Math.min(AIM.arc.max, AIM.arc.base + AIM.arc.per * valueOf(state, pid, 'weapons')) * D2R;
/** The speed the keys ask a push-off for (m/s): Shift's run, Alt's stroll, else the walk (BODY §16.6). */
export const keysPushMs = (feet) => (feet?.run ? F.PUSH.SPEEDS_MS.run : feet?.stroll ? F.PUSH.SPEEDS_MS.stroll : F.PUSH.SPEEDS_MS.walk);
/** Whether a person floats now (footing.js's 'float': nothing holds them under 0.05 G). */
export const floating = (state, pid) => footingOf(state, pid).mode === 'float';
/** The footing modes whose tick is the float's (move.js's seam): floating, on a hold or a lanyard, braced; under 0.05 G only the boots walk. */
export const FLOAT_TICK_MODES = Object.freeze(new Set(['float', 'handhold', 'braced']));
/** Whether a person's tick is the float's (places/move.js inertStep's and the free walk's seam; see the header). */
export const floatsNow = (state, pid) => FLOAT_TICK_MODES.has(footingOf(state, pid).mode);
/** Whether a person may push off now: floating, or a hand on a hold (which the push lets go of); a lanyard or a brace is let go of first (footing.js's "Let go"). */
export function pushable(state, pid) {
  const ft = footingOf(state, pid);
  return ft.mode === 'float' || (ft.mode === 'handhold' && ft.hold === 'handhold');
}

/** What a floating body is doing, for a card or a test: { y, vMs, tumbleRads, tumbleRad, pushing } (null when it is not floating). */
export function floatOf(state, pid) {
  const a = actorOf(state, pid);
  if (!a || !floating(state, pid)) return null;
  return { y: a.floatY ?? null, vMs: q(speedOfV(a), V_STEP_MS), tumbleRads: a.tumble ?? 0, tumbleRad: a.tumbleRad ?? 0, pushing: !!a.push };
}

// ---- what a body can push from ----

// (a face behind the body along -dir within REACH_M: the walls' rects or the floor's edge, marched in 5 cm)
function faceBehind(grid, x, z, ux, uz) {
  for (let t = 0.05; t <= F.REACH_M + 1e-9; t += 0.05) {
    const px = x - ux * t, pz = z - uz * t;
    if (!onFloor(grid, px, pz) || overlaps(grid, px, pz, 0.01)) return true;
  }
  return false;
}
/** Where a push-off along (ux, uz) can be made from (see the header): 'deck' | 'hold' | 'face' | null. */
export function pushFrom(state, a, grid, ux, uz) {
  if (a.anchor === HOLD_ANCHOR || holdNear(state, a.x, a.z, F.REACH_M)) return 'hold';
  if (a.floatY === undefined) return 'deck';
  return faceBehind(grid, a.x, a.z, ux, uz) ? 'face' : null;
}

/**
 * Begin a push-off (see the header) along dir (a heading in rad, or [dx, dz]) at speedMs (one of FREEFALL.PUSH.SPEEDS_MS'),
 * rolled now. Returns { ok, why, roll }: why 'not floating', 'not at rest', 'nothing to push from', 'pushing' or 'no such speed'.
 */
export function pushOff(state, pid, dir, speedMs, { bus = null, grid = null } = {}) {
  const a = actorOf(state, pid), area = state.places?.live?.area;
  if (!a || !area) return { ok: false, why: 'no actor', roll: null };
  if (!pushable(state, pid)) return { ok: false, why: 'not floating', roll: null };
  if (a.push) return { ok: false, why: 'pushing', roll: null };
  if (!Object.values(F.PUSH.SPEEDS_MS).includes(speedMs)) return { ok: false, why: 'no such speed', roll: null };
  if (speedOfV(a) > F.AT_REST_MS) return { ok: false, why: 'not at rest', roll: null };
  const h = Array.isArray(dir) ? Math.atan2(dir[1], dir[0]) : dir, g = grid ?? navOf(state, area, CLS, a.x, a.z);
  const from = pushFrom(state, a, g, Math.cos(h), Math.sin(h));
  if (!from) return { ok: false, why: 'nothing to push from', roll: null };
  // (a hand on a hold lets go of it to push off it)
  if (a.anchor) setAnchor(state, pid, null);
  const now = state.clock.ms, r = stream(state.meta?.seed ?? 0, 'ff:push', pid, now), roller = rollerOf(state, pid);
  const dc = F.PUSH.DC + (speedMs >= F.PUSH.FAST_MS ? F.PUSH.FAST_DC : 0);
  const roll = check(r, { skill: 'zerog', value: roller.value('zerog'), dc, mods: roller.mods('zerog'), by: pid, verb: 'push off' });
  const missed = roll.ok ? 0 : Math.max(1, -roll.margin);
  const err = missed ? (chance(r, 0.5) ? 1 : -1) * F.PUSH.ERR_DEG * missed * D2R : 0;
  const spin = missed ? (chance(r, 0.5) ? 1 : -1) * F.PUSH.TUMBLE_RADS * missed : 0;
  const hd = h + err, vx = q(speedMs * Math.cos(hd), V_STEP_MS), vz = q(speedMs * Math.sin(hd), V_STEP_MS);
  a.push = { fromMs: now, untilMs: now + F.PUSH.MS, x0: a.x, z0: a.z, v: [vx, vz], from };
  if (spin) a.tumble = q((a.tumble ?? 0) + spin, RAD_STEP);
  delete a.v;
  if (a.floatY === undefined) a.floatY = F.FLOAT_Y_M;
  if (isMe(state, pid)) {
    logEntry(state, bus, { kind: 'roll', tone: roll.ok ? 'note' : 'warn', roll, step: 'push', who: pid, text: checkShort(roll) });
    bus?.emit('roll', { roll, who: pid });
  }
  return { ok: true, why: null, roll };
}

// ---- moving ----

// (one axis's step on the grid, whole where the circle stays clear, else up to contact: move.js stepAxis's rule. Returns the metres)
function axisStep(a, grid, axis, d) {
  if (!d) return 0;
  const from = axis === 'x' ? a.x : a.z, full = q(from + d, POS_STEP_M);
  const ok = (v) => (axis === 'x' ? standOk(grid, v, a.z) : standOk(grid, a.x, v));
  let to = full;
  if (!ok(full)) {
    const s = sweep(grid, a.x, a.z, axis, d), k = Math.round(1 / POS_STEP_M), raw = from + sgn(d) * s;
    to = d > 0 ? Math.floor(raw * k + 1e-7) / k : Math.ceil(raw * k - 1e-7) / k;
    if (to === from || !ok(to)) return 0;
  }
  if (axis === 'x') a.x = to; else a.z = to;
  return Math.abs(to - from);
}
// (the body moved by (dx, dz), axis by axis: the speeds into whatever stopped an axis, m/s, given the velocity v)
function moveBy(a, grid, dx, dz, vx, vz) {
  let into = 0;
  if (Math.abs(dx) > 1e-9 && axisStep(a, grid, 'x', dx) < Math.abs(dx) * 0.5) into = Math.hypot(into, vx);
  if (Math.abs(dz) > 1e-9 && axisStep(a, grid, 'z', dz) < Math.abs(dz) * 0.5) into = Math.hypot(into, vz);
  return into;
}
// (a face met at vMs: landed or an impact, the body stopped there either way (see the header))
function meet(state, bus, a, pid, vMs, now) {
  const head = Number.isFinite(a.headRad) ? a.headRad : null, dir = a.v ? Math.atan2(a.v[1], a.v[0]) : a.push ? Math.atan2(a.push.v[1], a.push.v[0]) : null;
  const toward = head !== null && dir !== null && Math.cos(head - dir) > 0;
  const first = toward ? 'hands' : 'body', speed = q(vMs, V_STEP_MS);
  stopBody(a);
  if (speed <= F.LAND_MS) {
    if (isMe(state, pid)) logEntry(state, bus, { kind: 'note', tone: 'note', who: pid, text: `You meet the bulkhead at ${speed.toFixed(1)} m/s and stop on it.` });
    return { landed: true, vMs: speed, first, injuries: [] };
  }
  const injuries = impactOf(state, pid, { vMs: speed, first, atMs: now });
  bus?.emit('fx', { kind: 'impact', x: a.x, y: a.floatY ?? F.FLOAT_Y_M, z: a.z, atMs: now, who: pid, vMs: speed, first });
  if (isMe(state, pid)) logEntry(state, bus, { kind: 'note', tone: 'warn', who: pid, text: `You hit the bulkhead at ${speed.toFixed(1)} m/s. ${impactWords(injuries)}` });
  return { landed: false, vMs: speed, first, injuries };
}
// (the drift, the push and the tumble stopped: a face met, a hold taken)
function stopBody(a) { delete a.v; delete a.push; delete a.tumble; delete a.aimFrom; }

// (the tumble's angle advanced, and the stop's aim lost past the arms' arc (see the header))
function tumbleTick(state, a, pid, dt) {
  if (!a.tumble) return;
  a.tumbleRad = q((a.tumbleRad ?? 0) + a.tumble * dt, RAD_STEP);
  const S = state.stop, aim = S?.who === pid ? S.aim : null;
  if (!aim) { delete a.aimFrom; return; }
  if (!a.aimFrom || a.aimFrom.ms !== aim.settledMs) { a.aimFrom = { rad: a.tumbleRad, ms: aim.settledMs }; return; }
  if (Math.abs(a.tumbleRad - a.aimFrom.rad) > aimArcRadOf(state, pid)) { S.aim = null; delete a.aimFrom; }
}

/**
 * A floating body's tick (see the header), for places/move.js inertStep when the footing is 'float': a push-off under way, the
 * keys' push-off from rest, the drift, a face met, the tumble, the record. dt the body's step (s, move.js inertDtS); record whether
 * the locomotion record is written here (else the mover's own layer writes it). Returns true: a floating body is moved here.
 */
export function floatStep(state, a, feet, grid, pid, dt, record = true, bus = null) {
  const now = state.clock.ms, x0 = a.x, z0 = a.z;
  a.locoMs = now;
  if (!(dt > 0)) { a.$moved = 0; return true; }
  const x = sgn(feet?.mx), z = sgn(feet?.mz);
  if (a.buddyOff && a.anchor !== BUDDY_ANCHOR) delete a.buddyOff;
  if (x || z) {
    // (the keys turn the head, and from rest with something to push from start a push-off along them)
    a.face = faceOf(x, z, a.face);
    if (!a.push && speedOfV(a) <= F.AT_REST_MS) pushOff(state, pid, Math.atan2(z, x), keysPushMs(feet), { bus, grid });
  }
  // (holding a man: kept at the grab's offset from him, his drift shared (see the header); a wall between lets go)
  if (!a.push && a.anchor === BUDDY_ANCHOR && a.buddyOff && buddyTick(state, a, pid, grid, dt, bus)) {
    tumbleTick(state, a, pid, dt);
    a.$moved = record ? locoStep(a, x0, z0, { state, pid, gait: 'float', vMs: speedOfV(a), dtS: dt }) : Math.hypot(a.x - x0, a.z - z0);
    return true;
  }
  // (held, on a hold, a lanyard or a brace, and no push begun: the body stays where the anchor holds it, the keys only turned the head)
  if (!a.push && footingOf(state, pid).mode !== 'float') {
    delete a.v;
    a.$moved = record ? locoStep(a, x0, z0, { state, pid, gait: 'float', vMs: 0, dtS: dt }) : 0;
    return true;
  }
  let vMs = speedOfV(a);
  if (a.push) {
    // (the push's closed form: the speed ramps from rest to v over the step (see the header))
    const P = a.push, T = (P.untilMs - P.fromMs) / 1000, t = Math.min(T, (now - P.fromMs) / 1000), k = t / T;
    const tx = q(P.x0 + P.v[0] * t * t / (2 * T), POS_STEP_M), tz = q(P.z0 + P.v[1] * t * t / (2 * T), POS_STEP_M);
    const vx = q(P.v[0] * k, V_STEP_MS), vz = q(P.v[1] * k, V_STEP_MS);
    const into = moveBy(a, grid, tx - a.x, tz - a.z, vx, vz);
    vMs = Math.hypot(vx, vz);
    if (into > 0) meet(state, bus, a, pid, into, now);
    else if (now >= P.untilMs) { a.v = [P.v[0], P.v[1]]; delete a.push; }
    else a.v = [vx, vz];
  } else if (a.v) {
    if (a.floatY === undefined) a.floatY = F.FLOAT_Y_M;
    const [vx, vz] = a.v, into = moveBy(a, grid, vx * dt, vz * dt, vx, vz);
    if (into > 0) meet(state, bus, a, pid, into, now);
  }
  tumbleTick(state, a, pid, dt);
  a.$moved = record ? locoStep(a, x0, z0, { state, pid, gait: 'float', vMs, dtS: dt }) : Math.hypot(a.x - x0, a.z - z0);
  return true;
}

// (a man holding another this tick (see the header): the man held drifts by the drift they share (nobody else's tick drifts him:
// the float's is the mover's of whoever floats, here the holder's), a face he meets stopping both; then the holder is moved to the
// grab's offset from him and given his drift. True while he holds, false (the hold let go) where a wall stops the holder short of
// it or the man is gone)
function buddyTick(state, a, pid, grid, dt, bus) {
  const b = actorOf(state, a.anchorRef), now = state.clock.ms;
  if (!b) { setAnchor(state, pid, null); delete a.buddyOff; return false; }
  if (b.v && floating(state, b.who)) {
    const area = state.places?.live?.area, bg = area ? navOf(state, area, CLS, b.x, b.z) : null;
    const into = bg ? moveBy(b, bg, b.v[0] * dt, b.v[1] * dt, b.v[0], b.v[1]) : 0;
    if (into > 0) meet(state, bus, b, b.who, into, now);
    if (b.floatY === undefined) b.floatY = F.FLOAT_Y_M;
    b.locoMs = now;
  }
  const tx = q(b.x + a.buddyOff[0], POS_STEP_M), tz = q(b.z + a.buddyOff[1], POS_STEP_M);
  moveBy(a, grid, tx - a.x, tz - a.z, 0, 0);
  if (Math.hypot(a.x - tx, a.z - tz) > F.REACH_M) { setAnchor(state, pid, null); delete a.buddyOff; return false; }
  if (b.v) a.v = [b.v[0], b.v[1]]; else delete a.v;
  a.anchorAt = [q(a.x, 0.001), q(a.z, 0.001)];
  return true;
}

// ---- the grab ----

// (a person within REACH_M of a, not in a fight, nearest first: { pid, actor, dM } or null)
function personNear(state, a, pid) {
  let best = null;
  for (const b of state.actors?.list ?? []) {
    if (!b.who || b.who === pid || b === a || state.fights?.[b.who]) continue;
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    if (d <= F.REACH_M + 1e-9 && (!best || d < best.dM)) best = { pid: b.who, actor: b, dM: d };
  }
  return best;
}
/** What a grab would take now (see the header): { kind: 'hold' | 'person', hold, person, relMs } or null (nothing in reach, or not floating). */
export function grabOf(state, pid) {
  const a = actorOf(state, pid);
  if (!a || !state.places?.live?.area || !floating(state, pid)) return null;
  const hold = holdNear(state, a.x, a.z, F.REACH_M), person = hold ? null : personNear(state, a, pid);
  if (!hold && !person) return null;
  const v = a.v ?? [0, 0], u = person?.actor?.v ?? [0, 0];
  return { kind: hold ? 'hold' : 'person', hold, person: person?.pid ?? null, relMs: q(Math.hypot(v[0] - u[0], v[1] - u[1]), V_STEP_MS) };
}

/** BODY §16.6's grab (see the header). Returns { ok, why, band, roll, injuries }: why 'nothing to grab', 'glanced off', or setAnchor's refusal. */
export function grab(state, pid, { bus = null } = {}) {
  const G = F.GRAB, a = actorOf(state, pid), g = grabOf(state, pid), now = state.clock.ms;
  if (!a || !g) return { ok: false, why: 'nothing to grab', band: null, roll: null, injuries: [] };
  let roll = null, injuries = [], band = g.relMs < G.HOLD_MS ? 'hold' : g.relMs <= G.IMPACT_MS ? 'roll' : 'impact';
  if (band === 'roll') {
    const roller = rollerOf(state, pid), r = stream(state.meta?.seed ?? 0, 'ff:grab', pid, now);
    roll = check(r, { skill: 'zerog', value: roller.value('zerog'), dc: Math.round(G.DC_BASE + G.DC_PER_MS * (g.relMs - G.HOLD_MS)), mods: roller.mods('zerog'), by: pid, verb: 'grab' });
    if (isMe(state, pid)) { logEntry(state, bus, { kind: 'roll', tone: roll.ok ? 'note' : 'warn', roll, step: 'grab', who: pid, text: checkShort(roll) }); bus?.emit('roll', { roll, who: pid }); }
    if (!roll.ok) {
      // (a miss by SPRAIN_BY or more: the wrist wrenched (a bruise of SPRAIN_K of the arm's capacity, the hands' impact's own write))
      if (-roll.margin >= G.SPRAIN_BY) injuries = impactOf(state, pid, { vMs: g.relMs, first: 'hands', atMs: now });
      return { ok: false, why: 'glanced off', band, roll, injuries };
    }
  } else if (band === 'impact') injuries = impactOf(state, pid, { vMs: g.relMs, first: 'hands', atMs: now });
  // (the body stopped first, then the anchor written (see the header); the motion put back if the anchor is refused)
  const was = { v: a.v, push: a.push, tumble: a.tumble, aimFrom: a.aimFrom }, v = a.v ?? [0, 0];
  stopBody(a);
  const took = g.kind === 'hold' ? setAnchor(state, pid, HOLD_ANCHOR) : setAnchor(state, pid, BUDDY_ANCHOR, { ref: g.person });
  if (!took.ok) { for (const [k, x] of Object.entries(was)) if (x !== undefined) a[k] = x; return { ok: false, why: took.why, band, roll, injuries }; }
  if (g.kind === 'person') {
    // (two bodies held together drift as one: their momentum shared by their masses, the grabber's tumble stopped, kept at his offset)
    const b = actorOf(state, g.person), m1 = massOf(state, pid), m2 = massOf(state, g.person), u = b.v ?? [0, 0];
    const w = [q((m1 * v[0] + m2 * u[0]) / (m1 + m2), V_STEP_MS), q((m1 * v[1] + m2 * u[1]) / (m1 + m2), V_STEP_MS)];
    if (Math.hypot(w[0], w[1]) > V_STEP_MS) { b.v = [...w]; a.v = [...w]; } else delete b.v;
    a.buddyOff = [q(a.x - b.x, POS_STEP_M), q(a.z - b.z, POS_STEP_M)];
  }
  return { ok: true, why: null, band, roll, injuries };
}
/** The 'grab' action (core/keys.js L, by context: see the header): the float's grab when the player floats with something in reach, else nothing (CQC's). */
export function grabAction(state, action, bus) {
  const pid = playerId(state);
  if (pid && grabOf(state, pid)) grab(state, pid, { bus });
}

// ---- recoil while floating ----

/**
 * One round's push and spin (WEAPONS §7.8; see the header), from shot.js resolveShot: model the gun's, load the round's, dirRad the
 * bore's heading, keep the anchor's { keepPush, keepSpin, row } (shot.js anchorOf). Returns { jNs, dvMs, spinRads, keptMs, keptRads,
 * row, moved } (moved: the body's drift and tumble changed, floating), or null when the anchor keeps nothing.
 */
export function recoilFloat(state, pid, { model, load = 'ball', dirRad, keep }) {
  if (!keep || !(keep.keepPush > 0 || keep.keepSpin > 0)) return null;
  const M = MODELS[model];
  if (!M) throw new Error(`recoilFloat(): no gun model '${model}'`);
  const jNs = impulseNs(M.cal, load, v0Of(M.cal, load, M.barrelMm)), m = massOf(state, pid);
  const dvMs = jNs / m, spinRads = jNs * F.RECOIL.LEVER_M / inertiaOf(m);
  const keptMs = q(keep.keepPush * dvMs, 1e-5), keptRads = q(keep.keepSpin * spinRads, RAD_STEP);
  const a = actorOf(state, pid), moved = !!a && keep.row === 'floating';
  if (moved) {
    const v = a.v ?? [0, 0];
    a.v = [q(v[0] - keptMs * Math.cos(dirRad), V_STEP_MS), q(v[1] - keptMs * Math.sin(dirRad), V_STEP_MS)];
    if (!(Math.hypot(a.v[0], a.v[1]) > 0)) delete a.v;
    a.tumble = q((a.tumble ?? 0) + keptRads, RAD_STEP);
    if (a.floatY === undefined) a.floatY = F.FLOAT_Y_M;
  }
  return { jNs: q(jNs, 1e-4), dvMs: q(dvMs, 1e-5), spinRads: q(spinRads, RAD_STEP), keptMs, keptRads, row: keep.row, moved };
}
/** The tick's step a floating body is moved by (m): the drift's at TICK_MS (the tests' reading). */
export const driftStepM = (vMs) => vMs * TICK_MS / 1000;
