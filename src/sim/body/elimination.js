// OLYMPUS body: the bladder in millilitres and the bowel in grams, their urges and their accidents (BODY §5; the build sheet 0.0.4 §2.1, §4).
//
// The bladder fills with the kidneys' urine (src/sim/body/water.js) and is felt at 200 mL (could go),
// 400 (need: −1 to the mind; a sleeper is woken at 450), 550 (urgent: −2 to everything, walking
// stiffly, no sleep) and 700 (bursting: −3, and an accident hazard of 3% a minute); at 850 mL it
// empties, an accident (BODY §5.1). Food becomes stool at 0.06 g a kilocalorie absorbed (bars and
// rations 0.04), into transit, which moves into the bowel with τ 18 h, so today's food arrives
// tomorrow; with a constant inflow the two compose in closed form, `T(t) = aτ + (T₀ − aτ)e^(−t/τ)`.
// The bowel is felt at 150 g (could go), 250 (need), 350 (urgent), 450 (desperate: an accident hazard
// of 2% a minute) and empties at 550 g; for 45 minutes after a meal of 400 kcal every threshold is 100
// g lower (the gastrocolic reflex) and in the body's morning (06:00 to 10:00) 50 g lower: the morning
// call of reveille, the head and chow (BODY §5.2; the accident's own 550 g stays: my call). Relief is
// asked for, never automatic: voidBody() empties what it is told (a head the bladder whole, a stall
// 90% of the bowel, each by the share of the activity done). An accident (tradecraft's rule: the body
// lets go when it can no longer hold) soils you: grime +25 for urine, +40 for the bowel, stress +10,
// and the log says so (BODY §5.1: the squad bay never forgets).
import { BLADDER, BLADDER_BANDS, BOWEL, BOWEL_BANDS, WATER } from '../../data/body/needs.js';

/** The bladder's band index in BLADDER_BANDS. */
export function bladderIndex(ml) {
  for (let i = BLADDER_BANDS.length - 1; i >= 1; i--) if (ml >= BLADDER_BANDS[i].ml) return i;
  return 0;
}
/** How much lower the bowel's thresholds are at ms (the reflex after a meal, the body's morning), g. */
export function bowelLowerG(reflexUntilMs, ms, phi) {
  let g = 0;
  if (reflexUntilMs !== null && reflexUntilMs !== undefined && ms < reflexUntilMs) g += BOWEL.REFLEX_G;
  if (phi >= BOWEL.MORNING_FROM_H && phi < BOWEL.MORNING_TO_H) g += BOWEL.MORNING_G;
  return g;
}
/** The bowel's band index in BOWEL_BANDS, its thresholds lowered by lowerG. */
export function bowelIndex(g, lowerG = 0) {
  for (let i = BOWEL_BANDS.length - 1; i >= 1; i--) if (g >= BOWEL_BANDS[i].g - lowerG) return i;
  return 0;
}

/** The transit's closed form over dtH with an inflow of aGH g/h: { transitG, movedG }. */
export function transitStep(transitG, aGH, dtH) {
  const tau = BOWEL.TRANSIT_TAU_H, eq = aGH * tau;
  const T = eq + (transitG - eq) * Math.exp(-dtH / tau);
  return { transitG: T, movedG: transitG + aGH * dtH - T };
}

/**
 * Relief: the bladder and the bowel emptied by the shares given (the caller's: a head 1.0 × the share
 * done; a stall 0.9 × it). Stool takes its water with it. Returns { ml, g } let go. Writes body.
 */
export function voidBody(body, { bladderK = 0, bowelK = 0 }) {
  const kb = Math.max(0, Math.min(1, bladderK)), kg = Math.max(0, Math.min(1, bowelK));
  const ml = body.bladder.ml * kb, g = body.bowel.g * kg;
  body.bladder.ml -= ml;
  body.bowel.g -= g;
  body.water.balanceL -= g * WATER.STOOL_L_PER_G;
  return { ml, g };
}

/** The bladder lets go (850 mL, or the bursting hazard): emptied, soiled, shaken. Writes body; returns the mL. */
export function bladderAccident(body) {
  const ml = body.bladder.ml;
  body.bladder.ml = 0;
  body.hygiene.grime = Math.min(100, body.hygiene.grime + BLADDER.ACCIDENT_GRIME);
  body.stress.v = Math.min(100, body.stress.v + BLADDER.ACCIDENT_STRESS);
  return ml;
}
/** The bowel lets go (550 g, or the desperate hazard): 90% out, soiled, shaken. Writes body; returns the g. */
export function bowelAccident(body) {
  const g = body.bowel.g * BOWEL.RELIEF_K;
  body.bowel.g -= g;
  body.water.balanceL -= g * WATER.STOOL_L_PER_G;
  body.hygiene.grime = Math.min(100, body.hygiene.grime + BOWEL.ACCIDENT_GRIME);
  body.stress.v = Math.min(100, body.stress.v + BOWEL.ACCIDENT_STRESS);
  return g;
}
