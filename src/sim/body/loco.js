// OLYMPUS body: the locomotion record, the one plain record every moving body reports and the view draws from (BODY §16.8; VIEWS §3.10.1; the shoot house rework's stage R2).
//
// The user, scoring v0.0.12: "saying that the walking about is goofy is an understatement, the animation is really not
// there yet." The sim side of the cure: whatever moves a body (places/move.js for the keys and the drill's closed forms,
// combat/bundle.js runSlot for the #2, the instructor's catwalk walk, the range's coach and corpsman) reports the same
// fields, and the view reads only them ("visuals obey the sim"). The #2 in v0.0.12 reported nothing: idle on all 496 of
// his moving ticks, his drawn place a 20 Hz sawtooth.
//
// The record, on the actor (runtime fields `$`, stripped from saves):
//   - `$px`, `$pz`: where the body was at the tick's start, set before anything moves it (tickStart for the player, at the
//     tick's first layer, so a beat ended in the input layer moves the tween's end and not its start; the movers' own
//     layers for the rest: moverStart);
//   - `gait` ('idle' when the body did not move this tick, else 'walk', 'run', 'stroll', 'bound', 'float'), `strideM` (the
//     metres walked on src/data/body/gait.js STRIDE_WRAP_M's ring, the footfalls' and today's frames'), `moveStance`;
//   - `v`, the velocity [vx, vz] m/s (BODY §16.2), kept only while it moves;
//   - `gp`, the gait phase in steps (src/data/body/gait.js GP_WRAP), advanced by the metres moved over the band's step
//     (stepMOf: the cycle's planted travel plus the flight's metres), and **kept across a band change** (Combat to
//     Assault, the walk to the lope), so the same foot stays forward; absent read as 0;
//   - `bodyRad`, the body's yaw, which the facing is drawn from (VIEWS §3.10.6): toward the muzzle when the rifle is in
//     the hands, toward the travel otherwise, turned at most 90° in turnSOf(pace) (0.25 s at the fastest pace, 0.4 s at
//     pace 1, my calls); the eyes (`headRad`) may snap, the body follows (TC 3-22.9 §9-12); absent read as the head's;
//   - `locoMs`, the game time the body's place is for (saved, set by the stance moves: places/move.js, combat/bundle.js):
//     a move begun at the tick's time from a body last placed a tick before first coasts it there (the brake, BODY §16.2),
//     and the free body's brake integrates from it, never a fixed tick from a place set mid-tick (the cure for v0.0.12's
//     dead ticks: the body still for one tick at every change of row, 2.03 m/s to 0 and back, 7 times a lane).
// The saved phase `gp` is always counted in the game's cycle (src/data/body/gait.js CYCLE, B), so a save carries the
// default's numbers whichever cycle the page played. A page that plays another (state.$cycle: the R8 flag `&cycle=A|B|C`,
// src/core/debug.js; runtime only) also counts `$gp`, the same metres in that candidate's steps, which the view draws, so
// the planted foot never slides whichever is played (VIEWS §3.10.4; the code review of 2026-11-13: gp was counted in the
// flag's steps, so a save made with &cycle=A replayed in node with other bytes).
// No `SAVE_SCHEMA` bump: the fields are additive and only a body that moves writes them, so every scene's start keeps its
// bytes (BODY §16.8 asked upgradeState to fill gp 0 and bodyRad from headRad; read absent as those instead, a save made
// before and one made after carry on alike: my call).
// Pure but tickStart, moverStart and locoStep, which write the actor's record.
import { q } from '../../core/num.js';
import { TICK_MS } from '../../core/clock.js';
import { playerActor } from '../../core/ids.js';
import { paceOf } from '../skills/skills.js';
import { valueOf } from '../skills/templates.js';
import { gravityAt } from '../places/env.js';
import { STRIDE_WRAP_M, GP_WRAP, CYCLE, STEP_PX, STEP_PPM, LOPE_FROUDE, LOPE_VZ_MS, RUN_VZ_MS, LEG_K, REF_HEIGHT_M, TURN_OPERATOR_S, TURN_RECRUIT_S } from '../../data/body/gait.js';

const POS_STEP_M = 0.0001, GP_STEP = 1e-6, RAD_STEP = 1e-6, G_MIN_MS2 = 0.05;
const wrapRad = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
/** The pace paceOf gives at its fastest (src/sim/skills/skills.js's floor), where the body turns in TURN_OPERATOR_S. */
export const FASTEST_K = 0.45;

/** The band a gait's phase is counted in: { band ('walk' | 'combat' | 'assault' | 'run' | null in a float or idle), flight (s, 0 without), stepM (m) }. */
export function stepMOf({ gait, stance = null, vMs = 0, gMs2 = 9.81, legM = LEG_K * REF_HEIGHT_M, cycle = CYCLE }) {
  if (!gait || gait === 'idle' || gait === 'float') return { band: null, flight: 0, stepM: 0 };
  const S = STEP_PX[cycle] ?? STEP_PX[CYCLE], g = Math.max(G_MIN_MS2, gMs2);
  const run = gait === 'run' || gait === 'bound';
  const band = run ? 'run' : stance === 'assault' ? 'assault' : stance === 'combat' ? 'combat' : 'walk';
  // (flight from physics, not from a picture: the run always flies, a walk-type gait from Froude LOPE_FROUDE)
  const vz = run ? RUN_VZ_MS : (vMs * vMs) / (g * legM) >= LOPE_FROUDE ? LOPE_VZ_MS : 0;
  const flight = (2 * vz) / g;
  return { band, flight, stepM: S[band] / STEP_PPM + Math.max(0, vMs) * flight };
}

/** The walk cycle the page draws: the page's (state.$cycle, the R8 flag `&cycle=A|B|C`, runtime only, never saved), else src/data/body/gait.js CYCLE. The saved gp is counted in CYCLE whatever it is. */
export const cycleOf = (state) => (STEP_PX[state?.$cycle] ? state.$cycle : CYCLE);

/** The time the body takes to turn 90° at a pace (s): TURN_RECRUIT_S at pace 1, TURN_OPERATOR_S at the fastest, linear between and beyond (BODY §16.8). */
export const turnSOf = (k) => TURN_OPERATOR_S + (TURN_RECRUIT_S - TURN_OPERATOR_S) * ((k ?? 1) - FASTEST_K) / (1 - FASTEST_K);

/** The leg a person's Froude number is read with (m): LEG_K of the height. */
export function legMOf(state, pid) {
  const h = state?.people?.[pid]?.body?.heightM;
  return LEG_K * (Number.isFinite(h) ? h : REF_HEIGHT_M);
}

/** The body's yaw now (rad): its record's, else the head's, else the four-way face's. */
export function bodyRadOf(a) {
  if (Number.isFinite(a?.bodyRad)) return a.bodyRad;
  if (Number.isFinite(a?.headRad)) return a.headRad;
  return { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[a?.face] ?? Math.PI / 2;
}
/** The gait phase now (steps): its record's, else 0; for a cycle other than CYCLE, the runtime phase in its steps ($gp), else 0. */
export const gpOf = (a, cycle = CYCLE) => (cycle === CYCLE ? (Number.isFinite(a?.gp) ? a.gp : 0) : Number.isFinite(a?.$gp) ? a.$gp : 0);

/** Whether a person holds the rifle in the hands (on the sling and in a posture that is not slung: arms/carry.js's postures), the body then turning to the muzzle. */
export function inHandOf(state, pid) {
  const k = state?.people?.[pid]?.kit, p = k?.carry?.posture;
  return !!k?.worn?.sling && !!p && p !== 'slungFront' && p !== 'slungBack';
}

/** The player's tween start for the tick (see the header): the body's place at the tick's start, before the input layer moves it. */
export function tickStart(state) {
  const a = playerActor(state);
  if (a) { a.$px = a.x; a.$pz = a.z; }
}
/** A mover's tween start, from its own layer before it moves (the #2, the instructor, the coach). */
export function moverStart(a) {
  if (a) { a.$px = a.x; a.$pz = a.z; }
}

/**
 * A body's record after its move this tick (see the header): from (x0, z0) to where it stands now. opts: gait (the pace
 * drawn when it moved: 'walk' default), stance (the movement stance), vMs (the speed for the band's flight; else the
 * metres over the tick), inHand (the rifle in the hands: the body turns to the muzzle, a.headRad; inHandOf's if not given), dtS (the tick), and
 * state with pid for the gravity, the leg and the pace (each optional). Returns the metres moved.
 */
export function locoStep(a, x0, z0, { state = null, pid = a?.who ?? null, gait = 'walk', stance = a?.moveStance ?? null, vMs = null, inHand = null, dtS = TICK_MS / 1000, stride = true } = {}) {
  if (!a) return 0;
  const dx = a.x - x0, dz = a.z - z0, moved = q(Math.hypot(dx, dz), POS_STEP_M);
  const moving = moved > 1e-9;
  a.gait = moving ? gait : 'idle';
  if (moving && stride) a.strideM = q(((a.strideM ?? 0) + moved) % STRIDE_WRAP_M, POS_STEP_M);
  if (moving) {
    const gMs2 = state ? gravityAt(state, null, a.x, a.z).gMs2 : 9.81, legM = state && pid ? legMOf(state, pid) : LEG_K * REF_HEIGHT_M;
    const v = Number.isFinite(vMs) && vMs > 0 ? vMs : moved / Math.max(1e-3, dtS);
    const s = stepMOf({ gait, stance, vMs: v, gMs2, legM, cycle: CYCLE });
    if (s.stepM > 0) a.gp = q(((gpOf(a) + moved / s.stepM) % GP_WRAP + GP_WRAP) % GP_WRAP, GP_STEP);
    // (the page's other cycle: its own phase, runtime only (see the header))
    const c = cycleOf(state);
    if (c !== CYCLE) {
      const sc = stepMOf({ gait, stance, vMs: v, gMs2, legM, cycle: c });
      if (sc.stepM > 0) a.$gp = q(((gpOf(a, c) + moved / sc.stepM) % GP_WRAP + GP_WRAP) % GP_WRAP, GP_STEP);
    }
  }
  // (the body's yaw: to the muzzle with the rifle in the hands, else to the travel; at most 90° in turnSOf)
  const held = inHand ?? (state && pid ? inHandOf(state, pid) : false);
  const want = held && Number.isFinite(a.headRad) ? a.headRad : moving ? Math.atan2(dz, dx) : null;
  if (want !== null) {
    const k = state && pid ? paceOf(valueOf(state, pid, 'weapons')) : 1;
    const max = (Math.PI / 2) * dtS / Math.max(0.05, turnSOf(k)), now = bodyRadOf(a), d = wrapRad(want - now);
    const to = Math.abs(d) <= max ? want : now + Math.sign(d) * max;
    const b = q(wrapRad(to), RAD_STEP);
    if (b !== a.bodyRad) a.bodyRad = b;
  }
  return moved;
}
