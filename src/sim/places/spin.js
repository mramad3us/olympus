// OLYMPUS places: the spin's closed forms, a body's Coriolis push and a round's spin bias on a spun floor (PLACES §3.11, §4.15; COMBAT §25.10.4; WEAPONS §2.9; the build sheet 0.0.12 §2.1, §4).
//
// The one home of the spin's physics (SPIN_HOME): no other module defines ω or a Coriolis term. R and ω are
// data, read from the place's gravity (src/sim/places/env.js gravityAt(state, area).spin: the area's record, the
// Wheel's `melas.wheel.*` sectors, or a scene's preset), never written here or anywhere else.
//
// The frame. An area on a spun floor keeps x along the spin, prograde (the direction the floor moves, `alongRad`
// 0 for the Wheel's sectors: east), z across the band, +z outboard (south on the Wheel's sectors: the side of the
// band farther from the hub), y the felt up. The felt down is the vector sum of the spin's centripetal part and
// the body's own pull, so the floor is banked: the across-band direction has a radial share, acrossK = g_body /
// g_felt (Mars's 0.38 under the Wheel's 1 G, 67.7° of bank; 0 on a station in free space, whose floor is not
// banked), and the vertical keeps cosK = √(1 − acrossK²) of the radial (0.925).
//
// The Coriolis acceleration in the floor's frame is −2ω × v, ω along the hub's axis. Worked on the banked floor
// (spin.py's inertial check, /private/tmp/claude-501/olympus-build/1g/spin.py, 2026-11-08): a velocity v_along
// (prograde) is pushed radially outward by 2ω v_along, which is cosK of it down (heavier prograde, lighter
// retrograde) and acrossK of it outboard; a velocity v_across (outboard) is pushed retrograde by 2ω v_across ×
// acrossK, its axial share being parallel to ω and pushing nothing.
//   bodyPushOf(spin, { vx, vz }) gives a mover's push: alongK = 2ω v_along / G0 (the sheet's share of a body's
//     weight along the spin: 3.4% at the Combat walk of 1.23 m/s, 5.6% at the Assault walk of 2.03), acrossK =
//     2ω v_across × acrossK / G0 (2.1% at 2.03 m/s), weightK the felt weight's change (alongK × cosK, + heavier),
//     and pushMs2, the whole push as a vector in the area's frame. It is said, not applied to the stride
//     (the build sheet 0.0.12 §8 item 16: under 6% at a walk).
//   spinBiasCm(spin, { rangeM, vMs, bearingRad }) gives a round's offset from the felt-gravity path a flat floor
//     would give, after rangeM at vMs: the whole offset ω d² / v (frangible at 790 m/s 0.15, 0.43, 0.84 and
//     1.71 cm at 3, 5, 7 and 10 m; a marking round at 120 m/s 2.8 cm at 5 m), of which upCm is −cosK × cos(b)
//     (b the bearing from prograde: low prograde, high retrograde, none across) and sideCm acrossK of it, always
//     to the shooter's right on this frame (0.65 cm at 10 m), whatever the bearing (the radial push's across
//     share for fire along the spin, the tangential push for fire across it: the same size, the same side).
//     WEAPONS §2.9 enters it as the round's spin bias, moving the hole and not the odds (§8 item 16).
// spinOf(state, area) is the place's spin read from its gravity: { omegaRadS, radiusM, alongRad, acrossK,
// cosK, gMs2 } or null where the gravity's regime is not 'spin' or names no ω (a drum preset that gives only its
// felt G). Results are rounded (TECH §8.1 rule 11): pushes to 1e-6 of a G and 1e-4 m/s², offsets to 0.01 cm.
// Pure.
import { G0_MS2 } from '../../core/phys.js';
import { q } from '../../core/num.js';
import { BODIES } from '../../data/places/env.js';
import { gravityAt, envAt } from './env.js';

/** A share of a body's weight is kept to this; a push in m/s² to PUSH_STEP_MS2; an offset in cm to BIAS_STEP_CM. */
export const K_STEP = 1e-6, PUSH_STEP_MS2 = 1e-4, BIAS_STEP_CM = 0.01;

/**
 * The place's spin (see the header): { omegaRadS, radiusM, alongRad, acrossK, cosK, gMs2 }, or null where it does
 * not spin. Throws for a spin record whose ω or R is not a positive number (TECH §1.4: no quiet default).
 */
export function spinOf(state, area = null) {
  const g = gravityAt(state, area);
  if (g.regime !== 'spin' || !g.spin) return null;
  const { omegaRadS, radiusM, alongRad = 0 } = g.spin;
  if (!(omegaRadS > 0) || !(radiusM > 0)) throw new Error(`spin: the place's spin needs a positive ω and R, not ${JSON.stringify(g.spin)}`);
  const body = BODIES[envAt(state, area).body];
  if (!body) throw new Error(`spin: the place names no known body ('${envAt(state, area).body}')`);
  const acrossK = g.gG > 0 ? Math.min(1, body.gG / g.gG) : 0;
  return Object.freeze({ omegaRadS, radiusM, alongRad, acrossK: q(acrossK, K_STEP), cosK: q(Math.sqrt(1 - acrossK * acrossK), K_STEP), gMs2: g.gMs2 });
}

/** A spin record made from numbers, for the tests and the tables (the Ring's R 45 m beside the Wheel's): ω, R, the bank's acrossK, alongRad. */
export function spinFrom({ omegaRadS, radiusM, acrossK, alongRad = 0 }) {
  return Object.freeze({ omegaRadS, radiusM, alongRad, acrossK: q(acrossK, K_STEP), cosK: q(Math.sqrt(1 - acrossK * acrossK), K_STEP), gMs2: null });
}

// (a velocity's parts along the spin and outboard across the band, on the area's frame turned by alongRad)
function parts(spin, vx, vz) {
  const c = Math.cos(spin.alongRad), s = Math.sin(spin.alongRad);
  return { along: vx * c + vz * s, across: -vx * s + vz * c, c, s };
}

/**
 * A mover's Coriolis push on the spun floor (see the header): { alongK, acrossK, weightK, pushMs2: { x, y, z } }.
 * alongK and weightK are + heavier (prograde), acrossK + retrograde (moving outboard); pushMs2 in the area's frame,
 * y the felt up (negative: pressed down).
 */
export function bodyPushOf(spin, { vx = 0, vz = 0 } = {}) {
  if (!spin) return { alongK: 0, acrossK: 0, weightK: 0, pushMs2: { x: 0, y: 0, z: 0 } };
  const w2 = 2 * spin.omegaRadS, v = parts(spin, vx, vz), S = spin.acrossK, C = spin.cosK;
  const radial = w2 * v.along, tangential = -w2 * v.across * S;                 // (outward, prograde: m/s²)
  // (outward = cosK down + acrossK outboard; outboard is the area's (−sin α, cos α), prograde (cos α, sin α))
  const x = radial * S * -v.s + tangential * v.c, z = radial * S * v.c + tangential * v.s, y = -radial * C;
  return {
    alongK: q(radial / G0_MS2, K_STEP), acrossK: q(-tangential / G0_MS2, K_STEP), weightK: q(radial * C / G0_MS2, K_STEP),
    pushMs2: { x: q(x, PUSH_STEP_MS2), y: q(y, PUSH_STEP_MS2), z: q(z, PUSH_STEP_MS2) },
  };
}

/**
 * A round's spin bias after rangeM at vMs, fired on bearingRad (the area's heading: 0 +x, π/2 +z): { cm (the whole
 * offset ω d² / v), upCm (+ high), sideCm (+ to the shooter's right) }, in centimetres (see the header).
 */
export function spinBiasCm(spin, { rangeM, vMs, bearingRad = 0 }) {
  if (!spin) return { cm: 0, upCm: 0, sideCm: 0 };
  if (!(vMs > 0) || !(rangeM >= 0)) throw new Error(`spin: a round's bias needs its range and speed, not ${rangeM} m at ${vMs} m/s`);
  const whole = spin.omegaRadS * rangeM * rangeM / vMs * 100, b = bearingRad - spin.alongRad;
  return { cm: q(whole, BIAS_STEP_CM), upCm: q(-whole * spin.cosK * Math.cos(b), BIAS_STEP_CM), sideCm: q(whole * spin.acrossK, BIAS_STEP_CM) };
}

/** The words of the spin's bias for a sheet or a plaque: 'The Wheel puts a round 1.6 cm low at 10 m along the spin.' (low prograde, high retrograde). */
export function spinWords(spin, { rangeM = 10, vMs, bearingRad = 0, where = 'The Wheel' } = {}) {
  const B = spinBiasCm(spin, { rangeM, vMs, bearingRad });
  if (!B.cm) return '';
  const ud = Math.abs(B.upCm) >= BIAS_STEP_CM ? `${Math.abs(B.upCm).toFixed(1)} cm ${B.upCm < 0 ? 'low' : 'high'}` : 'level';
  return `${where} puts a round ${ud} and ${B.sideCm.toFixed(1)} cm right at ${rangeM} m.`;
}
