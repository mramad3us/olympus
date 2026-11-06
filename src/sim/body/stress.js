// OLYMPUS body: stress and morale, the stubs this round (BODY §9; the build sheet 0.0.4 §2.1, §4).
//
// Stress (0 to 100) is tradecraft's (src/sim/needs.js, v0.2.0-rc3): it falls by itself, CALM_PER_MIN
// 0.5 a minute, SIT_CALM_PER_MIN 2 seated or indoors and safe (in the barracks, always safe this
// round: no danger exists yet), linear with a floor at 0; a shower takes 10 off (a cold one adds 3),
// a meal 8, a night's sleep up to 60, an accident adds 10. On edge from 50 (−1 to eyes and face),
// frayed from 75 (−2 to eyes and face, −1 to hands and arms: BODY §9.1 moves tradecraft's −1 to
// Deception, Social and Awareness onto SKILLS's uses). Danger, the crash and combat stress load come
// with COMBAT. Morale (BODY §9.2, longhaul's) is flat at 70 this round: its target needs PEOPLE's social
// and CAREER's career terms (0.0.9 on); its bands exist so the strip and the mods read it.
import { STRESS, STRESS_BANDS, MORALE, MORALE_BANDS } from '../../data/body/needs.js';

/** Tradecraft's stress numbers (src/sim/needs.js), printed beside the port's by body-mods. */
export const TRADECRAFT_STRESS = Object.freeze({ ON_EDGE: 50, FRAYED: 75, CALM_PER_MIN: 0.5, SIT_CALM_PER_MIN: 2, ON_EDGE_MOD: -1, FRAYED_MOD: -2, SKILLS: 'deception, social, awareness' });

/** Stress's rate, per minute: down by itself, faster indoors and safe. */
export const stressRate = (outdoors) => -(outdoors ? STRESS.CALM_PER_MIN : STRESS.SAFE_CALM_PER_MIN);

/** Stress's band index in STRESS_BANDS. */
export function stressIndex(v) {
  for (let i = STRESS_BANDS.length - 1; i >= 1; i--) if (v >= STRESS_BANDS[i].v) return i;
  return 0;
}
/** Morale's band index in MORALE_BANDS (very low, low, steady). */
export const moraleIndex = (v) => (v < MORALE.VERY_LOW ? 0 : v < MORALE.LOW ? 1 : 2);
