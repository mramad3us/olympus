// OLYMPUS core: the event queue, a binary min-heap kept in the state and saved as its heap array.
//
// state.events holds every scheduled thing (TECH §4; TIME §5.6): a recurring job's next run, a
// need crossing, a block of the Plan of the Day, a pre-drawn hazard. It is an array kept as a binary
// min-heap ordered by (atMs, prio, seq), and nothing else (TECH correction 15). Live play dispatches
// what is due at the start of each tick (the fast layer 'due'), and a skip ends a step at the next
// event's second and dispatches it there, so one mechanism serves both (src/sim/jobs.js dispatches).
//
// An entry is TIME §5.6's record, saved without its null fields:
//     { id: 'e812', seq: 812, atMs, prio: 0-5, kind, src, who?, area?, line?, tone?, reflex?, payload? }
// seq comes from state.meta.next.e (the id's own number, src/core/ids.js), so ties between equal
// times and priorities break in posting order: comparing the ids as strings would put e1000 before
// e812. atMs is a whole second: post() floors it.
//
// Saved as the heap array, not sorted (TECH correction 9): the array's order is a pure function of
// the operations done, so a loaded game carries on with the same heap, and saving stays a pure read.
// That is also why nextAt() never pops: it is called by readers (the HUD, the debug handle) as well
// as the sim, and a read that tidied the heap would make the page's save differ from node's.
//
// Cancelling is lazy: cancel(state, src, pred) marks entries dead: true (saved), found through a
// runtime index state.$events = { bySrc: Map(src → Set of entries), dead } rebuilt from the array
// in array order whenever it is missing (after a load). popDue() drops dead entries as it meets
// them. When the dead pass COMPACT_DEAD_FRAC (a quarter) of the heap, it is compacted: the live
// entries kept in array order and heapified, which is deterministic. At most QUEUE_LIVE_MAX (4,000)
// live events are expected (TIME §13, TECH §4.4); the tests that run long print the size and fail
// above it, the queue does not refuse.
//
// Stochastic events are pre-drawn (TIME §5.6): hazard() draws the time to the next occurrence of a
// process of ratePerMin from its own stream (the world's seed, src, key and a generation), so lived
// and skipped time see the same event at the same second; a changed rate cancels and redraws with
// generation + 1.
import { nextNum } from './ids.js';
import { stream, next } from './rng.js';
import { SEC_MS, MIN_MS } from './clock.js';

export const QUEUE_LIVE_MAX = 4000;
export const COMPACT_DEAD_FRAC = 0.25;
/** The fields an entry may carry beyond its id, seq, atMs, prio, kind and src. */
export const EVENT_FIELDS = Object.freeze(['who', 'area', 'line', 'tone', 'reflex', 'payload']);

// (a before b: negative; the queue's one order)
const order = (a, b) => a.atMs - b.atMs || a.prio - b.prio || a.seq - b.seq;

function up(h, i) {
  const x = h[i];
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (order(x, h[p]) >= 0) break;
    h[i] = h[p]; i = p;
  }
  h[i] = x;
}
function down(h, i) {
  const n = h.length, x = h[i];
  for (;;) {
    let c = 2 * i + 1;
    if (c >= n) break;
    if (c + 1 < n && order(h[c + 1], h[c]) < 0) c++;
    if (order(h[c], x) >= 0) break;
    h[i] = h[c]; i = c;
  }
  h[i] = x;
}
function popTop(h) {
  const top = h[0], last = h.pop();
  if (h.length) { h[0] = last; down(h, 0); }
  return top;
}

function addTo(bySrc, ev) {
  let set = bySrc.get(ev.src);
  if (!set) bySrc.set(ev.src, (set = new Set()));
  set.add(ev);
}
function removeFrom(bySrc, ev) {
  const set = bySrc.get(ev.src);
  if (set) { set.delete(ev); if (!set.size) bySrc.delete(ev.src); }
}

/** Rebuild the runtime index ($events) from the heap array, in array order. Done by itself when missing. */
export function rebuildIndex(state) {
  const bySrc = new Map();
  let dead = 0;
  for (const ev of (state.events ??= [])) { if (ev.dead) dead++; else addTo(bySrc, ev); }
  state.$events = { bySrc, dead };
  return state.$events;
}
const index = (state) => state.$events ?? rebuildIndex(state);

/** Post an event: { atMs, kind, src, prio = 5, who?, area?, line?, tone?, reflex?, payload? }. Returns its id. */
export function post(state, ev) {
  if (!Number.isFinite(ev.atMs)) throw new Error(`post(): atMs must be a finite game time, not ${ev.atMs}`);
  if (typeof ev.kind !== 'string' || typeof ev.src !== 'string') throw new Error(`post(): an event needs a kind and a src (${JSON.stringify(ev)})`);
  const h = (state.events ??= []), ix = index(state);
  const n = nextNum(state, 'e');
  const rec = { id: 'e' + n, seq: n, atMs: Math.floor(ev.atMs / SEC_MS) * SEC_MS, prio: ev.prio ?? 5, kind: ev.kind, src: ev.src };
  for (const k of EVENT_FIELDS) if (ev[k] !== undefined && ev[k] !== null) rec[k] = ev[k];
  h.push(rec);
  up(h, h.length - 1);
  addTo(ix.bySrc, rec);
  return rec.id;
}

/** Cancel the live events of a source (those pred(ev) accepts, if given). Returns how many. */
export function cancel(state, src, pred = null) {
  const ix = index(state), set = ix.bySrc.get(src);
  if (!set) return 0;
  let n = 0;
  for (const ev of [...set]) {
    if (pred && !pred(ev)) continue;
    ev.dead = true;
    set.delete(ev);
    n++;
  }
  if (!set.size) ix.bySrc.delete(src);
  ix.dead += n;
  const h = state.events;
  if (ix.dead > COMPACT_DEAD_FRAC * h.length) compact(state);
  return n;
}

// (the live entries kept in array order, heapified: deterministic, and the dead gone)
function compact(state) {
  const h = state.events, ix = index(state);
  let w = 0;
  for (let r = 0; r < h.length; r++) if (!h[r].dead) h[w++] = h[r];
  h.length = w;
  for (let i = (w >> 1) - 1; i >= 0; i--) down(h, i);
  ix.dead = 0;
  ix.compactions = (ix.compactions ?? 0) + 1;
}

/** The time of the earliest live event, or Infinity. A pure read: it never changes the heap. */
export function nextAt(state) {
  const h = state.events;
  if (!h?.length) return Infinity;
  if (!h[0].dead) return h[0].atMs;
  let best = null;                                                   // (the top is dead: look further, without tidying)
  for (const ev of h) if (!ev.dead && (!best || order(ev, best) < 0)) best = ev;
  return best ? best.atMs : Infinity;
}

/** Pop the earliest live event due at or before tMs, or null. Dead entries met on the way are dropped. */
export function popNext(state, tMs) {
  const h = state.events;
  if (!h?.length) return null;
  const ix = index(state);
  while (h.length && h[0].atMs <= tMs) {
    const ev = popTop(h);
    if (ev.dead) { ix.dead--; continue; }
    removeFrom(ix.bySrc, ev);
    return ev;
  }
  return null;
}

/** Pop every live event due at or before tMs, in (atMs, prio, seq) order. */
export function popDue(state, tMs) {
  const out = [];
  for (let ev = popNext(state, tMs); ev; ev = popNext(state, tMs)) out.push(ev);
  return out;
}

/**
 * Pre-draw the next occurrence of a process of ratePerMin (TECH §4.2): atMs = now + the floor to the
 * second of -ln(u) / rate minutes, u from stream(world seed, src, key, gen). Returns its id.
 */
export function hazard(state, { src, key, ratePerMin, gen = 0, kind = 'hazard', prio = 5, payload = {}, ...rest }) {
  if (!(ratePerMin > 0)) throw new Error(`hazard(): ratePerMin must be positive, not ${ratePerMin}`);
  const u = next(stream(state.meta.seed, src, key, gen));
  const waitMs = Math.floor((-Math.log(1 - u) / ratePerMin) * MIN_MS / SEC_MS) * SEC_MS;   // (1 - u in (0, 1]: never log 0)
  return post(state, { ...rest, atMs: state.clock.ms + waitMs, kind, prio, src, payload: { key, gen, ratePerMin, ...payload } });
}

/** How many entries the heap holds, dead included (the save's). */
export const size = (state) => state.events?.length ?? 0;
/** How many live events there are. */
export const live = (state) => size(state) - (state.events?.length ? index(state).dead : 0);
/** The live events in their order (a copy, for tests, the debug handle and the overlays). */
export const sorted = (state) => (state.events ?? []).filter(ev => !ev.dead).sort(order);
/** The queue's one order, as a comparator. */
export const cmpEvent = order;
