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
// v0.0.19 (D2, the build sheet 0.0.19 §0 items 1, 8, 9, 16; kit2 §2.5, §2.6): **the cutting charge and the ballistic breach.**
// chargeFor(state, pid, plan) is the charge a door takes: the SC-1 on a push door's latch edge (D1); on a pull door, whose hinges
// are on your side, the BC-1 on its hinge edge (FM 3-06.11's cutting charge, to check), the SC-1 there still struck "opens
// toward you"; the BC-1 on a push door's latch only where no SC-1 is carried; a charge already placed on the door is its own.
// The way chosen (`way`: 'charge' or 'cut', the row's) picks the charge where both are carried: 'cut' the BC-1 on the edge the
// swing allows, 'charge' the SC-1 (the review of v0.0.19's K: "Cut, clear the room" at room 1 fired the SC-1).
// chargePointOf(state, plan, side) puts it a hand's width in from that edge, and safePointsOf(state, plan, model, { edge, side })
// measures the stand-off from it, so a hinge charge puts the stack the door's width further down the latch-side wall: room 2's
// BC-1 (0.30 kg, 3.18 m at 66 kPa) puts #1 at (23.43, 13.95). `side` is CHARGE_SIDE_SHORT ('same': the #2 stays on the stack's
// wall; 'other' lets him take the hinge side where the latch side is too short: kit2's TWO_SIDE_BLOCKED, renamed so it is never
// read as the team's other side). kitHas gains the needs 'cut' (a BC-1 and an FD-1, or a BC-1 placed on the door), 'frag' and
// 'conc' (a G-9 or G-9P, a G-13 or G-13P, pouched or in hand) and 'ballistic' (the rifle with the house's frangible, on a
// breaching lane: BALLISTIC_LANES, the loadout carrying a charge or a tool, breachingLane). entryOptions gains Cut (the BC-1:
// live where its swing and the kit allow it, never on an inner door) and Shoot (the lock or the hinges, ballistic.js: live on a
// door locked, struck 'not locked' on one that is not, 'marking rounds' on a load that cannot breach). breachHowOf(state, door)
// is how a door was opened: the house's R.house.breach[door].how where D2 wrote it ('cut', 'shot'), else 'broken' (D1's charge
// or tool: its ms in R.house.broken), else null.
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
import { loadoutOf } from '../arms/loadout.js';
import { AIM } from '../arms/shot.js';

/** The breach's count and the fire's press (s; COMBAT §25.19.2.1: "a count of 2 to 3 s"; bundle.js BREACH_S is the count). */
export const FIRE_S = 0.2;
/** The words a method is struck with when the kit does not carry it. */
export const NOT_ISSUED = 'not issued';
/** Why a charge is struck on an inner door (D1: the lane's doors only). */
export const INNER_WHY = 'not on an inner door';
/** The charge sits this far off the leaf's face on the stack's side (m). */
export const CHARGE_OFF_M = 0.05;
/** Where the #2 waits for a charge when the latch-side wall is too short (see the header): 'same' or 'other' (my call: 'same'). */
export const CHARGE_SIDE_SHORT = 'same';
/** The ballistic breach's lanes (the build sheet 0.0.19 §0 item 16, my call): a loadout carrying a charge or a tool. */
export const BALLISTIC_LANES = Object.freeze(['breach']);
/** Why Shoot the lock is struck: a door not locked; a load that cannot breach (the live lane's marking rounds, §0 item 22). */
export const NOT_LOCKED = 'not locked', MARKING_WHY = 'marking rounds';
/** The issue places that make a lane a breaching one (loadout.js ISSUE ids). */
export const BREACH_ISSUE = Object.freeze(['sc1+fd1', 'bc1+fd1', 'hal', 'ram']);

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
  // (v0.0.19, D2 (see the header))
  if (need === 'cut') {
    const placed = door ? placedOn(state, door, pid) : null;
    return (!!placed && state.items[placed.id]?.model === 'bc1') || (has('bc1', ['pouched', 'held']) && has('fd1', ['pouched']));
  }
  if (need === 'frag' || need === 'conc') { const as = need === 'frag' ? 'g9' : 'g13'; return list.some(d => d.kind === 'grenade' && (d.model === as || DEVICES[d.model]?.as === as) && ['pouched', 'held', 'armed'].includes(d.st)); }
  if (need === 'ballistic') return ballisticOk(state, pid) === null;
  if (need === 'halligan') return has('hal');
  if (need === 'ram') return has('ram');
  if (need === 'tool') return has('hal') || has('ram');
  return false;
}
/** Whether the lane is a breaching one (see the header): the house's loadout carries a charge or a tool. */
export function breachingLane(state) {
  const code = state.armoury?.range?.house?.loadout ?? null, s = code ? loadoutOf(code) : null;
  return !!s && !s.error && Object.values(s).some(f => Array.isArray(f) && f.some(p => BREACH_ISSUE.includes(p)));
}
/** Why a person cannot breach by fire now (see the header), or null: no rifle, a load that cannot breach, not a breaching lane. */
export function ballisticOk(state, pid) {
  const R = state.armoury?.range, gun = state.people?.[pid]?.kit?.worn?.sling ?? null;
  if (!gun || !state.items?.[gun]) return NOT_ISSUED;
  if (R?.load && R.load !== 'frangible') return MARKING_WHY;
  if (!BALLISTIC_LANES.includes('breach') || !breachingLane(state)) return NOT_ISSUED;
  return null;
}
/** How a door was opened (see the header): 'cut', 'shot' (D2's record), 'broken' (D1's charge or tool), or null. */
export const breachHowOf = (state, door) => { const H = state.armoury?.range?.house; return H?.breach?.[door]?.how ?? (H?.broken?.[door] !== undefined ? 'broken' : null); };
/**
 * The charge a door takes for a person (see the header): { model, side: 'latch' | 'hinge', placed? } or null (none carried, or the
 * door's swing takes none of what is carried). way: the row's 'charge' (the SC-1) or 'cut' (the BC-1), or null for either.
 */
export function chargeFor(state, pid, plan, way = null) {
  const sw = doorSwing(state, plan), how = sw?.how ?? 'push', o = plan?.door ? openingOf(plan.door) : null;
  if (!o) return null;
  const p = placedOn(state, o.id, pid);
  if (p) { const rec = state.items[p.id]; return { model: rec.model, side: rec.side ?? DEVICES[rec.model]?.side ?? 'latch', placed: p.id }; }
  if (how === 'pull') return way !== 'charge' && kitHas(state, pid, 'cut', o.id) && DEVICES.bc1.on.includes('pull') ? { model: 'bc1', side: 'hinge' } : null;
  if (way === 'cut') return kitHas(state, pid, 'cut', o.id) && DEVICES.bc1.on.includes(how) ? { model: 'bc1', side: 'latch' } : null;
  if (kitHas(state, pid, 'charge', o.id)) return { model: 'sc1', side: 'latch' };
  if (way === 'charge') return null;
  if (kitHas(state, pid, 'cut', o.id)) return { model: 'bc1', side: 'latch' };
  return null;
}
/** The charge placed on a door (by a person, or anyone), still there (placed, primed or a believed misfire, v0.0.19): { id, st, x, z } or null. */
export function placedOn(state, door, byId = null) {
  for (const site of Object.values(state.places?.sites ?? {})) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id];
    if (rec?.type === 'charge' && rec.door === door && (rec.st === 'placed' || rec.st === 'primed' || rec.st === 'misfire') && (!byId || !rec.byId || rec.byId === byId)) return { id: l.id, st: rec.st, x: l.x, z: l.z };
  }
  return null;
}

/** The charge's point on a door (see the header): [x, z] on its edge's outer face ('latch', D1's, or 'hinge'), from the side the plan clears it from. */
export function chargePointOf(state, plan, side = 'latch') {
  const sw = doorSwing(state, plan), o = plan?.door ? openingOf(plan.door) : null;
  if (!sw || !o) return null;
  const [mx, mz] = doorMid(o), s = plan.stack?.[0] ?? null;
  // (the outward normal: toward the stack's side of the door's line)
  const n = o.axis === 'x' ? [0, Math.sign((s?.[1] ?? mz + 1) - o.at) || 1] : [Math.sign((s?.[0] ?? mx + 1) - o.at) || 1, 0];
  const u = [sw.latchXZ[0] - sw.hingeXZ[0], sw.latchXZ[1] - sw.hingeXZ[1]], L = Math.hypot(u[0], u[1]) || 1;
  // (a hand's width in from the latch jamb, on the leaf; v0.0.19: from the hinge jamb for a cutting charge)
  if (side === 'hinge') return [r3(sw.hingeXZ[0] + u[0] / L * 0.1 + n[0] * CHARGE_OFF_M), r3(sw.hingeXZ[1] + u[1] / L * 0.1 + n[1] * CHARGE_OFF_M)];
  return [r3(sw.latchXZ[0] - u[0] / L * 0.1 + n[0] * CHARGE_OFF_M), r3(sw.latchXZ[1] - u[1] / L * 0.1 + n[1] * CHARGE_OFF_M)];
}

/**
 * The stack's safe points for a charge on the plan's door (see the header): { charge: [x, z], one: [x, z], two: [x, z], standoffM,
 * kPa: { one, two } (the peak at each), short (the hall too short: each the farthest it could go) } or null for a door with no leaf.
 */
export function safePointsOf(state, plan, model = 'sc1', { edge = null, side = CHARGE_SIDE_SHORT } = {}) {
  const sw0 = doorSwing(state, plan), e = edge ?? (model === 'bc1' && sw0?.how === 'pull' ? 'hinge' : 'latch');
  const sw = sw0, o = plan?.door ? openingOf(plan.door) : null, c = chargePointOf(state, plan, e);
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
  const one = at(k1).map(r3);
  // (the #2 behind #1 on the stack's wall; with CHARGE_SIDE_SHORT 'other' and that wall too short for him, on the hinge side's)
  const kp = (p) => Math.round(peakKPa(D?.tntKg ?? 0, Math.hypot(p[0] - c[0], p[1] - c[1]), Pa) * 10) / 10;
  const hingeAlong = e === 'hinge' ? along : along + (sw.widthM ?? L) - 0.2, other = side === 'other' && k2 < along + STACK_BEHIND_M - 1e-6 ? at(-hingeAlong).map(r3) : null;
  const two = other && inside(other) && kp(other) <= BREACH_SAFE_KPA ? other : at(Math.max(k2, k1)).map(r3);
  return { charge: c, edge: e, one, two, standoffM: sd, kPa: { one: kp(one), two: kp(two) }, short: k1 < along - 1e-6 || kp(one) > BREACH_SAFE_KPA, limitKPa: BREACH_SAFE_KPA };
}

/** A way in struck while a charge is on the door. */
export const CHARGE_ON_WHY = 'a charge is on the door';
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
    // (the hunt of v0.0.18: a charge on the leaf strikes every other way in, CHARGE_ON_WHY: the charge's own row finishes the
    // breach. Push and Kick stayed live over a placed SC-1, the door held shut and the #2 held at his safe point, and "Wait." ran the
    // lane out at 363 s)
    const on = placedOn(state, o.id) ? CHARGE_ON_WHY : null;
    const t = doorS(sk.wh, how, rung, o.openS ?? 0.4);
    row('open', true, locked ? 'locked' : on, t.ms);
    row('kick', true, sw?.kickable === false ? KICK_PULL_WHY : on, doorS(sk.wh, 'kick', rung, o.openS ?? 0.4).ms, { odds: oddsOf(sk.fit, dcOf(0)) });
    for (const [id, need] of [['pry', 'halligan'], ['ram', 'ram']]) {
      const model = id === 'pry' ? 'hal' : 'ram', F = DEVICES[model].force, has = kitHas(state, pid, need);
      const swingOk = F.on.includes(how);
      row(id, has && swingOk, !has ? NOT_ISSUED : !swingOk ? KICK_PULL_WHY : on, forceMs(roller, model, pouchedOf(state, pid, model)?.face ?? 'back').ms, { odds: oddsOf(sk.fit, dcOf(F.dcK)) });
    }
    // (a charge on the lane's doors only this round: an inner door's stack has no safe points laid (my call))
    const hasC = kitHas(state, pid, 'charge', o.id), cOk = DEVICES.sc1.on.includes(how), sp = cOk && !from ? safePointsOf(state, plan, 'sc1') : null;
    row('charge', hasC && cOk && !from, !hasC ? 'no charge issued' : !cOk ? KICK_PULL_WHY : from ? INNER_WHY : null, chargeMs(roller, pouchedOf(state, pid, 'sc1')?.face ?? 'right'), { standoffM: sp?.standoffM ?? null });
    // (v0.0.19, D2: the cutting charge on either swing (a pull door's hinges, a push door's latch); the lock or the hinges shot)
    if (kitHas(state, pid, 'cut', o.id)) {
      const xOk = DEVICES.bc1.on.includes(how), sx = xOk && !from ? safePointsOf(state, plan, 'bc1') : null;
      row('cut', xOk && !from, !xOk ? KICK_PULL_WHY : from ? INNER_WHY : null, chargeMs(roller, pouchedOf(state, pid, 'bc1')?.face ?? 'right', 2.5, 'bc1'), { standoffM: sx?.standoffM ?? null, side: sx?.edge ?? null });
    }
    const bWhy = ballisticOk(state, pid);
    if (bWhy !== NOT_ISSUED) row('shoot', !bWhy && locked, bWhy ?? (locked ? on : NOT_LOCKED), shootMs(state, pid, how), { how: how === 'pull' ? 'hinge' : 'lock' });
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
/** A charge's breach without the walk back (ms): the rifle let hang, the charge reached and placed (its model's placeS), primed, the count and the fire. */
export function chargeMs(roller, face = 'right', countS = 2.5, model = 'sc1') {
  const p = paceOf(roller.value('weapons')), s0 = model === 'sc1' ? null : DEVICES[model]?.placeS ?? null;
  return Math.round(HANG_S * p * 1000) + deviceMs(roller, 'charge:reach', { face }) + deviceMs(roller, 'charge:place', { s0 }) + deviceMs(roller, 'charge:prime') + Math.round((countS + FIRE_S) * 1000);
}
/** A ballistic breach's first point (ms; v0.0.19): the muzzle onto the leaf (the sight's settle at the person's pace) and its rounds, a lock's 2 or a hinge's 2 each of 3, at the rifle's pull. */
export function shootMs(state, pid, how = 'push') {
  const p = paceOf(skillsOf(state, pid).wh), rounds = how === 'pull' ? 6 : 2;
  return Math.round(AIM.sight * p * 1000 + rounds * 250 * p);
}
