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
//             (a 'skip:stop' command; any fast layer may set s.stop); a due event whose priority
//             breaks the mask is stopped at by the 'due' layer, which finishes the skip there and
//             then, at the event's own tick (game.js), so a fast-forward and an outcome skip land at
//             one second (TIME §5.5).
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
// finishSkip(state, bus) closes it (TIME §5.8): the activity closes with the share lived
// (src/sim/time/activities.js finishActivity: its effects whole or partial, the landing's pose and
// outfit, its log line), the player's body is brought to the end after an outcome skip (BODY's
// bodySync; a fast-forward's body is as its lived ticks left it, so game-ff stays bit-exact; the
// people were placed at each step, the unseen only, by their slow contributor), and the bus hears 'skip-end'
// { id, activity, fromMs, toMs, planned, interrupted, by, outcome, papers, minutes } with outcome =
// { body: { before, after } (BODY's stripOf and stagesOf at the start and the end, for the strip),
// look: { outfit, wet }, chunk: { offerMs } | null (a chunked activity that ran its chunk: T carries
// on, TIME §6.4), lines (the ticker's and the activity's), failedRoll: false (no rolls this round),
// activity (finishActivity's outcome), held (the O* events held: TIME §7.2) }; then state.skip is
// nulled and an autosave asked ({ why: 'skip' }, resetting time.liveSinceSaveMs: the sim resets it
// when it asks, TECH §7.4). skipNow(state, bus, req) is begin, advance to the end with no budget,
// finish: tests, the debug handle's skip(), node's bots. It keeps the kind the page would use, so it
// walks the page's grid; an ff skip needs lived ticks, so skipNow runs them through the tick() it was
// given, up to FF_GUARD_TICKS (12 hours of them: the parity tests force a night's fast-forward).
//
// stops(mask, ev, state) is TIME's (src/sim/time/interrupts.js, TIME §7): job events never stop a
// skip; priority 0 (D) and 1 (A) always do; O unless the mask holds it (O*: dispatched, its line to
// the ticker, its id to s.held); B unless the mask excepts its ledger; S by S, S(k) knocks, S(w)
// wakes, within TIME §7.4's limits; 5 never. A stop is s.stop = { atMs, by: the event's id, kind,
// prio, letter } and tells 'skip-interrupt' { id, atMs, by, prio, letter, kind, line, reflex }.
// beginSkip keeps the activity's spotId on the record and tells 'skip-start' { id, activity, kind,
// engine, fromMs, toMs, where, posture, mask, spotId, vignette, stoppable, chunkMs, chain }.
// A chain's skip (0.0.6: several single actions behind one splash, src/sim/time/chain.js) is one skip
// over the chain's total, req.chain { steps, n } giving the record chain { n } and skip-start its chain
// { steps, n } (null for every other skip); its activity, mask and posture follow the running step
// (chain.js onChainNext writes them at each 'chain-next'), so an interrupt is weighed by the step it
// lands in. Backspace in a chain ('skip:stop', here in the outcome engine's commands, in the time
// domain's action in a fast-forward) is chain.js chainStop: the skip's toMs moved to the running step's
// end, the rest dropped, never a cut mid-step. finishSkip closes the last step, then the chain
// (chainClose: by 'natural', 'player', 'interrupt' or 'refused'), and skip-end's outcome gains chain
// [{ id, line, fraction, by }] (null outside a chain), its lines each step's line in order.
import { nextId, playerId } from '../../core/ids.js';
import { nextAt, popNext } from '../../core/queue.js';
import { SEC_MS, MIN_MS, HOUR_MS, TICK_MS, wholeTicks, isHeld } from '../../core/clock.js';
import { NO_INPUT } from '../../core/loop.js';
import { askAutosave } from './domain.js';
import { stops as maskStops, holds, letterOf, noteStop, resetSkipCount } from './interrupts.js';
import { finishActivity } from './activities.js';
import { chainStop, chainClose, chainByOf } from './chain.js';
import { CHUNK_OFFER_S } from './splash.js';
import { bodyOf, bodySync } from '../body/body.js';
import { stagesOf, stripOf } from '../body/cues.js';
import { siteLonEDeg } from '../jobs.js';
import { playerActor } from '../../core/ids.js';

export const SKIP_KINDS = Object.freeze(['ff', 'outcome', 'out', 'day', 'world']);
/** A skip record's engine: its own, or from its kind for a save made before the field (v0.0.2, v0.0.3's first builds). */
export const engineOf = (s) => (!s ? null : s.engine ?? (s.kind === 'ff' ? 'ff' : 'outcome'));
/** Under this planned gap a skip is a fast-forward of lived ticks; at or over it, an outcome skip (TIME §5.2). */
export const FF_MAX_MS = 120_000;
/** A budget that is never over: the whole skip at once (node, tests, "to the end" with no splash). */
export const NO_BUDGET = Object.freeze({ over: () => false });
/** A budget of n steps a frame (tests). */
export const stepsBudget = (n) => Object.freeze({ over: (done) => done >= n });
/** skipNow's fast-forward guard: at most this many lived ticks (12 hours: the parity tests' forced nights). */
export const FF_GUARD_TICKS = 864_000;

/** Whether an event stops a skip with this mask: TIME's rule (src/sim/time/interrupts.js). */
export const defaultStops = (mask, ev, state = null) => maskStops(mask, ev, state);

/** The player's body as the strip reads it ({ strip, stages }), or null without one. */
export function bodyLook(state, ms = state.clock.ms) {
  const b = state.player?.id ? bodyOf(state, state.player.id) : null;
  return b ? { strip: stripOf(b, ms), stages: stagesOf(b, ms, siteLonEDeg(state)) } : null;
}

/**
 * An event dispatched while a skip runs (either engine), after its handler: a stop where the mask lets
 * it through (s.stop, counted, 'skip-interrupt'), else its line to the ticker and, held by O*, its id
 * to s.held. Returns whether it stopped the skip.
 */
export function noteDue(state, bus, s, ev, atMs, stops = maskStops, newLines = null) {
  if (stops(s.mask, ev, state)) {
    const letter = letterOf(ev);
    s.stop = { atMs, by: ev.id, kind: ev.kind, prio: ev.prio ?? 5, letter };
    noteStop(state, ev, atMs);
    bus.emit('skip-interrupt', { id: s.id, atMs, by: ev.id, prio: ev.prio ?? 5, letter, kind: ev.kind, line: ev.line ?? null, reflex: ev.reflex ?? null });
    return true;
  }
  if (holds(s.mask, ev)) (s.held ??= []).push(ev.id);
  if (ev.line) { const rec = { atMs, text: ev.line, tone: ev.tone ?? 'note' }; (s.ticker ??= []).push(rec); newLines?.push(rec); }
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
    if (req.spotId) s.spotId = req.spotId;
    if (req.chain) s.chain = { n: req.chain.n };
    s.held = [];
    if (state.time) resetSkipCount(state);
    const look = bodyLook(state, fromMs);
    if (look) s.result.before = look;
    state.skip = s;
    bus.emit('skip-start', { id: s.id, activity: s.activity, kind, engine, fromMs, toMs: s.toMs, where: s.where, posture: s.posture, mask: s.mask,
      spotId: s.spotId ?? null, vignette: req.vignette ?? null, stoppable: req.stoppable ?? true, chunkMs: s.chunkMs, chain: req.chain ? { steps: [...req.chain.steps], n: req.chain.n } : null });
    return s;
  }

  // (the player's skip commands, at the clock the engine has reached; Backspace in a chain stops it at the running step's end, chain.js)
  function takeCommands(state, bus, s, acts) {
    for (const a of acts ?? []) {
      const name = typeof a === 'string' ? a : a?.act;
      if (name === 'skip:stop' && s.chain && state.time?.chain) { chainStop(state, bus); s.cmds.push({ atMs: state.clock.ms, cmd: 'stop', done: true }); continue; }
      if (name === 'skip:stop' || name === 'skip:chunk') s.cmds.push({ atMs: state.clock.ms, cmd: name.slice(5) });
    }
  }

  // (every event due at a step's end, or its start, in queue order: an event the mask lets through stops
  // the skip there and the rest due then wait for the live game, after the landing; a line goes to the ticker)
  function dispatchDue(state, bus, s, atMs, newLines) {
    for (let ev = popNext(state, atMs); ev; ev = popNext(state, atMs)) {
      dispatch(state, bus, ev);
      if (noteDue(state, bus, s, ev, atMs, stops, newLines)) return;
    }
  }

  function advanceSkip(state, bus, targetMs = Infinity, budget = NO_BUDGET, acts = []) {
    const s = state.skip;
    if (!s) return { steps: 0, done: true };
    if (engineOf(s) === 'ff') throw new Error('advanceSkip() on a fast-forward: the loop runs its ticks');
    takeCommands(state, bus, s, acts);
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
    // (TIME §5.8: the activity closes with the fraction lived, the body is brought to the end, the people
    // were placed at each step (the unseen only), papers drained (CAREER's, later))
    const act = finishActivity(state, bus, end, { by: s.stop?.by ?? null, stopKind: s.stop?.kind ?? null });
    // (a chain's: its last step closed above, then the chain, its steps' outcomes for the strip)
    const chain = s.chain && state.time?.chain ? chainClose(state, bus, end, act, chainByOf(s)) : null;
    // (an outcome skip's body is brought to its end; a fast-forward's is lived ticks, as live play leaves it: TECH's game-ff)
    if (engineOf(s) !== 'ff' && s.who && bodyOf(state, s.who)) bodySync(state, s.who, end, bus);
    const after = bodyLook(state, end), me = playerActor(state);
    const chunk = s.chunkMs > 0 && !s.stop ? { offerMs: Math.round(CHUNK_OFFER_S * 1000) } : null;
    if (chunk && state.time) state.time.chunk = { activity: s.activity, spotId: s.spotId ?? null, atMs: end };
    else if (state.time) delete state.time.chunk;
    s.result = { ...s.result, body: { before: s.result.before ?? null, after }, look: act?.look ?? { outfit: me?.outfit ?? 'utilities', wet: false }, chunk,
      lines: [...(s.ticker ?? []).map(r => r.text), ...(chain ? chain.filter(c => c.line).map(c => c.line) : act?.line ? [act.line] : [])], failedRoll: false, activity: act, held: [...(s.held ?? [])],
      chain };
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
        if (n > FF_GUARD_TICKS) throw new Error(`skipNow(): a fast-forward that never ends (${s.id})`);
        tick(state);
      }
    }
    return lastEnd;
  }

  return { beginSkip, advanceSkip, finishSkip, skipNow, gridNext, ffInput, ffCheck };
}
