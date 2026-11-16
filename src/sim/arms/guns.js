// OLYMPUS arms: a person's guns, where each one is and which one is in use (COMBAT §25.19.6; VIEWS §4.4; the build sheet 0.0.18 §2.1).
//
// The shoot house issues every sheet the P-12 beside the R-7 (the user, 2026-11-15: one loadout), and v0.0.17 showed only the gun
// in use: the holstered pistol's condition, or the rifle hanging on its sling with a double feed, were nowhere on screen. This
// module says where each gun is, from the kit alone: a pistol in kit.worn.holster is 'holster', one in a hand (kit.js handGunOf)
// 'hands'; the rifle with a pistol in the hand is 'hanging', a rifle whose carry is slung takes that posture's name
// ('slungFront', 'slungBack'; firearms.js's hang slings it in front), otherwise 'hands'. Where your guns are is felt, not believed,
// as the selector is (firearms.js beliefOf reads it for the holder), so a place travels beside a gun's belief, never inside it
// (the HUD's BELIEF_FIELDS rule stands). gunsOf lists them, the one in use first (state.stop.gun in stop motion, else the gun in
// the hand, else the rifle); otherGunView is the one thing the weapon card's strip reads (null with one gun, so every scene
// without a sidearm draws v0.0.17's card); accessOf is the sub-steps that bring a gun to the hands and put it back (the
// holstered P-12's rows: the rifle let hang and the pistol drawn, then holstered and the rifle up). Pure.
import { beliefOf, finishOf } from './firearms.js';
import { handGunOf, pistolOf } from './kit.js';
import { modelOf, isLong } from './models.js';
import { SLUNG } from './carry.js';

const kitOf = (state, pid) => state.people?.[pid]?.kit ?? null;
/** The gun a person uses now: the one stopped in stop motion, else the one in a hand, else the rifle (shooting.js gunOn's rule). */
export const inUseOf = (state, pid) => (state.stop?.who === pid ? state.stop.gun : null) ?? handGunOf(state, pid) ?? kitOf(state, pid)?.worn?.sling ?? null;

/** Where a gun is (see the header): 'hands' | 'hanging' | 'slungFront' | 'slungBack' | 'holster'. */
export function gunPlaceOf(state, pid, gunId) {
  const k = kitOf(state, pid), g = state.items?.[gunId];
  if (!k || !g) return null;
  if (!isLong(modelOf(g))) return k.worn?.holster === gunId ? 'holster' : 'hands';
  const other = handGunOf(state, pid);
  if (other && other !== gunId) return 'hanging';
  const posture = k.carry?.posture ?? 'slungFront';
  return SLUNG.has(posture) ? posture : 'hands';
}

/** A person's guns, the one in use first: [{ id, model, short, kind: 'rifle' | 'pistol', place, inUse, finish }]. */
export function gunsOf(state, pid) {
  const k = kitOf(state, pid);
  if (!k) return [];
  const use = inUseOf(state, pid), ids = [k.worn?.sling ?? null, pistolOf(state, pid)].filter((id, i, a) => id && state.items?.[id]?.type === 'gun' && a.indexOf(id) === i);
  const out = ids.map(id => {
    const g = state.items[id], M = modelOf(g);
    return { id, model: g.model, short: M?.short ?? g.model, kind: isLong(M) ? 'rifle' : 'pistol', place: gunPlaceOf(state, pid, id), inUse: id === use, finish: finishOf(g) };
  });
  return out.sort((a, b) => Number(b.inUse) - Number(a.inUse));
}

/** The gun not in use, for the weapon card's strip: { id, model, short, place, belief, finish }, or null with one gun carried. */
export function otherGunView(state, pid) {
  const list = gunsOf(state, pid);
  if (list.length < 2) return null;
  const o = list.find(g => !g.inUse);
  return o ? { id: o.id, model: o.model, short: o.short, place: o.place, belief: beliefOf(state, o.id), finish: o.finish } : null;
}

/**
 * The sub-steps that bring a gun to the hands and put it back (Track B's four cases): { pre, post }. A holstered pistol with the
 * rifle up: the rifle let hang, the draw, then the holster and the rifle up; with the rifle slung: the draw and the holster; the
 * rifle hanging with the pistol out: the pistol holstered and the rifle up, which stays in use; a slung rifle comes up; a gun in
 * the hands needs nothing.
 */
export function accessOf(state, pid, gunId) {
  const place = gunPlaceOf(state, pid, gunId), k = kitOf(state, pid);
  if (place === 'holster') {
    const up = !SLUNG.has(k?.carry?.posture ?? 'slungFront') && !!k?.worn?.sling;
    return up ? { pre: ['hang', 'draw:thigh'], post: ['holster', 'up'] } : { pre: ['draw:thigh'], post: ['holster'] };
  }
  if (place === 'hanging') return { pre: ['holster', 'up'], post: [] };
  if (place === 'slungFront' || place === 'slungBack') return { pre: ['up'], post: [] };
  return { pre: [], post: [] };
}
