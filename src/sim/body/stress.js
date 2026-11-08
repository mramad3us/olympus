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
// 0.0.10 (the build sheet 0.0.10 §2.1, §8 item 20; BODY §9.3): addStress is the body's own door for an instant rise, the
// one the chaos's band term takes (combat/supp.js foldStress, which integrates it in closed form): the record brought to
// ms through body.js's door (bodySync), stress.v raised, at most STRESS.MAX, rounded to 1e-9 as the stepper rounds it,
// the rate point dropped and the next crossing solved again (as a shower's calm or an accident's +10 go through it), and
// the 'body-event' fact 'stress' (amount the points, why 'the chaos'). The acute fight inputs of BODY §9.1 wait for
// something that posts them.
import { STRESS, STRESS_BANDS, MORALE, MORALE_BANDS } from '../../data/body/needs.js';
import { q } from '../../core/num.js';
import { bodySync, bodyOf, storeBody, resolveCrossing } from './body.js';

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

/**
 * Stress raised by pts at ms (w; see the header): through the body's door, at most STRESS.MAX. Returns { before, after },
 * or null for a body not simulated or nothing to add.
 */
export function addStress(state, pid, pts, ms = state?.clock?.ms, bus = null, why = 'the chaos') {
  const p = state?.people?.[pid];
  if (!(pts > 0) || !p?.body || p.body.atMs === null || p.body.atMs === undefined) return null;
  bodySync(state, pid, ms, bus);
  const body = bodyOf(state, pid, ms), before = body.stress.v;
  const after = q(Math.min(STRESS.MAX, before + pts), 1e-9);
  body.stress.v = after;
  if (body.held) body.held.rp = null;
  storeBody(p, body);
  resolveCrossing(state, pid, ms);
  bus?.emit('body-event', { who: pid, kind: 'stress', atMs: ms, amount: q(after - before, 1e-9), why });
  return { before, after };
}
