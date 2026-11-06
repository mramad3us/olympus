// OLYMPUS sim: the skip engines, time passing in an activity, sliced across frames and saved as it goes.
//
// TIME §5 owns the contract (the activities, the masks, the interrupts, what happens at the end);
// this is how the engine does it (TECH §5). One record, state.skip, holds a running skip and its
// progress, so a skip can be cut into slices across frames and saved between any two steps:
//     { id: 'k1', kind, engine, activity, who, where, posture, mask, fromMs, toMs, atMs, chunkMs, chunks,
//       ticker: [{ atMs, text, tone }], frame: [], stop: null | { atMs, by }, result: {}, cmds: [] }
// beginSkip(state, bus, req) starts one during a tick (req = { activity, planMs, kind?, who?, where?,
// posture = null, mask = 'D', chunkMs = 0 }); the kind is the caller's for 'out', 'day' and 'world',
// else 'ff' under FF_MAX_MS (120 s) and 'outcome' at or over it (TIME §5.2). The engine is set there
// too (TECH §3.6, §5.2; CONTRACTS §2): 'ff' for kind 'ff', and for kind 'out' while a fight is live in
// the area (fightLive(state), COMBAT's: none exists before 0.0.7, so false) whatever its length, a
// fight never turned into an outcome round the player; 'outcome' for the rest. The loop's mode follows
// the engine, not the kind (a save from before the field reads it from the kind, engineOf). The tick
// that began it ends normally; the loop sees state.skip on its next frame and changes mode
// (src/core/loop.js).
//
// Two engines behind the one record:
//   ff        a fast-forward (engine 'ff') is lived ticks: the loop runs the real sim faster, with the skip's fixed
//             input (ffInput: no keys, the activity's posture to come), and after each tick asks
//             ffCheck, which finishes the skip once the clock reaches toMs or something stopped it
//             (a 'skip:stop' command; a due event whose priority breaks the mask, set by the 'due'
//             layer; any fast layer may set s.stop).
//   outcome   engine 'outcome' (kinds outcome, out, day, world) steps the slow layer on a grid set by the
//             kind (TECH §5.3; correction 19), never by the splash's target or the frame's budget:
//               outcome, out   whole game minutes on the live minute grid (the splash's clock moves
//                              by the minute)
//               day            whole hours while every slow contributor is steady, a step cut where
//                              one says it next changes (nextChangeMs: so an hour never spans the
//                              moment a process loses its closed form; my call), else minutes
//               world          event to event while steady (no clock is shown), else minutes
//             and every step also ends at the next event's second. Every step ends on the 50 ms tick
//             grid: a contributor's nextChangeMs is rounded up to a whole tick (wholeTicks), and so is
//             chunkMs when the skip begins, so a skip stopped anywhere leaves live play on the grid
//             (an off-grid clock never meets the live layers' whole seconds); advanceSkip throws on a
//             step that would end off it. An event due at a step's start (the clock the tick that
//             began the skip moved to) is dispatched there first, at its own second, not a step late
//             (TIME §5.3: an event ends a step at its second). advanceSkip(state, bus, targetMs,
//             budget, acts) runs the whole steps that end at or before targetMs (the target gates
//             steps, it never cuts one), reading budget.over(stepsDone) only between steps, so the
//             result never depends on how the skip was sliced or how fast the splash ran (TECH §8.2's
//             game-slices and game-targets). Each step moves the clock to t1 (clock.tick does not
//             move: it counts lived ticks), calls slowStep over [t0, t1] with { skipping: true,
//             skip } (the clock already at t1, as when the live minute layer runs: my call, so an
//             event a contributor posts from "now" never falls inside the step it is posted in),
//             then dispatches what is due at t1 in queue order; an event the mask lets
//             through is stopped at (s.stop, 'skip-interrupt'), the rest left in the queue for the
//             live game after the landing, and an event's line goes to the ticker. The player's
//             commands (acts: 'skip:stop', 'skip:chunk') are written into s.cmds at the clock the
//             engine had reached, always a step's end, so they apply there in the page and in a
//             replay alike (TECH §5.5). A hold set during a skip (a choice the game waits on)
//             stops it, by 'hold', as the 0.0.1 engine did: no time passes while time stands
//             still, and a fast-forward's fixed input could never answer. 'skip-frame' is heard
//             once per call.
// finishSkip(state, bus) closes it (TIME §5.8: the activity, the body and the people settle, papers;
// stubs until their owners build them), tells the bus 'skip-end' { id, activity, fromMs, toMs,
// planned, interrupted, by, outcome, papers, minutes }, nulls state.skip and asks an autosave
// ({ why: 'skip' }, resetting time.liveSinceSaveMs: the sim resets it when it asks, TECH §7.4).
// skipNow(state, bus, req) is begin, advance to the end with no budget, finish: tests, the debug
// handle's skip(), node's bots. It keeps the kind the page would use, so it walks the page's grid;
// an ff skip needs lived ticks, so skipNow runs them through the tick() it was given.
//
// stops(mask, ev) is TIME's to write with its masks (0.0.5). Until then defaultStops: job events
// never stop a skip; priority 0 (D, danger) and 1 (A, alarms) always do; 2 (O), 3 (B) and 4 (S)
// stop it where the mask names their letter (O* holds orders, so it does not); 5 never.
import { nextId, playerId } from '../../core/ids.js';
import { nextAt, popNext } from '../../core/queue.js';
import { SEC_MS, MIN_MS, HOUR_MS, TICK_MS, wholeTicks, isHeld } from '../../core/clock.js';
import { NO_INPUT } from '../../core/loop.js';
import { askAutosave } from './domain.js';

export const SKIP_KINDS = Object.freeze(['ff', 'outcome', 'out', 'day', 'world']);
/** A skip record's engine: its own, or from its kind for a save made before the field (v0.0.2, v0.0.3's first builds). */
export const engineOf = (s) => (!s ? null : s.engine ?? (s.kind === 'ff' ? 'ff' : 'outcome'));
/** Under this planned gap a skip is a fast-forward of lived ticks; at or over it, an outcome skip (TIME §5.2). */
export const FF_MAX_MS = 120_000;
/** A budget that is never over: the whole skip at once (node, tests, "to the end" with no splash). */
export const NO_BUDGET = Object.freeze({ over: () => false });
/** A budget of n steps a frame (tests). */
export const stepsBudget = (n) => Object.freeze({ over: (done) => done >= n });

const LETTER_PRIO = Object.freeze({ D: 0, A: 1, O: 2, B: 3, S: 4 });

/** Whether an event stops a skip with this mask (see the header: TIME's masks replace it at 0.0.5). */
export function defaultStops(mask, ev) {
  if (ev.kind === 'job') return false;
  const prio = ev.prio ?? 5;
  if (prio <= 1) return true;
  if (prio >= 5) return false;
  for (const part of String(mask ?? '').split(/\s+/)) {
    if (!part || part.endsWith('*')) continue;
    if (LETTER_PRIO[part[0]] === prio) return true;
  }
  return false;
}

const floorTo = (ms, stepMs) => Math.floor(ms / stepMs) * stepMs;
const has = (s, cmd, atMs) => s.cmds.some(c => c.cmd === cmd && !c.done && c.atMs <= atMs);

/**
 * The skip engines over a game's slow layer and queue: { beginSkip, advanceSkip, finishSkip,
 * skipNow, gridNext, ffInput, ffCheck }. slowStep(state, bus, t0, t1, ctx); allSteady(state);
 * minNextChange(state, t0); dispatch(state, bus, ev); stops(mask, ev); tick(state) runs one lived
 * tick of the real sim (for skipNow's fast-forwards).
 */
export function createSkips({ slowStep, allSteady = () => true, minNextChange = () => Infinity, dispatch, stops = defaultStops, tick = null, fightLive = () => false }) {
  let lastEnd = null;                                              // (the last skip-end payload: what skipNow returns)

  /** The end of the next step of a skip from t0, before events and toMs (TECH §5.3). */
  function gridNext(s, state, t0) {
    switch (s.kind) {
      case 'outcome': case 'out': return floorTo(t0, MIN_MS) + MIN_MS;
      // (a contributor's next change rounded up to the tick grid: the clock is whole ticks, always)
      case 'day': return allSteady(state) ? Math.min(floorTo(t0, HOUR_MS) + HOUR_MS, wholeTicks(minNextChange(state, t0))) : floorTo(t0, MIN_MS) + MIN_MS;
      case 'world': return allSteady(state) ? wholeTicks(minNextChange(state, t0)) : floorTo(t0, MIN_MS) + MIN_MS;
      default: throw new Error(`a skip of kind '${s.kind}' has no step grid (a fast-forward is lived ticks)`);
    }
  }

  function beginSkip(state, bus, req) {
    if (state.skip) throw new Error(`a skip while another runs (${state.skip.id}, ${state.skip.activity})`);
    const planMs = wholeTicks(req.planMs);
    if (!(planMs > 0)) throw new Error(`a skip needs a positive planMs, not ${req.planMs}`);
    const kind = req.kind ?? (planMs < FF_MAX_MS ? 'ff' : 'outcome');
    if (!SKIP_KINDS.includes(kind)) throw new Error(`no skip kind '${kind}' (${SKIP_KINDS.join(', ')})`);
    const fromMs = state.clock.ms;
    const engine = kind === 'ff' || (kind === 'out' && fightLive(state)) ? 'ff' : 'outcome';
    const s = {
      id: nextId(state, 'k'), kind, engine, activity: req.activity ?? 'idle',
      who: req.who ?? playerId(state), where: req.where ?? state.places?.live?.area ?? null,
      posture: req.posture ?? null, mask: req.mask ?? 'D',
      fromMs, toMs: fromMs + planMs, atMs: fromMs, chunkMs: Math.max(0, wholeTicks(req.chunkMs ?? 0)), chunks: 0,
      ticker: [], frame: [], stop: null, result: {}, cmds: [],
    };
    state.skip = s;
    bus.emit('skip-start', { id: s.id, activity: s.activity, kind, engine, fromMs, toMs: s.toMs, where: s.where, posture: s.posture, mask: s.mask });
    return s;
  }

  // (the player's skip commands, at the clock the engine has reached)
  function takeCommands(state, s, acts) {
    for (const a of acts ?? []) {
      const name = typeof a === 'string' ? a : a?.act;
      if (name === 'skip:stop' || name === 'skip:chunk') s.cmds.push({ atMs: state.clock.ms, cmd: name.slice(5) });
    }
  }

  // (every event due at a step's end, or its start, in queue order: an event the mask lets through stops
  // the skip there and the rest due then wait for the live game, after the landing; a line goes to the ticker)
  function dispatchDue(state, bus, s, atMs, newLines) {
    for (let ev = popNext(state, atMs); ev; ev = popNext(state, atMs)) {
      dispatch(state, bus, ev);
      if (stops(s.mask, ev)) {
        s.stop = { atMs, by: ev.id };
        bus.emit('skip-interrupt', { id: s.id, atMs, by: ev.id, prio: ev.prio, line: ev.line ?? null, reflex: ev.reflex ?? null });
        return;
      }
      if (ev.line) { const rec = { atMs, text: ev.line, tone: ev.tone ?? 'note' }; s.ticker.push(rec); newLines.push(rec); }
    }
  }

  function advanceSkip(state, bus, targetMs = Infinity, budget = NO_BUDGET, acts = []) {
    const s = state.skip;
    if (!s) return { steps: 0, done: true };
    if (engineOf(s) === 'ff') throw new Error('advanceSkip() on a fast-forward: the loop runs its ticks');
    takeCommands(state, s, acts);
    const newLines = [];
    let steps = 0;
    for (;;) {
      if (s.stop || state.clock.ms >= s.toMs || budget.over(steps)) break;
      if (has(s, 'stop', state.clock.ms)) { s.stop = { atMs: state.clock.ms, by: 'player' }; break; }
      if (isHeld(state)) { s.stop = { atMs: state.clock.ms, by: 'hold' }; break; }   // (the game waits on a choice: no time passes)
      const t0 = state.clock.ms;
      // (an event due at the step's start: the clock the tick that began the skip moved to, past that
      // tick's due layer. Handled here at its own second, never a step late)
      if (nextAt(state) <= t0) { dispatchDue(state, bus, s, t0, newLines); if (s.stop) break; }
      let t1 = Math.min(s.toMs, nextAt(state), gridNext(s, state, t0));
      t1 = Math.min(s.toMs, Math.max(t1, floorTo(t0, SEC_MS) + SEC_MS));   // (never a zero step; events sit on whole seconds)
      if (t1 % TICK_MS !== 0) throw new Error(`a skip step ending off the tick grid: ${t1} (from ${t0}, ${s.kind}, to ${s.toMs})`);
      if (t1 > targetMs) break;                                    // (the target gates whole steps; it never cuts one)
      // (the clock reads t1 while the step runs, as it does when the live minute layer runs: an event a
      // contributor posts from "now" then lands after the step, never inside it, dispatched late)
      state.clock.ms = t1;
      slowStep(state, bus, t0, t1, { skipping: true, skip: s });
      s.atMs = t1;
      steps++;
      dispatchDue(state, bus, s, t1, newLines);
      if (!s.stop && t1 >= s.toMs && s.chunkMs > 0) {
        const c = s.cmds.find(x => x.cmd === 'chunk' && !x.done && x.atMs <= t1);
        if (c) { c.done = true; s.toMs += s.chunkMs; s.chunks++; }
      }
    }
    bus.emit('skip-frame', { id: s.id, atMs: state.clock.ms, ticker: newLines, frame: null });
    const done = state.clock.ms >= s.toMs || !!s.stop;
    if (done) finishSkip(state, bus);
    return { steps, done };
  }

  function finishSkip(state, bus) {
    const s = state.skip;
    if (!s) return null;
    const end = state.clock.ms;
    // (TIME §5.8: the activity closes with the fraction lived, the body and the people settle, persistent
    // people are placed and the crowd recycled behind the ink, papers drained: their owners' stubs, 0.0.5 on)
    const out = { id: s.id, activity: s.activity, fromMs: s.fromMs, toMs: end, planned: s.toMs, interrupted: !!s.stop,
      by: s.stop?.by ?? null, outcome: s.result, papers: [], minutes: Math.floor((end - s.fromMs) / MIN_MS) };
    lastEnd = out;
    bus.emit('skip-end', out);
    state.skip = null;
    askAutosave(state, bus, 'skip');
    return out;
  }

  /** The fixed input of a fast-forward's ticks: no keys (the activity's held posture, when TIME has postures). */
  const ffInput = () => NO_INPUT;

  /** After a fast-forward's tick: finish it once the clock reaches toMs or it was stopped. Returns whether it is over. */
  function ffCheck(state, bus) {
    const s = state.skip;
    if (!s) return true;
    if (engineOf(s) !== 'ff') return false;
    s.atMs = state.clock.ms;
    if (!s.stop && has(s, 'stop', state.clock.ms)) s.stop = { atMs: state.clock.ms, by: 'player' };
    if (!s.stop && isHeld(state)) s.stop = { atMs: state.clock.ms, by: 'hold' };   // (a fast-forward's fixed input can't answer a choice)
    if (state.clock.ms >= s.toMs || s.stop) { finishSkip(state, bus); return true; }
    return false;
  }

  function skipNow(state, bus, req) {
    const s = beginSkip(state, bus, req);
    lastEnd = null;
    if (engineOf(s) !== 'ff') advanceSkip(state, bus, Infinity, NO_BUDGET);
    else {
      if (!tick) throw new Error('skipNow(): a fast-forward needs lived ticks, and no tick() was given');
      for (let n = 0; !ffCheck(state, bus); n++) {
        if (n > FF_MAX_MS) throw new Error(`skipNow(): a fast-forward that never ends (${s.id})`);
        tick(state);
      }
    }
    return lastEnd;
  }

  return { beginSkip, advanceSkip, finishSkip, skipNow, gridNext, ffInput, ffCheck };
}
