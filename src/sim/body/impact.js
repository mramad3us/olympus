// OLYMPUS body: impacts, a body meeting a face, a deck or a hold too fast (BODY §16.5; ROADMAP "anywhere" step 7; CONTRACTS §21).
//
// The one writer for every blunt meeting of a body and the world: a fall, a floating body into a bulkhead (freefall.js), a grab
// over FREEFALL.GRAB.IMPACT_MS 3 m/s, a body thrown under thrust (src/sim/places/gravity.js, step 6) and, later, a blast's throw.
// impactOf(state, pid, { vMs, first, atMs }) is BODY §16.5's model on the wounds' record (src/sim/body/wounds.js: hurt, injure,
// the blood's anchor), its numbers src/data/body/needs.js FREEFALL.IMPACT:
//   - **What the body takes.** Feet first the legs absorb LEGS_MS 3.0 m/s (TRAINED_MS 4.0 at Fitness TRAINED_FIT 12 or more: a
//     trained landing), ÷ √(the mass ratio, the body and its kit over the body: kit.js kitMassKg on motion.js BODY_KG 75) × bone
//     (BODY §14's index, rec.cond.bone: not modelled yet, so BONE_UNTRACKED 1, named); the hands first HANDS_MS 1.5 m/s the same
//     way (my call); the body first nothing. The rest, eff = vMs − absorbed, is the impact's speed.
//   - **The bands** (LONGHAUL's applyImpact, crew.js, its 0 to 100 losses read as shares of a part's capacity, wounds.js takes):
//     under 1 m/s nothing; bruise 1 to 3, hard 3 to 5 (a 30% fracture), bone-breaking 5 to 8 (a fracture), crushing 8 to 12 (a
//     fracture, the inside bleeding, down KO_MS 60 s), lethal 12 to 18 (the same, the inside bleed at INSIDE_LETHAL_PM), fatal 18
//     and over (dead on the spot). The torso's share is the band's at its edge plus its rise a m/s past it (bruise 0.03 + 0.025 a
//     m/s, hard 0.10 + 0.05, bone-breaking 0.20 + 0.067, crushing 0.40 + 0.0625, lethal 0.60 + 0.05: LONGHAUL's numbers / 100);
//     the part that meets the face (the legs feet first, the arms hands first) takes LEAD_K 1.5 × it, the head HEAD_K 0.3 ×, the
//     other limbs LIMB_K 0.5 ×, each × U(0.8, 1.2). A fracture's chance is the band's × (1 / bone)², on one leading part (a leg
//     feet first, an arm hands first, the ribs body first); every other part cracks as a blow of its force does (injure).
//   - **The draws** are on one stream of their own, stream(seed, 'impact', pid, atMs, the speed in mm/s, first), so an impact is
//     the same whatever was rolled before it, and in one order: the parts' jitters, then each part's injuries in PART_ORDER.
// Returns [{ part, points, state, injuries: [names] }] for the parts it hurt (empty under 1 m/s, or for the dead), with
// impactBand(vMs, first, ctx) the pure band reader the tests and the cards use, and impactWords(list, who) their words.
// Pure but impactOf, which writes the person's body record.
import { stream, range, pick } from '../../core/rng.js';
import { q } from '../../core/num.js';
import { HOUR_MS, DAY_MS } from '../../core/clock.js';
import { FREEFALL } from '../../data/body/needs.js';
import { BODY_TMPL } from '../../data/people/looks.js';
import { DEFAULT_TMPL } from '../../data/body/templates.js';
import { BODY_V } from './record.js';
import { takes, hurt, injure, stateOf, anchorBlood, dieOf } from './wounds.js';
import { valueOf } from '../skills/templates.js';
import * as KIT from '../arms/kit.js';
import { BODY_KG } from './motion.js';

/** BODY §14's bone index where the body record keeps none (the conditioning's daily job is not built): an adult's 1.0, named. */
export const BONE_UNTRACKED = 1;
/** What meets the face first. */
export const FIRSTS = Object.freeze(['feet', 'hands', 'body']);
/** The parts, in the order their injuries are drawn. */
export const PART_ORDER = Object.freeze(['torso', 'head', 'legL', 'legR', 'armL', 'armR']);
const LEAD = Object.freeze({ feet: ['legL', 'legR'], hands: ['armL', 'armR'], body: [] });
const LIMBS = Object.freeze(['legL', 'legR', 'armL', 'armR']);

/** A body record's bone index (see the header). */
export const boneOf = (rec) => (Number.isFinite(rec?.cond?.bone) ? rec.cond.bone : BONE_UNTRACKED);

/**
 * The impact's band, pure (see the header): { band (FREEFALL.IMPACT.BANDS' row or null under 1 m/s), absorbedMs, effMs,
 * torso (the torso's share before the jitter) }. ctx: { fitness, massRatio, bone }.
 */
export function impactBand(vMs, first, { fitness = 10, massRatio = 1, bone = BONE_UNTRACKED } = {}) {
  if (!(vMs >= 0)) throw new Error(`impactBand(): a speed in m/s, not ${vMs}`);
  if (!FIRSTS.includes(first)) throw new Error(`impactBand(): first is one of ${FIRSTS.join(', ')}, not ${first}`);
  if (!(massRatio >= 1)) throw new Error(`impactBand(): the mass ratio is 1 or more, not ${massRatio}`);
  const I = FREEFALL.IMPACT;
  const take = first === 'feet' ? (fitness >= I.TRAINED_FIT ? I.TRAINED_MS : I.LEGS_MS) : first === 'hands' ? I.HANDS_MS : 0;
  const absorbedMs = q(take / Math.sqrt(massRatio) * bone, 1e-4), effMs = q(Math.max(0, vMs - absorbedMs), 1e-4);
  let band = null;
  for (const b of I.BANDS) if (effMs >= b.fromMs) band = b;
  const torso = band ? (band.fatal ? 1 : band.torso + band.perMs * (effMs - band.fromMs)) : 0;
  return { band, absorbedMs, effMs, torso };
}

/**
 * A body meeting something at vMs (see the header): its injuries written on the person's body record. first: 'feet' | 'hands' |
 * 'body'; atMs the moment (the clock's by default). Returns [{ part, points, state, injuries }].
 */
export function impactOf(state, pid, { vMs, first, atMs = state.clock.ms } = {}) {
  const p = state.people?.[pid];
  if (!p) throw new Error(`impactOf(): no person '${pid}'`);
  const rec = (p.body ??= { v: BODY_V, tmpl: BODY_TMPL[p.sex] ?? DEFAULT_TMPL });
  if (rec.dead) return [];
  const fitness = Math.round(valueOf(state, pid, 'fitness')), massRatio = (BODY_KG + KIT.kitMassKg(state, pid)) / BODY_KG, bone = boneOf(rec);
  const B = impactBand(vMs, first, { fitness, massRatio, bone });
  if (!B.band) return [];
  anchorBlood(rec, atMs);
  if (rec.dead) return [];
  if (rec.fitness === undefined) rec.fitness = fitness;
  const I = FREEFALL.IMPACT, ms = atMs, r = stream(state.meta?.seed ?? 0, 'impact', pid, ms, Math.round(vMs * 1000), first);
  if (B.band.fatal) {
    for (const part of ['torso', 'head']) hurt(rec, part, takes(rec, part));
    dieOf(rec, ms, 'impact');
    return [{ part: 'torso', points: q(takes(rec, 'torso'), 0.1), state: 'out', injuries: ['killed on impact'] }];
  }
  const lead = LEAD[first], share = {};
  for (const part of PART_ORDER) {
    const k = part === 'torso' ? 1 : part === 'head' ? I.HEAD_K : lead.includes(part) ? I.LEAD_K : I.LIMB_K;
    share[part] = B.torso * k * range(r, I.JITTER[0], I.JITTER[1]);
  }
  // (the fracture on one leading part: a leg feet first, an arm hands first, the ribs body first)
  const broke = B.band.fracture ? (lead.length ? pick(r, lead) : 'torso') : null, fracK = Math.min(1, (B.band.fracture ?? 0) / (bone * bone));
  const out = [];
  for (const part of PART_ORDER) {
    const pts = share[part] * takes(rec, part);
    if (pts < 0.05) continue;
    hurt(rec, part, pts);
    const made = injure(rec, part, share[part], r, ms, part === broke ? { fracture: fracK } : {});
    out.push({ part, points: q(pts, 0.1), state: stateOf(rec, part), injuries: made.map(i => i.name) });
  }
  // (crushing and lethal: the inside bleeding (a torso's, as a chest wound's: BODY §17) and the body down)
  if (B.band.inside) {
    const rate = B.band.id === 'lethal' ? I.INSIDE_LETHAL_PM : I.INSIDE_PM;
    const i = { part: 'torso', kind: 'cut', name: 'bleeding inside, from the impact', ms, until: ms + 30 * DAY_MS, bleed: ms + I.INSIDE_H * HOUR_MS, rate, deep: true, internal: true };
    (rec.injuries ??= []).push(i);
    out.find(o => o.part === 'torso')?.injuries.push(i.name);
  }
  if (B.band.ko) rec.knock = { untilMs: Math.max(rec.knock?.untilMs ?? 0, ms + I.KO_MS) };
  return out;
}

/** What an impact did, in words (never numbers): the hurt parts' states and their injuries, or "unhurt". who: 'You' or a name. */
export function impactWords(list, who = 'You') {
  if (!list?.length) return `${who}: unhurt.`;
  if (list.some(o => o.injuries.includes('killed on impact'))) return `${who}: killed on impact.`;
  const names = list.flatMap(o => o.injuries);
  const worst = list.reduce((a, o) => (['bruised', 'hurt', 'wounded', 'out'].indexOf(o.state) > ['bruised', 'hurt', 'wounded', 'out'].indexOf(a) ? o.state : a), 'bruised');
  return `${who}: ${worst}${names.length ? `, ${names.join(', ')}` : ''}.`;
}
/** The limbs' keys (the tests' reading). */
export { LIMBS as IMPACT_LIMBS };
