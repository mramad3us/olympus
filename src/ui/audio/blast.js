// OLYMPUS audio: the kit's bursts in the ears, the G-11's and the SC-1's reports in the shoot house, through the combat EVA suit (WEAPONS §12.5; the build sheet 0.0.18 §2.3, §11).
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): it hears the 'fx' facts of the house's bursts (burst.js:
// a flash grenade's 'bang' through supp.js bang(), a charge's 'blast' with its model) and plays bang.js's report recipe
// ('bangReport') for them, so no new buffer is baked. blastVoice(...) is the pure part the audio-blast test measures:
//   the source  BANG_SOURCE_DB (the G-11's, bang.js's training bang the same flash composition) over the recipe's peak at 1 m, a
//               charge louder by its peak's ratio at 1 m (blast.js peakKPa: the SC-1's 0.1 kg 12.6 dB over the G-11's 0.0143 kg in
//               the Wheel's air), slower (BLAST_RATE: the bigger charge's longer positive phase, W^(1/3)), less the air's (airDb)
//               and the distance's fall on the floor's rolloff;
//   the suit    the combat EVA suit's sealed helmet (supp.js protOf: ears 'suit') takes the report through its electronics as the
//               range's defenders take a bang (bang.js: EARS_DB, low-passed at EARS_LP_HZ), and clamps it at the gate
//               (SUIT_GATE_DB, BANG_SOURCE_DB + EARS_DB: the loudest report a gated ear passes): WEAPONS §12.5's "a thump and a
//               flicker", the SC-1 at the gate from a few metres in, never over it;
//   the place   its moment on the audio clock (its place in the tick that brought it, then the flight of the sound), panned by
//               its offset; never the bay's berm echo (the house has none).
// fact(type, payload, state) answers a house's 'fx' bang or blast (the bay's bangs stay bang.js's: "Three bangs" and "Bang" as
// scored), and stats keeps the last one for the tests and the handle.
import { playerActor } from '../../core/ids.js';
import { TICK_MS } from '../../core/clock.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { airHere, needSound } from './range.js';
import { peakKPa } from '../../sim/arms/blast.js';
import { DEVICES } from '../../sim/arms/devices.js';
import { ROLLOFF, PAN_FULL_M, BANG_SOURCE_DB, EARS_DB, EARS_LP_HZ } from '../../data/sounds.js';

/** The suit's gate: the loudest report the sealed helmet's electronics pass (dB on the engine's scale). */
export const SUIT_GATE_DB = BANG_SOURCE_DB + EARS_DB;
/** A charge's report played slower than the G-11's by this (its longer positive phase: my call). */
export const BLAST_RATE = 0.8;
const dbOfDist = (dM, roll = ROLLOFF.floor) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
const r1 = (v) => Math.round(v * 10) / 10;

/** A charge's level over the G-11's at 1 m (dB): the ratio of their peaks there (blast.js), 0 for the G-11 itself. */
export function sourceDb(model, pKpa) {
  const W = DEVICES[model]?.tntKg ?? DEVICES.g11.tntKg, ref = peakKPa(DEVICES.g11.tntKg, 1, pKpa), p = peakKPa(W, 1, pKpa);
  return ref > 0 && p > 0 ? 20 * Math.log10(p / ref) : 0;
}

/**
 * A burst as you hear it (see the header): { gainDb, lowpassHz, distM, pan, rate, delayS, gated }. me { x, z }; at { x, z } the
 * burst; model its device; suit: the sealed helmet worn; soundMs, pKpa the air.
 */
export function blastVoice({ me = null, at = null, model = 'g11', suit = false, soundMs, pKpa, lagS = 0 } = {}) {
  needSound(soundMs);
  const dx = me && at ? at.x - me.x : 0, dz = me && at ? at.z - me.z : 0, distM = Math.hypot(dx, dz);
  let gainDb = BANG_SOURCE_DB + sourceDb(model, pKpa) + airDb(pKpa) + dbOfDist(distM), lp = lowpassHz(pKpa), gated = false;
  if (suit) { gainDb = Math.min(gainDb + EARS_DB, SUIT_GATE_DB); lp = Math.min(lp, EARS_LP_HZ); gated = true; }
  const charge = DEVICES[model]?.kind === 'charge';
  return { gainDb, lowpassHz: lp, distM, pan: Math.max(-1, Math.min(1, dx / PAN_FULL_M)), rate: charge ? BLAST_RATE : 1, delayS: lagS + (soundMs > 0 ? distM / soundMs : 0), gated };
}

/** The presenter (see the header): { fact(type, payload, state), stats }. engine: { bang(kind, opts) } (bang.js's ops). looks: { suitOn(state, pid) }. */
export function createBlast(engine, { looks = {} } = {}) {
  const stats = { bursts: 0, last: null };
  const suitOf = (state) => { try { return !!(looks.suitOn ? looks.suitOn(state, state.player?.id) : state.people?.[state.player?.id]?.kit?.worn?.suit); } catch { return false; } };
  /** Whether a fact is a house burst this presenter plays (a blast, or a bang in the shoot house). */
  const ours = (type, f, state) => type === 'fx' && !!state && (f?.kind === 'blast' || (f?.kind === 'bang' && state.armoury?.range?.course === 'house'));
  function fact(type, f, state) {
    if (!ours(type, f, state)) return false;
    const a = playerActor(state), me = a ? { x: a.x, z: a.z } : null, air = airHere(state);
    const lagS = Number.isFinite(f.atMs) ? Math.max(0, Math.min(TICK_MS, f.atMs - (state.clock.ms - TICK_MS))) / 1000 : 0;
    const model = f.model ?? (state.items?.[f.id]?.model ?? 'g11');
    const v = blastVoice({ me, at: { x: f.x, z: f.z }, model, suit: suitOf(state), soundMs: air.soundMs, pKpa: air.pKpa, lagS });
    const ok = engine.bang('bangReport', { delayS: v.delayS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, rate: v.rate });
    if (ok) { stats.bursts++; stats.last = { kind: f.kind, model, gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM), gated: v.gated }; }
    return ok;
  }
  return { fact, ours, stats };
}
