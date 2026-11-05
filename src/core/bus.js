// OLYMPUS core: the bus.
//
// The sim reports facts on it ("a roll", "a skip began", "an autosave is due", "time is held for a
// choice"); whoever listens (the stage, the UI, the presenter, a test) decides what to do with them.
// The sim never waits on a listener and never reads anything back (tradecraft's and LONGHAUL's rule:
// "the sim emits facts; the UI decides how to present them").
//
// Merged from tradecraft (src/sim/bus.js: on with an unsubscribe, '*' listeners) and LONGHAUL
// (js/core/events.js: off, clear, the handler list copied before it is walked, so a listener that
// unsubscribes itself or adds another mid-emit doesn't skip or double anyone).
//
// One change from both: a listener that throws doesn't throw into the sim. A tick half applied is
// worse than a toast that didn't show, so the error goes to onError (by default console.error) and
// the other listeners still hear the fact. The sim's own state is never at a listener's mercy.
//
// Events are plain data, by convention: { type } names in kebab-case ('skip-start', 'autosave'),
// payloads of numbers, strings, arrays and plain objects, so a test can record them and compare.

/**
 * A bus. on(type, fn) → unsubscribe; once(type, fn); off(type, fn); emit(type, data); clear();
 * count(type) (listeners of a type, for tests). '*' listeners hear everything as fn(type, data).
 */
export function createBus({ onError = (e, type) => console.error(`bus: a listener of '${type}' threw`, e) } = {}) {
  const subs = new Map();
  const call = (fn, type, a, b) => { try { fn(a, b); } catch (e) { onError(e, type); } };
  const bus = {
    on(type, fn) {
      let list = subs.get(type);
      if (!list) subs.set(type, (list = []));
      list.push(fn);
      return () => bus.off(type, fn);
    },
    once(type, fn) {
      const off = bus.on(type, (data) => { off(); fn(data); });
      return off;
    },
    off(type, fn) {
      const list = subs.get(type);
      const i = list ? list.indexOf(fn) : -1;
      if (i >= 0) list.splice(i, 1);
    },
    emit(type, data) {
      const list = subs.get(type);
      if (list?.length) for (const fn of list.slice()) call(fn, type, data);
      const any = subs.get('*');
      if (any?.length && type !== '*') for (const fn of any.slice()) call(fn, type, type, data);
    },
    clear() { subs.clear(); },
    count(type) { return subs.get(type)?.length ?? 0; },
  };
  return bus;
}

/** A bus that hears nothing: for a headless run that wants no listeners. */
export const nullBus = Object.freeze({ on: () => () => {}, once: () => () => {}, off() {}, emit() {}, clear() {}, count: () => 0 });

/** A bus that also keeps every fact it carries, in order (for tests: bus.events → [[type, data]…]). */
export function recordingBus(opts) {
  const bus = createBus(opts);
  bus.events = [];
  bus.on('*', (type, data) => bus.events.push([type, data]));
  return bus;
}
