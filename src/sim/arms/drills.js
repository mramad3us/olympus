// OLYMPUS arms: the Corps' weapon commands as macros of rolled steps (WEAPONS §5.3; the build sheet 0.0.5 §2.1).
//
// The Corps runs weapon handling by command (the US Marine Corps' LOAD, MAKE READY, CEASE FIRE, UNLOAD,
// UNLOAD SHOW CLEAR, RELOAD, IMMEDIATE and REMEDIAL ACTION, adopted by the hub). Each is one step in
// the panel and one key; it runs its sub-steps in order, each one of firearms.js's actions with its own
// time and its own roll in the log, so the chore is one choice and the dice still decide. A macro halts
// on any failure that is not routine (a routine natural 1 costs its time and nothing else: SKILLS
// §5.1), leaving the gun as that sub-step left it and the rest of its sub-steps queued for the panel
// (the shot role's stop.queue). Adapted from tradecraft's src/sim/gunwork.js (JOBS, ways, work: jobs at
// a table, each a timed roll with a fumble's cost), whose bench jobs (cleaning, filling magazines) wait
// for 0.0.8's upkeep.
//
// subsOf(macro, belief) skips only what the belief makes pointless (a magazine out when none is
// believed in; locking back a bolt believed locked on an empty chamber); the selector's and the port's
// checks always run, a check of a known state taking its thumb's time. The R-7's lever won't reach safe
// with the hammer down (after a function check or a click), so with the hammer believed down a macro's
// first safe comes after its first step that cocks it (UNLOAD's lock back, MAKE READY's charge), or a
// charge goes before it (LOAD, CEASE FIRE): the runtime review's, where each halted on the lever with
// nothing said. REMEDIAL ACTION is its steps (the design review's: one 5 s roll had stood for it): lock
// back, strip the magazine into the other hand, rack the action clear three times, the magazine in,
// charge, and a look at the port. SHOW CLEAR puts the selector on semi before its
// function check (WEAPONS §5.3 left it out: the build sheet's §8 item 14) and ends with a charge to cock
// the hammer, since the R-7's lever won't reach safe with it down. macroMs() is the sum of the
// sub-steps' times before any fumble (the observer's look at their own pace); the shot role's stop
// motion lives them at those times, sub-step by sub-step. macrosFor() is what the holder's belief
// offers: LOAD from no magazine, MAKE READY from a magazine and an empty chamber, the reloads from a
// bolt locked on empty (speed, or keep the empty) or with rounds left (tactical; on a course that says so, COURSES'
// spoutTopUp, the pairs course's, also with the magazine believed empty and one up the spout: the lull's own case, where
// v0.0.6's scored course says "fire it" instead (the fixer's, 0.0.8)), UNLOAD when anything
// is in it, UNLOAD SHOW CLEAR only with an observer at hand, IMMEDIATE ACTION for a stoppage felt,
// REMEDIAL for a double feed seen, CEASE FIRE off safe or with the finger on.
//
// runMacro() plays a macro whole through doAction (the tests', and 0.0.7's gunner's): each sub-step
// rolled and logged in order, halting where the macro halts.
//
// 0.0.6 (the user, 2026-11-07: "putting magazine in should be a "Reach for magazine" (or equivalent)"):
// LOAD and the RELOADs are built from the single steps, the magazine in being a reach and a seat
// (firearms.js: 0.6 and 0.8 s at value 10, v0.0.5's 1.4 s whole, so every drill's time stands). A drill's
// reach takes the magazine by rule (kit.js pickMag 'rule': the kind the gun is meant to fire first, the
// fullest believed, ties in reach order); with a magazine already in the hand subsOf leaves the reach out
// and the drill seats that one. A reach whose weight contradicts the count believed halts the drill
// (firearms.js: "It feels empty. You thought five."), its rest queued. REMEDIAL ACTION keeps v0.0.5's
// magIn for its stripped magazine (brought back from the hand that racked, in the reach's time).
import { actionMs, doAction, beliefOf, conditionOf, tempoFor } from './firearms.js';
import { sparesOf } from './kit.js';
import { modelOf, MODELS } from './models.js';
import { rollerOf } from '../combat/roll.js';
import { COURSES } from '../../data/courses.js';

/** The macros (WEAPONS §5.3): id → { label, subs, observer? }. */
export const MACROS = Object.freeze({
  load: Object.freeze({ label: 'LOAD', subs: Object.freeze(['selector:safe', 'reach', 'seat', 'port']) }),
  ready: Object.freeze({ label: 'MAKE READY', subs: Object.freeze(['selector:safe', 'charge', 'pressCheck', 'port']) }),
  unload: Object.freeze({ label: 'UNLOAD', subs: Object.freeze(['selector:safe', 'magOut:pouch', 'lockBack', 'inspect', 'release', 'selector:safe', 'port']) }),
  clear: Object.freeze({ label: 'UNLOAD, SHOW CLEAR', observer: true, subs: Object.freeze(['selector:safe', 'magOut:pouch', 'lockBack', 'inspect', 'show', 'release', 'selector:semi', 'functionCheck', 'charge', 'selector:safe', 'port']) }),
  'reload:speed': Object.freeze({ label: 'RELOAD', subs: Object.freeze(['magOut:drop', 'reach', 'seat', 'release']) }),
  'reload:retain': Object.freeze({ label: 'RELOAD, keep the empty', subs: Object.freeze(['magOut:dump', 'reach', 'seat', 'release']) }),
  'reload:tactical': Object.freeze({ label: 'RELOAD', subs: Object.freeze(['magOut:pouch', 'reach', 'seat']) }),
  ia: Object.freeze({ label: 'IMMEDIATE ACTION', subs: Object.freeze(['tap', 'charge', 'observe']) }),
  remedial: Object.freeze({ label: 'REMEDIAL ACTION', subs: Object.freeze(['lockBack', 'magOut:strip', 'rack', 'rack', 'rack', 'magIn', 'charge', 'observe']) }),
  cease: Object.freeze({ label: 'CEASE FIRE', subs: Object.freeze(['finger', 'selector:safe']) }),
  // (the shoot house's Stop at the lane's end (COMBAT §25.19.4: "Make safe", one row): the finger off, on safe, low ready)
  safe: Object.freeze({ label: 'MAKE SAFE', subs: Object.freeze(['finger', 'selector:safe', 'posture:lowReady']) }),
});

/** The actions that cock the hammer on the way (the R-7's lever reaches safe only after one: see the header). */
const COCKS = new Set(['charge', 'rack', 'lockBack', 'clearDouble']);
/**
 * A macro's sub-steps for a belief (beliefOf's view): skipping only a magazine out with none believed in, a
 * lock back with the bolt believed locked on an empty (or unsure) chamber, and a reach with a magazine already
 * in the hand (0.0.6); with the hammer believed down on a
 * model whose lever needs it cocked, the first safe after the first step that cocks it, or a charge before it.
 */
export function subsOf(macroId, belief) {
  const m = MACROS[macroId];
  if (!m) return [];
  const subs = m.subs.filter(a => !(a.startsWith('magOut:') && belief?.mag === 'out') && !(a === 'lockBack' && belief?.locked && (belief.chamber === 'empty' || belief.chamber === '?'))
    && !(a === 'reach' && belief?.hand));
  if (belief?.cocked === false && MODELS[belief.model]?.safeNeedsCocked) {
    const s = subs.indexOf('selector:safe'), c = subs.findIndex(a => COCKS.has(a));
    if (s >= 0 && (c < 0 || c > s)) {
      if (c < 0) subs.splice(s, 0, 'charge');
      else { subs.splice(s, 1); subs.splice(c, 0, 'selector:safe'); }
    }
  }
  return subs;
}

/** A macro's time in ms before any fumble: the sum of its sub-steps' (the tempo where each takes it; the observer's look at their pace). */
export function macroMs(roller, gun, macroId, belief, tempo = 'normal', { observer = null } = {}) {
  return subsOf(macroId, belief).reduce((s, a) => s + actionMs(roller, gun, a, { tempo: tempoFor(a, tempo), observer }), 0);
}

/** The macros the holder's belief offers, in the panel's order: [{ id, label, subs, ms }]. opts: { observerId, finger }. */
export function macrosFor(state, pid, gunId, { observerId = null } = {}) {
  const b = beliefOf(state, gunId), g = state.items?.[gunId];
  if (!b || !g) return [];
  const kit = state.people?.[pid]?.kit, finger = kit?.carry?.finger ?? 'off';
  const fams = modelOf(g)?.fams ?? [], spares = sparesOf(state, pid, null).filter(id => fams.includes(state.items[id]?.fam));
  // (a magazine not believed empty: an unknown count, or one felt to hold some)
  const withRounds = spares.filter(id => state.items[id]?.belief?.n !== 0 && state.items[id]?.belief?.feel !== 'none');
  const ids = [];
  if (b.stoppage === 'double') ids.push('remedial');
  else if (b.stoppage) ids.push('ia');
  if (b.mag === 'out' && withRounds.length && b.chamber !== 'live') ids.push('load');
  if (b.mag === 'in' && b.chamber === 'empty' && !b.locked && b.count !== 0 && !b.stoppage) ids.push('ready');
  if (b.mag === 'in' && b.locked && b.count === 0 && withRounds.length) ids.push('reload:speed', 'reload:retain');
  else if (b.mag === 'in' && (b.count !== 0 || (b.chamber === 'live' && !!COURSES[state.armoury?.range?.course]?.spoutTopUp)) && withRounds.length && !b.stoppage) ids.push('reload:tactical');
  // (the house's Stop: Make safe in one row, its low ready the house's own (COMBAT §25.19.4); CEASE FIRE elsewhere as built)
  const houseStop = state.armoury?.range?.course === 'house' && state.armoury.range.cmd?.id === 'stop';
  if (houseStop && (b.mode !== 'safe' || finger === 'on' || (kit?.carry?.posture ?? 'slungFront') !== 'lowReady')) ids.push('safe');
  else if (b.mode !== 'safe' || finger === 'on') ids.push('cease');
  if (b.mag === 'in' || b.chamber !== 'empty' || b.locked) ids.push('unload');
  if (observerId) ids.push('clear');
  const roller = rollerOf(state, pid), observer = observerId ? rollerOf(state, observerId) : null;
  return ids.map(id => ({ id, label: MACROS[id].label, subs: subsOf(id, b), ms: macroMs(roller, g, id, b, 'normal', { observer }) }));
}

/**
 * Play a macro whole (w): its sub-steps through doAction in order, halting on a failure that is not
 * routine (or a refusal, or the observer's "Hold."). opts: doAction's ({ pid, gunId, tempo, pressure,
 * observerId, bay, force }) and macro. Returns { macro, ms, subs: [{ action, ms, ok, grade, routine,
 * text, mishap, cond }], halted: null | { at, why }, queue: [the actions not done], nd, condition }.
 */
export function runMacro(state, bus, { macro, ...opts }) {
  const m = MACROS[macro];
  if (!m) throw new Error(`drills.runMacro(): no macro '${macro}'`);
  const subs = subsOf(macro, beliefOf(state, opts.gunId)), out = { macro, ms: 0, subs: [], halted: null, queue: [], nd: null, condition: null };
  for (let i = 0; i < subs.length; i++) {
    const action = subs[i];
    const r = doAction(state, bus, { ...opts, action, tempo: tempoFor(action, opts.tempo ?? 'normal') });
    out.ms += r.ms;
    out.subs.push({ action, ms: r.ms, ok: r.ok, grade: r.grade, routine: r.routine, text: r.text, mishap: r.mishap, cond: conditionOf(state.items[opts.gunId]) });
    if (r.nd) out.nd = r.nd;
    if (r.halts) { out.halted = { at: action, why: r.refused ? 'refused' : r.mishap ?? r.grade ?? 'hold' }; out.queue = subs.slice(i + 1); break; }
  }
  out.condition = conditionOf(state.items[opts.gunId]);
  return out;
}
