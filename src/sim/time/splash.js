// OLYMPUS sim: the splash's timing, how long the time-lapse of a skip lasts in real seconds and how the shown clock moves through it (TIME §6.2, §6.5; the build sheet 0.0.4 §2.2.5).
//
// The hud drives the splash with these numbers and the stage draws to them; nothing here touches the
// game. A skip of a planned gap of m minutes plays (TIME §6.2):
//   full form (a gap of FULL_FROM_MS, 3 minutes, or more): the zoom in SPLASH_IN_S 0.4 s (the clock
//         does not move yet), the time-lapse lapseS(m) = clamp(1.4 + 0.95 ln(1 + m/4), 1.6, 8.0) s,
//         the outcome strip SPLASH_HOLD_S 0.8 s, the zoom out SPLASH_OUT_S 0.5 s: Melas's 10-minute
//         shower 0.4 + 2.59 + 0.8 + 0.5 = 4.29 s, a night from taps to reveille 7.67 s;
//   brief form (under 3 minutes): no zoom, the time-lapse and a BRIEF_HOLD_S 0.4 s strip. A
//         fast-forward's lapse is the engine's own pace (its lived ticks at FF_TICKS_FRAME a frame:
//         the sheet §8, item 13), an outcome skip's the curve.
// "Short splashes" (VIEWS's setting) make every time-lapse SHORT_LAPSE_S 1.0 s. The shown clock
// follows ease(τ): its first 15% and its last 20% at 40% of the middle's rate (R = 1 / 0.79, so the
// three pieces sum to 1: the sheet §8, item 14), so the first and last minutes are seen to tick.
// targetAt gives the sim its target each frame, fromMs + ease(t / lapse) × gap floored to the game
// minute (an outcome step ends on the minute grid: the floor changes nothing the sim computes), and
// toMs itself once the lapse is over (toMs is seldom on a minute, and a target floored below it
// would never let the skip finish: v0.0.2's game-targets). An interrupt (TIME §6.5): the clock
// decelerates to it over DECEL_S 0.35 s, the beat holds BEAT_S 0.6 s, the zoom out takes 0.5 s
// (0.25 s for a danger, priority 0). The strip waits for a key only when a roll in it failed (TIME
// §6.2); no roll exists this round, so it never waits.
// Pure.
import { MIN_MS } from '../../core/clock.js';

export const SPLASH_IN_S = 0.4, SPLASH_HOLD_S = 0.8, SPLASH_OUT_S = 0.5, SPLASH_OUT_D_S = 0.25;
export const BRIEF_HOLD_S = 0.4, DECEL_S = 0.35, BEAT_S = 0.6, WHIRR_S = 0.25, CHUNK_OFFER_S = 1.2, TICKER_GAP_S = 0.8;
export const SHORT_LAPSE_S = 1.0;
/** A planned gap from this long on gets the full form (TIME §6.1), ms. */
export const FULL_FROM_MS = 180_000;
/** The iris: everything further than this from the splash's centre goes to ink (VIEWS §5.1), metres. */
export const SPLASH_IRIS_M = 3.5;
/** The zoom of the full form (VIEWS §5.1). */
export const SPLASH_ZOOM = 3;
/** The brief form's dimmed ring (the sheet §2.3), metres. */
export const BRIEF_RING_M = 6;
/** A fast-forward's pace: ticks a frame (TECH §3.6's FF_TICKS_FRAME), frames a second. */
export const FF_TICKS_FRAME = 40, FPS = 60;
/** The ease's ends run at this share of the middle's rate (the sheet §8, item 14). */
export const EASE_END_K = 0.4;
const A = 0.15, B = 0.8;
/** The ease's middle rate: the three pieces sum to one. */
export const EASE_R = 1 / (EASE_END_K * A + (B - A) + EASE_END_K * (1 - B));

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** The time-lapse's real seconds for a gap of gapMin game minutes (TIME §6.2); short: SHORT_LAPSE_S. */
export function lapseS(gapMin, { short = false } = {}) {
  if (short) return SHORT_LAPSE_S;
  return clamp(1.4 + 0.95 * Math.log(1 + Math.max(0, gapMin) / 4), 1.6, 8.0);
}

/**
 * A skip-start's splash: { id, form, engine, gapMin, inS, lapseS, holdS, outS, totalS }. skipStart is
 * the fact's payload (fromMs, toMs, engine); opts { short, ticksFrame = FF_TICKS_FRAME, fps = FPS, tickMs = 50 }.
 */
export function splashPlan(skipStart, { short = false, ticksFrame = FF_TICKS_FRAME, fps = FPS, tickMs = 50 } = {}) {
  const gapMs = Math.max(0, (skipStart.toMs ?? 0) - (skipStart.fromMs ?? 0));
  const gapMin = gapMs / MIN_MS, engine = skipStart.engine ?? (gapMs < 120_000 ? 'ff' : 'outcome');
  const form = gapMs >= FULL_FROM_MS ? 'full' : 'brief';
  const lapse = engine === 'ff' && !short ? Math.ceil(gapMs / tickMs) / ticksFrame / fps : lapseS(gapMin, { short });
  const inS = form === 'full' ? SPLASH_IN_S : 0, holdS = form === 'full' ? SPLASH_HOLD_S : BRIEF_HOLD_S, outS = form === 'full' ? SPLASH_OUT_S : 0;
  return Object.freeze({ id: skipStart.id ?? null, form, engine, gapMin, inS, lapseS: lapse, holdS, outS, totalS: inS + lapse + holdS + outS });
}

/** The shown clock's progress at τ (0..1) of the lapse: piecewise linear, slower at both ends (see the header). */
export function ease(tau) {
  const t = clamp(tau, 0, 1), R = EASE_R, k = EASE_END_K;
  if (t <= A) return k * R * t;
  if (t <= B) return k * R * A + R * (t - A);
  return Math.min(1, k * R * A + R * (B - A) + k * R * (t - B));
}

/** The sim's target tLapseS into the lapse: fromMs + ease × gap floored to the game minute, toMs at its end. */
export function targetAt(plan, fromMs, toMs, tLapseS) {
  const L = plan?.lapseS ?? 0;
  if (!(L > 0) || tLapseS >= L) return toMs;
  const t = fromMs + ease(tLapseS / L) * (toMs - fromMs);
  return Math.max(fromMs, Math.min(toMs, Math.floor(t / MIN_MS) * MIN_MS));
}

/** An interrupt's phases (TIME §6.5): { decelS, beatS, outS } (outS 0.25 for a danger). */
export const interruptTimes = (prio) => Object.freeze({ decelS: DECEL_S, beatS: BEAT_S, outS: prio === 0 ? SPLASH_OUT_D_S : SPLASH_OUT_S });

/** Whether the strip waits for a key (TIME §6.2: only on a failed roll). */
export const stripWaits = (outcome) => !!outcome?.failedRoll;
