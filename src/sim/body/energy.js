// OLYMPUS body: energy and hunger, the gut and the reserve in kilocalories (BODY §3; the build sheet 0.0.4 §2.1, §4).
//
// Burn is the basal rate by Mifflin–St Jeor, divided by 24 (a 75 kg, 178 cm, 21-year-old man 73.4
// kcal/h, 1,763 a day), times the activity's MET scaled to the felt gravity and the load (BODY §3.1:
// `metG = 1 + (met − 1) × f(g) × (1 + loadKg/massKg)` for weight-bearing kinds, with fWalk 0.4 + 0.6 g,
// fRun 0.15 + 0.85 g, fClimb g, fWork 0.7 + 0.3 g, still kinds unscaled). Asleep, the body runs at
// MET 0.95. Two pools (BODY §3.3): the gut, food eaten and not yet absorbed, capped at GUT_MAX_KCAL
// 1,800, absorbed at 120 + 0.8 × burn kcal/h while it holds anything; the reserve, the balance
// against the body's stores, gaining what is absorbed and losing what is burned, capped at +4,000,
// its deficit costing mass at 7,700 kcal a kilogram. Both are linear between events, so the closed
// form is exact (the gut's emptying is an event the stepper cuts at). Felt hunger (BODY §3.4) runs on
// two ladders and the worse rules: the felt one from `emptyH`, the hours since the gut emptied (an
// hour asleep counts a quarter: the night is not a missed meal), peckish below 4 h, hungry from 4,
// very hungry from 10; the deep one from the reserve, hungry at −1,500, very hungry at −3,000, weak at
// −13,000, faint spells at −20,000, starving at −40,000. Food brings its own water and stool (src/
// data/body/foods.js), both released as the gut absorbs it (the water too, my call: food water is
// freed by digestion over hours, not drunk, so a meal does not flood the kidneys at once); a meal of 400 kcal or more wakes the gastrocolic reflex for 45 minutes and
// takes 8 off stress. Nothing is eaten unasked (the user, 2026-10-31): only intake() feeds the body.
// Ported in shape from tradecraft v0.2.0-rc3 src/sim/needs.js (129 lines): its hours-since-a-meal
// ladder (HUNGRY_H 6, STARVING_H 14, WEAK_H 48, FAINT_H 72, DIE_H 504) becomes these physical pools
// and BODY's two ladders; eat() and the "sleep doesn't feed you" rule (the user, 2026-10-28) kept.
import { ENERGY, HUNGER, BMI_BY_BUILD, KCAL_PER_KG, BOWEL } from '../../data/body/needs.js';
import { FOODS } from '../../data/body/foods.js';

/** Tradecraft's ladder in hours since a meal (src/sim/needs.js), printed beside BODY's by body-energy. */
export const TRADECRAFT_HUNGER_H = Object.freeze({ HUNGRY_H: 6, STARVING_H: 14, WEAK_H: 48, FAINT_H: 72, DIE_H: 504 });

/** The gravity factor of a kind (BODY §3.1). */
export function gravityK(kind, gG) {
  switch (kind) {
    case 'walk': return 0.4 + 0.6 * gG;
    case 'run': return 0.15 + 0.85 * gG;
    case 'climb': return gG;
    case 'work': return 0.7 + 0.3 * gG;
    default: return 1;
  }
}
/** The MET felt at gravity gG carrying loadKg (BODY §3.1); still kinds are unscaled. */
export function metGOf(met, kind, gG, loadKg = 0, massKg = 75) {
  if (kind === 'still' || !kind) return met;
  return 1 + (met - 1) * gravityK(kind, gG) * (1 + loadKg / massKg);
}

/** The body's mass with no deficit: body-mass index by build × height² (kg). */
export const baseMassOf = (body) => (BMI_BY_BUILD[body.build] ?? BMI_BY_BUILD.medium) * body.heightM * body.heightM;
/** The body's mass, a reserve deficit taken off at 7,700 kcal a kilogram (BODY §3.3). */
export const massOf = (body, reserveKcal = body.energy.reserveKcal) => baseMassOf(body) + Math.min(0, reserveKcal) / KCAL_PER_KG;

/** The basal rate, kcal/h (Mifflin–St Jeor ÷ 24 × bmrK; BODY §3.1). */
export function bmrKcalH({ massKg, heightM, ageY, sex, bmrK = 1 }) {
  return (10 * massKg + 6.25 * heightM * 100 - 5 * ageY + (sex === 'f' ? -161 : 5)) / 24 * bmrK;
}

/** The energy rates at a rate point (BODY §3.3): { burn, absorb, emptyRate, stoolA, foodL } in kcal/h, h/h, g/h, L/h. */
export function energyRates(gutKcal, stoolK, waterK, bmr, metG, asleep) {
  const burn = bmr * metG;
  const absorb = gutKcal > 0 ? ENERGY.ABSORB_BASE_KCAL_H + ENERGY.ABSORB_BURN_K * burn : 0;
  return { burn, absorb, emptyRate: gutKcal > 0 ? 0 : asleep ? ENERGY.EMPTY_ASLEEP_K : 1, stoolA: absorb * stoolK, foodL: absorb * waterK };
}

/** Felt hunger's band index in HUNGER (BODY §3.4: the worse of the felt and the deep ladders). */
export function hungerIndex(gutKcal, emptyH, reserveKcal) {
  let felt = 0;
  if (!(gutKcal > 0)) felt = emptyH >= HUNGER[3].emptyH ? 3 : emptyH >= HUNGER[2].emptyH ? 2 : 1;
  let deep = 0;
  for (let i = HUNGER.length - 1; i >= 2; i--) if (reserveKcal <= HUNGER[i].reserveKcal) { deep = i; break; }
  return Math.max(felt, deep);
}

/**
 * Eat: the body record's gut takes the kilocalories up to GUT_MAX_KCAL, with its water and its stool
 * per kilocalorie mixed into the gut's (stoolK, waterK: released as the gut absorbs it). Returns what
 * went in: { kcal, foodWaterL }. Writes body; the caller has advanced it to ms.
 */
export function eatBody(body, { kcal = 0, food = 'snack' }, ms) {
  const f = FOODS[food] ?? FOODS.snack, e = body.energy;
  const room = Math.max(0, ENERGY.GUT_MAX_KCAL - e.gutKcal), took = Math.max(0, Math.min(kcal, room));
  if (!(took > 0)) return { kcal: 0, foodWaterL: 0 };
  const was = e.gutKcal;
  e.stoolK = (was * (e.stoolK ?? BOWEL.STOOL_G_PER_KCAL) + took * f.stoolGPerKcal) / (was + took);
  e.waterK = (was * (e.waterK ?? FOODS.mess.waterLPerKcal) + took * f.waterLPerKcal) / (was + took);
  e.gutKcal = was + took;
  e.ateMs = ms;
  e.emptySinceMs = null;
  e.emptyH = 0;
  if (took >= BOWEL.REFLEX_MIN_KCAL) body.bowel.reflexUntilMs = ms + BOWEL.REFLEX_MS;
  if (took >= BOWEL.REFLEX_MIN_KCAL) body.stress.v = Math.max(0, body.stress.v - ENERGY.MEAL_CALM);
  return { kcal: took, foodWaterL: took * f.waterLPerKcal };
}
