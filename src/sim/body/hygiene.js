// OLYMPUS body: hygiene, grime from 0 to 100, the sweat on you, wet hair and stubble (BODY §6; the build sheet 0.0.4 §2.1, §4).
//
// Grime builds by the hour (BODY §6): 1.2 awake, 0.5 asleep, 8 a litre of sweat, 1 more at a MET over
// 5, 1.5 more outdoors on Mars (the dust); an accident adds 25 (urine) or 40 (the bowel). Linear between
// events, capped at 100. Its bands: fresh under 15, clean to 35, grubby to 55 (fails an inspection),
// unwashed to 70 (−1 to a roll aimed at someone within 1.5 m: the smell), rank to 85 (−2, 2.5 m),
// filthy (−3, 4 m). A shower takes grime by its minutes of running water w (BODY owns what the water
// does; TIME §8.2 the activity, PLACES each site's minutes): `min(grime, round(30 × e^(−(w − 1)/0.75)))`,
// so 1 minute leaves 30, 2 leave 8, 3 (Melas's push-button heads) leave 2, 4 leave 1, 5 leave 0; it
// washes the sweat off, leaves the hair wet for WET_HAIR_MS (20 minutes), and takes 10 off stress (a
// cold one adds 3 instead). At the basin, face and hands take grime × 0.9 and a shave sets the stubble
// to 0; stubble is the hours since the last shave (it shows from STUBBLE_SHOWS_H 12, my call, and over
// 20 h fails an inspection). The sweat on the skin and the cloth (this round only a scene's: the shower
// test begins after PT) dries with τ 1 h (my call), a closed form, and the doll shows it.
import { HYGIENE, GRIME_BANDS, STUBBLE_BANDS } from '../../data/body/needs.js';

/** Grime's band index in GRIME_BANDS. */
export function grimeIndex(grime) {
  for (let i = GRIME_BANDS.length - 1; i >= 1; i--) if (grime >= GRIME_BANDS[i].grime) return i;
  return 0;
}
/** Stubble's band index in STUBBLE_BANDS. */
export function stubbleIndex(stubbleH) {
  for (let i = STUBBLE_BANDS.length - 1; i >= 1; i--) if (stubbleH >= STUBBLE_BANDS[i].h) return i;
  return 0;
}
/** The smell's range, metres (BODY §6's smellOf): 0 below unwashed. */
export const smellM = (grime) => GRIME_BANDS[grimeIndex(grime)].smellM ?? 0;

/** Grime per hour at a rate point (BODY §6). */
export function grimeRate(asleep, vhFrac, outFrac, sweatLh = 0) {
  return (asleep ? HYGIENE.GRIME_ASLEEP_H : HYGIENE.GRIME_AWAKE_H) + HYGIENE.GRIME_HARD_H * vhFrac + HYGIENE.GRIME_OUT_H * outFrac + HYGIENE.GRIME_PER_SWEAT_L * sweatLh;
}

/** What w minutes of running water leave of grime (BODY §6's rule): 30, 8, 2, 1, 0 for 1 to 5. */
export function washLeft(grime, waterMin) {
  if (!(waterMin > 0)) return grime;
  return Math.min(grime, Math.round(HYGIENE.WASH_LEFT * Math.exp(-(waterMin - 1) / HYGIENE.WASH_TAU_MIN)));
}

/** A shower's water on the body: grime by the water minutes, the sweat off, the hair wet, stress eased (or not: cold). Writes body. */
export function washBody(body, { waterMin = 0, cold = false }, ms) {
  const h = body.hygiene, before = h.grime;
  if (!(waterMin > 0)) return { before, after: before };
  h.grime = washLeft(h.grime, waterMin);
  h.sweatL = 0;
  h.wetUntilMs = ms + HYGIENE.WET_HAIR_MS;
  body.stress.v = cold ? Math.min(100, body.stress.v + HYGIENE.COLD_SHOWER_STRESS) : Math.max(0, body.stress.v - HYGIENE.SHOWER_CALM);
  return { before, after: h.grime };
}

/** The basin: a shave sets the stubble to 0, face and hands take grime × 0.9, teeth noted. Writes body. */
export function groomBody(body, { teeth = false, shave = false, face = false }, ms) {
  const h = body.hygiene;
  if (shave) h.stubbleH = 0;
  if (face) h.grime *= HYGIENE.FACE_K;
  if (teeth) h.teethMs = ms;
  return { shave, face, teeth };
}
