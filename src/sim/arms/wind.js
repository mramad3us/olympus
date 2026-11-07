// OLYMPUS arms: the wind on the range, as it truly blows, as the flags show it and as a shooter reads it (WEAPONS §7.4, §11.1; PLACES §4.12; the build sheet 0.0.7 §2.1, §8 items 5 and 6).
//
// **The truth** is a closed form of the world's seed, the time and the place, with no state (the build
// sheet §8 item 5, my call until PLACES's weather comes with the same windAt): so a string lived and the
// same string skipped feel the same wind, and nothing saves. The day's mean, WIND_MEAN_MS 2 to 6 m/s from
// a direction uniform round the compass, is drawn on stream('wind', seed, sol) (a morning breeze on the
// valley floor, under WEAPONS §11.1's afternoon 0 to 8 m/s); it drifts in strength by ±WIND_DRIFT_K 0.25
// over a period of WIND_DRIFT_S 600 to 1,500 s and veers by ±WIND_VEER_RAD 0.3 over 400 to 1,200 s (both
// drawn on the day's stream); and it gusts, gustK = 1 + GUST_K 0.35 × the mean of three sines of
// GUST_S 8.3, 17.9 and 37.1 s (their phases by the sol), each gust's phase lagged by the distance along
// the wind over the mean speed, so a gust walks down the range with the wind and the flags at 100 m
// intervals lift one after another. windAt(seed, ms, x, z) is that wind at a point: { towardRad (where it
// blows to, in the area's frame: x east, z south), speedMs, gustK }.
//
// **Across a shot**: crossOf(wind, bearingRad) is the component across a bearing, + pushing the round to
// the shooter's right (a wind from the left); pathWind() the mean of WIND_SAMPLES 5 points from the muzzle
// to the face at one moment (the round meets the wind all the way down), the across and the head
// components. flagOf() is a flag's heading and lift: its sleeve's FLAG_BANDS 5 bands fill one a FLAG_BAND_MS 1.5 m/s
// (a real sleeve's 3 knots a band), so it is limp under FLAG_LIMP_MS 1.5 and straight out from FLAG_FULL_MS 7.5,
// liftK the share filled (speed / FLAG_FULL_MS, 0 to 1): what the stage draws and what a shooter reads, two bands
// out at 3 m/s (the user's report of v0.0.7, 2026-11-07, that the sleeve did not match the coach's 3 m/s from the
// right: it was 0.5 and 8, a droop of (1 − liftK) × 80°, and the stage's to draw it so it reads; render/range-items.js).
//
// **The read** (WEAPONS §7.4: "we only know what we know"): readWind(state, pid, { atMs, bearingRad,
// coach }) is the shooter's belief of the crosswind, never the truth: the steady wind they watched over
// the last READ_AVG_S 10 s (the mean across the path at 1 s samples, gusts left out: nobody reads a
// gust), times 1 + e, e uniform within ±(1 − windCorr) on stream('judge', seed, pid, 'wind', atMs);
// windCorr = clamp((MRK − 6) / 24, 0, 0.8), + COACH_CORR 0.2 with a coach's call, at most CORR_CAP 0.95.
// The band is what the shooter knows of their own judgement: the read × (1 ± (1 − windCorr)). The coach
// reads with his own Marksmanship and the coach's bonus (his call is a read on his own sheet), at least
// COACH_MRK_MIN 14 (mrkMin: a range coach is a marksman; the code review's of v0.0.7, three seeds in forty drew a
// coach under it, whose call a MRK 14 player's own read beat). Its words (windWords) are the crosswind's, but a
// read with nothing across watched the flags too, and says what they do (flags): 'limp' only under FLAG_LIMP_MS of
// steady wind, 'front' or 'behind' when the wind along the path (steadyPath's headMs) stands them out on its own
// (FLAG_LIMP_MS or more), 'light' otherwise (the verifier's of the sleeve fix: "Flags are limp" said under a 3.6 m/s
// tailwind that stood every sleeve out, the user's report's own kind, flags against words). What the flags do is plain
// to see, so it is the truth's (the steady wind's); only the crosswind is judged.
// Pure.
import { stream, range } from '../../core/rng.js';
import { hash01 } from '../../core/hash.js';
import { SOL_MS } from '../../core/clock.js';
import { playerActor } from '../../core/ids.js';
import { rollerOf } from '../combat/roll.js';

/** The day's mean wind (m/s), drawn on the sol's stream (my call: a morning breeze). */
export const WIND_MEAN_MS = Object.freeze([2, 6]);
/** Its slow drift in strength (± share) and the drift's period (s); its veer (rad) and the veer's period (s). */
export const WIND_DRIFT_K = 0.25, WIND_DRIFT_S = Object.freeze([600, 1500]), WIND_VEER_RAD = 0.3, WIND_VEER_S = Object.freeze([400, 1200]);
/** The gusts: their depth (± share of the speed) and the three periods summed (s). */
export const GUST_K = 0.35, GUST_S = Object.freeze([8.3, 17.9, 37.1]);
/** The points along a path the wind is sampled at (the muzzle to the face). */
export const WIND_SAMPLES = 5;
/** A sleeve's bands, the wind that fills each (m/s: 3 knots), and so limp under one band and straight out with all five. */
export const FLAG_BANDS = 5, FLAG_BAND_MS = 1.5, FLAG_LIMP_MS = FLAG_BAND_MS, FLAG_FULL_MS = FLAG_BANDS * FLAG_BAND_MS;
/** A read watches the wind this long (s), sampled every READ_STEP_S. */
export const READ_AVG_S = 10, READ_STEP_S = 1;
/** WEAPONS §7.4's correction: the coach's bonus, the cap, the base's slope; the least Marksmanship a coach's call is made with. */
export const COACH_CORR = 0.2, CORR_CAP = 0.95, CORR_MAX_SELF = 0.8, COACH_MRK_MIN = 14;

const TAU = Math.PI * 2;
const dayOf = (seed, ms) => {
  const sol = Math.floor(ms / SOL_MS), r = stream('wind', seed, sol);
  return {
    sol, meanMs: range(r, WIND_MEAN_MS[0], WIND_MEAN_MS[1]), dirRad: range(r, -Math.PI, Math.PI),
    driftS: range(r, WIND_DRIFT_S[0], WIND_DRIFT_S[1]), driftPh: range(r, 0, TAU), veerS: range(r, WIND_VEER_S[0], WIND_VEER_S[1]), veerPh: range(r, 0, TAU),
  };
};
// (one sol's day record, the last asked: windAt is called a few dozen times a tick on the range, all on one sol)
let memo = { seed: null, sol: null, day: null };
function day(seed, ms) {
  const sol = Math.floor(ms / SOL_MS);
  if (memo.seed !== seed || memo.sol !== sol) memo = { seed, sol, day: dayOf(seed, ms) };
  return memo.day;
}

/** The steady wind and the gust at a point (see the header): { towardRad, speedMs, gustK }; gust false leaves the gust out (a read's). */
export function windAt(seed, ms, x = 0, z = 0, { gust = true } = {}) {
  const D = day(seed, ms), t = ms / 1000;
  const toward = D.dirRad + WIND_VEER_RAD * Math.sin(TAU * t / D.veerS + D.veerPh);
  const steady = D.meanMs * (1 + WIND_DRIFT_K * Math.sin(TAU * t / D.driftS + D.driftPh));
  let gustK = 1;
  if (gust) {
    // (the gust walks with the wind: its phase lagged by the distance along the day's direction over the mean speed)
    const along = x * Math.cos(D.dirRad) + z * Math.sin(D.dirRad), tl = t - along / Math.max(0.5, D.meanMs);
    let s = 0;
    for (let i = 0; i < GUST_S.length; i++) s += Math.sin(TAU * tl / GUST_S[i] + TAU * hash01('gust', seed, D.sol, i));
    gustK = 1 + GUST_K * s / GUST_S.length;
  }
  return { towardRad: wrapRad(toward), speedMs: Math.max(0, steady * gustK), gustK };
}
const wrapRad = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;

/** The wind's component across a bearing (m/s): + pushes the round to the shooter's right (a wind from the left). */
export const crossOf = (wind, bearingRad) => wind.speedMs * Math.sin(wind.towardRad - bearingRad);
/** The wind's component along a bearing against the shooter (m/s): + a headwind. */
export const headOf = (wind, bearingRad) => -wind.speedMs * Math.cos(wind.towardRad - bearingRad);

/** The wind across and along a path at one moment: the mean of WIND_SAMPLES points from the muzzle to the face ({ x, z } each). */
export function pathWind(seed, ms, from, to, { gust = true } = {}) {
  const b = Math.atan2(to.z - from.z, to.x - from.x);
  let c = 0, h = 0;
  for (let i = 0; i < WIND_SAMPLES; i++) {
    const k = (i + 0.5) / WIND_SAMPLES, w = windAt(seed, ms, from.x + k * (to.x - from.x), from.z + k * (to.z - from.z), { gust });
    c += crossOf(w, b); h += headOf(w, b);
  }
  return { crossMs: c / WIND_SAMPLES, headMs: h / WIND_SAMPLES };
}

/** A flag at a point (the stage's, through look.js): { towardRad (the way it blows to), liftK (the share of its bands filled, 0 limp to 1 straight out), speedMs }. */
export function flagOf(seed, ms, x, z) {
  const w = windAt(seed, ms, x, z);
  return { towardRad: w.towardRad, liftK: Math.max(0, Math.min(1, w.speedMs / FLAG_FULL_MS)), speedMs: w.speedMs };
}

/** The share of the crosswind a shooter's read corrects (WEAPONS §7.4): clamp((MRK − 6) / 24, 0, 0.8), + COACH_CORR with a coach's call, ≤ CORR_CAP. */
export const windCorrOf = (mrk, { coach = false } = {}) => Math.min(CORR_CAP, Math.max(0, Math.min(CORR_MAX_SELF, (mrk - 6) / 24)) + (coach ? COACH_CORR : 0));

/** The steady wind across and along a path averaged over the READ_AVG_S before atMs (gusts not in it): what a read watches, { crossMs, headMs } (+ a headwind). */
export function steadyPath(seed, atMs, from, to) {
  let c = 0, h = 0, n = 0;
  for (let s = READ_AVG_S; s > 0; s -= READ_STEP_S) { const p = pathWind(seed, atMs - s * 1000 + READ_STEP_S * 500, from, to, { gust: false }); c += p.crossMs; h += p.headMs; n++; }
  return { crossMs: c / n, headMs: h / n };
}
/** The steady crosswind alone (steadyPath's crossMs). */
export const steadyCross = (seed, atMs, from, to) => steadyPath(seed, atMs, from, to).crossMs;

const r1 = (v) => Math.round(v * 10) / 10;
/**
 * The wind in a shooter's words: its speed across (≈ 3 m/s, a breath of wind, still) and where it comes from. With
 * nothing across (under 0.5 m/s), what the flags do (see the header), given the wind along (headMs, + in the face) and
 * the steady speed (speedMs): flags 'limp' (under FLAG_LIMP_MS: "no wind to speak of"), 'front' or 'behind' (the wind
 * along stands them out), 'light' (they stir), the last three "nothing across"; null with a wind across.
 */
export function windWords(crossMs, headMs = 0, speedMs = Math.hypot(crossMs, headMs)) {
  const a = Math.abs(crossMs);
  const flags = a >= 0.5 ? null : speedMs < FLAG_LIMP_MS ? 'limp' : Math.abs(headMs) >= FLAG_LIMP_MS ? (headMs > 0 ? 'front' : 'behind') : 'light';
  const speedWord = a < 0.5 ? 'still' : a < 1.5 ? 'a breath of wind' : `≈ ${Math.round(a)} m/s`;
  const fromWord = flags === 'limp' ? 'no wind to speak of' : flags ? 'nothing across' : crossMs > 0 ? 'from the left' : 'from the right';
  return { speedWord, fromWord, flags };
}

/**
 * A shooter's read of the crosswind (see the header): { crossMs, band: [lo, hi], speedWord, fromWord, flags, atMs, corr }.
 * from: the shooter ({ x, z }; their actor by default), bearingRad the line to the face, rangeM its length (the
 * line's known distance on a KD line). Never the truth: the read drawn once for (pid, atMs).
 */
export function readWind(state, pid, { atMs = state.clock.ms, bearingRad = 0, coach = false, rangeM = 300, from = null, mrkMin = null } = {}) {
  const me = from ?? (playerActor(state)?.who === pid ? playerActor(state) : state.actors?.list?.find(a => a.who === pid)) ?? { x: 0, z: 0 };
  const to = { x: me.x + Math.cos(bearingRad) * rangeM, z: me.z + Math.sin(bearingRad) * rangeM };
  const { crossMs: truth, headMs } = steadyPath(state.meta.seed, atMs, me, to);
  const mrk = Math.max(mrkMin ?? -Infinity, rollerOf(state, pid, { ms: atMs }).value('marksmanship')), corr = windCorrOf(mrk, { coach });
  const e = range(stream('judge', state.meta.seed, pid, 'wind', atMs), -(1 - corr), 1 - corr);
  const est = truth * (1 + e), lo = est * corr, hi = est * (2 - corr);
  return { crossMs: r1(est), band: [r1(Math.min(lo, hi)), r1(Math.max(lo, hi))], ...windWords(est, headMs, Math.hypot(truth, headMs)), atMs, corr };
}
