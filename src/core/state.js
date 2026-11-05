// OLYMPUS core: the game state as saved, and its upgrades.
//
// State is plain data (numbers, strings, booleans, null, arrays and plain objects), so a save is its
// JSON (tradecraft's src/sim/state.js and LONGHAUL's js/sim/save.js, merged). Keys starting with $
// are runtime only (indexes, caches, a site's generated geometry) and never saved: they are dropped
// at any depth. ±Infinity and NaN, which JSON can't carry, are written as '__inf__', '__-inf__' and
// '__nan__' and read back as numbers (LONGHAUL's replacer, plus NaN, which is a bug to be caught
// rather than silently turned into null).
//
// The serialisation is canonical: every object's keys are written in sorted order. Two states equal
// as data are then equal as text, whatever order their keys were added in (a fresh game fills a
// domain one way, upgradeState() another), so "save, load, save again" gives the same bytes and a
// test can compare saves as strings (tradecraft's determinism test: identical JSON after 3,000
// ticks with a save and load halfway). Anything that isn't plain data outside a $ key (a Map, a Set,
// a class instance, a function, a typed array) throws with its path: a save must never lose
// something quietly.
//
// The shape (SAVE_SCHEMA 1). The top-level keys are reserved for the domains, and each domain's
// module owns what goes inside its key:
//   meta     { game: 'olympus', schema, version (the game that began it), seed, mode ('standard' |
//            'ironman', chosen per career: DESIGN.md, Saves and death), scenario, createdMs }
//   clock    { ms, tick, holds } (src/core/clock.js)
//   rng      { main: [4 words], <name>: [4 words]… } named dice streams (src/core/rng.js rngOf)
//   player   the player: their sheet, body, kit, where they are (src/sim)
//   people   { id: sheet } persistent people (PEOPLE.md tiers 1-3)
//   world    the background world: politics, fleets, the news (the 'world' layer)
//   sites    { id: … } the places that have been generated or changed, enough to make them again
//   log      [ … ] lines of the log, newest last
//   flags    { } one-shot facts and migrations done
//
// SAVE_SCHEMA is bumped only for a change upgradeState() can't fill in; anything additive is filled
// in on load, so players keep their careers across releases. A domain fills its own key through
// addUpgrade(), so this file doesn't grow with every system. Before 1.0, old saves are kept "only
// where it comes naturally" (the user, 2026-10-26, on tradecraft).
import { seedRng } from './rng.js';
import { newClock } from './clock.js';

export const GAME = 'olympus';
export const SAVE_SCHEMA = 1;
export const DOMAINS = Object.freeze(['meta', 'clock', 'rng', 'player', 'people', 'world', 'sites', 'log', 'flags']);
export const MODES = Object.freeze(['standard', 'ironman']);

const INF = '__inf__', NINF = '__-inf__', NAN = '__nan__';

/**
 * A new game's state: the reserved domains, empty but for the clock and the dice.
 * options: { version, mode ('standard' | 'ironman'), scenario, startMs (game time, 0 = the epoch) }.
 */
export function newState(seed, { version = '?', mode = 'standard', scenario = null, startMs = 0 } = {}) {
  if (!MODES.includes(mode)) throw new Error(`no such career mode: ${mode}`);
  const s = seed >>> 0;
  const clock = newClock(startMs);
  return {
    meta: { game: GAME, schema: SAVE_SCHEMA, version, seed: s, mode, scenario, createdMs: clock.ms },
    clock,
    rng: { main: seedRng(s) },
    player: {},
    people: {},
    world: {},
    sites: {},
    log: [],
    flags: {},
  };
}

// ---- writing ----

const plainProto = (v) => { const p = Object.getPrototypeOf(v); return p === Object.prototype || p === null; };

// (the one walker: a plain copy with $ keys dropped, the odd numbers encoded and every object's keys sorted)
function encode(v, path) {
  if (v === null) return null;
  switch (typeof v) {
    case 'number': return Number.isFinite(v) ? (Object.is(v, -0) ? 0 : v) : v > 0 ? INF : v < 0 ? NINF : NAN;
    case 'string': case 'boolean': return v;
    case 'undefined': return undefined;                            // (dropped from objects, as JSON does; null in arrays)
    case 'object': {
      if (Array.isArray(v)) {
        const out = new Array(v.length);
        for (let i = 0; i < v.length; i++) { const e = encode(v[i], `${path}[${i}]`); out[i] = e === undefined ? null : e; }
        return out;
      }
      if (!plainProto(v)) throw new Error(`state is not plain data at ${path || 'the top'}: ${v.constructor?.name ?? 'an odd object'}`);
      const out = {};
      for (const k of Object.keys(v).sort()) {
        if (k.charCodeAt(0) === 36) continue;                      // ('$': runtime only)
        const e = encode(v[k], path ? `${path}.${k}` : k);
        if (e !== undefined) out[k] = e;
      }
      return out;
    }
    default: throw new Error(`state is not plain data at ${path || 'the top'}: a ${typeof v}`);
  }
}

/** A plain copy of the state as it is saved: $ keys gone, ±Infinity and NaN encoded, keys sorted. */
export const stripRuntime = (state) => encode(state, '');

/** The state as save JSON (canonical: see the header). */
export const toJSON = (state) => JSON.stringify(stripRuntime(state));

// ---- reading ----

const revive = (_k, v) => (v === INF ? Infinity : v === NINF ? -Infinity : v === NAN ? NaN : v);

/** A state from save JSON (a string, or an already parsed object), upgraded to the current shape. Throws on anything else. */
export function fromJSON(input) {
  let s;
  try { s = JSON.parse(typeof input === 'string' ? input : toJSON(input), revive); }
  catch (e) { throw new Error(`not a save file (${e.message})`); }
  if (!s || typeof s !== 'object' || s.meta?.game !== GAME) throw new Error('not an OLYMPUS save');
  if (!(s.meta.schema <= SAVE_SCHEMA)) throw new Error(`a save from a newer game (schema ${s.meta.schema}; this one reads up to ${SAVE_SCHEMA})`);
  return upgradeState(s);
}

/** A deep copy of a state, as a save and a load would make it. */
export const copyState = (state) => fromJSON(toJSON(state));

// ---- upgrades ----

const upgrades = new Map();                                        // id → fn(state), in the order added

/**
 * A domain's own additive fill for older saves: fn(state) fills in what its key lacks (??=). Keyed
 * by id, so a module loaded twice doesn't add it twice. Run in the order added, after the core's.
 */
export function addUpgrade(id, fn) { upgrades.set(id, fn); }

/** Fill in what an older save lacks: the reserved domains, then each domain's own upgrades. */
export function upgradeState(s) {
  s.meta.version ??= '?';
  s.meta.seed = (s.meta.seed ?? 0) >>> 0;
  s.meta.mode ??= 'standard';
  s.meta.scenario ??= null;
  s.clock ??= newClock(0);
  s.clock.tick ??= 0;
  s.clock.holds ??= [];
  s.meta.createdMs ??= s.clock.ms;
  s.rng ??= {};
  s.rng.main ??= seedRng(s.meta.seed);
  for (const k of ['player', 'people', 'world', 'sites', 'flags']) s[k] ??= {};
  s.log ??= [];
  for (const fn of upgrades.values()) fn(s);
  s.meta.schema = SAVE_SCHEMA;
  return s;
}
