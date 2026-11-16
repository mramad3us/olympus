// OLYMPUS arms: a burst's blast and fragments, WEAPONS' one helper each (WEAPONS §12.3, §12.4; COMBAT §11.3, §11.6; the build sheet 0.0.18 §2.3, §4).
//
// peakKPa(W, r, Pa) is the peak side-on overpressure (kPa above ambient) of W kg of TNT at r m in an ambient of Pa kPa:
// the Kinney-Graham fit scaled for the ambient by Sachs' law (Z = r (Pa / P0)^(1/3) / W^(1/3), the ratio × Pa), so a G-9
// gives 313 kPa at 1 m in the Wheel's and an MCRN hull's 66 kPa and 345 kPa in a UN hull's 101.3; in vacuum nothing beyond
// the fireball (FIREBALL_M 0.5). qspKPa(W, V) is the closed room's quasi-static pressure, the min of UFC 3-340-02's Weibull fit
// (2,250 (W/V)^0.72) and twice the ideal ((γ − 1) E / V with γ − 1 = 0.4 and E the detonation's 4.184 MJ/kg twice over, the
// afterburn counted). standoffM(W, Pa, limit) is the distance at which the peak falls to a limit: the breaching training limit
// BREACH_SAFE_KPA 27.6 (4 psi, to check against the manual), so the SC-1's 0.1 kg is 2.20 m away in the Wheel, 2.40 m at
// 101.3 kPa and 1.18 m in Mars' surface air (the fit far outside its usual range there). STUN_KPA 20 is COMBAT §11.3's stun.
// BLAST_KPA is what an opening's leaf holds by its kind (WEAPONS §12.4's proposal: an interior door 15, a fire door 35, a
// pressure door 100). fragLambda and fragHits are §12.3's fragment helper, tested data for D2 (no fragment grenade is issued).
// Pure.
import { stream, next } from '../../core/rng.js';

/** The reference ambient of the fit (kPa): sea level. */
export const P0_KPA = 101.325;
/** No air: no blast beyond the fireball (m). */
export const FIREBALL_M = 0.5;
/** The breaching training limit for the stack (kPa; 4 psi, to check) and COMBAT §11.3's stun threshold (kPa). */
export const BREACH_SAFE_KPA = 27.6, STUN_KPA = 20;
/** TNT's detonation energy (MJ/kg), the closed room's γ − 1 and the afterburn's factor on it (WEAPONS §12.4). */
export const TNT_MJ_KG = 4.184, QSP_GAMMA_K = 0.4, QSP_BURN_K = 2;
/** What an opening's leaf holds by its kind (kPa; WEAPONS §12.4's proposal, my calls on the words). */
export const BLAST_KPA = Object.freeze({ door: 15, interior: 15, wall: 10, partition: 20, weather: 30, fire: 35, pressure: 100, airlock: 100, bulkhead: 150, hatch: 150, armoury: 300 });

/** The peak side-on overpressure (kPa above ambient) of tntKg of TNT at rM in an ambient of ambientKPa (see the header). */
export function peakKPa(tntKg, rM, ambientKPa) {
  if (!(tntKg > 0)) return 0;
  if (!(ambientKPa > 0)) return rM <= FIREBALL_M ? Infinity : 0;
  const r = Math.max(0.05, rM), Z = r * Math.cbrt(ambientKPa / P0_KPA) / Math.cbrt(tntKg);
  const ratio = 808 * (1 + (Z / 4.5) ** 2) / Math.sqrt((1 + (Z / 0.048) ** 2) * (1 + (Z / 0.32) ** 2) * (1 + (Z / 1.35) ** 2));
  return ratio * ambientKPa;
}
/** The closed room's quasi-static pressure (kPa above ambient) of tntKg in volM3 (see the header). */
export function qspKPa(tntKg, volM3) {
  if (!(tntKg > 0) || !(volM3 > 0)) return 0;
  const wv = tntKg / volM3;
  return Math.min(2250 * wv ** 0.72, QSP_GAMMA_K * tntKg * QSP_BURN_K * TNT_MJ_KG * 1000 / volM3);
}
/** The distance (m) at which a charge's peak falls to limitKPa in ambientKPa (bisection to a millimetre); 0 with no air (the fireball's edge counted apart). */
export function standoffM(tntKg, ambientKPa, limitKPa = BREACH_SAFE_KPA) {
  if (!(ambientKPa > 0)) return FIREBALL_M;
  let lo = 0.05, hi = 200;
  if (peakKPa(tntKg, lo, ambientKPa) <= limitKPa) return lo;
  for (let i = 0; i < 60 && hi - lo > 1e-4; i++) { const m = (lo + hi) / 2; if (peakKPa(tntKg, m, ambientKPa) > limitKPa) lo = m; else hi = m; }
  return Math.round(hi * 1000) / 1000;
}
/** The exposure of a body to fragments by its stance (WEAPONS §12.3). */
export const FRAG_EXPOSURE = Object.freeze({ stand: 1, kneel: 0.6, crouch: 0.6, prone: 0.25 });
/** A fragment burst's expected hits on a body (WEAPONS §12.3): K × exposure × (1 − keeps) / max(r, 0.5)². */
export const fragLambda = (K, rM, exposure = 1, keeps = 0) => K * exposure * (1 - keeps) / Math.max(rM, 0.5) ** 2;
/** A Poisson draw of a burst's hits on a person, on the stream arms:frag (the burst, the person): the count. */
export function fragHits(seed, burstId, pid, lambda) {
  const r = stream(seed, 'arms:frag', burstId, pid), L = Math.exp(-lambda);
  let k = 0, p = 1;
  for (; k < 10_000; k++) { p *= next(r); if (p <= L) break; }
  return k;
}
