// OLYMPUS core: the game state as saved, its reserved domains, and its upgrades.
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
// The top level is reserved (TECH §6.1, CONTRACTS §9): DOMAINS, 25 keys, each owned by one design
// section, which defines the shape inside it:
//   TECH    meta { game, schema, version, seed, worldId, mode, scenario, createdMs, next: { <id
//           prefix>: n }, errors: [≤ 20], and the honesty marks debugUsed, imported, recovered },
//           rng { main, <stream>… }, log [≤ 1,500 records], flags { one-shot facts and migrations }
//   TIME    clock { ms, tick, holds, seq } (src/core/clock.js), events (the queue's heap array,
//           src/core/queue.js), skip (the running skip, or null), time { chapter, voyage, pod,
//           alarms, interrupts, liveSinceSaveMs, slowToMs }
//   PLACES  places { live: { site, area } | null, sites: { … } } (the 0.0.1 'sites', renamed:
//           TECH correction 2)
//   PEOPLE  player { id, actor, waypoint, presets, keeps }, people { <p id>: person }, units,
//           happenings [ ], actors { list }, mind { seen, felt, heard, known, map }, talk (or null),
//           names { people, ships, ops }
//   WEAPONS stop (or null), items { <i id>: item }, armoury { guns, ammoIssues }
//   COMBAT  fights [ ]
//   world   world { } (LONGHAUL's background, ported by TECH; empty until 0.2)
//   CAREER  career (or null), careers [ ], memorial [ ]
// newState() returns every key at its empty default (emptyDomain()), so the core runs without the
// game; the game's composition root (src/sim/game.js) then runs each domain's init.
//
// The registry (TECH §2.5): each domain claims its keys through registerDomain(name, { keys,
// idMaps, idFields, init }). A key claimed by a second domain throws at once, naming both, and a key
// not in DOMAINS throws too, so two agents building in parallel can never both write one key
// unnoticed. resetDomains() empties it, with the upgrades a game added as its own (scoped: createSim
// does, so two games in one process each register their own, and a bare core state loaded after a
// game gets none of that game's fills). domainOwners() gives key → claimant; registeredDomains() the
// claims in order. A claim's after(state) runs on load once every upgrade has (game.js's job check:
// it must see the scenario's own fill of an old save).
//
// SAVE_SCHEMA is bumped only for a change upgradeState() can't fill in; anything additive is filled
// in on load, so players keep their careers across releases (TECH §7.7). upgradeState fills meta's
// worldId, next and errors, clock.seq (and puts the clock on the 50 ms tick grid, where 0.0.1's
// sandbox did not start it), every reserved key at its empty default (and the missing
// fields of an object-shaped one), moves 0.0.1's 'sites' to 'places' once (flags['mig:sites-places']:
// the sandbox's site there carries nothing), then runs each registered domain's init as its fill,
// then the upgrades added with addUpgrade(), in the order added, then each claim's after(). Before
// 1.0, old saves are kept "only where it comes naturally" (the user, 2026-10-26, on tradecraft).
//
// Reading is JSON.parse with no reviver (a reviver costs about seven times the parse: 26 ms against
// 3.9 ms for 489 KB, measured by store's agent); only a save whose text holds one of the three
// encoded numbers is walked once after to put them back.
import { seedRng } from './rng.js';
import { newClock, onTick } from './clock.js';

export const GAME = 'olympus';
export const SAVE_SCHEMA = 1;
/** The reserved top-level keys (TECH §6.1), in its table's order. */
export const DOMAINS = Object.freeze(['meta', 'clock', 'rng', 'events', 'skip', 'time', 'player', 'people', 'units', 'happenings',
  'actors', 'mind', 'talk', 'names', 'fights', 'stop', 'items', 'armoury', 'places', 'world', 'career', 'careers', 'memorial', 'log', 'flags']);
export const MODES = Object.freeze(['standard', 'ironman']);
/** The last errors kept in meta.errors (TECH §3.7). */
export const ERRORS_MAX = 20;

const INF = '__inf__', NINF = '__-inf__', NAN = '__nan__';

/**
 * A reserved key's empty default, fresh. meta and clock take the seed and start; the others are
 * TECH §6.1's empty shapes (the 0.0.2 build sheet, §3).
 */
export function emptyDomain(key, { seed = 0, version = '?', mode = 'standard', scenario = null, startMs = 0 } = {}) {
  switch (key) {
    case 'meta': { const s = seed >>> 0; return { game: GAME, schema: SAVE_SCHEMA, version, seed: s, worldId: `w-${s}`, mode, scenario, createdMs: newClock(startMs).ms, next: {}, errors: [] }; }
    case 'clock': return { ...newClock(startMs), seq: 0 };
    case 'rng': return { main: seedRng(seed >>> 0) };
    case 'events': return [];
    case 'skip': return null;
    case 'time': return { chapter: null, voyage: null, pod: {}, alarms: [], interrupts: { perSol: 0, perSkip: 0 }, liveSinceSaveMs: 0, slowToMs: null };
    case 'player': return { id: null, actor: null, waypoint: null, presets: {}, keeps: {} };
    case 'people': return {};
    case 'units': return {};
    case 'happenings': return [];
    case 'actors': return { list: [] };
    case 'mind': return { seen: {}, felt: [], heard: [], known: {}, map: {} };
    case 'talk': return null;
    case 'names': return { people: {}, ships: {}, ops: {} };
    case 'fights': return [];
    case 'stop': return null;
    case 'items': return {};
    case 'armoury': return { guns: {}, ammoIssues: [] };
    case 'places': return { live: null, sites: {} };
    case 'world': return {};
    case 'career': return null;
    case 'careers': return [];
    case 'memorial': return [];
    case 'log': return [];
    case 'flags': return {};
    default: throw new Error(`'${key}' is not a reserved key of the state (TECH §6.1: ${DOMAINS.join(', ')})`);
  }
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Fill a reserved key at its empty default where it is missing, and the missing fields of an
 * object-shaped one (one level: a domain's own fill does the rest). For a domain's init (??=).
 */
export function fillDomain(state, key, opts = { seed: state?.meta?.seed ?? 0 }) {
  const def = emptyDomain(key, opts);
  if (state[key] === undefined) { state[key] = def; return state[key]; }
  if (isPlainObject(def) && isPlainObject(state[key])) for (const f of Object.keys(def)) if (state[key][f] === undefined) state[key][f] = def[f];
  return state[key];
}

/**
 * A new game's state: every reserved key at its empty default (newGame in src/sim/game.js runs the
 * domains' inits and the scenario on it). options: { version, mode ('standard' | 'ironman'),
 * scenario, startMs (game time, 0 = the epoch) }.
 */
export function newState(seed, { version = '?', mode = 'standard', scenario = null, startMs = 0 } = {}) {
  if (!MODES.includes(mode)) throw new Error(`no such career mode: ${mode}`);
  const opts = { seed: seed >>> 0, version, mode, scenario, startMs };
  const s = {};
  for (const k of DOMAINS) s[k] = emptyDomain(k, opts);
  return s;
}

// ---- the registry of domains (TECH §2.5) ----

const claims = new Map();                                          // key → claimant name
const registry = new Map();                                        // name → { name, owner, keys, idMaps, idFields, init }

/** Forget every claim and every scoped upgrade (createSim does, before registering its own domains). */
export function resetDomains() {
  claims.clear(); registry.clear();
  for (const id of scoped) upgrades.delete(id);
  scoped.clear();
}

/**
 * A domain claims its top-level keys: registerDomain('places', { owner: 'PLACES', keys: ['places'],
 * idMaps, idFields, init }). Throws on a key not in DOMAINS and on a key another domain holds,
 * naming both. A name registered again replaces its earlier claims.
 */
export function registerDomain(name, { owner = name, keys = [], idMaps = {}, idFields = {}, init = null, after = null } = {}) {
  if (registry.has(name)) for (const k of registry.get(name).keys) claims.delete(k);
  for (const k of keys) {
    if (!DOMAINS.includes(k)) throw new Error(`domain '${name}' claims '${k}', which is not a reserved key (TECH §6.1)`);
    const held = claims.get(k);
    if (held && held !== name) throw new Error(`the state key '${k}' is claimed twice: by '${held}' and by '${name}'`);
  }
  for (const k of keys) claims.set(k, name);
  const rec = Object.freeze({ name, owner, keys: Object.freeze([...keys]), idMaps: Object.freeze({ ...idMaps }), idFields: Object.freeze({ ...idFields }), init, after });
  registry.set(name, rec);
  return rec;
}

/** key → the domain that claimed it. */
export const domainOwners = () => Object.fromEntries(claims);
/** The registered domains, in the order registered. */
export const registeredDomains = () => [...registry.values()];

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

const ODD = /"__(?:-?inf|nan)__"/;
const odd = (v) => (v === INF ? Infinity : v === NINF ? -Infinity : v === NAN ? NaN : v);
// (the encoded numbers put back, in place: only for a save whose text holds one)
function revive(v) {
  if (v === null || typeof v !== 'object') return odd(v);
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = revive(v[i]); return v; }
  for (const k of Object.keys(v)) v[k] = revive(v[k]);
  return v;
}

/** A state from save JSON (a string, or an already parsed object), upgraded to the current shape. Throws on anything else. */
export function fromJSON(input) {
  let s;
  try {
    const text = typeof input === 'string' ? input : toJSON(input);
    s = JSON.parse(text);
    if (ODD.test(text)) s = revive(s);
  } catch (e) { throw new Error(`not a save file (${e.message})`); }
  if (!s || typeof s !== 'object' || s.meta?.game !== GAME) throw new Error('not an OLYMPUS save');
  if (!(s.meta.schema <= SAVE_SCHEMA)) throw new Error(`a save from a newer game (schema ${s.meta.schema}; this one reads up to ${SAVE_SCHEMA})`);
  return upgradeState(s);
}

/** A deep copy of a state, as a save and a load would make it. */
export const copyState = (state) => fromJSON(toJSON(state));

// ---- upgrades ----

const upgrades = new Map();                                        // id → fn(state), in the order added
const scoped = new Set();                                          // (the ids a game added as its own: resetDomains drops them)

/**
 * A domain's own additive fill for older saves: fn(state) fills in what its key lacks (??=). Keyed
 * by id, so a module loaded twice doesn't add it twice. Run in the order added, after the core's.
 * { scoped: true } marks it the registering game's own (createSim's domains' upgrades), dropped by
 * resetDomains(); a module's own (the sandbox's 'sandbox:0.0.1') stays for every game.
 */
export function addUpgrade(id, fn, { scoped: own = false } = {}) {
  upgrades.set(id, fn);
  if (own) scoped.add(id); else scoped.delete(id);
}

/** Fill in what an older save lacks: see the header. */
export function upgradeState(s) {
  s.meta.version ??= '?';
  s.meta.seed = (s.meta.seed ?? 0) >>> 0;
  s.meta.mode ??= 'standard';
  s.meta.scenario ??= null;
  s.meta.worldId ??= `w-${s.meta.seed}`;
  s.meta.next ??= {};
  s.meta.errors ??= [];
  s.clock ??= newClock(0);
  s.clock.ms = onTick(s.clock.ms);                                 // (0.0.1 started a sandbox off the 50 ms grid; every later clock is on it)
  s.clock.tick ??= 0;
  s.clock.holds ??= [];
  s.clock.seq ??= 0;
  s.meta.createdMs ??= s.clock.ms;
  s.rng ??= {};
  s.rng.main ??= seedRng(s.meta.seed);
  s.flags ??= {};
  // (0.0.1's 'sites' is 'places' (TECH correction 2); its one record, the sandbox's longitude, carries
  // nothing. Done once, and only where there is something to move: a fresh state must load unchanged)
  if ('sites' in s && !s.flags['mig:sites-places']) {
    delete s.sites;
    s.flags['mig:sites-places'] = true;
  }
  const opts = { seed: s.meta.seed, startMs: s.clock.ms };
  for (const k of DOMAINS) fillDomain(s, k, opts);
  for (const d of registry.values()) d.init?.(s);
  for (const fn of upgrades.values()) fn(s);
  for (const d of registry.values()) d.after?.(s);
  s.meta.schema = SAVE_SCHEMA;
  return s;
}
