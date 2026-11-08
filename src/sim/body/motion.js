// OLYMPUS body: the gaits in every gravity by load, and stamina and breath (BODY §8, §16.1, §16.3; the build sheet 0.0.4 §2.1, §8 item 11).
//
// Gaits (BODY §16.1): stroll `0.95·g^0.25`, walk `1.45·g^0.25`, run `3.6·(0.85 + 0.015·F)·g^0.3`, sprint
// `6.0·(0.85 + 0.015·F)·g^0.35` m/s, g the felt gravity in G and F effective fitness (10 until
// SKILLS's fitness, 0.0.13 on: CAREER's fitness term on the run, equal to BODY's at 10), rounded to
// SPEED_STEP_MS 0.01 m/s (the sheet §8, item 11), so Mars comes out at stroll 0.75, walk 1.14, run
// 2.69, sprint 4.28, Earth at 0.95, 1.45, 3.60, 6.00, Europa at 0.57, 0.88, 1.97, 2.97: one helper for
// every gravity, read at the place's (src/sim/places/env.js gravityAt; move.js's Mars constants are gone,
// ROADMAP "anywhere" step 2). **Gravity's branches** (src/data/body/needs.js GAIT_G): the law is clamped at
// 1 G, so nobody walks faster at 3 G than at 1 G (the audit's probe had a 3 G sprint at 8.81 m/s); above it
// the 1 G speeds are multiplied by BODY §14.1's band at r = gG / gCond (gCond 1.00, the Wheel's marine,
// until the conditioning reaches the gait: heavy ×0.95 from r 1.15, very heavy ×0.85 and no sprint from
// 1.5, crushing ×0.65 and no run from 2.0, ×0.4 past 2.8); under 0.05 G the keys pick BODY §16.6's
// push-off speeds (0.3, 0.6, 1.2, 2.0 m/s: a stub until free-fall motion), so free fall is never a
// zero-speed trap. `mode` names the branch, CONTRACTS §21's footing modes where they are the gravity's
// alone: 'float' under 0.05 G, 'bound' to 0.3 G (the run is BODY §16.7's two-footed bound: move.js draws
// it), 'heavy' in a band, else 'walk'; `gBand` the band's id or null. The load's band reads the felt g
// unclamped (a pack weighs three times as much at 3 G). placeGaits(state, area) is the unloaded, rested row
// at a place's gravity (the coach's walk, the corpsman's run, the late card's walk to the rack).
// Load by weight against strength (BODY §16.3): `loadKg × g / (massKg × (0.8 + 0.02 F))`; laden from
// 0.30, heavy from 0.45 (walk ×0.9, no sprint), very heavy from 0.65 (walk ×0.75, no run), overloaded
// from 0.90. Stamina (BODY §8), a fast pool 0 to 100: aerobic capacity `capMet = (8 + 0.45 F) ×
// SpO₂/97` (12.5 MET at Fitness 10), threshold 0.85 of it; demand (the body's MET at the felt g) above
// the threshold drains `7 × (d − th)/cap` a second, below it recovers `1.5 × (th − d)/cap` a second
// (about 90 s from empty to full at rest). On Mars a run is 4.3 MET, under every marine's threshold:
// the lope is sustainable, and only a sprint (1.3 × cap, no key yet) or a 1 G deck drains. Under 50
// "breathing hard", under 25 "winded" (no sprint), at 0 "blown": walk only until 25 again. The fast
// layer steps it each tick lived (staminaTick); a skip recovers it in closed form (linear, clamped).
// gaitSpeeds takes the gravity (required: no place is assumed); gaitsOf reads the person now: the felt g
// (the live area's, src/sim/places/env.js gravityAt, unless given), their mass, stamina and the needs that forbid a run or a
// sprint (BODY §3.4 weak, starving; §4.3 dehydrated; §10.1 the cold's and the heat's slows).
import { GAIT, GAIT_G, LOAD_BANDS, STAMINA, SPO2_PCT, BMI_BY_BUILD, KCAL_PER_KG } from '../../data/body/needs.js';
import { gravityAt } from '../places/env.js';
import { TEMPLATES, DEFAULT_TMPL } from '../../data/body/templates.js';
import { q } from '../../core/num.js';
import { hungerIndex } from './energy.js';
import { thirstPct, thirstIndex } from './water.js';
import { stageOf } from './thermal.js';
import { mobilityOf } from './wounds.js';

/** The load's band by weight against strength (BODY §16.3). */
export function loadBandOf(loadKg, gG, massKg, effFitness = STAMINA.FITNESS) {
  const ratio = loadKg * gG / (massKg * (0.8 + 0.02 * effFitness));
  let b = LOAD_BANDS[0];
  for (const L of LOAD_BANDS) if (ratio >= L.from) b = L;
  return { ...b, ratio };
}

/** BODY §14.1's band at a felt g against the conditioning (r = gG / condG): the band, or null at r 1.15 and under. */
export function heavyBandOf(gG, condG = GAIT_G.COND_G) {
  const r = gG / condG;
  let b = null;
  for (const H of GAIT_G.HEAVY_BANDS) if (r > H.fromR) b = H;
  return b;
}
/** The gravity branch at gG (see the header): 'float' | 'bound' | 'heavy' | 'walk'. */
export function gaitModeOf(gG, condG = GAIT_G.COND_G) {
  if (gG < GAIT_G.FLOAT_BELOW_G) return 'float';
  if (gG < GAIT_G.BOUND_BELOW_G) return 'bound';
  return heavyBandOf(gG, condG) ? 'heavy' : 'walk';
}

/** The gaits at gravity gG (BODY §16.1, §16.3, §16.6, §14.1; see the header): m/s, rounded to SPEED_STEP_MS, whether a run and a sprint are possible, the load's band, the gravity's mode and band. */
export function gaitSpeeds({ gG, loadKg = 0, massKg = 75, effFitness = STAMINA.FITNESS, stamina = 100, blown = false, condG = GAIT_G.COND_G } = {}) {
  if (!Number.isFinite(gG) || gG < 0) throw new Error(`gaitSpeeds(): the felt gravity in G, not ${gG}`);
  const fitK = GAIT.FIT_BASE + GAIT.FIT_K * effFitness, L = loadBandOf(loadKg, gG, massKg, effFitness), r = (v) => q(v, GAIT.SPEED_STEP_MS);
  const mode = gaitModeOf(gG, condG), H = mode === 'heavy' ? heavyBandOf(gG, condG) : null;
  const runOk = L.run && (!H || H.run) && !blown, sprintOk = L.sprint && (!H || H.sprint) && !blown && stamina >= STAMINA.WINDED_BELOW;
  if (mode === 'float') {
    const F = GAIT_G.FLOAT_MS;
    return { strollMs: r(F.stroll * L.walkK), walkMs: r(F.walk * L.walkK), runMs: r(F.run * L.walkK), sprintMs: r(F.sprint * L.walkK), runOk, sprintOk, load: L.id, mode, gBand: null };
  }
  const g = Math.min(gG, GAIT_G.LAW_MAX_G), k = L.walkK * (H ? H.k : 1);
  return {
    strollMs: r(GAIT.STROLL_MS * g ** GAIT.STROLL_EXP * k),
    walkMs: r(GAIT.WALK_MS * g ** GAIT.WALK_EXP * k),
    runMs: r(GAIT.RUN_MS * fitK * g ** GAIT.RUN_EXP * k),
    sprintMs: r(GAIT.SPRINT_MS * fitK * g ** GAIT.SPRINT_EXP * k),
    runOk, sprintOk, load: L.id, mode, gBand: H?.id ?? null,
  };
}
const PLACE_GAITS = new Map();
/** The gaits unloaded and rested at a place's gravity (area: an area id, null the live one; src/sim/places/env.js gravityAt): frozen, one per gravity. */
export function placeGaits(state, area = null) {
  const gG = gravityAt(state, area).gG;
  let g = PLACE_GAITS.get(gG);
  if (!g) PLACE_GAITS.set(gG, (g = Object.freeze(gaitSpeeds({ gG }))));
  return g;
}

/** Aerobic capacity, MET (BODY §8). */
export const capMetOf = (effFitness = STAMINA.FITNESS, spo2 = SPO2_PCT) => (STAMINA.CAP_BASE_MET + STAMINA.CAP_PER_FIT * effFitness) * spo2 / 97;
/** Stamina's rate at a demand of metG, per second (BODY §8): negative draining, positive recovering. */
export function staminaRate(metG, effFitness = STAMINA.FITNESS) {
  const cap = capMetOf(effFitness), th = STAMINA.TH_K * cap;
  return metG > th ? -STAMINA.DRAIN_K * (metG - th) / cap : STAMINA.RECOVER_K * (th - metG) / cap;
}
/** One lived step of stamina at demand metG over dtS seconds: { stamina, blown }. */
export function staminaTick(stamina, blown, metG, dtS, effFitness = STAMINA.FITNESS) {
  const s = Math.max(0, Math.min(100, stamina + staminaRate(metG, effFitness) * dtS));
  const b = s <= 0 ? true : blown && s < STAMINA.BLOWN_UNTIL;
  return { stamina: s, blown: b };
}

// (a light read of the stored record, the template filling what it leaves out: gaitsOf runs every tick)
const tmplOf = (rec) => TEMPLATES[rec?.tmpl] ?? TEMPLATES[DEFAULT_TMPL];
const field = (rec, g, k) => rec?.[g]?.[k] ?? tmplOf(rec)[g][k];

/** The person's gaits now (BODY §16.1 with the body's gates), for move.js each tick: at gG, else the live area's gravity. */
export function gaitsOf(state, pid, { gG: given, loadKg = 0 } = {}) {
  const gG = given ?? gravityAt(state).gG, rec = state?.people?.[pid]?.body;
  if (!rec) return gaitSpeeds({ gG });
  const t = tmplOf(rec), h = rec.heightM ?? t.heightM, res = field(rec, 'energy', 'reserveKcal');
  const massKg = (BMI_BY_BUILD[rec.build ?? t.build] ?? BMI_BY_BUILD.medium) * h * h + Math.min(0, res) / KCAL_PER_KG;
  const g = gaitSpeeds({ gG, loadKg, massKg, stamina: rec.stamina ?? t.stamina, blown: rec.blown ?? false });
  const hunger = hungerIndex(field(rec, 'energy', 'gutKcal'), field(rec, 'energy', 'emptyH'), res);
  const thirst = thirstIndex(thirstPct(field(rec, 'water', 'balanceL'), massKg));
  const cold = stageOf(field(rec, 'thermal', 'coreC'));
  if (hunger >= 4 || thirst >= 4) g.sprintOk = false;                                   // (weak, dehydrated: no sprint)
  if (hunger >= 6 || thirst >= 6 || cold?.down) { g.runOk = false; g.sprintOk = false; } // (starving, collapsing, down)
  if (cold?.slow) for (const k of ['strollMs', 'walkMs', 'runMs', 'sprintMs']) g[k] = q(g[k] * cold.slow, GAIT.SPEED_STEP_MS);
  // (0.0.7: a wound slows the walker by its legs, torso and blood (wounds.js mobilityOf); an unhurt body is untouched)
  if (rec.injuries?.length || (rec.bloodMs !== undefined && rec.bloodMs !== null)) {
    const m = mobilityOf(rec, state.clock.ms);
    for (const k of ['strollMs', 'walkMs', 'runMs', 'sprintMs']) g[k] = q(g[k] * m.k, GAIT.SPEED_STEP_MS);
    if (!m.runOk) { g.runOk = false; g.sprintOk = false; }
  }
  return g;
}
