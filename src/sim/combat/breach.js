// OLYMPUS sim: a door's ways in by its swing and the kit carried, and the stack's safe points for a charge (COMBAT §25.5.6, §25.20; PLACES §1.6; the build sheet 0.0.18 §2.3).
//
// The user, 2026-11-15: "doors should have a direction they open (pull or push) and it should affect our options for entry",
// and "breaching options and equipment (explosives etc)". entryOptions(state, pid, plan) is the door's methods as rows read
// them: [{ id: 'open' | 'kick' | 'pry' | 'ram' | 'charge' | 'flash', how, live, off, ms, odds?, standoffM? }]:
//   Open    a push or a pull, as the leaf swings; struck 'locked' on a lock
//   Kick    a push door only (a pull door's leaf bears on its stop: KICK_PULL_WHY 'opens toward you'), Fitness against its DC
//   Pry     the halligan, on either swing (its fork at a push door's latch, its adze prying a pull door out), Fitness against
//           the door's DC + the tool's dcK (an unlocked door KICK_DC_OPEN 8 − 4, the closet's 14 − 4 = 10)
//   Ram     a push door only, the ram's dcK −6 and its 1.0 s swing
//   Charge  the SC-1 on a push door's latch edge (on a pull door the leaf would come at the stack: struck 'opens toward you';
//           D2's BC-1 cuts a pull door's hinge side), with its FD-1
//   Flash   a G-11 once the leaf is open, after whichever breach
// A method the kit does not carry is struck 'not issued' (the panel's placeholders' words, groups.js DRILL_OUT). kitHas(state,
// pid, need) reads the kit for a need: 'charge' (an SC-1 pouched, or one placed on this door to fire again, and an FD-1),
// 'flashbang' (a G-11 pouched or in hand), 'halligan', 'ram' or 'tool' (either).
// safePointsOf(state, plan, model) is where the stack waits for a charge (FM 3-06.11's explosive breach): the charge on the
// latch edge's outer face, #1 on the latch side's wall at the charge's stand-off (blast.js standoffM at the air's pressure,
// BREACH_SAFE_KPA 27.6) from it and STACK_OFF_WALL_M off the wall, the #2 STACK_BEHIND_M further along: never across the hall
// from the door nor in line with it. A hall too short for it gives its farthest point inside the area's walls, its peak
// there (`kPa`) over the limit: the run sheet's STACK IN THE BLAST. Room 1's door in the Wheel puts #1 2.20 m off.
// Pure.
import { airAt } from '../places/env.js';
import { openingOf, openingState, areaOf, roomOf } from '../places/model.js';
import { STACK_OFF_WALL_M, STACK_BEHIND_M, KICK_PULL_WHY } from '../places/swing.js';
import { oddsOf } from '../skills/checks.js';
import { paceOf } from '../skills/skills.js';
import { DEVICES, devicesOf, deviceMs, pouchedOf, throwChainMs, HANG_S, UP_S, DEVICE_ACTIONS } from '../arms/devices.js';
import { standoffM, peakKPa, BREACH_SAFE_KPA } from '../arms/blast.js';
import { doorSwing, lockedOf, skillsOf, KICK_DC_OPEN, doorS } from './bundle.js';
import { rollerOf } from './roll.js';

/** The breach's count and the fire's press (s; COMBAT §25.19.2.1: "a count of 2 to 3 s"; bundle.js BREACH_S is the count). */
export const FIRE_S = 0.2;
/** The words a method is struck with when the kit does not carry it. */
export const NOT_ISSUED = 'not issued';
/** Why a charge is struck on an inner door (D1: the lane's doors only). */
export const INNER_WHY = 'not on an inner door';
/** The charge sits this far off the leaf's face on the stack's side (m). */
export const CHARGE_OFF_M = 0.05;

const doorMid = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);
const r3 = (x) => Math.round(x * 1000) / 1000;

/** Whether a person's kit carries what a need names (see the header); door: a charge already placed on it counts. */
export function kitHas(state, pid, need, door = null) {
  const list = devicesOf(state, pid);
  const has = (model, sts = ['pouched', 'stowed', 'held', 'armed']) => list.some(d => d.model === model && sts.includes(d.st));
  if (need === 'charge') {
    const placed = door ? placedOn(state, door, pid) : null;
    return !!placed || (has('sc1', ['pouched', 'held']) && has('fd1', ['pouched']));
  }
  if (need === 'flashbang') return list.some(d => d.kind === 'grenade' && DEVICES[d.model]?.flash && ['pouched', 'held', 'armed'].includes(d.st));
  if (need === 'halligan') return has('hal');
  if (need === 'ram') return has('ram');
  if (need === 'tool') return has('hal') || has('ram');
  return false;
}
/** The charge placed on a door (by a person, or anyone), still there: { id, st, x, z } or null. */
export function placedOn(state, door, byId = null) {
  for (const site of Object.values(state.places?.sites ?? {})) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id];
    if (rec?.type === 'charge' && rec.door === door && (rec.st === 'placed' || rec.st === 'primed') && (!byId || !rec.byId || rec.byId === byId)) return { id: l.id, st: rec.st, x: l.x, z: l.z };
  }
  return null;
}

/** The charge's point on a door (see the header): [x, z] on the latch edge's outer face, from the side the plan clears it from. */
export function chargePointOf(state, plan) {
  const sw = doorSwing(state, plan), o = plan?.door ? openingOf(plan.door) : null;
  if (!sw || !o) return null;
  const [mx, mz] = doorMid(o), s = plan.stack?.[0] ?? null;
  // (the outward normal: toward the stack's side of the door's line)
  const n = o.axis === 'x' ? [0, Math.sign((s?.[1] ?? mz + 1) - o.at) || 1] : [Math.sign((s?.[0] ?? mx + 1) - o.at) || 1, 0];
  const u = [sw.latchXZ[0] - sw.hingeXZ[0], sw.latchXZ[1] - sw.hingeXZ[1]], L = Math.hypot(u[0], u[1]) || 1;
  // (a hand's width in from the latch jamb, on the leaf)
  return [r3(sw.latchXZ[0] - u[0] / L * 0.1 + n[0] * CHARGE_OFF_M), r3(sw.latchXZ[1] - u[1] / L * 0.1 + n[1] * CHARGE_OFF_M)];
}

/**
 * The stack's safe points for a charge on the plan's door (see the header): { charge: [x, z], one: [x, z], two: [x, z], standoffM,
 * kPa: { one, two } (the peak at each), short (the hall too short: each the farthest it could go) } or null for a door with no leaf.
 */
export function safePointsOf(state, plan, model = 'sc1') {
  const sw = doorSwing(state, plan), o = plan?.door ? openingOf(plan.door) : null, c = chargePointOf(state, plan);
  if (!sw || !o || !c) return null;
  const D = DEVICES[model], area = plan.area ?? state.places?.live?.area, air = airAt(state, area, c[0], c[1]), Pa = air?.vacuum ? 0 : air?.pKpa ?? 0;
  const sd = standoffM(D?.tntKg ?? 0, Pa);
  const s = plan.stack?.[0] ?? null, [mx, mz] = doorMid(o);
  const n = o.axis === 'x' ? [0, Math.sign((s?.[1] ?? mz + 1) - o.at) || 1] : [Math.sign((s?.[0] ?? mx + 1) - o.at) || 1, 0];
  const u0 = [sw.latchXZ[0] - sw.hingeXZ[0], sw.latchXZ[1] - sw.hingeXZ[1]], L = Math.hypot(u0[0], u0[1]) || 1, u = [u0[0] / L, u0[1] / L];
  // (along the wall past the latch, STACK_OFF_WALL_M off it: the distance along that puts the point sd from the charge)
  const off = STACK_OFF_WALL_M, along = Math.sqrt(Math.max(0, sd * sd - (off - CHARGE_OFF_M) ** 2)) + 0.02;
  const A = areaOf(area), hall = A ? roomOf(A, s?.[0] ?? mx + n[0], s?.[1] ?? mz + n[1]) : null;
  const at = (k) => [c[0] + u[0] * k + n[0] * (off - CHARGE_OFF_M), c[1] + u[1] * k + n[1] * (off - CHARGE_OFF_M)];
  const inside = (p) => !hall || (p[0] >= hall.rect[0] + 0.3 && p[0] <= hall.rect[2] - 0.3 && p[1] >= hall.rect[1] + 0.3 && p[1] <= hall.rect[3] - 0.3);
  const fit = (k) => { let x = k; while (x > 0.3 && !inside(at(x))) x -= 0.05; return x; };
  const k1 = fit(along), k2 = fit(along + STACK_BEHIND_M);
  const one = at(k1).map(r3), two = at(Math.max(k2, k1)).map(r3);
  const kp = (p) => Math.round(peakKPa(D?.tntKg ?? 0, Math.hypot(p[0] - c[0], p[1] - c[1]), Pa) * 10) / 10;
  return { charge: c, one, two, standoffM: sd, kPa: { one: kp(one), two: kp(two) }, short: k1 < along - 1e-6 || kp(one) > BREACH_SAFE_KPA, limitKPa: BREACH_SAFE_KPA };
}

/**
 * The door's ways in for a person (see the header): [{ id, how, live, off, ms, odds?, standoffM? }] in the order Open, Kick, Pry,
 * Ram, Charge, Flash. A door standing open has only Flash.
 */
export function entryOptions(state, pid, plan, { rung = 0, from = null } = {}) {
  const o = plan?.door ? openingOf(plan.door) : null, sw = o ? doorSwing(state, plan, from) : null;
  const sk = skillsOf(state, pid), roller = rollerOf(state, pid), how = sw?.how ?? 'push', locked = o ? lockedOf(state, o.id) : false;
  const open = !o || openingState(state, o) === 'open', out = [];
  const row = (id, live, off, ms, more = {}) => out.push({ id, how: id === 'open' ? how : id, live: !!live && !off, off: off ?? null, ms: Math.round(ms), ...more });
  const dcOf = (dcK) => (o?.lock && locked ? o.kickDc ?? 14 : KICK_DC_OPEN) + dcK;
  if (o && !open) {
    const t = doorS(sk.wh, how, rung, o.openS ?? 0.4);
    row('open', true, locked ? 'locked' : null, t.ms);
    row('kick', true, sw?.kickable === false ? KICK_PULL_WHY : null, doorS(sk.wh, 'kick', rung, o.openS ?? 0.4).ms, { odds: oddsOf(sk.fit, dcOf(0)) });
    for (const [id, need] of [['pry', 'halligan'], ['ram', 'ram']]) {
      const model = id === 'pry' ? 'hal' : 'ram', F = DEVICES[model].force, has = kitHas(state, pid, need);
      const swingOk = F.on.includes(how);
      row(id, has && swingOk, !has ? NOT_ISSUED : !swingOk ? KICK_PULL_WHY : null, forceMs(roller, model, pouchedOf(state, pid, model)?.face ?? 'back').ms, { odds: oddsOf(sk.fit, dcOf(F.dcK)) });
    }
    // (a charge on the lane's doors only this round: an inner door's stack has no safe points laid (my call))
    const hasC = kitHas(state, pid, 'charge', o.id), cOk = DEVICES.sc1.on.includes(how), sp = cOk && !from ? safePointsOf(state, plan, 'sc1') : null;
    row('charge', hasC && cOk && !from, !hasC ? 'no charge issued' : !cOk ? KICK_PULL_WHY : from ? INNER_WHY : null, chargeMs(roller, pouchedOf(state, pid, 'sc1')?.face ?? 'right'), { standoffM: sp?.standoffM ?? null });
  }
  const hasF = kitHas(state, pid, 'flashbang');
  row('flash', hasF, hasF ? null : NOT_ISSUED, throwChainMs(sk.wh, { face: pouchedOf(state, pid, 'g11')?.face ?? 'left' }).airMs);
  return out;
}

/** A tool's force at a door (ms): the rifle let hang, the tool off the back, the force, the tool let go and the rifle up: { ms, handMs }. */
export function forceMs(roller, model, face = 'back') {
  const F = DEVICES[model].force, p = paceOf(roller.value('weapons'));
  const handMs = Math.round(HANG_S * p * 1000) + deviceMs(roller, 'tool:reach', { face }) + Math.round(F.s * 1000);
  return { ms: handMs + Math.round(DEVICE_ACTIONS['tool:drop'].s * 1000) + Math.round(UP_S * p * 1000), handMs };
}
/** A charge's breach without the walk back (ms): the rifle let hang, the charge reached and placed, primed, the count and the fire. */
export function chargeMs(roller, face = 'right', countS = 2.5) {
  const p = paceOf(roller.value('weapons'));
  return Math.round(HANG_S * p * 1000) + deviceMs(roller, 'charge:reach', { face }) + deviceMs(roller, 'charge:place') + deviceMs(roller, 'charge:prime') + Math.round((countS + FIRE_S) * 1000);
}
