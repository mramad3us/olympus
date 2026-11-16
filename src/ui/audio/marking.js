// OLYMPUS audio: the marking round in the ears, its report and the slap of its strike (the build sheet 0.0.19 §1 L-look; opfor §1, §2.4).
//
// The first live men fire marking rounds (calibres.js 'marking': 0.5 g at 120 m/s, subsonic, a sting and paint, never a wound), and
// so does the stack on the live lane. A marking cartridge is a reduced-energy round: no crack (it is subsonic), a smaller charge and
// a short, softer report, a pop, MARKING_DB under the same gun's report and with its top cut at MARKING_LP_HZ (my call: force on
// force cartridges are said to be "much quieter", about a fifth of the loudness by the ear; the number is to check). markingShot(v)
// turns gun.js's voices for the gun (ownShot or otherShot, played subsonic) into the marking round's; range.js shotSound plays a
// shot whose load is 'marking' through it, so one gun keeps one voice and the marking is a filter on it. Its strike on a body is a
// wet slap (the 'impact' recipe high and short, SLAP_DB at a metre, rolled off with the floor's distance), heard where the struck
// man stands on the house's 'paint' fact ({ phase: 'paint', who, atMs }). Pure but createMarking.
import { playerActor } from '../../core/ids.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { airHere } from './range.js';
import { ROLLOFF, PAN_FULL_M } from '../../data/sounds.js';

/** The marking report under the gun's own (dB), its lowpass (Hz): see the header. */
export const MARKING_DB = -14, MARKING_LP_HZ = 2600;
/** The paint's slap at a metre (dB on the impact recipe's scale), its lowpass (Hz) and its rate (the recipe pitched up: short). */
export const SLAP_DB = -12, SLAP_LP_HZ = 3800, SLAP_RATE = 1.5;
/** Whether a shot fact is a marking round's (the load's key, or the fact's own flag). */
export const isMarking = (f) => f?.load === 'marking' || f?.marking === true;
/** gun.js's voices for a shot (ownShot or otherShot's { voices, gainDb, lowpassHz, … }) as the marking round's: quieter, duller. */
export function markingShot(v) {
  if (!v) return v;
  const voice = (x) => ({ ...x, gainDb: x.gainDb + MARKING_DB, lowHz: Math.min(x.lowHz ?? MARKING_LP_HZ, MARKING_LP_HZ) });
  return { ...v, voices: (v.voices ?? []).map(voice), gainDb: v.gainDb + MARKING_DB, lowpassHz: Math.min(v.lowpassHz ?? MARKING_LP_HZ, MARKING_LP_HZ), marking: true };
}
/** The slap of a marking round's strike heard from me at the struck man (at): { gainDb, lowpassHz, pan, distM }. */
export function slapVoice({ me = null, at = null, pKpa } = {}) {
  const dx = me && at ? at.x - me.x : 0, dz = me && at ? at.z - me.z : 0, d = Math.max(0.5, Math.hypot(dx, dz));
  const gainDb = SLAP_DB + airDb(pKpa) + 20 * Math.log10(1 / (1 + ROLLOFF.floor * Math.max(0, d - 1)));
  return { gainDb, lowpassHz: Math.min(lowpassHz(pKpa), SLAP_LP_HZ), pan: Math.max(-1, Math.min(1, dx / PAN_FULL_M)), distM: d };
}
/** The marking's ear: { fact(type, payload, state), stats }: the slap on a 'house' fact of phase 'paint'. engine: { shot(kind, opts) }. */
export function createMarking(engine) {
  const stats = { slaps: 0, lastSlap: null };
  function fact(type, f, state) {
    if (type !== 'house' || f?.phase !== 'paint' || !state) return false;
    const a = state.actors?.list?.find(x => x.who === f.who), me = playerActor(state);
    if (!a) return false;
    const v = slapVoice({ me: me ? { x: me.x, z: me.z } : null, at: { x: a.x, z: a.z }, pKpa: airHere(state).pKpa });
    if (!engine.shot('impact', { gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, rate: SLAP_RATE })) return false;
    stats.slaps++; stats.lastSlap = { gainDb: Math.round(v.gainDb * 10) / 10, distM: Math.round(v.distM * 10) / 10, who: f.who };
    return true;
  }
  return { fact, stats };
}
