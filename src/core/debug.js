// OLYMPUS core: the debug handle and the test parameters.
//
// window.__olympus is how tests, shots and a curious developer drive the game from outside
// (tradecraft's window.__tradecraft, DESIGN.md, Stack: "Debug handle: window.__olympus exposes
// state, step(n), start, newGame, save, skip and pause"):
//   state              the live state (a getter: it follows loads)
//   step(n, input)     n ticks now, paused or not, with a partial input ({ mx: 1 } is enough), the
//                      same input every tick (an act given here fires n times: step(1, …) for one)
//   start(state|json)  play this state (a save's JSON, or a state object)
//   newGame(opts)      a new career (opts as main.js's newGame: { seed, mode, scenario, hour })
//   save(slot?)        the state's JSON; with a slot, also written there (a promise of the JSON)
//   load(json|slot)    a JSON save (now), or a slot ('auto' by default; a promise)
//   skip(ms, opts)     the loop's skip: time passing in an activity, with its report
//   pause(on)          pause or carry on (a pause reason of its own, 'debug')
//   version            the game's VERSION
//   loop, bus          the machinery, for tests that listen
// and window.__ready turns true after the third frame drawn (main.js), so a test or a shot knows
// the page is up.
//
// URL parameters skip the title for tests and shots (main.js reads them through readParams()):
// ?play=<scenario>&seed=<n>&hour=<h>[&mode=ironman][&debug=1]. hour is the Mars local hour at the
// start (0-24), seed a whole number.
import { toJSON, fromJSON } from './state.js';
import { NO_INPUT } from './loop.js';

/** The test parameters of a URL's query: { play, seed, hour, mode, debug }. */
export function readParams(search = globalThis.location?.search ?? '') {
  const q = new URLSearchParams(search);
  const num = (k) => (q.has(k) && q.get(k) !== '' && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : null);
  return {
    play: q.get('play') || null,
    seed: num('seed'),
    hour: num('hour'),
    mode: q.get('mode') === 'ironman' ? 'ironman' : 'standard',
    debug: q.get('debug') === '1',
  };
}

/**
 * The handle. start(state) plays a state (main.js's launch); newGame(opts) makes one; store is
 * src/core/store.js (for save and load by slot); about(state) the line a save shows in the lists.
 */
export function createDebugHandle({ loop, start, newGame, version = '?', store = null, bus = null, about = () => 'debug' }) {
  const inputOf = (inp) => (inp ? { ...NO_INPUT, ...inp, act: inp.act ?? [] } : NO_INPUT);
  return {
    get state() { return loop.state; },
    get version() { return typeof version === 'function' ? version() : version; },
    step(n = 1, input = null) { return loop.step(n, inputOf(input)); },
    start(s) { return start(typeof s === 'string' ? fromJSON(s) : s); },
    newGame(opts = {}) { return start(newGame(opts)); },
    save(slot = null) {
      const json = toJSON(loop.state);
      if (!slot) return json;
      if (!store) return Promise.reject(new Error('no store'));
      return store.save(slot, loop.state, about(loop.state)).then(() => json);
    },
    load(src = 'auto') {
      if (src && typeof src === 'object') return start(fromJSON(src));
      if (typeof src === 'string' && src.trimStart().startsWith('{')) return start(fromJSON(src));
      if (!store) return Promise.reject(new Error('no store'));
      return store.load(src).then(s => (s ? start(s) : null));
    },
    skip(ms, opts) { return loop.skip(ms, opts); },
    pause(on = true) { return loop.pause(on, 'debug'); },
    loop,
    bus,
  };
}

/** Put the handle on window (globalThis) as __olympus. */
export function installDebug(handle) {
  globalThis.__olympus = handle;
  return handle;
}
