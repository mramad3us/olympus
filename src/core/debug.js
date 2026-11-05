// OLYMPUS core: the debug handle and the test parameters.
//
// window.__olympus is how tests, shots and a curious developer drive the game from outside
// (tradecraft's window.__tradecraft; TECH §15.2):
//   state              the live state (a getter: it follows loads)
//   version            the game's VERSION
//   step(n, input)     n ticks now, paused or not, with a partial input ({ mx: 1 } is enough), the
//                      same input every tick (an act given here fires n times: step(1, …) for one)
//   start(state|json)  play this state (a save's JSON, or a state object): a promise of the state
//   newGame(opts)      a new career (opts as src/sim/game.js newGame: { seed, mode, scenario, hour }),
//                      played at once: a promise of the state
//   save(slot?)        the state's JSON; with a slot, also written there (a promise of the JSON). A
//                      bare name ('auto', 'manual-3') is the state's own world's; one holding a ':'
//                      is taken as it is
//   load(json|slot)    a JSON save (now), or a slot ('auto' by default, in the state's world: a promise)
//   skip(ms, { what }) time passing in an activity (the sim's skipNow: activity what, 'idle' by
//                      default, mask D), with its skip-end report
//   pause(on)          pause or carry on (a pause reason of its own, 'debug')
//   events()           the queue in its order, each with its time on the live site's clock (main.js
//                      gives the sim's dates.js solText: core can't import SETTING's years) and in UTC
//   report()           a bug report of the state now: the page's own (main.js gives the builder its
//                      menu's Report a problem uses, so both carry the anchor, the renderer, the
//                      engine, the screen and the density: a promise), else the store's reportOf
//   view               the stage's numbers (the view's stats, with idle and pending), or null
//   loop, bus, sim     the machinery, for tests that listen
// and window.__ready turns true once the page has drawn its frames with nothing pending (main.js),
// so a test or a shot knows the page is up.
//
// URL parameters skip the title for tests and shots (main.js reads them through readParams()):
// ?play=<scenario>&seed=<n>&hour=<h>[&mode=ironman][&debug=1], hour being the Mars local hour at the
// start (0-24, a fraction giving minutes), seed a whole number; and for the stage &prop=chibi|soldier
// (the figure: chibi until the look is scored), &mood=<name>, &fog=1, &nostore=1 (no IndexedDB
// writes: shots, benches, agents' smoke runs) and &perf=1 (the GL counters and pass times).
import { toJSON, fromJSON } from './state.js';
import { NO_INPUT } from './loop.js';
import { sorted } from './queue.js';
import { utcText, marsTimeText } from './calendar.js';

export const PROPS = Object.freeze(['chibi', 'soldier']);

/** The test parameters of a URL's query: { play, seed, hour, mode, debug, prop, mood, fog, nostore, perf }. */
export function readParams(search = globalThis.location?.search ?? '') {
  const q = new URLSearchParams(search);
  const num = (k) => (q.has(k) && q.get(k) !== '' && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : null);
  const on = (k) => q.get(k) === '1';
  return {
    play: q.get('play') || null,
    seed: num('seed'),
    hour: num('hour'),
    mode: q.get('mode') === 'ironman' ? 'ironman' : 'standard',
    debug: on('debug'),
    prop: PROPS.includes(q.get('prop')) ? q.get('prop') : 'chibi',
    mood: q.get('mood') || null,
    fog: on('fog'),
    nostore: on('nostore'),
    perf: on('perf'),
  };
}

/**
 * The handle. start(state) plays a state (main.js's launch, which may return a promise); newGame(opts)
 * makes one; sim is src/sim/game.js's; store is src/core/store.js (for save and load by slot and the
 * report); about(state) the line a save shows in the lists; view the stage's view, if any; solText(ms,
 * lonE) the watch's face for events() (the sim's dates.js, SETTING's years bound), else the bare clock;
 * report() the page's bug report builder (main.js: what the menu's Report a problem writes), if any.
 */
export function createDebugHandle({ loop, sim = null, start, newGame, version = '?', store = null, bus = null, about = () => 'debug', view = null, solText = null, report = null }) {
  const inputOf = (inp) => (inp ? { ...NO_INPUT, ...inp, act: inp.act ?? [] } : NO_INPUT);
  const slotOf = (name) => {
    const s = String(name);
    if (s.includes(':') || !store?.slotFor) return s;
    return store.slotFor(loop.state ?? {}, s);
  };
  const lonOf = (state) => { try { return sim?.lonOf?.(state) ?? 0; } catch { return 0; } };
  return {
    get state() { return loop.state; },
    get version() { return typeof version === 'function' ? version() : version; },
    step(n = 1, input = null) { return loop.step(n, inputOf(input)); },
    start(s) { return Promise.resolve(start(typeof s === 'string' ? fromJSON(s) : s)); },
    newGame(opts = {}) { return Promise.resolve(start(newGame(opts))); },
    save(slot = null) {
      const json = toJSON(loop.state);
      if (!slot) return json;
      if (!store) return Promise.reject(new Error('no store'));
      return store.save(slotOf(slot), loop.state, about(loop.state)).then(() => json);
    },
    load(src = 'auto') {
      if (src && typeof src === 'object') return Promise.resolve(start(fromJSON(src)));
      if (typeof src === 'string' && src.trimStart().startsWith('{')) return Promise.resolve(start(fromJSON(src)));
      if (!store) return Promise.reject(new Error('no store'));
      return store.load(slotOf(src)).then(s => (s ? start(s) : null));
    },
    skip(ms, { what = null } = {}) {
      if (!sim) throw new Error('no sim to skip time in');
      return sim.skipNow(loop.state, { activity: what ?? 'idle', planMs: ms, mask: 'D' });
    },
    pause(on = true) { return loop.pause(on, 'debug'); },
    events() {
      const s = loop.state;
      if (!s) return [];
      const lon = lonOf(s);
      return sorted(s).map(ev => ({ ...ev, melas: solText ? solText(ev.atMs, lon) : marsTimeText(ev.atMs, lon), utc: utcText(ev.atMs) }));
    },
    report() {
      if (report) return Promise.resolve(report());                 // (the page's: the one Report a problem writes)
      const s = loop.state;
      const stats = { loop: { ...loop.stats }, sim: sim ? { ...sim.stats } : null };
      if (store?.reportOf && s) return store.reportOf(s, { errors: s.meta?.errors ?? [], stats });
      return { olympus: 'report', version: this.version, state: s ? toJSON(s) : null, errors: s?.meta?.errors ?? [], stats };
    },
    get view() { return view ? { ...(view.stats ?? {}), idle: !!view.idle, pending: view.pending ?? [] } : null; },
    loop,
    bus,
    sim,
  };
}

/** Put the handle on window (globalThis) as __olympus. */
export function installDebug(handle) {
  globalThis.__olympus = handle;
  return handle;
}
