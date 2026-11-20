// OLYMPUS tests: the headless game (TECH §13.2). The real sim, in node, with no DOM and no render.
//
//   const g = createGame({ scenario: 'sandbox', seed: 1 });
//   g.step(600, (state, me, mem) => ({ mx: 1 }));       // ticks, with an input or a bot
//   g.skipNow({ activity: 'wait', planMs: 15 * MIN_MS });
//   const json = g.save(); g.load(json); g.digest();
//
// createGame builds what main.js builds in the page, less the page: a core loop (src/core/loop.js)
// with a recording bus (bus.events keeps every fact, in order), the sim composed on it by
// src/sim/game.js createSim (its fast layers, its slow layer, its skips), and a new game from
// newGame() (the scenario, the seed, the mode, the domains given to replace built-in ones, such as
// tests/game-dummy.mjs's world). It holds nothing of its own but those: load() swaps the state and
// the same loop and sim carry on. From v0.0.26 the new game is a clone of the first made for the same options in this process
// (newGameMemo below; NO_GAME_MEMO=1 makes each anew).
//
// step(n, inputOrBot) runs n loop ticks. The input is a partial snapshot ({ mx: 1 } is enough,
// filled from NO_INPUT; an act in a fixed input fires on every one of the n ticks, so step(1, …)
// for one press), or a bot: (state, me, mem) → input for one tick, pure, me the player's actor and
// mem its memory, me.bot (plain data on the actor, so it saves and loads with the game; tradecraft
// tests/bots.mjs). Skips run as the page runs them, on the same grid (TECH §5.3) but synchronously:
//   - (by the skip's engine, not its kind: TECH §3.6) an outcome, out, day or world skip begun in a tick (R's wait, a debug skip) is advanced to its
//     end with no budget before the next tick, as skipNow() would (the page slices it over frames;
//     the slicing never moves the result: game-slices);
//   - a fast-forward skip runs real ticks: while one is on, each tick takes the skip's own input
//     (the loop's ffInput) instead of the caller's, and the loop's ffCheck ends it, as an ff frame
//     does (or the tick's due layer, at an interrupting event's own tick: 0.0.4). Both hooks are
//     what createSim gives loop.useSkips, caught here on the way in.
// A tick that throws is lost (the loop's rule) and noted in meta.errors by sim.noteError, as in the
// page; here it also goes into g.errors, and with strict (the default) the step throws, so a test
// can't pass over a lost tick (both runs of a determinism test would lose the same one).
import { createLoop, NO_INPUT } from '../src/core/loop.js';
import { engineOf } from '../src/sim/time/skip.js';
import { recordingBus } from '../src/core/bus.js';
import { toJSON, fromJSON } from '../src/core/state.js';
import { digest as digestOf } from '../src/core/hash.js';
import { TICK_MS } from '../src/core/clock.js';
import { createSim, newGame } from '../src/sim/game.js';
import { playerActor } from '../src/core/ids.js';
import { ROOMS_URL, LAYOUTS_URL, PLANS_URL, houseChoice } from '../src/core/debug.js';

export { NO_INPUT };
/** A skip budget that is never over: a skip advanced with it runs to its end. */
export const NO_BUDGET = Object.freeze({ over: () => false });
/** A budget of n grid steps a slice (tests slice by steps; the page by real time). */
export const stepBudget = (n) => Object.freeze({ over: (stepsDone) => stepsDone >= n });
/**
 * The tests' house where a createGame names none (v0.0.21, the build sheet §1 item 17): null, the set; withHouse({ draw: 'drawn' } or
 * { house: code }, fn) runs fn with every such createGame drawn, so the gauges' own lane runners (flawless.mjs, -kit, -bodies, -room,
 * -card) play drawn lanes as written (house-drawn). A createGame that names a draw (`draw: 'set'` included) or a house keeps its own.
 * v0.0.22: the override may carry rooms ('all') and layout ('B', 'C') as well; a createGame naming either keeps its own.
 */
let HOUSE_OVERRIDE = null;
export function withHouse(o, fn) { const was = HOUSE_OVERRIDE; HOUSE_OVERRIDE = o ?? null; try { return fn(); } finally { HOUSE_OVERRIDE = was; } }
// (v0.0.26: "Bang, then go"'s draw for every house game a suite's helper makes inside fn and names none (withBreach('bang,held', fn): the
// live lanes' gauges, tests/flawless-live.mjs liveLane, played on the scene by tests/breach-nodead), as withHouse does for the house)
let BREACH_OVERRIDE = null;
export function withBreach(code, fn) { const was = BREACH_OVERRIDE; BREACH_OVERRIDE = code ?? null; try { return fn(); } finally { BREACH_OVERRIDE = was; } }
/**
 * The house's options createGame passes to newGame (v0.0.22, the build sheet §2 step 3, §0 item 40): the page's precedence (core/debug.js
 * houseChoice) with rooms 'a' the default whatever the page's HOUSE_ROOMS_DEFAULT says: a named layout beats a code, the rooms and
 * the draw ('A' the set: nothing passed); a code names its rooms; rooms 'all' alone implies drawn, and with draw 'set' is dropped. A
 * code is drawn whatever the draw, as v0.0.21's createGame made it, and draw 'set' is passed as nothing, as it was; doors and plans
 * pass when given. The set gives {}. `pool` (v0.0.22's fixer) is the end card's: the room set a code was drawn from, kept with it.
 */
export function houseOpts({ draw = null, house = null, doors = null, rooms = 'a', layout = null, plans = null, pool = null } = {}) {
  const H = houseChoice({ draw, house, rooms: rooms === 'a' ? null : rooms, layout, pool }, { roomsDefault: 'a' }).opts;
  const drawn = H.house || H.draw === 'drawn' ? 'drawn' : null;
  return { ...(drawn ? { draw: drawn } : {}), ...(H.house ? { house: H.house } : {}), ...(doors ? { doors } : {}), ...(H.rooms ? { rooms: H.rooms } : {}), ...(H.layout ? { layout: H.layout } : {}), ...(plans ? { plans } : {}) };
}
/**
 * The fresh game kept per process (v0.0.26's stage 0, its build sheet §2 step 2; the carried lens §4.2 item 1): a quick run makes
 * about 3,600 games, half of them repeats of options made before in the same worker (the barracks' roster alone is 10 ms a roll), so
 * newGameMemo(opts) keeps the first newGame(opts) for given options, keyed by the options' JSON, and hands every caller a
 * structuredClone of it, the first caller included, so every game a test makes is a clone of one plain state whether it was made
 * now or before. The state is plain data (CLAUDE.md's rule), so a clone of it is the state newGame would make again: the same save,
 * the same digest, the same play (game-memo holds it, with and without). A game that changes its state never reaches the kept one.
 * Options with test domains (descriptors that replace built-in ones) are never kept, nor a state that will not clone; at most
 * GAME_MEMO_MAX are kept, the least recently used dropped first. NO_GAME_MEMO=1 (read at each call) makes every game anew.
 */
export const GAME_MEMO_MAX = 64;
const GAME_MEMO = new Map();
const memoCount = { hits: 0, misses: 0, skipped: 0 };
/** The memo's counts so far in this process: { hits, misses, skipped, kept }. */
export const gameMemoStats = () => ({ ...memoCount, kept: GAME_MEMO.size });
/** A fresh state for newGame's options (see above). */
export function newGameMemo(opts) {
  if (process.env.NO_GAME_MEMO === '1' || Object.keys(opts.domains ?? {}).length) { memoCount.skipped++; return newGame(opts); }
  const key = JSON.stringify(opts);
  let kept = GAME_MEMO.get(key);
  if (kept) { memoCount.hits++; GAME_MEMO.delete(key); GAME_MEMO.set(key, kept); return structuredClone(kept); }
  kept = newGame(opts);
  let out;
  try { out = structuredClone(kept); } catch { memoCount.skipped++; return kept; }
  memoCount.misses++;
  GAME_MEMO.set(key, kept);
  if (GAME_MEMO.size > GAME_MEMO_MAX) GAME_MEMO.delete(GAME_MEMO.keys().next().value);
  return out;
}
/** Real skips end; one that hasn't after this many slices is a bug, not a long skip. */
export const SKIP_SLICES_MAX = 1_000_000;

const firstLine = (e) => String(e?.message ?? e).split('\n')[0];
/** A tick's input from a partial one: { mx: 1 } → the whole snapshot, its act a fresh array. */
export const fullInput = (inp) => (inp ? { ...NO_INPUT, ...inp, act: inp.act ? [...inp.act] : [] } : { ...NO_INPUT, act: [] });
/** The player's actor in a state, or null (core/ids.js's one helper). */
export { playerActor };

/**
 * A headless game: { state, bus, loop, sim, errors, step, run, skipNow, advance, me, digest, save,
 * load, facts }. Options: scenario, seed, mode, hour, startMs, worldId, domains (descriptors that
 * replace built-in domains, for createSim and newGame alike), version (meta.version, 'test' so a
 * golden doesn't move with VERSION), strict (throw on a lost tick or a listener's error), at (an
 * { area, x, z, face } the scenario starts the player at, as the page's ?at= does), setup (a scene's), tier (0.0.8:
 * test-pairs' test sheet, as the page's ?tier= does), env (a preset the scene runs under, as the page's ?env= does:
 * ROADMAP "anywhere" step 2), par (0.0.12: test-shoothouse's instructor's par, as the page's ?par= does), loadout (0.0.18: test-shoothouse's, a preset or a
 * code of src/sim/arms/loadout.js, as the page's ?loadout= does), opfor (0.0.19: the live lane's role-players, as the page's
 * ?opfor= does; passed to newGame only when given, so a game without it is made as before), draw, house and doors (v0.0.21: the
 * drawn house), rooms, layout and plans (v0.0.22, the build sheet §2 step 3, §0 item 40: rooms 'a' (layout A's three, whatever the
 * page's HOUSE_ROOMS_DEFAULT) or 'all' (X4's eight, which alone implies drawn and with draw 'set' is dropped, as the page drops it);
 * layout 'A' (the set), 'B' or 'C', a named house that beats house, rooms and draw; plans 'derived'; each passed only when not the
 * default, so no test, pin or golden moves with them absent). breach (v0.0.26: "Bang, then go"'s draw on the house's scenario, 'drawn'
 * or a code '<bang|quiet>,<held|loose>' (shoothouse.js parseBreach), as the page's &breach= does; passed only when given, and keyed by the
 * memo with the other options). holdouts (v0.0.27: "Away the boarding party"'s, 'pirates' or 'smugglers', as the page's &holdouts= does;
 * passed only when given, keyed by the memo likewise).
 */
export function createGame({ scenario = 'sandbox', seed = 1, mode = 'standard', hour = null, startMs, worldId = null,
  domains = {}, version = 'test', strict = true, at = null, setup = null, tier = null, env = null, par = null, loadout = null, opfor = null, draw = null, house = null, doors = null, rooms = 'a', layout = null, plans = null, pool = null, again = false, breach = null, holdouts = null } = {}) {
  const errors = [];
  let sim = null, hooks = null, seen = 0;
  const bus = recordingBus({ onError: (e, type) => errors.push(`a listener of '${type}': ${firstLine(e)}`) });
  const loop = createLoop({ bus, onError: (e, where) => {
    errors.push(`${where}: ${firstLine(e)}`);
    try { sim?.noteError?.(loop.state, e, where); } catch { /* (the note must never be what breaks) */ }
  } });
  // (the skip hooks createSim hands the loop: an ff tick's input and its end check, kept for step())
  if (typeof loop.useSkips === 'function') {
    const useSkips = loop.useSkips;
    loop.useSkips = (h) => { hooks = h; return useSkips.call(loop, h); };
  }
  sim = createSim({ loop, bus, domains });
  // (v0.0.21, the build sheet §0 item 50: the house 'set' unless the test says 'drawn' or gives a code (which implies drawn), whatever the
  // page's HOUSE_DRAW_DEFAULT; the set passes nothing, so no test, pin or golden moves with that default)
  // (withHouse's override reads only a createGame that names no draw and no house: `draw` null is "none named", so a test's own
  // `draw: 'set'` keeps the set inside withHouse too; the review of v0.0.21's A and B)
  // (v0.0.22, the build sheet §2 step 3, §0 item 40: rooms, layout and plans checked, so a typo fails here, not as the set)
  // (v0.0.23, its build sheet §2 step 3: again, the house's Again of the same lane, true or false only; passed only when true)
  if (typeof again !== 'boolean') throw new Error(`createGame(): no such again ${JSON.stringify(again)} (true or false)`);
  if (!ROOMS_URL.includes(rooms ?? 'a') || (layout !== null && !LAYOUTS_URL.includes(layout)) || (plans !== null && !PLANS_URL.includes(plans))) throw new Error(`createGame(): no such house option ${JSON.stringify({ rooms, layout, plans })}`);
  // (and from v0.0.22 the override's rooms and layout too (withHouse({ draw: 'drawn', rooms: 'all' }, fn)), for a createGame naming none)
  if (breach === null && BREACH_OVERRIDE && scenario === 'test-shoothouse') breach = BREACH_OVERRIDE;
  if (draw === null && !house && !layout && (rooms ?? 'a') === 'a' && HOUSE_OVERRIDE) { house = HOUSE_OVERRIDE.house ?? null; draw = HOUSE_OVERRIDE.draw ?? null; rooms = HOUSE_OVERRIDE.rooms ?? 'a'; layout = HOUSE_OVERRIDE.layout ?? null; }
  // (v0.0.22, the B and C review of 2026-11-16: a live lane is drawn as the test asks (liveDraw), which the page never passes: there it
  // is the set until its ship rule is met, shoothouse.js drawnCodeFor; a lane with no draw asked is the set either way)
  const opts = { seed, mode, scenario, hour, worldId, version, domains, at, setup, tier, env, ...(par ? { par } : {}), ...(loadout ? { loadout } : {}), ...(opfor ? { opfor } : {}), ...houseOpts({ draw, house, doors, rooms, layout, plans, pool }), liveDraw: true, ...(again ? { again } : {}), ...(breach ? { breach } : {}), ...(holdouts ? { holdouts } : {}) };
  if (startMs !== undefined) opts.startMs = startMs;
  // (v0.0.26's stage 0: the fresh state kept per process by its options, newGameMemo below)
  loop.setState(newGameMemo(opts));

  const strictCheck = () => {
    if (strict && errors.length > seen) { const fresh = errors.slice(seen); seen = errors.length; throw new Error(`the game broke: ${fresh.join('; ')}`); }
  };
  // (an outcome-engine skip begun in this tick: run to its end before the next one, as skipNow does)
  function finishSkips() {
    const s = loop.state;
    if (!s?.skip) return;
    if (engineOf(s.skip) === 'ff') { hooks?.ffCheck?.(s, bus); return; }
    for (let n = 0; s.skip && n < SKIP_SLICES_MAX; n++) if (sim.advanceSkip(s, Infinity, NO_BUDGET)?.done) break;
    if (s.skip) throw new Error(`a skip that never ends: ${JSON.stringify({ ...s.skip, ticker: undefined, frame: undefined })}`);
  }
  function inputFor(s, inputOrBot) {
    if (s.skip && engineOf(s.skip) === 'ff' && hooks?.ffInput) return fullInput(hooks.ffInput(s));
    if (typeof inputOrBot !== 'function') return fullInput(inputOrBot);
    const me = playerActor(s);
    return fullInput(inputOrBot(s, me, me ? (me.bot ??= {}) : {}));
  }

  const game = {
    get state() { return loop.state; },
    bus, loop, errors,
    get sim() { return sim; },
    /** n ticks with an input or a bot (see the header). Returns how many moved the clock. */
    step(n = 1, inputOrBot = NO_INPUT) {
      let moved = 0;
      for (let i = 0; i < n; i++) {
        // (a save loaded inside an outcome skip: the page's loop finishes it before ticking again)
        if (loop.state.skip && engineOf(loop.state.skip) !== 'ff') { finishSkips(); strictCheck(); }
        const s = loop.state;
        if (loop.tick(inputFor(s, inputOrBot))) moved++;
        strictCheck();
        finishSkips();
        strictCheck();
      }
      return moved;
    },
    /** One tick that leaves an outcome skip it begins open, as the page's splash has it (a save made behind a splash: advance() moves it part-way, step() finishes it). */
    tickOpen(inputOrBot = NO_INPUT) {
      if (loop.state.skip) return false;
      const moved = loop.tick(inputFor(loop.state, inputOrBot));
      strictCheck();
      return moved;
    },
    /** ms of game time in ticks (ms / TICK_MS of them), with a bot or an input. */
    run(ms, bot = NO_INPUT) { return game.step(Math.round(ms / TICK_MS), bot); },
    /** A skip begun, advanced to its end and finished now (sim.skipNow): its skip-end payload. */
    skipNow(req) { const out = sim.skipNow(loop.state, req); strictCheck(); return out; },
    /** A skip begun now and left running (sim.beginSkip): advance() moves it. */
    beginSkip(req) { const out = sim.beginSkip(loop.state, req); strictCheck(); return out; },
    /** One slice of the running skip (sim.advanceSkip): { steps, done }. */
    advance(targetMs = Infinity, budget = NO_BUDGET, acts = []) { const out = sim.advanceSkip(loop.state, targetMs, budget, acts); strictCheck(); return out; },
    /** The player's actor. */
    me() { return playerActor(loop.state); },
    /** The digest of the save as it stands. */
    digest() { return digestOf(toJSON(loop.state)); },
    /** The save's JSON (canonical). */
    save() { return toJSON(loop.state); },
    /**
     * Play a save from here: JSON goes through fromJSON (its upgrade, as a load in the page); a
     * state object is played as given, its keys in their own order (the key-order test's way in).
     */
    load(jsonOrState) { const s = typeof jsonOrState === 'string' ? fromJSON(jsonOrState) : jsonOrState; loop.setState(s); return s; },
    /** The facts of a kind the bus has carried ([data…]), or every one ([[type, data]…]). */
    facts(type = null) { return type ? bus.events.filter(([t]) => t === type).map(([, d]) => d) : bus.events.slice(); },
    /** Forget the facts carried so far (a long run's memory). */
    clearFacts() { bus.events.length = 0; },
  };
  return game;
}
