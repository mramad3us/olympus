// OLYMPUS body: water and thirst, body water in litres against euhydration (BODY §4; the build sheet 0.0.4 §2.1, §4).
//
// Two ledgers (BODY §4.1): `gutL`, drunk and eaten water not yet absorbed, emptying exponentially with
// τ 20 min (about a litre an hour at most; the stomach holds 1.2 L), and `balanceL`, body water against
// euhydration (0), which gains what the gut absorbs and the metabolic water of what is burned (0.13 mL a
// kcal) and loses the insensible water of breath and skin, `0.030 × (0.6 + 0.4 × metG/1.5) × dryK`
// L/h (dryK 1.0 indoors, 1.3 in Mars's dry outdoor air), and urine (BODY §4.2): `0.025 × nightK +
// max(0, balance)/1.5` L/h, nightK 0.5 between the body's 23:00 and 06:00 (night-time ADH), the
// obligatory 0.025 cut to 0.018 below a −0.5 L balance (concentrated urine). No sweat this round:
// Melas's cool season is 20 °C indoors (BODY §4.2: "a training sol at Melas in the cool season sweats
// almost nothing"); the heat balance's sweat comes with the two-node model at 0.0.12. Stool takes 0.4
// mL a gram at relief (0.1 L a sol, my call). Urine fills the bladder (src/sim/body/elimination.js).
// Thirst by the deficit as a share of mass (BODY §4.3): thirsty at 1%, dry 2, parched 4, dehydrated
// 6, severe 8, collapse 12. Drinking is only ever asked for (the user, 2026-10-31): drinkBody() is the
// one way in.
import { WATER, THIRST } from '../../data/body/needs.js';

/** The deficit as a share of mass, % (BODY §4.1; refL is 0 until plasma volume moves, 0.2). */
export const thirstPct = (balanceL, massKg) => -balanceL / massKg * 100;

/** Thirst's band index in THIRST. */
export function thirstIndex(pct) {
  for (let i = THIRST.length - 1; i >= 1; i--) if (pct >= THIRST[i].pct) return i;
  return 0;
}

/** Whether the body's hour φ is in the kidneys' night (23:00 to 06:00). */
export const kidneyNight = (phi) => phi >= WATER.NIGHT_FROM_H || phi < WATER.NIGHT_TO_H;

/** The water rates at a rate point, L/h: { metabL, insL, urineL }. */
export function waterRates(balanceL, burnKcalH, metG, outFrac, night) {
  const dryK = WATER.DRY_K_IN + (WATER.DRY_K_OUT - WATER.DRY_K_IN) * outFrac;
  const base = balanceL < WATER.URINE_LOW_BELOW_L ? WATER.URINE_LOW_L_H : WATER.URINE_BASE_L_H;
  return {
    metabL: WATER.METABOLIC_L_PER_KCAL * burnKcalH,
    insL: WATER.INSENSIBLE_L_H * (0.6 + 0.4 * metG / 1.5) * dryK,
    urineL: base * (night ? WATER.NIGHT_K : 1) + Math.max(0, balanceL) / WATER.URINE_SURPLUS_TAU_H,
  };
}

/** Drink: the gut's water takes it up to GUT_MAX_L. Returns the litres that went in. Writes body. */
export function drinkBody(body, waterL) {
  const room = Math.max(0, WATER.GUT_MAX_L - body.water.gutL), took = Math.max(0, Math.min(waterL, room));
  body.water.gutL += took;
  return took;
}
