// OLYMPUS audio: when a foot falls and what it sounds like, the pure half of the footsteps (no WebAudio here).
//
// A foot falls where the drawn figure's foot does (the hub: visuals obey the sim, and so does the
// sound). The figure picks its gait frame from the metres walked (src/art/figures/poses.js
// gaitFrame: STEP_M a frame, four frames a cycle, the walk's 0.64 m and the run's 1.8 m), and its
// frames 0 and 2 are the two contacts, so a foot falls each time the stride crosses a whole half
// cycle: every 0.32 m walking or strolling (the stroll draws the walk's frames), 0.9 m running,
// 1.4 m bounding (the low-g run below 0.3 G: src/sim/places/move.js gaitOf). The cadence is the gait's
// speed over these, so it follows the place's gravity with the speed (src/sim/body/motion.js gaitSpeeds: a
// walk's 3.56 foot-falls a second at Melas, 4.53 at 1 G; a bound's 1.41 at Europa's 1.97 m/s); a 'float'
// (under 0.05 G) has no feet on anything and schedules none (VIEWS §11's "zero g, no steps"), however far
// it goes. STRIDE_WRAP_M (201.6 m, where actor.strideM wraps) is a whole number of every
// half cycle (630, 224, 144), so a wrap never adds or loses a foot-fall. footfalls(prev, now, gait)
// gives the fractions of the way from prev to now at which they fall.
//
// The scheduler (createStepScheduler) turns the frames into foot-falls with times. The view draws
// the player between the last tick's start and end by alpha (src/render/view.js: from $px to x), so
// the drawn stride at a frame is the tick's start stride plus alpha of its step, and a threshold c
// inside the last tick is drawn at the moment alpha reaches (c − start) / step: nowS + (that − alpha)
// × the tick's real length. That is up to a tick (50 ms) ahead of the frame, which is the scheduling
// look-ahead the picture itself gives, with no guessing: a foot-fall is scheduled only once the sim
// has stepped past it, so stopping never leaves a step that was not taken. It keeps doneM, the
// unwrapped stride up to which foot-falls are scheduled, and moves it only forward, so no foot-fall
// is scheduled twice or skipped whatever the frames' lengths; a crossing more than LOOKAHEAD_S late
// (a stalled frame, a hidden tab) is dropped and counted rather than played in a burst. While the
// game is not live (paused, time standing still, a skip, the sound not started) it schedules nothing
// and keeps doneM on the stride, so nothing bursts out when play goes on; a jump in the stride of
// more than RESYNC_M (a load, a debug move) is taken as a new start.
//
// stepVoice(surface, gait, { gG, pKpa }) is what the foot-fall sounds like (gG and pKpa the place's,
// src/sim/places/env.js's, required: TECH §1.4; lowpassHz refuses a pressure that is not a number, so no
// voice in the audio plays in an assumed air): the surface PLACES names under the
// feet (places/model.js surfaceAt) as one of three recipes (tile and vinyl tick, concrete, paving
// and stairs slap, regolith crunches: src/data/sounds.js), and its level and filter by the physics,
// against the same step on Earth: the weight on the foot, VIEWS §11.3's 10 log10(g / 9.81) at the place's
// gravity (src/sim/places/env.js gravityAt: +4.8 dB at 3 G; no weight, no sound: −Infinity, never played) (−4.2 dB
// at 0.38 G), plus the air's PEOPLE §7.3 law, airDb(P) = 10 log10(P / 101.3) (−1.9 dB in Melas's
// 65.9 kPa: the one air law, which replaces VIEWS §11.2's −3.7 dB, build sheet 0.0.3 §8 item 16),
// plus the gait's own (src/data/sounds.js GAIT_DB): −6.1 dB walking at Melas; and low-passed at
// VIEWS §11.2's 8 kHz × P / 101.3, 5,204 Hz at 65.9 kPa (5,212 Hz in a building's 66.0).
import { STEP_M } from '../../art/figures/poses.js';
import { STRIDE_WRAP_M } from '../../data/body/gait.js';
import { airDb } from '../../sim/people/hearing.js';
import { GAIT_DB, SURFACE_STEP, LOOKAHEAD_S, LOWPASS_REF_HZ, LOWPASS_REF_KPA } from '../../data/sounds.js';

/** The metres between foot-falls by gait: half the four-frame cycle (the stroll draws the walk's frames). */
export const HALF_CYCLE_M = Object.freeze({ walk: 2 * STEP_M.walk, stroll: 2 * STEP_M.walk, run: 2 * STEP_M.run, bound: 2 * STEP_M.bound });
/** A stride that moves further than this between frames is a new start, not a walk (metres). */
export const RESYNC_M = 3;
/** The gaits whose feet touch nothing: no foot-falls (the float under 0.05 G). */
export const NO_FEET = Object.freeze(['float']);
const EPS = 1e-7;

/** The weight on the foot, in dB against Earth's 1 G: 10 log10(g / 9.81) (VIEWS §11.3; −4.2 dB at 0.38 G). */
export const weightDb = (gG) => (gG > 0 ? 10 * Math.log10(gG) : -Infinity);
/** VIEWS §11.2's air filter: the low-pass corner at a pressure (the place's, required), in whole Hz. */
export function lowpassHz(pKpa) {
  if (!Number.isFinite(pKpa)) throw new Error(`audio: the place's air pressure (src/sim/places/env.js airAt), not ${pKpa}`);
  return Math.round((LOWPASS_REF_HZ * pKpa) / LOWPASS_REF_KPA);
}

// (whole half cycles up to a stride: a threshold met exactly belongs to the stride that reaches it)
const halves = (m, half) => Math.floor(m / half + EPS);

/**
 * The foot-falls between two strides (metres, as actor.strideM: a wrap at STRIDE_WRAP_M undone) for a
 * gait: the fractions of the way from prevStrideM to strideM, in (0, 1], at which a foot falls.
 */
export function footfalls(prevStrideM, strideM, gait) {
  const half = HALF_CYCLE_M[gait];
  if (!half) return [];
  let to = strideM;
  if (to < prevStrideM) to += STRIDE_WRAP_M;
  const span = to - prevStrideM;
  if (!(span > 0)) return [];
  const out = [];
  for (let k = halves(prevStrideM, half) + 1, n = halves(to, half); k <= n; k++) out.push(Math.min(1, Math.max(0, (k * half - prevStrideM) / span)));
  return out;
}

/**
 * What a foot-fall sounds like: { kind ('tile' | 'concrete' | 'regolith'), gainDb (against the same
 * step on Earth at 1 G), lowpassHz, weightDb, airDb, gaitDb }. gG the site's gravity, pKpa the air.
 */
export function stepVoice(surface, gait, { gG, pKpa } = {}) {
  if (!Number.isFinite(gG)) throw new Error(`stepVoice(): the place's gravity in G, not ${gG}`);
  const kind = SURFACE_STEP[surface] ?? 'concrete';
  const w = weightDb(gG), a = airDb(pKpa), g = GAIT_DB[gait] ?? 0;
  return { kind, gainDb: Math.round((w + a + g) * 100) / 100, lowpassHz: lowpassHz(pKpa), weightDb: Math.round(w * 100) / 100, airDb: Math.round(a * 100) / 100, gaitDb: g };
}

/**
 * The footsteps' scheduler: frame({ strideM, stepM, gait, alpha, nowS, tickS, live }) → the foot-falls
 * to play, [{ atS (real seconds, on nowS's clock), m (the unwrapped stride it falls at), n (its whole
 * half cycle: n mod 2 is the foot), gait (the last moving tick's, whose frames are drawn) }]. strideM is the player's actor's (the last tick's end), stepM the
 * metres it moved in that tick (|x − $px|, as the view reads it), alpha the loop's, tickS the tick's
 * real length, live false while the game is not running. stats: { scheduled, dropped, resyncs }.
 */
export function createStepScheduler({ lookaheadS = LOOKAHEAD_S, jumpM = 1.5 } = {}) {
  let doneM = null, lastRaw = null, wraps = 0, moving = 'walk';
  const stats = { scheduled: 0, dropped: 0, resyncs: 0 };
  return {
    frame({ strideM = 0, stepM = 0, gait = 'idle', alpha = 0, nowS = 0, tickS = 0.05, live = true }) {
      const raw = strideM ?? 0;
      if (lastRaw !== null && raw < lastRaw - STRIDE_WRAP_M / 2) wraps++;
      lastRaw = raw;
      const u = raw + wraps * STRIDE_WRAP_M;
      if (doneM === null || !live || u < doneM || u - doneM > RESYNC_M) {
        if (doneM !== null && live) stats.resyncs++;
        doneM = u;
        return [];
      }
      if (NO_FEET.includes(gait)) { doneM = u; return []; }      // (floating: the stride moves, the feet do not fall)
      if (HALF_CYCLE_M[gait]) moving = gait;
      if (u === doneM) return [];
      // (the gait of the last tick that moved: its frames are the ones drawn, even if the feet stopped since)
      const half = HALF_CYCLE_M[moving];
      // (a jump, the view's JUMP_M, is drawn at once: its foot-falls are now)
      const step = stepM > 0 && stepM <= jumpM ? stepM : 0;
      const s0 = u - step, out = [];
      for (let k = halves(doneM, half) + 1, n = halves(u, half); k <= n; k++) {
        const m = k * half;
        // (inside the last tick: drawn when alpha reaches its place in the step; before it (a tick
        // earlier in this frame, or a frame missed): as far back as the walk's own pace puts it)
        const a = step > 0 ? (m - s0) / step : alpha;
        const atS = nowS + (a - alpha) * tickS;
        if (atS < nowS - lookaheadS) { stats.dropped++; continue; }
        out.push({ atS, m, n: k, gait: moving });
        stats.scheduled++;
      }
      doneM = u;
      return out;
    },
    /** Forget where the feet were (a new game, a load): the next frame starts afresh. */
    reset() { doneM = null; lastRaw = null; wraps = 0; moving = 'walk'; },
    get doneM() { return doneM; },
    stats,
  };
}
