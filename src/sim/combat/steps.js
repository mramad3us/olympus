// OLYMPUS sim: COMBAT's own steps this round, the stances and the wait, with their times in the place's gravity (COMBAT §3.3, §3.4; the build sheet 0.0.5 §2.2, §4).
//
// A step's base time is at value 10 (pace 1.00) and scales with SKILLS' paceOf on its skill; the
// stances go by Fitness and roll nothing (COMBAT §3.4's table). Getting down is slow in low g, since
// the body falls only as fast as the gravity lets it: stand to prone max(900 ms, tFall(1.0 m) + 300),
// kneel to prone max(600, tFall(0.5 m) + 300), tFall(h) = √(2h / g), g = gG × G0 (src/core/phys.js; on
// Mars, 0.38 G: 1,033 and 818 ms; gG is the place's, src/sim/places/env.js gravityAt, and required); kneeling and rising from a kneel 500 ms each, rising from prone 1,300 (to a
// kneel 1,000): the in-between stances are my calls. Under the float band's 0.05 G (src/data/body/needs.js
// GAIT_G) nothing falls: getting down is an orientation and anchor change (COMBAT §14.8: the body pulled
// round to the face and held there), timed as the slowest fall, the one at the band's edge (stand to prone
// 2,321 ms, kneel to prone 1,729 at pace 1.001), so the time is finite at 0 G, continuous across the band
// and never shorter as the gravity falls (ROADMAP "anywhere" step 2, my call until free-fall motion).
// stanceMs(from, to, { gG, fitness }) is the time
// of one change, the one helper the step panel, the stop motion and the bots read. A stance step
// writes actor.stance ('kneel' | 'prone', absent standing) at its end (src/sim/arms/shooting.js).
// STEP_LONG_MS 1,000 is COMBAT §3.3's interruptible step; WAIT_MAX_MS 15,000 the longest wait (the
// chained wait after the tower's command is done, the build sheet §8 item 16).
// Pure.
import { G0_MS2 } from '../../core/phys.js';
import { GAIT_G } from '../../data/body/needs.js';
import { paceOf } from '../skills/skills.js';

/** The stances, standing first. */
export const STANCES = Object.freeze(['stand', 'kneel', 'prone']);
/** A step longer than this is interruptible (COMBAT §3.3), ms. */
export const STEP_LONG_MS = 1_000;
/** The longest wait a step may chain (the build sheet §8 item 16), ms. */
export const WAIT_MAX_MS = 15_000;
/** The flat parts of the stance changes (COMBAT §3.4), ms at pace 1; getting down adds the fall. */
export const STANCE_BASE_MS = Object.freeze({ 'stand>kneel': 500, 'kneel>stand': 500, 'prone>kneel': 1000, 'prone>stand': 1300 });
/** Getting down: the least time, the height fallen (m), the push after the fall (ms). */
export const DOWN = Object.freeze({ 'stand>prone': Object.freeze({ minMs: 900, fallM: 1.0, pushMs: 300 }), 'kneel>prone': Object.freeze({ minMs: 600, fallM: 0.5, pushMs: 300 }) });

/** The time to fall h metres from rest at gG (the place's, required), ms: Infinity at 0 G (stanceBaseMs never asks it there). */
export function tFallMs(hM, gG) {
  if (!Number.isFinite(gG)) throw new Error(`tFallMs(): the place's gravity in G, not ${gG}`);
  return Math.sqrt(2 * hM / (gG * G0_MS2)) * 1000;
}

/** A stance change's time at pace 1 (ms, unrounded): 0 for none. */
export function stanceBaseMs(from = 'stand', to = 'stand', gG) {
  if (from === to) return 0;
  const key = `${from}>${to}`, d = DOWN[key];
  if (d) {
    if (!Number.isFinite(gG)) throw new Error(`stanceBaseMs(): the place's gravity in G, not ${gG}`);
    return Math.max(d.minMs, tFallMs(d.fallM, Math.max(gG, GAIT_G.FLOAT_BELOW_G)) + d.pushMs);       // (under the float band: an orientation change, see the header)
  }
  return STANCE_BASE_MS[key] ?? 0;
}

/** A stance change's time (see the header), ms: × paceOf(Fitness). gG the place's gravity (required). */
export const stanceMs = (from, to, { gG, fitness = 10 } = {}) => Math.round(stanceBaseMs(from, to, gG) * paceOf(fitness));

/** The stance a notch up or down from one ('down' from standing kneels, from kneeling lies prone). */
export function stanceStep(from = 'stand', dir = 'down') {
  const i = STANCES.indexOf(from), j = Math.max(0, Math.min(STANCES.length - 1, i + (dir === 'down' ? 1 : -1)));
  return STANCES[j];
}
