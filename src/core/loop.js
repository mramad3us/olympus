// OLYMPUS core: the loop. Real time in, fixed ticks out, and time skipped with outcomes.
//
// The fixed step (tradecraft's main.js loop, LONGHAUL's GameLoop): each animation frame adds the
// real time since the last (capped at FRAME_CAP_MS = 250 ms, so a stall or a hidden tab costs at
// most five ticks of catch-up, never a burst) to an accumulator, and the sim steps in whole ticks of
// TICK_MS = 50 ms while it holds one. The renderer is handed alpha, the fraction of the next tick
// already owed, to draw between the last two ticks. One game second per real second, no speed
// controls (DESIGN.md, Time).
//
// The layers (DESIGN.md, Time: "The background world steps in layers"), kept generic: anything
// registers under a name and a period. 'fast' runs every tick (the live area: the step itself, at
// 20 Hz), 'slow' every game minute (off-map people, life support, the voyage), 'world' every game
// hour (politics, fleets, the news), and any other name with its own everyMs. A periodic layer runs
// when the clock crosses a whole multiple of its period, in live play and in a skip alike, so a
// minute is a minute however it passed. Within a tick: the fast layers in the order registered, then
// the clock moves one tick, then the periodic layers whose boundary it crossed, shortest period
// first (a new hour runs the minute's layer, then the hour's), in the order registered within one.
//
// Two ways for time to stop, kept apart:
//   paused   the player's: Space, an open overlay (each registers a reason: pauseFor('menu') gives
//            back its release), a hidden tab. Runtime only. No ticks run; the accumulator waits.
//   held     the sim's: state.clock.holds (clock.js holdTime/releaseTime), saved. The game waits on
//            the player's choice: stop motion in shooting and CQC, time standing still while you
//            talk (tradecraft's "time stands still"). Ticks still run, so the input reaches the sim,
//            but only the fast layers marked whileHeld (the step is) run, the clock doesn't move and
//            no periodic layer runs. A hold set during a tick freezes that tick at once (the fast
//            layers after the one that set it don't run, and the clock doesn't move); a hold
//            released during a tick lets it go on. The bus hears 'hold' { held, holds } on a change.
//
// skip(ms, { what, outcomes, interrupt }) is the one engine for an activity that takes time (eat,
// shower, sleep, a class: DESIGN.md, Time, "Skip-time activities"). The sim calls it (the step gets
// it as ctx.skip). The clock moves a game minute at a time; at each minute the periodic layers
// crossed run (with ctx.skipping), and then the skip may stop early: a layer called
// ctx.interrupt(reason) (an alarm, a summons), the sim set a hold, or the interrupt(state, at)
// predicate answered with a reason (a need gone critical). Then outcomes(state, bus, report) gives
// the world its closed-form results for the gap actually lived (needs accrue in closed form, healing
// by the day), and the bus hears 'skip' with the report the call returns:
//     { what, fromMs, toMs, requestedMs, elapsedMs, minutes, stopped: 'done' | 'interrupt' | 'error', reason }
// The fast layers never run in a skip, and clock.tick doesn't move (it counts lived ticks). A layer
// finer than a minute runs once a minute in a skip with ctx.n, the periods it spans.
//
// Errors: a tick that throws is lost (its clock doesn't move), onError hears it, and the next tick
// runs (tradecraft's broke(): "a bug in a tick costs that tick, not the game"). A skip whose layer
// throws stops there with stopped 'error', and its outcomes still apply to the time lived.
//
// Nothing here touches the DOM: requestAnimationFrame is looked up only by start(), and a test
// drives frame(nowMs) or step(n) by hand.
import { TICK_MS, MIN_MS, HOUR_MS, wholeTicks, crossings, isHeld } from './clock.js';
import { nullBus } from './bus.js';

export const FRAME_CAP_MS = 250;
export const MAX_TICKS_PER_FRAME = FRAME_CAP_MS / TICK_MS;         // 5
/** The standard layers' periods. */
export const LAYER_EVERY_MS = Object.freeze({ fast: TICK_MS, slow: MIN_MS, world: HOUR_MS });
/** The input of a tick with nothing pressed. */
export const NO_INPUT = Object.freeze({ mx: 0, mz: 0, run: false, stroll: false, look: false, act: Object.freeze([]), mouse: null });

/**
 * A loop. Options:
 *   step(state, input, bus, ctx)   the sim's tick: the first fast layer, run while held too
 *   render(alpha, state, info)     drawn every frame; info { paused, held, ticks, frame }
 *   poll()                         the input of the next tick (src/core/input.js snapshot)
 *   bus, onError(e, where)
 * ctx (fast layers): { held, skip(ms, opts), tickMs }. ctx (periodic): { atMs, everyMs, n, skipping, what, interrupt(reason) }.
 */
export function createLoop({ step = null, render = null, poll = null, bus = nullBus, onError = (e) => console.error(e) } = {}) {
  let state = null;
  const fast = [], periodic = [];
  let order = 0;
  const reasons = new Set();
  let accMs = 0, lastMs = null, alpha = 0, frames = 0, rafId = 0, running = false, skipping = false, heldKey = '';
  const stats = { ticks: 0, lostTicks: 0, ticksLastFrame: 0, tickMs: 0, tickMsMax: 0, skips: 0 };
  const now = () => globalThis.performance?.now?.() ?? 0;
  const report = (e, where) => { try { onError(e, where); } catch { /* (an error reporter that throws mustn't stop the game) */ } };

  const fastCtx = { held: false, tickMs: TICK_MS, skip: (ms, opts) => skip(ms, opts) };
  const liveCtx = { atMs: 0, everyMs: 0, n: 0, skipping: false, what: null, interrupt() {} };

  /** Add a layer: register('slow', fn), register('world', fn, 3_600_000), register('fast', fn, { whileHeld: true }). Returns its removal. */
  function register(layer, fn, opts = {}) {
    const o = typeof opts === 'number' ? { everyMs: opts } : opts;
    const everyMs = o.everyMs ?? LAYER_EVERY_MS[layer];
    if (!(everyMs >= TICK_MS)) throw new Error(`layer '${layer}' needs a period of at least one tick (everyMs)`);
    const L = { layer, name: o.name ?? layer, fn, everyMs, whileHeld: !!o.whileHeld, order: order++ };
    const list = everyMs === TICK_MS ? fast : periodic;
    list.push(L);
    periodic.sort((a, b) => a.everyMs - b.everyMs || a.order - b.order);
    return () => { const i = list.indexOf(L); if (i >= 0) list.splice(i, 1); };
  }
  if (step) register('fast', step, { name: 'step', whileHeld: true });

  // (the periodic layers whose boundary a move of the clock from fromMs to toMs crosses)
  function runPeriodic(fromMs, toMs, ctx) {
    for (const L of periodic) {
      const n = crossings(fromMs, toMs, L.everyMs);
      if (n <= 0) continue;
      ctx.atMs = toMs; ctx.everyMs = L.everyMs; ctx.n = n;
      L.fn(state, bus, ctx);
    }
  }

  function noteHolds() {
    const holds = state.clock.holds ?? [];
    const key = holds.length ? holds.join(',') : '';
    if (key !== heldKey) { heldKey = key; bus.emit('hold', { held: !!key, holds: holds.slice() }); }
  }

  /** One tick of the sim. Returns whether the clock moved. */
  function tick(input = NO_INPUT) {
    if (!state) throw new Error('the loop has no state (start(state) first)');
    const t0 = now();
    let moved = false;
    try {
      // (held is read again before each layer: a hold set by the step stops the layers after it in
      // this very tick, and one released by the step lets them run)
      for (const L of fast) {
        fastCtx.held = isHeld(state);
        if (!fastCtx.held || L.whileHeld) L.fn(state, input, bus, fastCtx);
      }
      if (!isHeld(state)) {
        const fromMs = state.clock.ms;
        state.clock.ms = fromMs + TICK_MS;
        state.clock.tick += 1;
        moved = true;
        runPeriodic(fromMs, state.clock.ms, liveCtx);
      }
      noteHolds();
    } catch (e) {
      stats.lostTicks++;
      report(e, 'tick');
    }
    stats.ticks++;
    stats.tickMs = now() - t0;
    if (stats.tickMs > stats.tickMsMax) stats.tickMsMax = stats.tickMs;
    return moved;
  }

  /** Time passing in an activity: see the header. Returns the report. */
  function skip(ms, { what = 'time', outcomes = null, interrupt = null } = {}) {
    if (!state) throw new Error('the loop has no state (start(state) first)');
    if (skipping) throw new Error(`a skip inside a skip (${what})`);
    skipping = true;
    const requestedMs = wholeTicks(Math.max(0, ms));
    const fromMs = state.clock.ms, targetMs = fromMs + requestedMs;
    let minutes = 0, reason = null, stopped = 'done', pending = null;
    const ctx = { atMs: fromMs, everyMs: 0, n: 0, skipping: true, what, interrupt: (why) => { pending ??= why || 'interrupted'; } };
    bus.emit('skip-start', { what, fromMs, toMs: targetMs });
    try {
      if (isHeld(state)) { reason = `held: ${state.clock.holds.join(', ')}`; stopped = 'interrupt'; }   // (a choice is waited on: no time passes)
      else while (state.clock.ms < targetMs) {
        const prevMs = state.clock.ms;
        const nextMs = Math.min(targetMs, (Math.floor(prevMs / MIN_MS) + 1) * MIN_MS);
        state.clock.ms = nextMs;
        runPeriodic(prevMs, nextMs, ctx);
        if (nextMs % MIN_MS === 0) minutes++;
        if (nextMs >= targetMs) break;                             // (done: whatever stirs now, the live game meets it)
        if (pending) { reason = pending; stopped = 'interrupt'; break; }
        if (isHeld(state)) { reason = `held: ${state.clock.holds.join(', ')}`; stopped = 'interrupt'; break; }
        const why = interrupt?.(state, { atMs: nextMs, elapsedMs: nextMs - fromMs, what });
        if (why) { reason = why; stopped = 'interrupt'; break; }
      }
    } catch (e) {
      reason = e.message; stopped = 'error';
      report(e, `skip (${what})`);
    }
    const toMs = state.clock.ms;
    const out = { what, fromMs, toMs, requestedMs, elapsedMs: toMs - fromMs, minutes, stopped, reason };
    try { outcomes?.(state, bus, out); } catch (e) { report(e, `skip outcomes (${what})`); }
    skipping = false;
    stats.skips++;
    bus.emit('skip', out);
    noteHolds();
    return out;
  }

  const isPaused = () => reasons.size > 0;

  /** A frame at real time nowMs (performance.now()): ticks owed, then the render. */
  function frame(nowMs) {
    const dtMs = lastMs === null ? 0 : Math.min(FRAME_CAP_MS, Math.max(0, nowMs - lastMs));
    lastMs = nowMs;
    let n = 0;
    if (state && !isPaused()) {
      accMs += dtMs;
      while (accMs >= TICK_MS) { tick(poll ? poll() : NO_INPUT); accMs -= TICK_MS; n++; }
    }
    alpha = accMs / TICK_MS;
    stats.ticksLastFrame = n;
    frames++;
    if (render) {
      try { render(alpha, state, { paused: isPaused(), held: !!state && isHeld(state), ticks: n, frame: frames }); }
      catch (e) { report(e, 'render'); }
    }
  }

  function schedule() {
    const raf = globalThis.requestAnimationFrame;
    if (!raf) throw new Error('no requestAnimationFrame here: drive frame(nowMs) by hand');
    rafId = raf((t) => { if (!running) return; schedule(); frame(t); });
  }

  const loop = {
    register,
    tick,
    skip,
    frame,
    /** Begin (or carry on) with a state: frames from requestAnimationFrame. */
    start(s = state) {
      if (s && s !== state) loop.setState(s);
      if (running) return;
      running = true; lastMs = null;
      schedule();
    },
    stop() { running = false; globalThis.cancelAnimationFrame?.(rafId); },
    /** Play another state from here (a load, a new career). */
    setState(s) { state = s; accMs = 0; alpha = 0; heldKey = s?.clock?.holds?.join(',') ?? ''; },
    get state() { return state; },
    /** n ticks now, whatever the pause (the debug handle's step). Returns how many moved the clock. */
    step(n = 1, input = NO_INPUT) { let moved = 0; for (let i = 0; i < n; i++) if (tick(input)) moved++; return moved; },
    /** The player's pause: pause(true) / pause(false), for a reason ('player' by default: Space). */
    pause(on = true, reason = 'player') { if (on) reasons.add(reason); else reasons.delete(reason); return isPaused(); },
    togglePause(reason = 'player') { return loop.pause(!reasons.has(reason), reason); },
    /** A pause for as long as something is open (an overlay): returns its release. */
    pauseFor(reason) { reasons.add(reason); return () => reasons.delete(reason); },
    get paused() { return isPaused(); },
    get pauseReasons() { return [...reasons]; },
    get held() { return !!state && isHeld(state); },
    get alpha() { return alpha; },
    get frames() { return frames; },
    get running() { return running; },
    get skipping() { return skipping; },
    get layers() { return [...fast, ...periodic].map(L => ({ layer: L.layer, name: L.name, everyMs: L.everyMs, whileHeld: L.whileHeld })); },
    stats,
  };
  return loop;
}
