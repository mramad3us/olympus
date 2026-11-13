// OLYMPUS sim: the stepper, the one engine that times a step's sub-steps and a bundle's beats on their channels (COMBAT §25.7.1; TIME §4.3; the build sheet 0.0.12 §2.2, §3.1).
//
// v0.0.5's step machinery, taken out of src/sim/arms/shooting.js as the design asked (COMBAT §25.7.1: "the engine is
// v0.0.5's step machinery taken out of shooting.js", guarded by scene-handling byte for byte), with channels added.
// Two kinds of doing record run through it, both plain data in the state (TECH §6.1):
//
// A list doing (a step: the rifle's singles, a Corps command, a shot row, a contact's row; v0.0.5's shape, no `beats`):
//     { who, step, kind, tempo, list: [subId], subs: [rec], i, fromMs, subFromMs, untilMs, … }
// runs one sub-step at a time exactly as built: begin() sets it doing, releases the 'stop' hold and rolls sub-step 0 at
// the clock; each sub-step's time is known once rolled (a fumble ×1.6, the handler's), its boundary at the formula time
// (cumulative from the step's start), taken on the first tick at or after it (advance(), in the input layer, which runs
// while time stands still), so a step lives ceil(Σ ms / TICK_MS) ticks. At a boundary the sub-step ends (the handler's
// endSub: its effects land), then the gun stopping, a halt (the rest into the panel's "Carry on": the handler's
// queueAfter), a cut, or the next sub-step rolled there; with none left the step ends (endStep: the 'step' fact and the
// doing cleared here, the rest the handler's end: the chained wait, the reflex card, choosing again). The rifle's
// sub-kinds and what each does are shooting.js's own handler (useList), so this module never reads a rifle.
//
// A beat doing (a bundle: src/sim/combat/bundle.js; the player's state.stop.doing or the #2's R.house.two.doing):
//     { who, step, kind: 'bundle', rung, beats: [{ key, k, ch, ms, after, fromMs, untilMs, st, … }], lanes, subs, fromMs,
//       untilMs, atMs, halt?, stopAfter? }
// runs its beats on CHANNELS (feet, hands, eyes, voice, world), one active beat a channel. A beat waits for its `after`
// (a beat's id: that beat done; 'id@0.85': that share of its time gone; 'id@pass': the door's leaf passable, its passMs
// from the beat's start; 'id@arrive': a move's last stretch, its arriveMs) and for the flow (flowOf(rung): the channels that may overlap the feet: none to rung 2, so the
// beats run one at a time and the step's time is their sum, as v0.0.5's macros; hands and voice from rung 3, the eyes too
// at 4). Every boundary falls at its formula time: a beat starts the moment its last dependency is met (a share, a pass,
// another's end), never at the tick that notices it, and the ends are taken in time order, an end before a start on a
// tie; each is processed on the first tick at or after it, so the run does not depend on the tick it is advanced from
// (a save in a bundle carries on byte for byte). A beat's kind is a registered handler (registerKind: run at its start →
// { ms, ok, grade, routine, mishap, text, halt? }, end at its end), bundle.js's for move, posture, aim:point, door, scan,
// call, mark and wait. A beat listed in the doing's `seams` halts the doing at its end ('seam', the rest queued); a run
// that returns `halt` (a refusal: the door locked) halts at once (with `again`, the beat goes back to waiting at its end,
// so the rest holds it: the door still to open, the #2 still to wait for); halt() from outside ('contact' at the pause, 'stop' for
// Backspace or X, 'two', 'noshoot', 'gun') cuts where they stand the running beats a contact cuts (`cut: true`: a move, a
// scan) and lets the others end, starting nothing new ('stop' lets every running beat end: "stop after this beat"). The
// rest of a halted doing (every beat not done) is its `rest`, the owner's "Carry on: …". HALTS names the reasons.
// The facts: 'step' for list doings as built; 'bundle' { phase: 'beat' | 'seam' | 'halt' | 'suspend' | 'end', who, id, beat,
// ch, why?, atMs } for beats (bundle.js emits 'start').
// 2026-11-12 (the shoot house's rework R3, COMBAT §25.19.3.1): a beat doing can be **suspended** instead of halted, from rung 2
// at a contact's pause (contact.js) or where a beat asks it (`suspend` from its run: "Clear!" with a man of the room up):
// suspendFlow() writes d.suspendAsk; nothing new starts; a running scan is paused where it stands (back to waiting with the
// time it had left and its sweep from where the head was, so it resumes where it stood); a running hands or voice beat ends;
// the moves run on (time stands still at the pause, so the closed form resumes at the speed it had); then advanceBeats
// returns 'suspended' with d.suspended = { why, atMs }, its beats untouched. resume() takes it up again, with a list step
// beside it holding a channel (d.hold = { ch: 'hands', step, fromMs }: the shot row on the hands, read by flowOk as a beat
// running on that channel, so the eyes and the voice wait for it too) or none; release() frees the channel at the step's end.
// advance() advances the player's flow (state.stop.flow: a suspended bundle taken up beside a list step) before the list step,
// handing its end, halt or suspension to the owner (useBeats' flow). Saved as it stands (plain data, no Infinity).
// 2026-11-12 (the rework's R4): a beat may flow with the feet from a rung of its own (`flowFrom`), below its channel's: the
// door's read (eyes) rides the approach from rung 3, where the eyes otherwise wait for the feet until rung 4.
// 2026-11-12 (the rework's R5, COMBAT §25.19.5): advanceList runs another person's list doing on the same boundaries (the
// shoot house's number two's LOAD, MAKE READY, MAKE SAFE and UNLOAD SHOW CLEAR: shoothouse.js twoAdminTick), its sub-steps
// the owner's.
// Pure but begin, runSub, advance, advanceList, endStep, advanceBeats, suspendFlow, resume and release, which write the doing record and the clock's holds.
import { releaseTime, TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { playerId } from '../../core/ids.js';

/** The channels a beat runs on (COMBAT §25.7.1): feet, hands, eyes, voice, and world for a wait on the world. */
export const CHANNELS = Object.freeze(['feet', 'hands', 'eyes', 'voice', 'world']);
/** Why a beat doing stops early (COMBAT §25.7.2 amended by the build sheet 0.0.12 §2.2). */
export const HALTS = Object.freeze(['contact', 'noshoot', 'refused', 'door-unplanned', 'two', 'gun', 'fail', 'seam', 'lane-end', 'stop', 'clear']);
/** Why a beat doing is suspended rather than halted (COMBAT §25.19.3.1, §25.19.4): a contact's pause, a man of the room up at "Clear!", the list step beside it ended on a decision. */
export const SUSPENDS = Object.freeze(['contact', 'up', 'decision']);
/** A man of the window this near a corner's spot took the eyes there: the corner's look counts as done at the suspension (m; my call). */
export const TOOK_M = 1.5;
/** The rung from which hands and voice overlap the feet, and the rung from which the eyes do too (COMBAT §25.3.1). */
export const FLOW_HANDS_RUNG = 3, FLOW_EYES_RUNG = 4;
const FLOW = [new Set(), new Set(), new Set(), new Set(['hands', 'voice']), new Set(['hands', 'voice', 'eyes'])];
/** The channels that may overlap a running feet beat at a rung (COMBAT §25.3.1's flow): none to rung 2. */
export const flowOf = (rung) => FLOW[Math.max(0, Math.min(4, rung | 0))];

// ---- the list doings (v0.0.5's steps, see the header) ----

let LIST = null, BEATS = null;
/** The player's beat doings' owner (bundle.js): { done(state, bus, d, 'ended' | 'halted' | 'suspended'), flow(state, bus, d, r) }, called when advance() finishes or suspends one (flow: the player's flow beside a list step). */
export function useBeats(owner) { BEATS = owner; }
/**
 * The list doings' handler, the rifle's (shooting.js): { run(state, bus, d, i, atMs) → { rec, text, extra }, endSub(state,
 * bus, d), queueAfter(state, d) → [subId], end(state, bus, d, why), onStart(state, bus, d) }.
 */
export function useList(handler) { LIST = handler; }

/**
 * A sub-step's or a beat's mark on the panel (VIEWS §7.4, SKILLS §5.1; the user's natural 1s, 2026-11-11), the one helper the
 * panel and the bundle's lanes read: '~' a natural 1 caught (slow, not failed), '!' a stoppage (the dummy's click, a jam),
 * '★' a natural 20, '✗' only a failure that cost something (the time, a halt), '◦' routine, '✓' passed; null with no roll.
 */
export function markOf(f) {
  if (!f || f.ok === undefined || f.ok === null) return f?.stop ? '!' : null;
  if (f.caught) return '~';
  if (f.stop) return '!';
  if (f.star || f.clean) return '★';
  if (!f.ok || f.grade === 'bad' || f.grade === 'disaster' || (f.grade === 'miss' && !f.routine)) return '✗';
  return f.routine ? '◦' : '✓';
}
// (a sub-step's roll's marks carried on its record and its fact, only where they are (the saves made before keep their shape))
export const markFields = (r) => ({ ...(r?.caught ? { caught: true } : {}), ...(r?.clean ? { clean: true } : {}), ...(r?.star ? { star: true } : {}), ...(r?.stop ? { stop: true } : {}) });
// (a list step's record as the 'step' fact carries it)
export const stepFact = (d, phase, extra = {}) => ({ phase, who: d.who, step: d.step, i: d.i, action: d.list?.[d.i] ?? null, fromMs: d.subFromMs ?? d.fromMs, toMs: d.untilMs, ...extra });

/** A list step begun (see the header): set doing on state.stop, 'stop' released, the start fact, sub-step 0 rolled at the clock, then advanced. */
export function begin(state, bus, d, { mode = 'stop', text = null } = {}) {
  const S = state.stop, now = state.clock.ms;
  S.doing = d;
  S.phase = 'act';
  S.queue = [];
  releaseTime(state, 'stop');
  bus?.emit('step', stepFact(d, 'start', { ok: null, grade: null, routine: null, mishap: null, text: text ?? d.step, mode }));
  LIST?.onStart?.(state, bus, d);
  runSub(state, bus, d, 0, now);
  advance(state, bus);
  return d;
}

/** Sub-step i rolled and applied at atMs (its boundary): the handler's effects, then its time from here (see the header). */
export function runSub(state, bus, d, i, atMs) {
  d.i = i; d.subFromMs = atMs;
  const { rec, text, extra } = LIST.run(state, bus, d, i, atMs);
  d.subs.push(rec);
  d.untilMs = atMs + rec.ms;
  bus?.emit('step', stepFact(d, 'sub', { ok: rec.ok, grade: rec.grade, routine: rec.routine, mishap: rec.mishap, text, ...markFields(rec), ...(extra ?? {}) }));
}

/** The player's doing advanced to the clock (see the header): a list's boundaries taken, a bundle's beats run. */
export function advance(state, bus) {
  const S = state.stop;
  // (the flow beside a list step first: its feet carry on while the step runs on the hands (see the header))
  const F = S?.flow;
  if (F && !F.suspended && !F.over && S.doing && !S.doing.beats) { const r = advanceBeats(state, bus, F, state.clock.ms); if (r !== 'running') BEATS?.flow?.(state, bus, F, r); }
  let d = S?.doing;
  if (d?.beats) { const r = advanceBeats(state, bus, d, state.clock.ms); if (r !== 'running') BEATS?.done?.(state, bus, d, r); return; }
  const t = state.clock.ms;
  while (state.stop && S.doing === d && d && t >= d.untilMs) {
    if (d.kind === 'wait') { endStep(state, bus, 'end'); break; }
    LIST.endSub(state, bus, d);
    if (d.gunStop) { endStep(state, bus, 'stop'); break; }
    if (d.halt) { S.queue = LIST.queueAfter(state, d); endStep(state, bus, 'halt'); break; }
    if (d.cut) { endStep(state, bus, 'cut'); break; }
    if (d.i + 1 < d.list.length) runSub(state, bus, d, d.i + 1, d.untilMs);
    else { endStep(state, bus, 'end'); break; }
    d = S.doing;
  }
}

/**
 * Another person's list doing advanced to ms (the shoot house's number two's tower macro, COMBAT §25.19.5, the rework's R5): the
 * same boundaries as the player's (each sub-step rolled at its formula time, its effects at its start as the NPC gunner's,
 * its time from there), by the owner's run(state, bus, d, i, atMs) → rec { ms, … }, which may plan the rest of d.list again.
 * Returns 'running', or 'ended' with every sub-step done (the owner clears the doing).
 */
export function advanceList(state, bus, d, ms, run) {
  for (let guard = 0; guard < 64 && ms >= d.untilMs; guard++) {
    const i = d.i + 1;
    if (i >= d.list.length) return 'ended';
    const at = d.untilMs, rec = run(state, bus, d, i, at);
    d.i = i; d.subFromMs = at; d.subs.push(rec);
    d.untilMs = at + Math.max(0, Math.round(rec.ms ?? 0));
  }
  return 'running';
}

/** A list step over (see the header): the fact, the doing cleared, then the handler's end (the chained wait, the reflex, choosing again). */
export function endStep(state, bus, why = 'end') {
  const S = state.stop, d = S?.doing;
  if (!d) return;
  LIST.before?.(state, bus, d, why);
  bus?.emit('step', stepFact(d, why === 'halt' ? 'halt' : why === 'cut' ? 'cut' : 'end', { ok: why === 'end' || why === 'stop', grade: null, routine: null, mishap: null, text: why }));
  S.doing = null;
  LIST.end(state, bus, d, why);
}

// ---- the beat doings (bundles, see the header) ----

const KINDS = new Map();
/** A beat kind's handler (see the header): { run(state, bus, d, beat, atMs) → { ms, ok?, grade?, routine?, mishap?, text?, halt?, passMs? }, end?(state, bus, d, beat) }. */
export function registerKind(kind, handler) { KINDS.set(kind, handler); }
/** A beat kind's handler, or null. */
export const kindOf = (kind) => KINDS.get(kind) ?? null;

// (a dependency's time: when it is met, or Infinity while it cannot be known)
function depMs(d, dep) {
  const [id, mod] = dep.split('@'), b = d.beats.find(x => x.key === id);
  if (!b || b.st === 'skip') return -Infinity;                     // (a beat the plan left out is no dependency)
  if (b.st === 'wait') return Infinity;
  if (!mod) return b.st === 'run' ? Infinity : b.untilMs;
  if (mod === 'pass') return b.fromMs + (b.passMs ?? b.ms);
  if (mod === 'arrive') return b.fromMs + (b.arriveMs ?? b.ms);
  const k = Number(mod);
  return b.fromMs + Math.round((Number.isFinite(k) ? k : 1) * b.ms);
}
// (whether a beat on channel ch may run beside the running ones at this flow)
// (a beat may flow with the feet from a rung of its own, below its channel's (`flowFrom`: the door's read rides the approach
// from rung 3, the point man's eyes on the hinge as he closes on it; the rework's R4, my call))
function flowOk(d, ch, b = null) {
  const F = flowOf(d.rung ?? 0), rung = d.rung ?? 0;
  const flows = (c, x) => F.has(c) || (Number.isFinite(x?.flowFrom) && rung >= x.flowFrom);
  const busy = (r) => r.ch === ch || !((r.ch === 'feet' && flows(ch, b)) || (ch === 'feet' && flows(r.ch, r)));
  // (a list step beside the doing holds its channel as a running beat would (see the header); the feet carry on beside it
  // at every rung from 2, the suspension's whole point: the shot runs on the hands while the feet go to the point)
  if (d.hold && (d.hold.ch === ch || ch !== 'feet')) return false;
  for (const r of d.beats) {
    if (r.st !== 'run') continue;
    if (busy(r)) return false;
  }
  return true;
}
// (when a waiting beat could start, given what runs now; Infinity when it cannot until something ends)
function readyMs(d, b) {
  if (d.halt || d.stopAfter || d.suspendAsk || d.suspended) return Infinity;
  // (the eyes held elsewhere (d.eyesOff, the #2's on a man he takes on the move: bundle.js runSlot): no look starts)
  if (d.eyesOff && b.k === 'scan') return Infinity;
  if (!flowOk(d, b.ch, b)) return Infinity;
  let at = d.atMs ?? d.fromMs;
  for (const dep of b.after ?? []) at = Math.max(at, depMs(d, dep));
  return at;
}
// (the 'bundle' fact)
const beatFact = (d, phase, b, extra = {}) => ({ phase, who: d.who, id: d.step, beat: b?.key ?? null, ch: b?.ch ?? null, atMs: extra.atMs ?? d.atMs, ...extra });

// (a beat started at atMs by its handler)
function startBeat(state, bus, d, b, atMs) {
  const H = KINDS.get(b.k);
  b.st = 'run'; b.fromMs = atMs;
  const r = H?.run?.(state, bus, d, b, atMs) ?? { ms: b.ms ?? 0 };
  b.ms = Math.max(0, Math.round(r.ms ?? b.ms ?? 0));
  if (r.passMs !== undefined) b.passMs = Math.round(r.passMs);
  if (r.arriveMs !== undefined) b.arriveMs = Math.round(r.arriveMs);
  if (r.again) b.again = true;
  b.untilMs = atMs + b.ms;
  d.subs.push({ beat: b.key, k: b.k, ch: b.ch, ms: b.ms, ok: r.ok ?? null, grade: r.grade ?? null, routine: r.routine ?? null, mishap: r.mishap ?? null, ...markFields(r) });
  (d.lanes[b.ch] ??= []).push({ key: b.key, glyph: r.ok === false ? markOf({ ...r, ok: false }) ?? '✗' : r.routine ? '◦' : '▸' });
  bus?.emit('bundle', beatFact(d, 'beat', b, { atMs, text: r.text ?? null }));
  if (r.halt) haltBeats(state, bus, d, r.halt, r.text ?? null, atMs);
  else if (r.suspend && !d.dry) suspendFlow(state, bus, d, r.suspend, atMs);
}
// (a beat ended at its untilMs, or cut at atMs)
function endBeat(state, bus, d, b, atMs, cut = false, early = false) {
  b.st = cut ? 'cut' : b.again ? 'wait' : 'done';
  if (b.again) { delete b.again; b.redo = true; }
  if (cut || early) { b.untilMs = atMs; }
  if (early) b.took = true;
  KINDS.get(b.k)?.end?.(state, bus, d, b, { cut, atMs });
  const lane = d.lanes[b.ch]?.find(x => x.key === b.key && x.glyph === '▸');
  // (a beat cut by a decision is no failure: '–', never ✗ (VIEWS §7.4: ✗ only for a failure that cost something))
  if (lane) lane.glyph = cut ? '–' : markOf(d.subs.find(s => s.beat === b.key) ?? { ok: true }) ?? '✓';
}

/**
 * A beat doing advanced to ms (see the header): every boundary up to ms taken at its formula time. Returns 'running',
 * 'ended' (every beat done) or 'halted' (d.halt set and nothing running: the rest is d.rest).
 */
export function advanceBeats(state, bus, d, ms) {
  for (let guard = 0; guard < 4 * d.beats.length + 8; guard++) {
    // (the next boundary: the earliest running beat's end, else the earliest start, ends first on a tie)
    let end = null, start = null, startAt = Infinity;
    for (const b of d.beats) if (b.st === 'run' && (!end || b.untilMs < end.untilMs)) end = b;
    for (const b of d.beats) {
      if (b.st !== 'wait') continue;
      const at = readyMs(d, b);
      if (at < startAt) { startAt = at; start = b; }
    }
    if (end && end.untilMs <= ms && end.untilMs <= startAt) {
      d.atMs = Math.max(d.atMs ?? 0, end.untilMs);
      endBeat(state, bus, d, end, end.untilMs);
      const i = d.beats.indexOf(end);
      if (!d.halt && (d.seams ?? []).includes(i) && d.beats.some(b => b.st === 'wait')) haltBeats(state, bus, d, 'seam', null, end.untilMs);
      continue;
    }
    if (start && startAt <= ms) {
      d.atMs = Math.max(d.atMs ?? 0, startAt);
      startBeat(state, bus, d, start, startAt);
      continue;
    }
    break;
  }
  if (d.suspended && !d.halt) return 'suspended';
  // (a call still waiting to be said (its run came back `again` with nothing said: "Clear!" waiting on the #2's sweep or the
  // scene's gate) is no voice under way: it goes back to waiting and the pause comes now. The rework's R9, 2026-11-13: the
  // corporal's "Clear!" in the hall waited on his #2's group for up to a second with the hall's man taken in, and the pause,
  // so the pair, came that much later: 13 of 30 advanced pars missed there, F10)
  const owedCall = (b) => b.st === 'run' && b.k === 'call' && b.again === true;
  if (d.suspendAsk && !d.halt && !d.beats.some(b => b.st === 'run' && b.k !== 'move' && b.k !== 'scan' && !owedCall(b))) {
    // (suspended once nothing but the moves and the scans run: the scans paused where they stand (see the header))
    const at = Math.max(d.atMs ?? 0, d.suspendAsk.atMs ?? 0);
    for (const b of d.beats) if (owedCall(b)) { delete b.again; b.redo = true; b.st = 'wait'; b.untilMs = at; }
    // (a contact took the eyes: the corner's look, running or still to come of the room the feet are going into, is done there
    // when a man of the window stands in that corner (within TOOK_M of the spot), as v0.0.12's hand-back counted every scan it
    // cut (the man seen is where the eyes went; my call, which keeps room 1's time: "a pause costs no game time", COMBAT
    // §25.19.3.2; counted for any man, a no-shoot elsewhere left the corner unseen: "Corner! You never looked." on 4 of 100
    // tier one lanes); the far leg's look stays owed; any other scan is paused where it stands and resumes)
    const mvPlan = d.beats.find(x => x.st === 'run' && x.k === 'move')?.plan ?? null, men = d.suspendAsk.at ?? [];
    const inCorner = (b) => !!b.eyes && men.some(([x, z]) => Math.hypot(x - b.eyes[0], z - b.eyes[1]) <= TOOK_M);
    const took = (b) => d.suspendAsk.why === 'contact' && b.k === 'scan' && b.key.endsWith('corner') && inCorner(b) && (b.st === 'run' || (b.st === 'wait' && b.plan === mvPlan && mvPlan !== null));
    for (const b of d.beats) {
      if (took(b)) { if (b.st === 'run') endBeat(state, bus, d, b, at, false, true); else { b.st = 'done'; b.fromMs = at; b.untilMs = at; b.ms = 0; b.took = true; } }
      else if (b.st === 'run' && b.k === 'scan') pauseScan(d, b, at);
    }
    d.suspended = { why: d.suspendAsk.why, atMs: at };
    delete d.suspendAsk;
    d.atMs = at;
    bus?.emit('bundle', beatFact(d, 'suspend', null, { atMs: at, why: d.suspended.why }));
    return 'suspended';
  }
  const running = d.beats.some(b => b.st === 'run');
  if (running) return 'running';
  if (d.halt || d.stopAfter) {
    if (!d.halt) d.halt = { why: 'stop', words: null, atMs: d.atMs };
    // (a contact's halt: a scan cut by it is done, and the corner's look still to come of the room he is in, the contact having
    // taken the eyes there (my call); the rest is what waits and the cut moves)
    // (but the far leg's look: the man seen took the eyes onto him, not onto the dead space's middle, so the look down the leg
    // is still owed and the carry on gives it (the tier one by T on 48213, room 3: his eyes on the far leg's man 20.6° off
    // its middle, "Corner! You never looked." once the routing of 2026-11-11 moved his walk a tick; 19.0° before, by chance))
    const took = (b) => d.halt.why === 'contact' && b.k === 'scan' && !b.key.endsWith('farlook') && (b.st === 'cut' || (b.st === 'wait' && b.key.endsWith('corner') && b.plan === d.beats.find(x => x.st === 'cut' && x.k === 'move')?.plan));
    d.rest = d.beats.filter(b => (b.st === 'wait' || b.st === 'cut') && !took(b)).map(b => b.key);
    d.untilMs = Math.max(d.atMs ?? d.fromMs, d.halt.atMs ?? 0);
    return 'halted';
  }
  if (d.beats.every(b => b.st !== 'wait')) { d.untilMs = d.atMs ?? d.fromMs; return 'ended'; }
  return 'running';
}

/** Every running scan of a beat doing paused at ms, as a contact's suspension pauses them (see pauseScan): the eyes taken elsewhere. Returns how many. */
export function pauseScans(d, ms) {
  let n = 0;
  // (a tick at least left to each: taken up again, the head is on the sweep's rest for one lived tick, where the scene's
  // coverage reads it; a look paused past its end with nothing left jumped to done unseen, the corner never covered)
  for (const b of d?.beats ?? []) if (b.st === 'run' && b.k === 'scan') { pauseScan(d, b, ms); b.ms = Math.max(b.ms, TICK_MS); n++; }
  return n;
}
// (a running scan paused at ms: back to waiting with the time it had left, its sweep from where the head was, its
// dependencies met, its lane's running glyph taken back so its restart writes its own (see the header))
function pauseScan(d, b, ms) {
  const k = b.untilMs > b.fromMs ? Math.max(0, Math.min(1, (ms - b.fromMs) / (b.untilMs - b.fromMs))) : 1;
  if (b.sweep) b.sweep = [q(b.sweep[0] + wrapRad(b.sweep[1] - b.sweep[0]) * k, 1e-6), b.sweep[1]];
  b.ms = Math.max(0, b.untilMs - ms); b.st = 'wait'; b.after = []; b.fromMs = null; b.untilMs = null; b.paused = true;
  const lane = d.lanes[b.ch]?.findLastIndex?.(x => x.key === b.key && x.glyph === '▸');
  if (lane !== undefined && lane >= 0) d.lanes[b.ch].splice(lane, 1);
  d.eyes = null;
}
const wrapRad = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

/**
 * Ask a beat doing to suspend (see the header): from ms nothing new starts; it is suspended once nothing but its moves and
 * scans run (advanceBeats then returns 'suspended'). why one of SUSPENDS. Returns whether it was asked.
 */
export function suspendFlow(state, bus, d, why, ms = state?.clock?.ms ?? 0, at = null) {
  if (!d?.beats || d.halt || d.suspended || d.suspendAsk) return false;
  d.suspendAsk = { why, atMs: ms, ...(at?.length ? { at: at.map(([x, z]) => [q(x, 1e-4), q(z, 1e-4)]) } : {}) };
  return true;
}
/** A suspended beat doing taken up again at ms (see the header): hold, the channel a list step beside it holds ({ ch, step }), or null. */
export function resume(d, ms, hold = null) {
  if (!d?.beats) return false;
  delete d.suspended; delete d.suspendAsk;
  d.atMs = Math.max(d.atMs ?? 0, ms);
  if (hold) d.hold = { ch: hold.ch ?? 'hands', step: hold.step ?? null, fromMs: ms };
  return true;
}
/** The channel a list step beside a beat doing held, freed at ms (see the header): its record in the doing's subs and lanes. */
export function release(d, ms, { ok = true } = {}) {
  if (!d?.hold) return false;
  const h = d.hold;
  d.subs.push({ beat: h.step ?? 'step', k: 'step', ch: h.ch, ms: Math.max(0, ms - h.fromMs), ok, grade: null, routine: null, mishap: null });
  (d.lanes[h.ch] ??= []).push({ key: h.step ?? 'step', glyph: ok ? '✓' : '✗' });
  delete d.hold;
  d.atMs = Math.max(d.atMs ?? 0, ms);
  return true;
}

// (the halt written, the cuttable running beats cut where they stand)
function haltBeats(state, bus, d, why, words, atMs) {
  if (d.halt) return;
  delete d.suspendAsk; delete d.suspended;
  d.halt = { why, words: words ?? null, atMs };
  if (why !== 'stop' && why !== 'seam') for (const b of d.beats) if (b.st === 'run' && b.cut) endBeat(state, bus, d, b, atMs, true);
  bus?.emit('bundle', beatFact(d, why === 'seam' ? 'seam' : 'halt', null, { atMs, why }));
}

/**
 * Halt a beat doing from outside (see the header): why one of HALTS. 'stop' (Backspace, X) lets the running beats end and
 * starts nothing new; any other cuts the running beats a contact cuts where they stand at ms. The owner reads advanceBeats'
 * 'halted' and d.rest.
 */
export function halt(state, bus, d, why, words = null, ms = state.clock.ms) {
  if (!d?.beats || d.halt) return false;
  if (why === 'stop') { d.stopAfter = true; bus?.emit('bundle', beatFact(d, 'halt', null, { atMs: ms, why })); return true; }
  haltBeats(state, bus, d, why, words, ms);
  d.atMs = Math.max(d.atMs ?? 0, ms);
  return true;
}

/** When a beat doing's next boundary falls (ms), Infinity when nothing is due: the earliest running end or start. */
export function due(d) {
  if (!d?.beats) return d?.untilMs ?? Infinity;
  let t = Infinity;
  for (const b of d.beats) if (b.st === 'run') t = Math.min(t, b.untilMs);
  for (const b of d.beats) if (b.st === 'wait') t = Math.min(t, readyMs(d, b));
  return t;
}

/** The beat running on a channel now, or null. */
export const beatOn = (d, ch) => d?.beats?.find(b => b.st === 'run' && b.ch === ch) ?? null;
/** A beat doing's planned end if nothing halts it (ms): its beats' times laid out by the flow (bundle.js plans it; the face's bar). */
export const plannedUntil = (d) => d?.untilPlanMs ?? d?.untilMs ?? null;

const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// ---- a move beat's closed form (BODY §16.2; bundle.js plans it, places/move.js and the #2's slot read it) ----

/**
 * A trapezoid along L metres (see the header): from v0 toward vMax at pushMs2, then to v1 at brakeMs2 (or pushing again
 * where v1 > the peak): { L, v0, vp, v1, au, ad, t1, t2, t3, s1, s3, T } (s, m, m/s).
 */
export function profileOf(L, vMax, au, ad, { v0 = 0, v1 = 0 } = {}) {
  const len = Math.max(0, L);
  v1 = Math.min(v1, Math.sqrt(v0 * v0 + 2 * au * len));
  const up = (a, b) => (b >= a ? (b * b - a * a) / (2 * au) : (a * a - b * b) / (2 * ad));
  const tm = (a, b) => (b >= a ? (b - a) / au : (a - b) / ad);
  let vp = vMax, s1 = up(v0, vp), s3 = up(vp, v1);
  if (s1 + s3 > len) {
    // (no room to cruise: the peak where the push and the brake meet, never under the ends)
    vp = Math.max(v0, v1, Math.sqrt(Math.max(0, (2 * len + v0 * v0 / au + v1 * v1 / ad) / (1 / au + 1 / ad))));
    s1 = up(v0, vp); s3 = Math.max(0, len - s1);
  }
  const t1 = tm(v0, vp), t3 = tm(vp, v1), t2 = vp > 0 ? Math.max(0, len - s1 - s3) / vp : 0;
  return { L: len, v0, vp, v1, au, ad, t1, t2, t3, s1, s3, T: t1 + t2 + t3 };
}
/** The distance along a profile at t seconds and the speed there: { s, v }. */
export function profileAt(P, t) {
  if (t <= 0) return { s: 0, v: P.v0 };
  const a1 = P.vp >= P.v0 ? P.au : -P.ad;
  if (t < P.t1) return { s: P.v0 * t + a1 * t * t / 2, v: P.v0 + a1 * t };
  if (t < P.t1 + P.t2) return { s: P.s1 + P.vp * (t - P.t1), v: P.vp };
  if (t < P.T) { const u = t - P.t1 - P.t2, a3 = P.v1 >= P.vp ? P.au : -P.ad; return { s: Math.min(P.L, P.L - P.s3 + P.vp * u + a3 * u * u / 2), v: P.vp + a3 * u }; }
  return { s: P.L, v: P.v1 };
}
/** When a profile reaches s metres (s), by bisection on its monotone distance. */
export function profileWhen(P, s) {
  if (s <= 0) return 0;
  if (s >= P.L) return P.T;
  let lo = 0, hi = P.T;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (profileAt(P, m).s < s) lo = m; else hi = m; }
  return hi;
}
// (a polyline's length and the point s metres along it, with the segment's heading)
export const pathLen = (path) => path.slice(1).reduce((a, p, i) => a + dist(path[i], p), 0);
function along(path, s) {
  let left = s;
  for (let i = 1; i < path.length; i++) {
    const L = dist(path[i - 1], path[i]);
    if (left <= L || i === path.length - 1) {
      const k = L > 0 ? Math.min(1, Math.max(0, left / L)) : 1;
      return { x: path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, z: path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k, headRad: Math.atan2(path[i][1] - path[i - 1][1], path[i][0] - path[i - 1][0]) };
    }
    left -= L;
  }
  return { x: path[0][0], z: path[0][1], headRad: 0 };
}
/** A move beat's place at game time ms (see the header): { x, z, vMs, headRad, done }. */
export function moveAt(beat, ms) {
  const P = beat.prof, t = Math.max(0, (Math.min(ms, beat.untilMs ?? ms) - beat.fromMs) / 1000);
  const { s, v } = profileAt(P, t), p = along(beat.path, s);
  return { x: q(p.x, 0.0001), z: q(p.z, 0.0001), vMs: q(v, 0.001), headRad: q(p.headRad, 1e-6), done: ms >= (beat.untilMs ?? Infinity) };
}

/**
 * The move running for a person now (places/move.js sets the body's place from it): a shot row's feet (state.stop.feet: moving
 * on, or braking to plant) or a bundle's running move beat; else the body's carry through a no-stop zone (actor.through, the
 * rework's R8b: places/move.js throughOf); or null.
 */
export function moveNow(state, pid = playerId(state)) {
  const S = state.stop?.who === pid ? state.stop : null;
  if (S?.feet && !S.feet.done) return S.feet;
  const m = S?.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? S?.flow?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? null;
  if (m) return m;
  const a = state.actors?.list?.find(x => x.who === pid);
  return a?.through?.prof ? a.through : null;
}
