// OLYMPUS arms: a grenade's throw solved in closed form at release, in any gravity, with the spin's bias (WEAPONS §12.2; COMBAT §11.1; the build sheet 0.0.18 §2.3).
//
// throwSolve(state, pid, { from: [x, y, z], aim: [x, z], gMs2, ceilingM, fuseMs, vMaxMs }) picks the throw: the highest angle
// from 45° down, by a degree at a time, whose speed is within the thrower's (vMaxMs, else WEAPONS §12.2's min(20, 14 + 0.25 ×
// Fitness) × 0.85 in a suit), whose top clears the ceiling by CEILING_KEEP_M and whose flight leaves FUSE_KEEP_MS of the
// fuse, so a room's toss in the Wheel is a 45° lob and a long throw on Mars or Europa, where the lob would outlast the fuse,
// is thrown low (`low`). In free fall (under FREE_G_MS2) it goes straight, at FREE_THROW_MS. The flight is plain data, a
// closed form any frame can draw from (x0, y0, z0, vx, vy, vz, g, fromMs, landMs).
// The Wheel's spin: spin.js spinBiasCm (the one home of ω) gives the throw's bias over its range at its horizontal speed;
// a conditioned thrower's aim already allows for it (the Corps' sheets train in the Wheel: conditioned 1), so only
// (1 − conditioned) of it moves the landing. Its whole is reported (24 cm at 3 m and 5 m/s).
// throwDc(d, { door, unconditioned }) is §12.2's roll: 8 + round(5 log2(max(d, 5) / 5)), +4 through a doorway, +3 in a gravity
// the thrower is not conditioned to. throwLand(state, pid, solve, { itemId, ok, margin, nat, wh }) lands it: on a pass within
// 0.5 + 0.03 d m of the aim, on a fail 1 + 0.5 |margin| + 0.08 d m off, the direction and the share from the stream
// arms:throw:<pid>:<item>; the line from the hand checked against the walls as they stand (route.js lineClear, the routing
// grid's rects), a wall hit stopping it short there (route.js clipped); then it rolls U(0.5, 2) × √(G0 / g) m on, again never
// through a wall. Through a door (`door`: its plane and the room's side), the hand is through the doorway at the release, so the
// grenade goes on into the room: an error that would carry it back over the door's line is turned about that line, at least
// BEYOND_M into the room (the review of 2026-11-16: a fail at margin −8 landed in the hall behind the stack 742 times in 2,000).
// A natural 1 with Weapon handling under 10 slips: armed at your feet (`feet`, the thrower's place), SLIP_M toward the hand
// and never nearer the door's line than SLIP_KEEP_M on your own side, where it was dropped (the same review: it landed in the
// room from the door's middle, and dazed the room's stands).
// Pure.
import { stream, next, range } from '../../core/rng.js';
import { G0_MS2 } from '../../core/phys.js';
import { spinBiasCm } from '../places/spin.js';
import { lineClear, clipped } from '../combat/route.js';

/** The ceiling's keep for a lob's top (m), the fuse's keep for its flight (ms), free fall below FREE_G_MS2 thrown straight at FREE_THROW_MS (m/s); the release's height (m). */
export const CEILING_KEEP_M = 0.1, FUSE_KEEP_MS = 400, FREE_G_MS2 = 0.05, FREE_THROW_MS = 6, RELEASE_Y_M = 1.4;
/** The thrower's speed (WEAPONS §12.2): min(THROW_V_MAX, THROW_V0 + THROW_V_PER × Fitness) × SUIT_THROW_K in a suit. */
export const THROW_V_MAX = 20, THROW_V0 = 14, THROW_V_PER = 0.25, SUIT_THROW_K = 0.85;
/** A slip at your feet lands this far toward the hand (m), and at least SLIP_KEEP_M short of the door's line on your side; a throw through a door lands at least BEYOND_M past its line (m). */
export const SLIP_M = 0.4, SLIP_KEEP_M = 0.2, BEYOND_M = 0.3;

/** The thrower's top speed (m/s) for a Fitness, suited or not (see the header). */
export const throwVMax = (fitness, suited = false) => Math.min(THROW_V_MAX, THROW_V0 + THROW_V_PER * (fitness ?? 10)) * (suited ? SUIT_THROW_K : 1);
/** The throw's DC (see the header). */
export function throwDc(dM, { door = false, unconditioned = false } = {}) {
  return 8 + Math.round(5 * Math.log2(Math.max(dM, 5) / 5)) + (door ? 4 : 0) + (unconditioned ? 3 : 0);
}

/**
 * The throw solved (see the header): { dM, angleDeg, vMs, flightMs, apexM, low, flight: { x0, y0, z0, vx, vy, vz, g }, bias:
 * { cm, upCm, sideCm }, appliedCm, short } (short: none of the angles reaches; the best at full speed is given).
 */
export function throwSolve(state, pid, { from, aim, gMs2, spin = null, ceilingM = Infinity, fuseMs = Infinity, vMaxMs = THROW_V_MAX, conditioned = 1 } = {}) {
  const [x0, y0 = RELEASE_Y_M, z0] = from.length === 3 ? from : [from[0], RELEASE_Y_M, from[1]];
  const dx = aim[0] - x0, dz = aim[1] - z0, d = Math.hypot(dx, dz), ux = d > 0 ? dx / d : 1, uz = d > 0 ? dz / d : 0;
  const g = Math.max(0, gMs2 ?? 0);
  const pack = (deg, v, low, short = false) => {
    const th = deg * Math.PI / 180, vh = v * Math.cos(th), vy = v * Math.sin(th);
    const T = g < FREE_G_MS2 ? d / Math.max(vh, 1e-6) : (vy + Math.sqrt(vy * vy + 2 * g * y0)) / g;
    const bias = spin && d > 0 ? spinBiasCm(spin, { rangeM: d, vMs: Math.max(vh, 0.1), bearingRad: Math.atan2(uz, ux) }) : { cm: 0, upCm: 0, sideCm: 0 };
    const k = 1 - Math.max(0, Math.min(1, conditioned));
    return { dM: r3(d), angleDeg: deg, vMs: r3(v), flightMs: Math.round(T * 1000), apexM: r3(y0 + (g > 0 ? vy * vy / (2 * g) : 0)), low, short,
      flight: { x0: r3(x0), y0: r3(y0), z0: r3(z0), vx: r3(vh * ux), vy: r3(vy), vz: r3(vh * uz), g: r3(g) }, bias, appliedCm: r3(bias.cm * k), ux, uz };
  };
  if (g < FREE_G_MS2) return pack(0, Math.min(vMaxMs, FREE_THROW_MS), true);
  let best = null;
  for (let deg = 45; deg >= 2; deg--) {
    const th = deg * Math.PI / 180, c = Math.cos(th), den = 2 * c * c * (y0 + d * Math.tan(th));
    if (den <= 0) continue;
    const v = Math.sqrt(g * d * d / den);
    const apex = y0 + (v * Math.sin(th)) ** 2 / (2 * g), T = d / (v * c);
    if (v <= vMaxMs && apex <= ceilingM - CEILING_KEEP_M && T * 1000 <= fuseMs - FUSE_KEEP_MS) return pack(deg, v, deg < 45);
    if (!best || T < best.T) best = { deg, T };
  }
  return pack(best?.deg ?? 10, vMaxMs, true, true);
}

const r3 = (x) => Math.round(x * 1000) / 1000;

/**
 * Where a solved throw lands (see the header): { x, z, aimX, aimZ, offM, wall, rollM, atFeet }. ok, margin and nat are the
 * throw's roll; wh the thrower's Weapon handling (the slip's); feet the thrower's place [x, z]; door the doorway thrown through,
 * { axis, at, side } (its line, axis 'x' a line of constant z at `at`, and the room's side of it, +1 or −1).
 */
export function throwLand(state, pid, solve, { itemId = 'g', ok = true, margin = 0, nat = 0, wh = 10, area = state.places?.live?.area ?? null, feet = null, door = null } = {}) {
  const F = solve.flight, r = stream(state.meta?.seed ?? 0, 'arms:throw', pid, itemId), d = solve.dM;
  const from = [F.x0, F.z0];
  const across = (p) => (door.axis === 'x' ? p[1] : p[0]) - door.at, setAcross = (p, v) => (door.axis === 'x' ? [p[0], door.at + v] : [door.at + v, p[1]]);
  if (nat === 1 && wh < 10) {
    let p = [F.x0 + solve.ux * SLIP_M, F.z0 + solve.uz * SLIP_M];
    if (feet) { const dx = F.x0 - feet[0], dz = F.z0 - feet[1], n = Math.hypot(dx, dz) || 1; p = [feet[0] + dx / n * SLIP_M, feet[1] + dz / n * SLIP_M]; }
    if (door && across(p) * door.side > -SLIP_KEEP_M) p = setAcross(p, -door.side * SLIP_KEEP_M);
    return { x: r3(p[0]), z: r3(p[1]), aimX: null, aimZ: null, offM: null, wall: false, rollM: 0, atFeet: true };
  }
  const aimX = F.x0 + solve.ux * d, aimZ = F.z0 + solve.uz * d;
  // (the spin's residual: to the thrower's right by its side term, long or short by its up term)
  const side = (solve.bias?.sideCm ?? 0) / 100 * (solve.appliedCm && solve.bias?.cm ? solve.appliedCm / solve.bias.cm : 0);
  const along = (solve.bias?.upCm ?? 0) / 100 * (solve.appliedCm && solve.bias?.cm ? solve.appliedCm / solve.bias.cm : 0);
  const rx = -solve.uz, rz = solve.ux;
  const errM = ok ? next(r) * (0.5 + 0.03 * d) : 1 + 0.5 * Math.abs(margin) + 0.08 * d, ang = next(r) * 2 * Math.PI;
  let to = [aimX + rx * side + solve.ux * along + Math.cos(ang) * errM, aimZ + rz * side + solve.uz * along + Math.sin(ang) * errM];
  // (through a door, never back over its line: the error turned about it, BEYOND_M into the room at least)
  if (door && across(to) * door.side < BEYOND_M) to = setAcross(to, door.side * Math.max(Math.abs(across(to)), BEYOND_M));
  let wall = false;
  if (area && !lineClear(state, from, to, { area })) { to = clipped(state, from, to, { area }); wall = true; }
  // (the roll on: along the throw's heading, U(0.5, 2) × √(G0 / g) m, never through a wall)
  const g = Math.max(F.g, FREE_G_MS2), rollM = range(r, 0.5, 2) * Math.sqrt(G0_MS2 / g) * (wall ? 0.3 : 1);
  let end = [to[0] + solve.ux * rollM, to[1] + solve.uz * rollM];
  if (area && !lineClear(state, to, end, { area })) end = clipped(state, to, end, { area });
  return { x: r3(end[0]), z: r3(end[1]), aimX: r3(aimX), aimZ: r3(aimZ), offM: r3(Math.hypot(to[0] - aimX, to[1] - aimZ)), wall, rollM: r3(Math.hypot(end[0] - to[0], end[1] - to[1])), atFeet: false };
}

/** A flight's place at ms (for the picture): { x, y, z, landed }, the closed form from its fromMs to its landMs, then the landing point. */
export function flightAt(flight, ms) {
  if (!flight) return null;
  const t = Math.max(0, Math.min(ms, flight.landMs) - flight.fromMs) / 1000, landed = ms >= flight.landMs;
  if (landed) return { x: flight.x1, y: 0.05, z: flight.z1, landed };
  return { x: flight.x0 + flight.vx * t, y: Math.max(0.05, flight.y0 + flight.vy * t - 0.5 * flight.g * t * t), z: flight.z0 + flight.vz * t, landed };
}
