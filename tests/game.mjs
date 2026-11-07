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
// the same loop and sim carry on.
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

export { NO_INPUT };
/** A skip budget that is never over: a skip advanced with it runs to its end. */
export const NO_BUDGET = Object.freeze({ over: () => false });
/** A budget of n grid steps a slice (tests slice by steps; the page by real time). */
export const stepBudget = (n) => Object.freeze({ over: (stepsDone) => stepsDone >= n });
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
 * { area, x, z, face } the scenario starts the player at, as the page's ?at= does).
 */
export function createGame({ scenario = 'sandbox', seed = 1, mode = 'standard', hour = null, startMs, worldId = null,
  domains = {}, version = 'test', strict = true, at = null, setup = null } = {}) {
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
  const opts = { seed, mode, scenario, hour, worldId, version, domains, at, setup };
  if (startMs !== undefined) opts.startMs = startMs;
  loop.setState(newGame(opts));

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
