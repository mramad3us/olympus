// OLYMPUS tests: the user's walk of v0.0.3 as a bot plan (ROADMAP §4.4's moment 2, "The bay at 23:00";
// the build sheet 0.0.3 §6 items 5 to 9), for game-walk (node) and browser (the page) alike.
//
// From the foot of the player's rack in bay-2-1 at 23:00: the aisle walked east and west under the
// fire watch's red lamp past the sleeping squad, back to the rack; six debug hours ($, an Earth hour
// each: 04:20 Melas time) and R's fifteen-minute waits until the bay's lights are on (05:30 on a
// weekday: the last wait ends at 05:35); out by the bay door (R), up the east
// stair to the Weapons Platoon's hall and down the main stair, through the lobby and the vestibule's
// two doors (R) onto Echo's street; there, waiting for the sun to clear the canyon's wall; west along
// the street and north round the barracks' west end (the 4 m between Echo and the armoury), across
// the valley floor to the north fence 1.5 m inside it (the gates are closed this release: the sheet's
// §8 item 19), 214 m from the door; back the same way, and in by the front door to the rack. Every primitive is the bots'
// toolkit (tests/bots/lib.mjs), so its memory is plain data on the player's actor and a save made at
// any tick carries the walk on (tradecraft's rule). Two primitives are its own: press(act), an action
// pressed once, and pressUntil(pred, act), an action pressed until pred holds (each press a skip the
// game runs to its end before the next tick, as the page's splash would).
import { goTo, crossTo, waitUntil, plan } from './bots/lib.mjs';
import { ROUTE_LEG_M } from './bots/walker.mjs';
import { sunAt } from '../src/sim/places/sun.js';
import { lightingOf } from '../src/sim/places/light.js';
import { HOUR_MS } from '../src/core/clock.js';

/** The walk's start: the barracks at 23:00, seed 48213 (the build sheet's §6 item 5). */
export const WALK_START = Object.freeze({ scenario: 'barracks', seed: 48213, hour: 23 });

/** An action pressed once (a debug skip, R): done on the tick after. */
export function press(act) {
  return {
    name: `press ${typeof act === 'string' ? act : act.act}`,
    start() { return { pressed: false }; },
    step(state, me, m) {
      if (m.pressed) return { done: true };
      m.pressed = true;
      return { input: { act: [act] } };
    },
  };
}

/** An action pressed until pred(state) holds, at most `most` times (R's waits until the lights are on). */
export function pressUntil(pred, act, most = 16) {
  return {
    name: `press ${typeof act === 'string' ? act : act.act} until`,
    start() { return { n: 0 }; },
    step(state, me, m) {
      if (pred(state)) return { done: true };
      if (m.n >= most) return { fail: 'never' };
      m.n++;
      return { input: { act: [act] } };
    },
  };
}
/** Whether bay-2-1's lights are on (places' lightingOf: past reveille). */
export const bayLit = (s) => lightingOf(s, 'melas.echo.1', 'e1.bay-2-1', s.clock.ms) !== 'lightsOut';

/** The walk on the ground from Echo's front door to the north fence: west along the street, north between Echo and the armoury. */
export const TO_FENCE = Object.freeze([[522, 216.5], [478, 216.5], [478, 186], [478, 1.5]].map(p => Object.freeze(p)));
// (a polyline cut into goTo legs of ROUTE_LEG_M on the ground's windows, the walker's way; the last arrives exactly)
function lineSteps(pts, cls) {
  const out = [];
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / ROUTE_LEG_M));
    for (let i = 1; i <= n; i++) out.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]);
  }
  return out.map((p, i) => goTo(p, { cls, area: 'melas.ground', arriveM: i === out.length - 1 ? 0.2 : 0.6, openDoors: false }));
}

/** The walk's primitives, in order, each with a name the tests print. */
export function walkSteps({ cls = 'C0' } = {}) {
  const north = lineSteps(TO_FENCE, cls), back = lineSteps([...TO_FENCE].reverse(), cls);
  const e1 = 'melas.echo.1', e2 = 'melas.echo.2';
  return [
    ['the aisle east, at 23:00', goTo({ x: 58.4, z: 3.95 }, { cls, area: e1 })],
    ['the aisle west', goTo({ x: 50.2, z: 3.95 }, { cls, area: e1 })],
    ['back to the rack', goTo({ x: 52.075, z: 3.3 }, { cls, area: e1 })],
    ...Array.from({ length: 6 }, (_, i) => [`debug hour ${i + 1}`, press(`debug:skip:${HOUR_MS}`)]),
    ['R until the lights come on', pressUntil(bayLit, 'hand')],
    ['out of the bay and up the east stair', crossTo({ area: e2, x: 80.95, z: 16.0 }, { cls })],
    ['the Weapons Platoon\'s hall', goTo({ x: 66.0, z: 8.8 }, { cls, area: e2 })],
    ['down to the lobby', crossTo({ area: e1, x: 42.0, z: 15.0 }, { cls })],
    ['out through the vestibule onto the street', crossTo({ area: 'melas.ground', x: 522, z: 216.5 }, { cls })],
    ['the sun over the canyon\'s wall', waitUntil((s) => sunAt('melas', s.clock.ms).visible >= 1, 30 * 60_000)],   // (the whole disc clear of the rim: the light has come all the way up)
    ...north.map((p, i) => [`to the north fence, leg ${i + 1}`, p]),
    ...back.map((p, i) => [`back to the front door, leg ${i + 1}`, p]),
    ['in by the front door, to the rack', crossTo({ area: e1, x: 52.075, z: 3.3 }, { cls })],
  ];
}

/** The walk as a bot: plan() over walkSteps' primitives. */
export const walkBot = (opts) => plan(walkSteps(opts).map(([, p]) => p));
