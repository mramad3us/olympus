// OLYMPUS body: the core temperature, tradecraft's model begun before BODY's two-node heat balance (BODY §10.1; the build sheet 0.0.4 §4).
//
// Ported from tradecraft v0.2.0-rc3 src/sim/thermal.js (159 lines). Kept as they were: STAGES (the
// core's stages, BODY §10.1 moving heat stroke to its clinical 40 °C and collapse to 40.8, death to
// 42.5), WORDS, CORE 37 °C, the comfort ranges by warmth (COMFORT), COLD_K, HEAT_K, RUN_C and the time
// constants TAU_COLD 60, TAU_HEAT 45, TAU_IN 30 minutes, and settleTo(): out of doors the core settles
// toward CORE less COLD_K a degree the felt air is below the comfort of what you wear, or more HEAT_K
// a degree above it, RUN_C more running; indoors back to 37 with τ 30 min. Changed: the felt air is the
// environment's (ROOM_C 20 °C indoors, OUTDOOR_C −10 °C at Melas this round; no wind, wet or sun yet);
// warmth comes from OLYMPUS's outfits by BODY §10.3's clo, `warmth = min(4, 3.3 × clo)` (PT kit 0.3
// clo, the sweats 0.8, utilities 0.9; a towel 0: my call, so the sweats at a −10 °C dawn run finish at
// 36.8 °C after the hour, BODY §10.4's 36.9); tradecraft's live() stepped a minute at a time with its
// drift, `(target − core)(1 − e^(−1/τ))`, which is the closed form a minute long, so the body uses the
// closed form over any span (`T* + (T − T*)e^(−Δ/τ)`), exact under composition (TIME §5.5). BODY
// §10.2's Gagge two-node balance, clothing by clo, the night sky and sweat replace settleTo() with
// Mars's weather (0.0.12). Indoors nothing moves: a core at 37 stays at 37.
import { ROOM_C, OUTDOOR_C } from '../../data/body/needs.js';

export const CORE = 37;
export const COLD_K = 0.25, HEAT_K = 0.12, RUN_C = 1.2, TAU_COLD = 60, TAU_HEAT = 45, TAU_IN = 30;
/** Comfort by warmth (0 a T-shirt … 4 a parka): felt air from, to (°C), tradecraft's. */
export const COMFORT = Object.freeze([[16, 31], [12, 32], [5, 25], [-10, 17], [-25, 10]].map(r => Object.freeze(r)));
/** The core's stages (tradecraft's, with BODY §10.1's heat lines). */
export const STAGES = Object.freeze([
  { below: 28, id: 'arrest', v: -10, dead: true }, { below: 31, id: 'collapse', v: -10, down: true }, { below: 33, id: 'severe', v: -6, slow: 0.7 },
  { below: 35, id: 'hypothermia', v: -3, slow: 0.85 }, { below: 36, id: 'shivering', v: -1 },
  { above: 42.5, id: 'cooked', v: -10, dead: true }, { above: 40.8, id: 'collapse-heat', v: -10, down: true }, { above: 40, id: 'stroke', v: -6, slow: 0.7 },
  { above: 39.5, id: 'exhaustion', v: -3, slow: 0.85 }, { above: 38, id: 'hot', v: -1 },
].map(s => Object.freeze(s)));
export const WORDS = Object.freeze({
  shivering: 'You\'re shivering, and can\'t stop.', hypothermia: 'The cold\'s in your bones: your hands are slow, your thoughts slower.',
  severe: 'You can\'t feel your hands. You need to get warm, now.', collapse: 'Your legs go from under you in the cold.',
  hot: 'Too hot: the sweat\'s running down your back.', exhaustion: 'The heat\'s got into you: dizzy, sick, slow.',
  stroke: 'The heat takes your thoughts.', warm: 'Warm again.',
});
/** BODY §10.3's clo by outfit (the towel my call); warmth = min(4, CLO_WARMTH_K × clo). */
export const CLO = Object.freeze({ pt: 0.3, sweats: 0.8, utilities: 0.9, towel: 0, service: 1.0 });
export const CLO_WARMTH_K = 3.3;
/** Tradecraft's warmth of a few of its tops, printed beside the port's by body-thermal. */
export const TRADECRAFT_WARMTH = Object.freeze({ tee: 0, robe: 1, jacket: 2, uniform: 2, coat: 3, parka: 4 });

/** An outfit's warmth on tradecraft's scale. */
export const warmthOf = (outfit) => Math.min(4, CLO_WARMTH_K * (CLO[outfit] ?? CLO.utilities));
const comfortAt = (w, end) => { const v = Math.min(4, Math.max(0, w)), i = Math.floor(v), f = v - i; return COMFORT[i][end] + (COMFORT[Math.min(4, i + 1)][end] - COMFORT[i][end]) * f; };

/** Where the core would settle (tradecraft's settleTo): { target °C, tauMin }. env: { outdoors, airC, outfit }; runK the share of time running. */
export function settleTo({ outdoors = false, airC = outdoors ? OUTDOOR_C : ROOM_C, outfit = 'utilities' } = {}, runK = 0) {
  if (!outdoors) return { target: CORE, tauMin: TAU_IN };
  const w = warmthOf(outfit), lo = comfortAt(w, 0), hi = comfortAt(w, 1), t = airC, run = RUN_C * runK;
  if (t < lo) return { target: CORE - COLD_K * (lo - t) + run, tauMin: TAU_COLD };
  if (t > hi) return { target: CORE + HEAT_K * (t - hi) + run, tauMin: TAU_HEAT };
  return { target: CORE + run * 0.5, tauMin: run ? TAU_HEAT : TAU_IN };
}

/** The core after dtMin toward target with τ (the closed form of tradecraft's per-minute drift). */
export const coreAfter = (coreC, target, tauMin, dtMin) => target + (coreC - target) * Math.exp(-dtMin / tauMin);
/** Tradecraft's own step, a minute at a time (live()'s loop, rounded to 0.001 °C as it rounds), for the parity print. */
export function tradecraftLive(coreC, target, tauMin, minutes) {
  let c = coreC;
  for (let left = minutes; left > 0; left -= 1) c = Math.round((c + (target - c) * (1 - Math.exp(-1 / tauMin)) * Math.min(1, left)) * 1000) / 1000;
  return c;
}

/** The stage the core is at, or null when it is fine (tradecraft's stageOf). */
export function stageOf(coreC) {
  for (const s of STAGES) if ((s.below !== undefined && coreC < s.below) || (s.above !== undefined && coreC > s.above)) return s;
  return null;
}
/** What the cold or the heat costs every roll (tradecraft's thermalMods): [{ why, v }]. */
export function thermalMods(coreC) {
  const s = stageOf(coreC);
  return s ? [{ why: { shivering: 'shivering', hypothermia: 'hypothermia', severe: 'hypothermia, badly', collapse: 'hypothermia', arrest: 'the cold', hot: 'too hot', exhaustion: 'heat exhaustion', stroke: 'heat stroke', 'collapse-heat': 'heat stroke', cooked: 'heat stroke' }[s.id], v: s.v, id: s.id }] : [];
}
