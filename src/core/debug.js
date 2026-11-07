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
//   act(action)        an action into the sim (a string or { act, args }): queued for the next tick
//                      the loop runs, or, while it is paused, run at once in a tick of its own
//   activity(id, spotId, args)  an activity begun at a spot (time's action { act: 'activity', args:
//                      { id, spotId, args } }: the late card's and the choices card's way in), by act()
//   drill(ms)          the alert drill forced to sound at ms tonight (the debug action
//                      debug:drill:<ms>, which marks the save), by act()
//   body()             the player's body record and its stages now (main.js gives BODY's readers:
//                      { body, stages, strip, words, cues })
//   instinct()         the instinct's line, chip and keys now (SKILLS' instinctNow), and the parts the
//                      HUD shows
//   splash()           the running splash, its plan, phase and shown clock (hud/splash.js), or null
//   scores()           the scores kept in this browser (localStorage['olympus.scores'])
//   gun()              the gun the player holds or slings: { id, truth (its record), belief (arms'
//                      beliefOf: what the HUD may show) }, or null (the build sheet 0.0.5 §2.4)
//   steps()            the step panel now: { steps (the shot role's stepsOf), slots (the digits as the
//                      panel numbers them), text (as shown) }, or null outside stop motion
//   plaque()           the plaque now: { rec (plaqueOf's record for the target shown), words, parts }
//   range()            the range session now (the shot role's rangeNow), or null; on test-range (0.0.7) its
//                      record carries, unenumerated, kd() (range.js kdNow: the stages, groups, strings, pits,
//                      the coach's call, the relay, brass, the declaration, the casualty) and nd(who) (a
//                      negligent discharge forced from your rifle toward a person id or { x, z }: range.js
//                      forceNd, the build sheet 0.0.7 §6 item 7); and far() the far window (farPointOf, its
//                      place, the stage's farState)
//   stop()             stop motion now (the shot role's stopNow: mode, phase, pick, aim, doing, reflex)
//   menu()             R held's menu now (places' handMenu: { title, spotId, fixtureId, quick, rows }), or
//                      null; and the card open, if it is: { …, card: { text, cursor, checked, picks } }
//                      (the build sheet 0.0.6 §2.3)
//   hands()            the player's hands: { dirt, why, band, words, k } (BODY's ledger and its stage)
//   hair()             the player's hair: hairOf's { cut, word, h, sols, mm, step, band, dueDay, … }
//   loop, bus, sim     the machinery, for tests that listen
// and what main.js adds through more (property descriptors, so getters stay getters), since core
// may not import the sim (TECH §2.2): area (the live area's id), go(area, x, z, face) (the debug
// action debug:go, which marks the save), door(id, to) (the door action), actors() (each actor with
// its person's name, posture, outfit and whether you see them), light(x, z) (places' lightLevel
// now), sun() (sunAt now), sightMask() (people's, for the player now), offer() (R's offer now),
// audio (the sound's stats), hud (the HUD's lines: the watch, the instinct's line, the toasts, the
// splash's plaque, ticker and strip), scene (the test scene playing: its id, seed, whether it has
// ended) and world (the world's sounds: the water, the tap, the flushes, the klaxon's whoops, the
// bugle, the splash's muffle and ticks). window.__ready turns true once the page has drawn its frames
// with nothing pending (main.js), so a test or a shot knows the page is up.
//
// URL parameters skip the title for tests and shots (main.js reads them through readParams()):
// ?play=<scenario>&seed=<n>&hour=<h>[&mode=ironman][&debug=1][&setup=hot|bench|mixed], hour being the Mars local hour at the
// start (0-24, a fraction giving minutes), seed a whole number; &area=<id>&at=<x>,<z>&face=<f> a
// start somewhere else than the scenario's (the barracks' berth): an area, a place in its frame in
// metres, a facing (up, down, left, right); setup test-handling's start or test-range's ('confirm', 's200',
// 'far': the build sheet 0.0.7 §2.3); for test-handling ('hot': string 1 in Condition 1,
// prone, the line hot, aimed at your card; 'bench': the same with one magazine of 15, the build sheet
// 0.0.5 §2.2's fill; 'mixed', 0.0.6: the course from its brief with a fourth magazine, of tracer); and for the stage &mood=<name>, &fog=1, &nostore=1 (IndexedDB neither read nor written: shots, benches,
// agents' smoke runs) and &perf=1 (the GL counters and pass times). ?bench=<scene> (or ?bench=1, the
// default scene) runs the bench card (main.js; src/data/bench.js holds the scenes).
import { toJSON, fromJSON } from './state.js';
import { NO_INPUT } from './loop.js';
import { sorted } from './queue.js';
import { utcText, marsTimeText } from './calendar.js';

export const FACES = Object.freeze(['up', 'down', 'left', 'right']);
/** test-handling's setups (the build sheet 0.0.5 §2.2; 'mixed', the 0.0.6 arms role's: one tracer magazine besides the ball); test-range's (0.0.7 §2.3: 'confirm' zeroed at the 300 m line, 's200' sitting at the 200 m line, 'far' the range-far bench's). */
export const SETUPS = Object.freeze(['hot', 'bench', 'mixed', 'confirm', 's200', 'far']);

/** The test parameters of a URL's query: { play, seed, hour, mode, debug, mood, fog, nostore, perf, bench, area, at, face, setup }. */
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
    mood: q.get('mood') || null,
    fog: on('fog'),
    nostore: on('nostore'),
    perf: on('perf'),
    bench: q.get('bench') || null,
    area: q.get('area') || null,
    at: pair(q.get('at')),
    face: FACES.includes(q.get('face')) ? q.get('face') : null,
    setup: SETUPS.includes(q.get('setup')) ? q.get('setup') : null,
  };
}

// ('<x>,<z>' as two finite numbers, else null)
function pair(v) {
  if (!v) return null;
  const xs = String(v).split(',').map(t => (t.trim() === '' ? NaN : Number(t)));
  return xs.length === 2 && xs.every(Number.isFinite) ? xs : null;
}

/**
 * The handle. start(state) plays a state (main.js's launch, which may return a promise); newGame(opts)
 * makes one; sim is src/sim/game.js's; store is src/core/store.js (for save and load by slot and the
 * report); about(state) the line a save shows in the lists; view the stage's view, if any; solText(ms,
 * lonE) the watch's face for events() (the sim's dates.js, SETTING's years bound), else the bare clock;
 * report() the page's bug report builder (main.js: what the menu's Report a problem writes), if any;
 * queue(action) the input's (an action for the next tick the loop runs); more, members main.js adds
 * (an object whose property descriptors are copied onto the handle).
 */
export function createDebugHandle({ loop, sim = null, start, newGame, version = '?', store = null, bus = null, about = () => 'debug', view = null, solText = null, report = null, queue = null, more = null, body = null, instinct = null, splash = null, scores = null, arms = null, menu = null, hands = null, hair = null }) {
  const inputOf = (inp) => (inp ? { ...NO_INPUT, ...inp, act: inp.act ?? [] } : NO_INPUT);
  const slotOf = (name) => {
    const s = String(name);
    if (s.includes(':') || !store?.slotFor) return s;
    return store.slotFor(loop.state ?? {}, s);
  };
  const lonOf = (state) => { try { return sim?.lonOf?.(state) ?? 0; } catch { return 0; } };
  const handle = {
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
    /** An action into the sim: queued for the next tick the loop runs, or run at once in a tick of its own while paused. */
    act(action) {
      if (loop.paused || !queue) return loop.step(1, inputOf({ act: [action] }));
      queue(action);
      return null;
    },
    /** An activity begun at a spot (time's action), as the late card and the choices card send it. */
    activity(id, spotId, args = {}, { late = null } = {}) { return this.act({ act: 'activity', args: { id, spotId, args, ...(late ? { late } : {}) } }); },
    /** The alert drill forced to sound at ms (the debug action: it marks the save). */
    drill(ms) { return this.act(`debug:drill:${Math.round(ms)}`); },
    /** The player's body now: { body, stages, strip, words, cues } (BODY's readers, from main.js), or null. */
    body() { return body && loop.state ? body(loop.state) : null; },
    /** The instinct now: { line, chip, keys, queued, parts }, or null. */
    instinct() { return instinct && loop.state ? instinct(loop.state) : null; },
    /** The running splash: its plan, phase and shown clock, or null. */
    splash() { return splash ? splash() : null; },
    /** The scores kept in this browser: { v: 1, scores: [] }. */
    scores() { return scores ? scores() : { v: 1, scores: [] }; },
    /** The gun the player holds or slings: { id, truth, belief }, or null (main.js gives arms' readers). */
    gun() { return arms?.gun && loop.state ? arms.gun(loop.state) : null; },
    /** The step panel now: { steps, slots, text }, or null. */
    steps() { return arms?.steps && loop.state ? arms.steps(loop.state) : null; },
    /** The plaque now: { rec, words, parts }, or null. */
    plaque() { return arms?.plaque && loop.state ? arms.plaque(loop.state) : null; },
    /** The range session now, or null. */
    range() { return arms?.range && loop.state ? arms.range(loop.state) : null; },
    /** Stop motion now, or null. */
    stop() { return arms?.stop && loop.state ? arms.stop(loop.state) : null; },
    /** R held's menu now (handMenu's), with the open card's state where it is up, or null (main.js gives the reader). */
    menu() { return menu && loop.state ? menu(loop.state) : null; },
    /** The player's hands: { dirt, why, band, words, k }, or null. */
    hands() { return hands && loop.state ? hands(loop.state) : null; },
    /** The player's hair (hairOf's record), or null. */
    hair() { return hair && loop.state ? hair(loop.state) : null; },
    loop,
    bus,
    sim,
  };
  if (more) Object.defineProperties(handle, Object.getOwnPropertyDescriptors(more));
  return handle;
}

/** Put the handle on window (globalThis) as __olympus. */
export function installDebug(handle) {
  globalThis.__olympus = handle;
  return handle;
}
