// OLYMPUS body: the gaits in every gravity by load, and stamina and breath (BODY §8, §16.1, §16.3; the build sheet 0.0.4 §2.1, §8 item 11).
//
// Gaits (BODY §16.1): stroll `0.95·g^0.25`, walk `1.45·g^0.25`, run `3.6·(0.85 + 0.015·F)·g^0.3`, sprint
// `6.0·(0.85 + 0.015·F)·g^0.35` m/s, g the felt gravity in G and F effective fitness (10 until
// SKILLS's fitness, 0.0.13 on: CAREER's fitness term on the run, equal to BODY's at 10), rounded to
// SPEED_STEP_MS 0.01 m/s (the sheet §8, item 11), so Mars comes out at stroll 0.75, walk 1.14, run
// 2.69, sprint 4.28, Earth at 0.95, 1.45, 3.60, 6.00, Europa at 0.57, 0.88, 1.97, 2.97: one helper for
// every gravity, replacing move.js's constants (its WALK_MS, RUN_MS, STROLL_MS are this at 0.38 G).
// Load by weight against strength (BODY §16.3): `loadKg × g / (massKg × (0.8 + 0.02 F))`; laden from
// 0.30, heavy from 0.45 (walk ×0.9, no sprint), very heavy from 0.65 (walk ×0.75, no run), overloaded
// from 0.90. Stamina (BODY §8), a fast pool 0 to 100: aerobic capacity `capMet = (8 + 0.45 F) ×
// SpO₂/97` (12.5 MET at Fitness 10), threshold 0.85 of it; demand (the body's MET at the felt g) above
// the threshold drains `7 × (d − th)/cap` a second, below it recovers `1.5 × (th − d)/cap` a second
// (about 90 s from empty to full at rest). On Mars a run is 4.3 MET, under every marine's threshold:
// the lope is sustainable, and only a sprint (1.3 × cap, no key yet) or a 1 G deck drains. Under 50
// "breathing hard", under 25 "winded" (no sprint), at 0 "blown": walk only until 25 again. The fast
// layer steps it each tick lived (staminaTick); a skip recovers it in closed form (linear, clamped).
// gaitsOf reads the person now: the felt g, their mass, stamina and the needs that forbid a run or a
// sprint (BODY §3.4 weak, starving; §4.3 dehydrated; §10.1 the cold's and the heat's slows).
import { GAIT, LOAD_BANDS, STAMINA, G_MELAS, SPO2_PCT, BMI_BY_BUILD, KCAL_PER_KG } from '../../data/body/needs.js';
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

/** The gaits at gravity gG (BODY §16.1, §16.3; see the header): m/s, rounded to SPEED_STEP_MS, and whether a run and a sprint are possible. */
export function gaitSpeeds({ gG = G_MELAS, loadKg = 0, massKg = 75, effFitness = STAMINA.FITNESS, stamina = 100, blown = false } = {}) {
  const fitK = GAIT.FIT_BASE + GAIT.FIT_K * effFitness, L = loadBandOf(loadKg, gG, massKg, effFitness), r = (v) => q(v, GAIT.SPEED_STEP_MS);
  return {
    strollMs: r(GAIT.STROLL_MS * gG ** GAIT.STROLL_EXP * L.walkK),
    walkMs: r(GAIT.WALK_MS * gG ** GAIT.WALK_EXP * L.walkK),
    runMs: r(GAIT.RUN_MS * fitK * gG ** GAIT.RUN_EXP * L.walkK),
    sprintMs: r(GAIT.SPRINT_MS * fitK * gG ** GAIT.SPRINT_EXP * L.walkK),
    runOk: L.run && !blown,
    sprintOk: L.sprint && !blown && stamina >= STAMINA.WINDED_BELOW,
    load: L.id,
  };
}
/** The gaits on Mars, unloaded, rested (move.js's constants). */
export const MARS_GAITS = Object.freeze(gaitSpeeds({ gG: G_MELAS }));

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

/** The person's gaits now (BODY §16.1 with the body's gates), for move.js each tick. */
export function gaitsOf(state, pid, { gG = G_MELAS, loadKg = 0 } = {}) {
  const rec = state?.people?.[pid]?.body;
  if (!rec) return MARS_GAITS;
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
