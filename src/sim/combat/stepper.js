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
// The facts: 'step' for list doings as built; 'bundle' { phase: 'beat' | 'seam' | 'halt' | 'end', who, id, beat, ch, why?,
// atMs } for beats (bundle.js emits 'start').
// Pure but begin, runSub, advance, endStep and advanceBeats, which write the doing record and the clock's holds.
import { releaseTime } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { playerId } from '../../core/ids.js';

/** The channels a beat runs on (COMBAT §25.7.1): feet, hands, eyes, voice, and world for a wait on the world. */
export const CHANNELS = Object.freeze(['feet', 'hands', 'eyes', 'voice', 'world']);
/** Why a beat doing stops early (COMBAT §25.7.2 amended by the build sheet 0.0.12 §2.2). */
export const HALTS = Object.freeze(['contact', 'noshoot', 'refused', 'door-unplanned', 'two', 'gun', 'fail', 'seam', 'lane-end', 'stop']);
/** The rung from which hands and voice overlap the feet, and the rung from which the eyes do too (COMBAT §25.3.1). */
export const FLOW_HANDS_RUNG = 3, FLOW_EYES_RUNG = 4;
const FLOW = [new Set(), new Set(), new Set(), new Set(['hands', 'voice']), new Set(['hands', 'voice', 'eyes'])];
/** The channels that may overlap a running feet beat at a rung (COMBAT §25.3.1's flow): none to rung 2. */
export const flowOf = (rung) => FLOW[Math.max(0, Math.min(4, rung | 0))];

// ---- the list doings (v0.0.5's steps, see the header) ----

let LIST = null, BEATS = null;
/** The player's beat doings' owner (bundle.js): { done(state, bus, d, 'ended' | 'halted') }, called when advance() finishes one. */
export function useBeats(owner) { BEATS = owner; }
/**
 * The list doings' handler, the rifle's (shooting.js): { run(state, bus, d, i, atMs) → { rec, text, extra }, endSub(state,
 * bus, d), queueAfter(state, d) → [subId], end(state, bus, d, why), onStart(state, bus, d) }.
 */
export function useList(handler) { LIST = handler; }

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
  bus?.emit('step', stepFact(d, 'sub', { ok: rec.ok, grade: rec.grade, routine: rec.routine, mishap: rec.mishap, text, ...(extra ?? {}) }));
}

/** The player's doing advanced to the clock (see the header): a list's boundaries taken, a bundle's beats run. */
export function advance(state, bus) {
  const S = state.stop;
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
function flowOk(d, ch) {
  const F = flowOf(d.rung ?? 0);
  for (const r of d.beats) {
    if (r.st !== 'run') continue;
    if (r.ch === ch) return false;
    if (!((r.ch === 'feet' && F.has(ch)) || (ch === 'feet' && F.has(r.ch)))) return false;
  }
  return true;
}
// (when a waiting beat could start, given what runs now; Infinity when it cannot until something ends)
function readyMs(d, b) {
  if (d.halt || d.stopAfter) return Infinity;
  if (!flowOk(d, b.ch)) return Infinity;
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
  d.subs.push({ beat: b.key, k: b.k, ch: b.ch, ms: b.ms, ok: r.ok ?? null, grade: r.grade ?? null, routine: r.routine ?? null, mishap: r.mishap ?? null });
  (d.lanes[b.ch] ??= []).push({ key: b.key, glyph: r.ok === false ? '✗' : r.routine ? '◦' : '▸' });
  bus?.emit('bundle', beatFact(d, 'beat', b, { atMs, text: r.text ?? null }));
  if (r.halt) haltBeats(state, bus, d, r.halt, r.text ?? null, atMs);
}
// (a beat ended at its untilMs, or cut at atMs)
function endBeat(state, bus, d, b, atMs, cut = false) {
  b.st = cut ? 'cut' : b.again ? 'wait' : 'done';
  if (b.again) { delete b.again; b.redo = true; }
  if (cut) { b.untilMs = atMs; }
  KINDS.get(b.k)?.end?.(state, bus, d, b, { cut, atMs });
  const lane = d.lanes[b.ch]?.find(x => x.key === b.key && x.glyph === '▸');
  if (lane) lane.glyph = cut ? '✗' : (d.subs.find(s => s.beat === b.key)?.routine ? '◦' : d.subs.find(s => s.beat === b.key)?.ok === false ? '✗' : '✓');
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
  const running = d.beats.some(b => b.st === 'run');
  if (running) return 'running';
  if (d.halt || d.stopAfter) {
    if (!d.halt) d.halt = { why: 'stop', words: null, atMs: d.atMs };
    // (a contact's halt: a scan cut by it is done, and the corner's look still to come of the room he is in, the contact having
    // taken the eyes there (my call); the rest is what waits and the cut moves)
    const took = (b) => d.halt.why === 'contact' && b.k === 'scan' && (b.st === 'cut' || (b.st === 'wait' && b.key.endsWith('corner') && b.plan === d.beats.find(x => x.st === 'cut' && x.k === 'move')?.plan));
    d.rest = d.beats.filter(b => (b.st === 'wait' || b.st === 'cut') && !took(b)).map(b => b.key);
    d.untilMs = Math.max(d.atMs ?? d.fromMs, d.halt.atMs ?? 0);
    return 'halted';
  }
  if (d.beats.every(b => b.st !== 'wait')) { d.untilMs = d.atMs ?? d.fromMs; return 'ended'; }
  return 'running';
}

// (the halt written, the cuttable running beats cut where they stand)
function haltBeats(state, bus, d, why, words, atMs) {
  if (d.halt) return;
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

/** The move running for a person now (places/move.js sets the body's place from it): a shot row's feet (state.stop.feet: moving on, or braking to plant) or a bundle's running move beat; or null. */
export function moveNow(state, pid = playerId(state)) {
  const S = state.stop?.who === pid ? state.stop : null;
  if (!S) return null;
  if (S.feet && !S.feet.done) return S.feet;
  return S.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? null;
}
