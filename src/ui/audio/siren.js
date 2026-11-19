// OLYMPUS audio: the brace siren, a ship's warning before its thrust changes (v0.0.24, ROADMAP "anywhere" step 6; AW§4.3 item 3; VIEWS §11).
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): each frame it reads the gravity's moment (src/sim/places/
// gravity.js gravNow) and, while a brace is warned (the phase 'warn', from the 1MC's warning to the onset), plays the siren's
// cycle (src/data/sounds.js WORLD.siren, samples/void-look's S-a until scored) once each SIREN_CYCLE_MS from the warning, as
// world.js plays the klaxon's whoop at each of its cycles. The ship's speakers are in every compartment (the 1MC's circuit), so
// the siren is heard where you are, through the compartment's air (people/hearing.js airDb and steps.js lowpassHz, the one law
// each), never through walls or by distance (my call). Nothing plays in vacuum (no air to carry it: the suit's bus is step 8's),
// while time stands still, or before the context runs (the engine's own rule).
// sirenCycle(now, ms) is the pure part (the grav-hud test reads it): the cycle number the moment is in, or null outside a warning.
// createSiren(engine) takes the engine's world ops (oneShot) and gives { frame(state, ms), stats }.
import { playerActor } from '../../core/ids.js';
import { airDb } from '../../sim/people/hearing.js';
import { airAt } from '../../sim/places/env.js';
import { gravNow } from '../../sim/places/gravity.js';
import { SIREN_CYCLE_MS, SIREN_DB } from '../../data/sounds.js';
import { lowpassHz } from './steps.js';

/** The siren's cycle at ms for a moment (gravNow's), or null when no brace is warned. */
export function sirenCycle(now, ms) {
  if (!now || now.phase !== 'warn' || !(ms < now.atMs)) return null;
  return Math.max(0, Math.floor((ms - (now.atMs - now.warnS * 1000)) / SIREN_CYCLE_MS));
}

/** The siren in the engine (see the header). */
export function createSiren(engine) {
  const stats = { cycles: 0, last: null };
  let lastKey = null;
  function frame(state, ms = state?.clock?.ms) {
    const me = state ? playerActor(state) : null;
    if (!me) { lastKey = null; return; }
    let now = null;
    try { now = gravNow(state, ms); } catch { now = null; }
    const cycle = sirenCycle(now, ms);
    if (cycle === null) { lastKey = null; return; }
    const key = `${now.i}:${now.atMs}:${cycle}`;
    if (key === lastKey) return;
    lastKey = key;
    const air = airAt(state, null, me.x, me.z);
    if (air.vacuum) return;
    const gainDb = SIREN_DB + airDb(air.pKpa), lowHz = lowpassHz(air.pKpa);
    if (engine.oneShot('siren', { gainDb, lowHz, pan: 0 })) { stats.cycles++; stats.last = { cycle, gainDb: Math.round(gainDb * 10) / 10, lowpassHz: Math.round(lowHz) }; }
  }
  return { frame, stats };
}
