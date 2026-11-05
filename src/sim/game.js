// OLYMPUS sim: the composition root. The one place the game is put together: its domains, its tick, its skips and its actions.
//
// createSim({ loop, bus, domains }) builds the game on a core loop (TECH §2.5), holding no state of
// its own (everything is in the state or a pure function of it), so the same file runs in the
// page, in node for the tests and the bots (tests/game.mjs), and in a replay:
//   1. the domains, in DOMAIN_ORDER (tech, time, places, people, weapons, combat, world, career),
//      each a descriptor { name, owner, keys, idMaps, idFields, init, fast, slow, jobs, events,
//      actions, upgrades }. time is src/sim/time/domain.js, places src/sim/places/domain.js, tech
//      below; people, weapons, combat, world and career are stubs here until their sections build
//      them (each claims its keys and fills them empty; their actions do nothing). domains: { <name>:
//      descriptor } replaces a built-in one (tests/game-dummy.mjs's world), and a name outside the
//      order is added after it. Each claims its top-level keys (core/state.js registerDomain): a key
//      claimed twice throws, naming both, and so does a key outside TECH §6.1's table;
//   2. the twelve fast layers of TECH §3.1, in order (FAST_LAYERS): due, input (runs while held),
//      player, actors, bodyFast, rehash, look, think, rules, paths, second, offers (while held). Each
//      runs its contributors (a domain's fast[layer], fn(state, input, bus, ctx), ctx { held, tickMs,
//      sim }) in domain order; a layer nobody builds yet is a no-op. 'due' first dispatches every
//      event due at the clock (src/sim/jobs.js), and during a fast-forward stops the skip on one its
//      mask lets through; 'input' first routes each of the snapshot's actions through act();
//   3. one periodic 'slow' layer at MIN_MS, calling slowStep over the minute just ended. There is no
//      hourly game layer (TECH §3.5): hourly and daily work are jobs in the queue;
//   4. the slow contributors (a domain's slow records, and registerSlow({ name, step, steady,
//      nextChangeMs }) after), stepped in order by slowStep(state, bus, fromMs, toMs, ctx), the one
//      function live play calls each minute and a skip calls each step (ctx.skipping). A step spans
//      [time.slowToMs, toMs] and moves the mark (fromMs only where a save has none), each contributor
//      in its own try so one that throws (its error rethrown once the rest have run) never makes the
//      others step a span twice, so the live
//      minutes and a skip's steps cover each moment of game time once, wherever a skip starts or
//      ends (TIME §5.5's parity; store's probe of 90.5 s lived, a 5-minute skip, 90.5 s lived had
//      stepped [60, 90.5] s never and [360, 390.5] s twice before the mark);
//   5. the jobs, merged by name (src/sim/jobs.js), and a keyless 'jobs' entry in the registry whose
//      after(), on loading a game's state (one with a scenario) once every fill and upgrade has run,
//      drops a vanished job's events and posts a missing recurring one;
//   6. the actions table: an action (a string, or { act, args }) is routed by its prefix, the text
//      before its first colon, to the domain that registered it; an unknown one is counted
//      (stats.unrouted), never thrown;
//   7. the skip engines (src/sim/time/skip.js), given to the loop through loop.useSkips, and the one
//      stops(mask, ev) rule that both they and the due layer's fast-forward check read (sim.stops).
// sim.noteError(state, error, where) is the loop's onError's other half (main.js, tests/game.mjs):
// '<where>: <first line>' into meta.errors (the last ERRORS_MAX, saved, so an exported save carries
// them) and 'broke' on the bus. Only the sim's own errors are written into the state (notesInState:
// a tick's, a skip's); a render's, a listener's or the page's are told on the bus and nowhere else,
// since TECH §3.7 says they never touch the state (0.0.2 wrote a render error into meta.errors even
// while paused, so the page's save parted from a node replay exactly when something broke).
//
// newGame({ seed, mode, scenario, startMs, hour, worldId, version, domains }) makes a fresh state:
// core's newState, meta.worldId (w-<seed> unless given), every domain's init in order, the scenario's
// fill (SCENARIOS: the sandbox, src/sim/scenarios/sandbox.js), then hour (the Mars local hour, a
// fraction giving minutes) moves the clock and meta.createdMs to the next such time at the live
// site's longitude, then each recurring job's first occurrence is posted. The start is START_MS,
// 2351-12-19 02:20 UTC (SETTING §3.7); a test world has no career (ROADMAP §2.1).
//
// The tech domain's one action is debug:skip:<ms> (the debug keys ^ and $ on AZERTY, the codes
// BracketLeft and BracketRight, [ and ] on QWERTY): it marks the save
// (meta.debugUsed, an honesty mark, TECH §15.5), writes a [debug] log record and begins an idle skip.
// The tick's order and the shape of skip() are referenced from tradecraft v0.2.0-rc3 src/sim/game.js
// (620 lines; its body is rewritten, TECH §12.3).
import { newState, registerDomain, resetDomains, fillDomain, addUpgrade, ERRORS_MAX } from '../core/state.js';
import { popNext } from '../core/queue.js';
import { msAtMarsTime } from '../core/calendar.js';
import { MIN_MS, TICK_MS, isHeld, durationText } from '../core/clock.js';
import { START_MS } from '../data/setting/calendar.js';
import { createJobs, dispatch as dispatchJob, postJobs, ensureJobs, siteLonEDeg } from './jobs.js';
import { createSkips, defaultStops } from './time/skip.js';
import { timeDomain } from './time/domain.js';
import { placesDomain } from './places/domain.js';
import { sandbox } from './scenarios/sandbox.js';
import { logEntry } from './log.js';

/** The fast layers of a tick, in order (TECH §3.1); input and offers run while time stands still. */
export const FAST_LAYERS = Object.freeze(['due', 'input', 'player', 'actors', 'bodyFast', 'rehash', 'look', 'think', 'rules', 'paths', 'second', 'offers']
  .map(name => Object.freeze({ name, whileHeld: name === 'input' || name === 'offers' })));
const LAYER_NAMES = new Set(FAST_LAYERS.map(L => L.name));
/** The domains, in the order their contributors run. */
export const DOMAIN_ORDER = Object.freeze(['tech', 'time', 'places', 'people', 'weapons', 'combat', 'world', 'career']);
/** The scenarios a new game can start in: each fills a fresh state. */
export const SCENARIOS = Object.freeze({ sandbox });

const nameOf = (action) => (typeof action === 'string' ? action : action?.act);
/** Whether an error from where (the loop's onError) is the sim's, and so noted in the state: a tick's or a skip's. */
export const notesInState = (where) => where === 'tick' || String(where ?? '').startsWith('skip');
const keysInit = (keys) => (state) => { for (const k of keys) fillDomain(state, k); };
const noop = () => {};

// ---- the tech domain, and the stubs ----

function debugAction(state, action, bus, ctx) {
  const m = /^debug:skip:(\d+)$/.exec(nameOf(action) ?? '');
  if (!m || state.skip || isHeld(state)) return;
  const ms = Number(m[1]);
  state.meta.debugUsed = true;
  logEntry(state, bus, { kind: 'debug', tone: 'note', text: `[debug] skipped ${durationText(ms)}` });
  ctx.sim.beginSkip(state, { activity: 'idle', planMs: ms, mask: 'D' });
}

const descriptor = (d) => Object.freeze({ idMaps: {}, idFields: {}, fast: {}, slow: [], jobs: {}, events: {}, actions: {}, upgrades: [], ...d });

/** TECH's own domain: meta, rng, log, flags; the debug commands. */
export const techDomain = descriptor({ name: 'tech', owner: 'TECH', keys: ['meta', 'rng', 'log', 'flags'], init: keysInit(['meta', 'rng', 'log', 'flags']), actions: { debug: debugAction } });

const stub = (name, owner, keys, more = {}) => descriptor({ name, owner, keys, init: keysInit(keys), stub: true, ...more });
/** The domains not built yet: each claims its keys (TECH §6.1) and fills them empty. */
export const STUB_DOMAINS = Object.freeze({
  people: stub('people', 'PEOPLE', ['player', 'people', 'units', 'happenings', 'actors', 'mind', 'talk', 'names'], {
    idMaps: { people: 'p', units: 'unit' }, idFields: { 'player.id': 'p', 'player.actor': 'a' }, actions: { people: noop, instinct: noop },
  }),
  weapons: stub('weapons', 'WEAPONS', ['stop', 'items', 'armoury'], { idMaps: { items: 'i', 'armoury.guns': 'i' }, actions: { shoot: noop } }),
  combat: stub('combat', 'COMBAT', ['fights'], { actions: { hit: noop, grab: noop, guard: noop } }),
  world: stub('world', 'TECH', ['world']),
  career: stub('career', 'CAREER', ['career', 'careers', 'memorial']),
});

const BUILT_IN = () => ({ tech: techDomain, time: timeDomain, places: placesDomain, ...STUB_DOMAINS });

// (a descriptor with every field present, named by its slot)
function normalise(name, d) {
  if (!d) throw new Error(`no domain '${name}'`);
  return {
    name, owner: d.owner ?? name, keys: [...(d.keys ?? [])], idMaps: { ...(d.idMaps ?? {}) }, idFields: { ...(d.idFields ?? {}) },
    init: d.init ?? null, fast: { ...(d.fast ?? {}) }, slow: [...(d.slow ?? [])], jobs: { ...(d.jobs ?? {}) }, events: { ...(d.events ?? {}) },
    actions: { ...(d.actions ?? {}) }, upgrades: [...(d.upgrades ?? [])], stub: !!d.stub,
  };
}

/** The game's domains in order, with replacements ({ <name>: descriptor }) and additions. */
export function domainsOf(replace = {}) {
  const built = BUILT_IN();
  const list = DOMAIN_ORDER.map(n => normalise(n, replace[n] ?? built[n]));
  for (const n of Object.keys(replace)) if (!DOMAIN_ORDER.includes(n)) list.push(normalise(n, replace[n]));
  return list;
}

// ---- the sim ----

/** Compose the game on a loop (see the header). Returns the sim. */
export function createSim({ loop = null, bus, domains = {} } = {}) {
  if (!bus) throw new Error('createSim(): a bus is needed');
  const list = domainsOf(domains);
  resetDomains();
  for (const d of list) registerDomain(d.name, d);
  for (const d of list) for (const [id, fn] of d.upgrades) addUpgrade(id, fn, { scoped: true });
  for (const d of list) for (const layer of Object.keys(d.fast)) {
    if (!LAYER_NAMES.has(layer)) throw new Error(`domain '${d.name}' contributes to a fast layer '${layer}' that is not one of TECH §3.1's (${[...LAYER_NAMES].join(', ')})`);
  }
  const jobs = createJobs(list);
  // (on load, after the domains' fills and every upgrade (so an old save's scenario fill has set its
  // live site): a vanished job's events dropped, a missing recurring job posted. A keyless entry in
  // the registry, so it goes with the game that registered it, as the inits do)
  registerDomain('jobs', { owner: 'TECH', keys: [], after: (s) => { if (s.meta?.scenario) ensureJobs(s, jobs); } });
  const actions = {}, actionOwners = {};
  for (const d of list) for (const [prefix, fn] of Object.entries(d.actions)) {
    if (actions[prefix]) throw new Error(`the action '${prefix}' is routed twice: to '${actionOwners[prefix]}' and to '${d.name}'`);
    actions[prefix] = fn; actionOwners[prefix] = d.name;
  }
  const slow = [];
  const stats = { routed: 0, unrouted: 0, unroutedLast: null, undispatched: 0, errors: 0, slowSteps: 0 };
  const ctx = { held: false, tickMs: TICK_MS, sim: null };

  function dispatch(state, b, ev) {
    const ok = dispatchJob(state, bus, ev, jobs);
    if (!ok) stats.undispatched++;
    return ok;
  }
  function registerSlow(rec) {
    if (!rec || typeof rec.step !== 'function' || !rec.name) throw new Error('registerSlow(): { name, step, steady, nextChangeMs }');
    if (slow.some(c => c.name === rec.name)) throw new Error(`a slow contributor '${rec.name}' is registered twice`);
    slow.push(Object.freeze({ name: rec.name, step: rec.step, steady: rec.steady ?? (() => true), nextChangeMs: rec.nextChangeMs ?? (() => Infinity) }));
  }
  for (const d of list) for (const rec of d.slow) registerSlow(rec);
  // (every step starts at the saved mark, time.slowToMs, and moves it: the live minute layer's span
  // after a skip that ended mid-minute, and a skip's first step after live play stopped mid-minute,
  // then cover game time once, as TIME §5.5's parity needs. A span already stepped is not stepped again)
  // (each contributor in its own try, and the mark moved whatever they did: one that throws loses its
  // span, told by the error thrown after the rest have run, and the others never step it again)
  function slowStep(state, b, fromMs, toMs, sctx = {}) {
    const t = state.time, mark = t && Number.isFinite(t.slowToMs) ? t.slowToMs : fromMs;
    if (!(toMs > mark)) return;
    stats.slowSteps++;
    let failed = null;
    for (const c of slow) { try { c.step(state, bus, mark, toMs, sctx); } catch (e) { failed ??= e; } }
    if (t) t.slowToMs = toMs;
    if (failed) throw failed;
  }
  const allSteady = (state) => slow.every(c => c.steady(state));
  const minNextChange = (state, t0) => { let m = Infinity; for (const c of slow) { const t = c.nextChangeMs(state, t0); if (t < m) m = t; } return m; };

  // (one rule for when an event stops a skip, the outcome engine's and the due layer's fast-forward
  // check alike: TIME's masks replace defaultStops at 0.0.5, here and nowhere else)
  const stops = defaultStops;
  const skips = createSkips({ slowStep, allSteady, minNextChange, dispatch, stops, tick: (state) => {
    if (!loop || loop.state !== state) throw new Error('a fast-forward runs lived ticks on the loop playing this state');
    loop.tick(skips.ffInput(state));
  } });

  function act(state, action, b = bus, c = ctx) {
    const name = nameOf(action);
    const i = typeof name === 'string' ? name.indexOf(':') : -1;
    const fn = typeof name === 'string' ? actions[i < 0 ? name : name.slice(0, i)] : null;
    if (!fn) { stats.unrouted++; stats.unroutedLast = name ?? null; return false; }
    fn(state, action, bus, c);
    stats.routed++;
    return true;
  }

  // (the fast layers: a built-in part for due and input, then the contributors in domain order)
  const layers = FAST_LAYERS.map(L => ({ name: L.name, whileHeld: L.whileHeld, contributors: list.filter(d => d.fast[L.name]).map(d => d.name) }));
  function layerFn(L) {
    const fns = list.filter(d => d.fast[L.name]).map(d => d.fast[L.name]);
    const run = (state, input) => { for (const fn of fns) fn(state, input, bus, ctx); };
    if (L.name === 'due') return (state, input, b, lctx) => {
      ctx.held = lctx.held;
      const t = state.clock.ms;
      for (let ev = popNext(state, t); ev; ev = popNext(state, t)) {
        dispatch(state, bus, ev);
        const s = state.skip;
        if (s && s.kind === 'ff' && !s.stop && stops(s.mask, ev)) {
          s.stop = { atMs: t, by: ev.id };
          bus.emit('skip-interrupt', { id: s.id, atMs: t, by: ev.id, prio: ev.prio, line: ev.line ?? null, reflex: ev.reflex ?? null });
        }
      }
      run(state, input);
    };
    if (L.name === 'input') return (state, input, b, lctx) => {
      ctx.held = lctx.held;
      for (const a of input.act ?? []) act(state, a, bus, ctx);
      run(state, input);
    };
    return (state, input, b, lctx) => { ctx.held = lctx.held; run(state, input); };
  }
  if (loop) {
    for (const L of FAST_LAYERS) loop.register('fast', layerFn(L), { name: L.name, whileHeld: L.whileHeld });
    loop.register('slow', (state, b, pctx) => {
      const toMs = Math.floor(pctx.atMs / MIN_MS) * MIN_MS;
      slowStep(state, bus, toMs - MIN_MS, toMs, { skipping: !!pctx.skipping, skip: null });
    }, { name: 'slow', everyMs: MIN_MS });
  }

  const sim = {
    act,
    slowStep,
    registerSlow,
    allSteady,
    minNextChange,
    dispatch,
    /** Whether an event stops a skip with a mask: the one rule both engines use. */
    stops,
    beginSkip: (state, req) => skips.beginSkip(state, bus, req),
    advanceSkip: (state, targetMs = Infinity, budget, acts = []) => skips.advanceSkip(state, bus, targetMs, budget, acts),
    finishSkip: (state) => skips.finishSkip(state, bus),
    skipNow: (state, req) => skips.skipNow(state, bus, req),
    gridNext: (skip, state, t0) => skips.gridNext(skip, state, t0),
    noteError(state, error, where = 'tick') {
      const message = String(error?.message ?? error);
      if (state?.meta && notesInState(where)) {
        const errs = (state.meta.errors ??= []);
        errs.push(`${where}: ${message.split('\n')[0]}`);
        if (errs.length > ERRORS_MAX) errs.splice(0, errs.length - ERRORS_MAX);
      }
      stats.errors++;
      bus.emit('broke', { where, message });
    },
    /** The live site's east longitude (the clocks', the jobs'). */
    lonOf: (state) => siteLonEDeg(state),
    get layers() { return layers.map(L => ({ ...L, contributors: [...L.contributors] })); },
    get domains() { return list.map(d => ({ name: d.name, owner: d.owner, keys: [...d.keys], idMaps: { ...d.idMaps }, idFields: { ...d.idFields }, stub: d.stub })); },
    get slow() { return slow.map(c => c.name); },
    get actions() { return { ...actionOwners }; },
    jobs,
    stats,
  };
  ctx.sim = sim;
  if (loop) loop.useSkips?.({
    advance: (state, b, targetMs, budget, acts) => skips.advanceSkip(state, bus, targetMs, budget, acts),
    ffInput: (state) => skips.ffInput(state),
    ffCheck: (state) => skips.ffCheck(state, bus),
  });
  return sim;
}

// ---- a new game ----

/** A new game's state (see the header). */
export function newGame({ seed, mode = 'standard', scenario = 'sandbox', startMs = START_MS, hour = null, worldId = null, version = '?', domains = {} } = {}) {
  if (seed === undefined || seed === null) throw new Error('newGame(): a seed is needed');
  const fill = SCENARIOS[scenario];
  if (!fill) throw new Error(`no scenario '${scenario}' (${Object.keys(SCENARIOS).join(', ')})`);
  const s = newState(seed, { version, mode, scenario, startMs });
  s.meta.worldId = worldId ?? `w-${s.meta.seed}`;
  const list = domainsOf(domains);
  for (const d of list) d.init?.(s);
  fill(s);
  if (hour !== null && hour !== undefined) {
    const h = Math.max(0, Math.min(24, Math.floor(hour)));
    const m = Math.min(h === 24 ? 39 : 59, Math.round((hour - Math.floor(hour)) * 60));
    const t = msAtMarsTime(s.clock.ms, h, m, siteLonEDeg(s));
    s.clock.ms = s.meta.createdMs = Math.ceil(t / TICK_MS) * TICK_MS;
  }
  s.time.slowToMs = s.clock.ms;                                    // (the slow layer has stepped up to the start)
  postJobs(s, createJobs(list));
  return s;
}
