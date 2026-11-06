// OLYMPUS scenarios: the test scenes' fills, the barracks set up for one mechanic the user plays and scores (ROADMAP §2.2; the build sheet 0.0.4 §2.2.9).
//
// Each fill is the barracks (src/sim/scenarios/barracks.js: Echo Company drawn from the world's seed,
// the player in 1st Squad's bay) on Monday Sol 590 at its scene's hour (src/data/scenes.js; newGame
// moves the clock there before the fill when given the hour, and the fill does so itself when it was
// not, by newGame's own rule), the player at their rack's foot facing up the bay, in the scene's
// outfit, their body BODY's start body (startBody: a marine at reveille after a standard night, run
// along the reference sol to the hour) with the scene's ledgers set on it (grime, sweatL, stubbleH,
// pressureH, bladderMl). test-night forces the night's alert drill to 02:30 the next morning
// (time.drills.forced, read by TIME's postNight, which the time domain's start() runs after the fill:
// the user's rule that the drill's night is drawn holds for every career, and the scene alone pins it).
import { TICK_MS } from '../../core/clock.js';
import { msAtMarsTime } from '../../core/calendar.js';
import { START_MS, SITES } from '../../data/setting/calendar.js';
import { SCENES } from '../../data/scenes.js';
import { barracks, BARRACKS } from './barracks.js';
import { playerActor, playerId } from '../../core/ids.js';
import { siteOf } from '../places/model.js';
import { atLocal } from '../time/pod.js';
import { localSol } from '../../core/calendar.js';
import { setOutfit } from '../people/place.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';

/** Where the test scenes play. */
export const TESTS = Object.freeze({ site: BARRACKS.site, area: BARRACKS.area });

// (the scene's ledgers, by their names in the scene, onto the body record)
const LEDGERS = Object.freeze({
  grime: ['hygiene', 'grime'], sweatL: ['hygiene', 'sweatL'], stubbleH: ['hygiene', 'stubbleH'],
  pressureH: ['sleep', 'pressureH'], bladderMl: ['bladder', 'ml'],
});
/** Set a scene's ledgers on a body record (writes). */
export function setLedgers(body, values = {}) {
  for (const [k, v] of Object.entries(values)) {
    const path = LEDGERS[k];
    if (!path) throw new Error(`a scene's ledger '${k}' the body does not have (${Object.keys(LEDGERS).join(', ')})`);
    (body[path[0]] ??= {})[path[1]] = v;
  }
  return body;
}

const lonOfSite = () => SITES[siteOf(TESTS.site)?.geo]?.lonEDeg ?? 0;

// (a scene's fill: the clock at its hour if newGame did not put it there, the barracks, the player's outfit and body)
function fillScene(scene) {
  return function fill(state, { at = null } = {}) {
    const lon = lonOfSite();
    if (state.clock.ms === START_MS && scene.hour !== null) {
      const h = Math.floor(scene.hour), m = Math.round((scene.hour - h) * 60);
      const t = msAtMarsTime(state.clock.ms, h, m, lon);
      state.clock.ms = state.meta.createdMs = Math.ceil(t / TICK_MS) * TICK_MS;
    }
    barracks(state, { at: { face: 'up', ...(at ?? {}) } });
    const me = playerActor(state), pid = playerId(state), person = state.people[pid];
    setOutfit(me, scene.outfit);
    // (the start body as a career's: its own traits drawn from the seed, stored as its deltas, so the sleep need does not change at its first sync)
    person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, lon, state.meta.seed), scene.body));
    if (scene.drill) {
      // (the night beginning on the scene's sol: its drill the next morning at the scene's hour)
      const night = localSol(state.clock.ms, lon).sol, sol = scene.drill.hour < 12 ? night + 1 : night;
      (state.time.drills ??= {}).forced = atLocal(sol, scene.drill.hour, lon);
    }
    return state;
  };
}

/** The fill of 'test-shower', "Ten minutes under the shower". */
export const testShower = fillScene(SCENES['test-shower']);
/** The fill of 'test-night', "The klaxon at 02:30". */
export const testNight = fillScene(SCENES['test-night']);
