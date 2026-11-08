// OLYMPUS sim: the composition root. The one place the game is put together: its domains, its tick, its skips and its actions.
//
// createSim({ loop, bus, domains }) builds the game on a core loop (TECH §2.5), holding no state of
// its own (everything is in the state or a pure function of it), so the same file runs in the
// page, in node for the tests and the bots (tests/game.mjs), and in a replay:
//   1. the domains, in DOMAIN_ORDER (tech, time, places, body, people, weapons, combat, world, career:
//      TIME §5.4's slow order, the place, the body, the people), each a descriptor { name, owner, keys,
//      idMaps, idFields, init, start, fast, slow, jobs, events, actions, upgrades }. time is
//      src/sim/time/domain.js, places src/sim/places/domain.js, body src/sim/body/domain.js (0.0.4: the
//      body lives on the person and claims no key), people src/sim/people/domain.js, weapons
//      src/sim/arms/domain.js (0.0.5: stop motion, the items, the range; its init fills its keys as the
//      stub did, so a gunless game is v0.0.4's byte for byte), tech below; combat, world and career are
//      stubs here until their sections build
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
//      stops(mask, ev, state) rule, TIME's masks (src/sim/time/interrupts.js), that both they and the
//      due layer's fast-forward check read (sim.stops), the due layer noting a fast-forward's stops,
//      its ticker lines and its held orders as the outcome engine does (skip.js noteDue), and finishing
//      a fast-forward an event stops at that tick's clock (the event's own second, where an outcome
//      skip lands too: TIME §5.5's events at the same second), the rest of the tick lived after it.
// sim.noteError(state, error, where) is the loop's onError's other half (main.js, tests/game.mjs):
// '<where>: <first line>' into meta.errors (the last ERRORS_MAX, saved, so an exported save carries
// them) and 'broke' on the bus. Only the sim's own errors are written into the state (notesInState:
// a tick's, a skip's); a render's, a listener's or the page's are told on the bus and nowhere else,
// since TECH §3.7 says they never touch the state (0.0.2 wrote a render error into meta.errors even
// while paused, so the page's save parted from a node replay exactly when something broke).
//
// newGame({ seed, mode, scenario, scene, startMs, hour, worldId, version, domains, at, setup, tier, env }) makes a fresh
// state from a scene's spec (src/data/scenes.js; ROADMAP "anywhere", step 4): scene names one (SCENES or STARTS),
// else scenario's own (STARTS, or the first built scene that plays it: specOf, which also checks that scenes
// sharing a scenario share its host and env). Then core's newState, meta.worldId (w-<seed> unless given), every
// domain's init in order; then hour (null: the spec's; the local hour on the host site's clock, a fraction
// giving minutes) moves the clock and meta.createdMs to the next such time by src/sim/places/env.js msAtLocal at
// the spec's host, before the scenario's fill, so a barracks started at 23:00 places the squad asleep (the 0.0.3
// build sheet §8, item 20; the fills no longer move it themselves); then the environment: env (a preset of
// src/data/places/env.js ENV_PRESETS, the debug's &env=, ROADMAP "anywhere" step 2) or else the spec's own when
// it names one ({ preset: 'site' } names none: every shipped scene, which so writes nothing) is set live on the
// host site before the fill (its site entered first, src/sim/places/model.js enterSite, which keeps the
// environment while the fill moves within that site; src/sim/places/env.js setLiveEnv: saved; an unknown preset
// throws), so the fill and the scene's first tick read its gravity and air; then the fill
// (SCENARIOS: the sandbox, src/sim/scenarios/sandbox.js, the test rooms; the barracks,
// src/sim/scenarios/barracks.js, Echo Company drawn from the seed and the player in 1st Squad's bay),
// given { at, setup } (an { area, x, z, face } to start at; a scene's setup, test-handling's 'hot' or
// 'bench' for the tests and the bench), which must leave the host's site live (and the environment set on it:
// both checked, so a fill that wanders off its host throws), then each recurring job's first occurrence is
// posted, then each domain's start(state) in order (a new game's own: the body's start body, the
// night's taps, reveille and drill). The start is START_MS, 2351-12-19 02:20 UTC (SETTING §3.7); a
// test world has no career (ROADMAP §2.1). The test scenes (src/sim/scenarios/tests.js, 0.0.4) are
// test-shower and test-night, on Melas: the barracks at their hour with the scene's body and outfit;
// 0.0.5 adds test-handling, "Show clear" (src/sim/scenarios/handling.js: the 25 m line of the KD range); 0.0.7
// test-range, "The line at 300 m" (src/sim/scenarios/range.js: the KD range in full, its relay, its pits); 0.0.8
// test-pairs, "Pairs" (src/sim/scenarios/pairs.js: the take-in and the shot rows on the bay's turners), whose fill takes
// newGame's tier (a test sheet: recruit, private, cpl, sgt, raider, tierone; null the scene's own, the private); 0.0.10
// test-stress, "Bang" (src/sim/scenarios/stress.js: the stress course on pairs.js's engine), its fill taking the tier too.
// act()'s first line is the take-in's gate (the build sheet 0.0.8 §2.6, §8 item 25): while a contact's window is open
// (src/sim/combat/contact.js refusesAct) every sim action is refused and counted (stats.refused), in node and the page
// alike, so a replay from the state and the inputs pauses where the game did (COMBAT §25.4.5, §25.4.8).
//
// The tech domain's actions: debug:skip:<ms> (the debug keys ^ and $ on AZERTY, the codes
// BracketLeft and BracketRight, [ and ] on QWERTY) marks the save (meta.debugUsed, an honesty mark,
// TECH §15.5), writes a [debug] log record and starts TIME's idle activity for that long (an outcome
// skip, mask D A: a drill stops it); debug:go:<areaId>:<x>:<z>[:<face>] (the debug handle's go())
// marks the save, writes a [debug] record and moves the player there, across areas if need be, by
// places' moveTo (src/sim/places/portals.js), as a portal would; debug:drill:<ms> marks the save,
// writes a [debug] record, sets time.drills.forced to that game time and posts the night again (TIME's
// postNight), so the alert drill sounds then (a test scene's, the debug handle's drill()).
// The tick's order and the shape of skip() are referenced from tradecraft v0.2.0-rc3 src/sim/game.js
// (620 lines; its body is rewritten, TECH §12.3).
import { newState, registerDomain, resetDomains, fillDomain, addUpgrade, ERRORS_MAX } from '../core/state.js';
import { popNext } from '../core/queue.js';
import { MIN_MS, TICK_MS, isHeld, durationText } from '../core/clock.js';
import { START_MS } from '../data/setting/calendar.js';
import { createJobs, dispatch as dispatchJob, postJobs, ensureJobs, siteLonEDeg } from './jobs.js';
import { createSkips, engineOf, noteDue } from './time/skip.js';
import { stops as maskStops } from './time/interrupts.js';
import { timeDomain } from './time/domain.js';
import { startActivity } from './time/activities.js';
import { postNight } from './time/pod.js';
import { bodyDomain } from './body/domain.js';
import { placesDomain } from './places/domain.js';
import { enterSite } from './places/model.js';
import { setLiveEnv, msAtLocal } from './places/env.js';
import { moveTo } from './places/portals.js';
import { peopleDomain } from './people/domain.js';
import { sandbox } from './scenarios/sandbox.js';
import { barracks } from './scenarios/barracks.js';
import { testShower, testNight } from './scenarios/tests.js';
import { testHandling } from './scenarios/handling.js';
import { testRange } from './scenarios/range.js';
import { testPairs } from './scenarios/pairs.js';
import { testStress } from './scenarios/stress.js';
import { refusesAct } from './combat/contact.js';
import { weaponsDomain } from './arms/domain.js';
import { SCENES, STARTS } from '../data/scenes.js';
import { logEntry } from './log.js';

/** The fast layers of a tick, in order (TECH §3.1); input and offers run while time stands still. */
export const FAST_LAYERS = Object.freeze(['due', 'input', 'player', 'actors', 'bodyFast', 'rehash', 'look', 'think', 'rules', 'paths', 'second', 'offers']
  .map(name => Object.freeze({ name, whileHeld: name === 'input' || name === 'offers' })));
const LAYER_NAMES = new Set(FAST_LAYERS.map(L => L.name));
/** The domains, in the order their contributors run. */
export const DOMAIN_ORDER = Object.freeze(['tech', 'time', 'places', 'body', 'people', 'weapons', 'combat', 'world', 'career']);
/** The scenarios a new game can start in: each fills a fresh state (fill(state, { at })). */
export const SCENARIOS = Object.freeze({ sandbox, barracks, 'test-shower': testShower, 'test-night': testNight, 'test-handling': testHandling, 'test-range': testRange, 'test-pairs': testPairs, 'test-stress': testStress });

// (one host and one environment a scenario: the scenes that share a fill differ only in the hud's fields and their setup)
const sameStand = (a, b) => JSON.stringify([a.host, a.env]) === JSON.stringify([b.host, b.env]);
/**
 * The spec a new game starts from (src/data/scenes.js): { scene } a SCENES or STARTS id; else { scenario }'s own start
 * (STARTS) or the first built scene that plays it. Throws for an unknown one, a stub (built false: no layout yet), a
 * spec whose scenario has no fill, and scenes of one scenario that stand at different hosts or environments.
 */
export function specOf({ scene = null, scenario = null } = {}) {
  let spec = null;
  if (scene) {
    spec = SCENES[scene] ?? STARTS[scene] ?? null;
    if (!spec) throw new Error(`no scene '${scene}' (${[...Object.keys(SCENES), ...Object.keys(STARTS)].join(', ')})`);
    if (spec.built === false) throw new Error(`the scene '${scene}' is a stub: its layout and fill are not built yet`);
  } else {
    spec = STARTS[scenario] ?? Object.values(SCENES).find(x => x.scenario === scenario && x.built !== false) ?? null;
    if (!spec) throw new Error(`no scenario '${scenario}' (${Object.keys(SCENARIOS).join(', ')})`);
  }
  if (!SCENARIOS[spec.scenario]) throw new Error(`the scene '${spec.id}' plays no known scenario ('${spec.scenario}')`);
  if (!spec.host?.site || !spec.env?.preset) throw new Error(`the scene '${spec.id}' names no host site or env`);
  const odd = Object.values(SCENES).find(x => x.scenario === spec.scenario && !sameStand(x, spec));
  if (odd) throw new Error(`the scenes '${spec.id}' and '${odd.id}' play '${spec.scenario}' at different hosts or environments`);
  return spec;
}

const nameOf = (action) => (typeof action === 'string' ? action : action?.act);
/** Whether an error from where (the loop's onError) is the sim's, and so noted in the state: a tick's or a skip's. */
export const notesInState = (where) => where === 'tick' || String(where ?? '').startsWith('skip');
const keysInit = (keys) => (state) => { for (const k of keys) fillDomain(state, k); };
const noop = () => {};

// ---- the tech domain, and the stubs ----

const FACES = new Set(['up', 'down', 'left', 'right']);
function debugAction(state, action, bus, ctx) {
  const name = nameOf(action) ?? '';
  const go = /^debug:go:([a-z0-9][a-z0-9.-]*):(-?\d+(?:\.\d+)?):(-?\d+(?:\.\d+)?)(?::([a-z]+))?$/.exec(name);
  if (go) {
    if (state.skip || isHeld(state) || !state.player?.actor) return;
    const [, area, x, z, face] = go;
    state.meta.debugUsed = true;
    logEntry(state, bus, { kind: 'debug', tone: 'note', text: `[debug] went to ${area} (${x}, ${z})` });
    moveTo(state, state.player.actor, { area, x: Number(x), z: Number(z), face: FACES.has(face) ? face : undefined }, bus, { why: 'debug' });
    return;
  }
  const drill = /^debug:drill:(\d+)$/.exec(name);
  if (drill) {
    const ms = Number(drill[1]);
    state.meta.debugUsed = true;
    logEntry(state, bus, { kind: 'debug', tone: 'note', text: `[debug] an alert drill at ${ms}` });
    (state.time.drills ??= {}).forced = ms;
    postNight(state, state.clock.ms);
    return;
  }
  const m = /^debug:skip:(\d+)$/.exec(name);
  if (!m || state.skip || isHeld(state) || state.time?.doing) return;
  const ms = Number(m[1]);
  state.meta.debugUsed = true;
  logEntry(state, bus, { kind: 'debug', tone: 'note', text: `[debug] skipped ${durationText(ms)}` });
  startActivity(state, bus, ctx, { id: 'idle', args: { ms }, force: 'outcome' });
}

const descriptor = (d) => Object.freeze({ idMaps: {}, idFields: {}, fast: {}, slow: [], jobs: {}, events: {}, actions: {}, upgrades: [], ...d });

/** TECH's own domain: meta, rng, log, flags; the debug commands. */
export const techDomain = descriptor({ name: 'tech', owner: 'TECH', keys: ['meta', 'rng', 'log', 'flags'], init: keysInit(['meta', 'rng', 'log', 'flags']), actions: { debug: debugAction } });

const stub = (name, owner, keys, more = {}) => descriptor({ name, owner, keys, init: keysInit(keys), stub: true, ...more });
/** The domains not built yet: each claims its keys (TECH §6.1) and fills them empty. */
export const STUB_DOMAINS = Object.freeze({
  combat: stub('combat', 'COMBAT', ['fights'], { actions: { hit: noop, grab: noop, guard: noop } }),
  world: stub('world', 'TECH', ['world']),
  career: stub('career', 'CAREER', ['career', 'careers', 'memorial']),
});

const BUILT_IN = () => ({ tech: techDomain, time: timeDomain, places: placesDomain, body: bodyDomain, people: peopleDomain, weapons: weaponsDomain, ...STUB_DOMAINS });

// (a descriptor with every field present, named by its slot)
function normalise(name, d) {
  if (!d) throw new Error(`no domain '${name}'`);
  return {
    name, owner: d.owner ?? name, keys: [...(d.keys ?? [])], idMaps: { ...(d.idMaps ?? {}) }, idFields: { ...(d.idFields ?? {}) },
    init: d.init ?? null, start: d.start ?? null, fast: { ...(d.fast ?? {}) }, slow: [...(d.slow ?? [])], jobs: { ...(d.jobs ?? {}) }, events: { ...(d.events ?? {}) },
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
  // check alike: TIME's masks, given the state for TIME §7.4's limits, here and nowhere else)
  const stops = maskStops;
  const skips = createSkips({ slowStep, allSteady, minNextChange, dispatch, stops, tick: (state) => {
    if (!loop || loop.state !== state) throw new Error('a fast-forward runs lived ticks on the loop playing this state');
    loop.tick(skips.ffInput(state));
  } });

  function act(state, action, b = bus, c = ctx) {
    // (the take-in's gate (see the header): nothing the player does lands while a contact's window is open)
    if (refusesAct(state, action)) { stats.refused = (stats.refused ?? 0) + 1; return false; }
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
        // (a fast-forward stopped by an event lands at its tick, as an outcome skip lands at its second: the rest of the tick is lived)
        if (s && engineOf(s) === 'ff' && !s.stop && noteDue(state, bus, s, ev, t, stops)) skips.finishSkip(state, bus);
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
    /** Whether an event stops a skip with a mask (given the state, TIME §7.4's limits): the one rule both engines use. */
    stops: (mask, ev, state = null) => stops(mask, ev, state),
    beginSkip: (state, req) => skips.beginSkip(state, bus, req),
    advanceSkip: (state, targetMs = Infinity, budget, acts = []) => skips.advanceSkip(state, bus, targetMs, budget, acts),
    finishSkip: (state) => skips.finishSkip(state, bus),
    /** One fast-forward tick on its own input and its end check, as the loop's ffFrame runs them (a driver stepping the page by hand): whether it ended. */
    ffTick: (state) => {
      if (!loop || loop.state !== state) throw new Error('a fast-forward runs lived ticks on the loop playing this state');
      loop.tick(skips.ffInput(state));
      return skips.ffCheck(state, bus);
    },
    /** After a fast-forward's lived tick: finish it at its end or its stop (the loop's ffFrame does this; a test driving ticks by hand does too). Returns whether it is over. */
    ffCheck: (state) => skips.ffCheck(state, bus),
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
export function newGame({ seed, mode = 'standard', scenario = 'sandbox', scene = null, startMs = START_MS, hour = null, worldId = null, version = '?', domains = {}, at = null, setup = null, tier = null, env = null } = {}) {
  if (seed === undefined || seed === null) throw new Error('newGame(): a seed is needed');
  const spec = specOf({ scene, scenario }), fill = SCENARIOS[spec.scenario], site = spec.host.site;
  const s = newState(seed, { version, mode, scenario: spec.scenario, startMs });
  s.meta.worldId = worldId ?? `w-${s.meta.seed}`;
  const list = domainsOf(domains);
  for (const d of list) d.init?.(s);
  // (the clock to the start's hour on the host's clock, before the fill: the sheet §8, item 20)
  const at0 = hour ?? spec.hour ?? null;
  if (at0 !== null) {
    const h = Math.max(0, Math.min(24, Math.floor(at0)));
    const m = Math.min(h === 24 ? 39 : 59, Math.round((at0 - Math.floor(at0)) * 60));
    s.clock.ms = s.meta.createdMs = Math.ceil(msAtLocal(site, s.clock.ms, h, m) / TICK_MS) * TICK_MS;
  }
  // (the scene's environment, live on its host before the fill: the debug's &env= over the spec's own; 'site' sets none)
  const { preset, ...over } = spec.env;
  const live = env ? { preset: env } : preset !== 'site' ? { preset, ...over } : null;
  if (live) { enterSite(s, site, spec.host.area); setLiveEnv(s, live); }
  fill(s, { at, setup: setup ?? spec.setup ?? null, tier });
  if (s.places.live?.site !== site) throw new Error(`the scene '${spec.id}' stands on '${site}', and its fill left '${s.places.live?.site}' live`);
  if (live && !s.places.live.env) throw new Error(`the scene '${spec.id}''s fill dropped its environment ('${live.preset}')`);
  s.time.slowToMs = s.clock.ms;                                    // (the slow layer has stepped up to the start)
  postJobs(s, createJobs(list));
  for (const d of list) d.start?.(s);
  return s;
}
