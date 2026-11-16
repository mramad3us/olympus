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
// v0.0.6's scored course says "fire it" instead (the fixer's, 0.0.8); from the hunt of v0.0.18 only where it can change the
// magazine in, kit.js topUpGains: the reach would take another over it as stowed, one in a hand, or the coach's named magazine), UNLOAD when anything
// is in it, UNLOAD SHOW CLEAR only with an observer at hand, IMMEDIATE ACTION for a stoppage felt,
// REMEDIAL for a double feed seen, CEASE FIRE off safe or with the finger on.
//
// 0.0.18 (the user, 2026-11-15: the handling options from the gun's believed state, for any gun): every offer keeps its predicate,
// and each reload's sub-steps are the planner's path for its purpose (src/sim/arms/plan.js: RELOAD to fed, keep the empty to
// retain, Top up to topup), its name the path's; one more offer closes the dead end v0.0.17 left (RELOAD where nothing reloads
// and the gun can't fire, its way holding a seat: a magazine believed empty in a closed, empty rifle); a reload with no way is
// struck with why. subsOf drops the port on a model with no cover (the P-12's UNLOAD read "Port cover"); every R-7 list is
// v0.0.17's, so the #2, the gunner, the bundle's reorg and the sidearm keep their runs.
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
import { sparesOf, topUpGains } from './kit.js';
import { modelOf } from './models.js';
import { rollerOf } from '../combat/roll.js';
import { COURSES } from '../../data/courses.js';
import { planFor, GOAL_OF } from './plan.js';

// (the macros and their sub-steps: macros.js, a leaf, re-exported here for every caller)
export { MACROS, subsOf } from './macros.js';
import { MACROS, subsOf } from './macros.js';

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
  // (the magazine out with a round still chambered: a top-up whose magazine fell (a fumble on the magazine out, or the new one
  // dropped on the seat). LOAD's safe and port are no answer in a fight, so the top-up's tail, the reach and the seat (subsOf
  // drops the magazine out). Before, nothing reloaded the rifle: the user, 2026-11-15, "fumbled magazine when topping up, no
  // option to load")
  else if (b.mag === 'out' && withRounds.length && b.chamber === 'live' && !b.stoppage) ids.push('reload:tactical');
  // (the magazine out and the chamber not live: the rifle fired dry on no magazine (a fumbled top-up, then the round chambered
  // fired). LOAD's safe and port and no charge are the tower's; the fight's answer is RELOAD's tail, the reach, the seat and the
  // bolt (subsOf: Charge for the release on a bolt not locked). The user, 2026-11-15: "fired the last bullet and still no
  // option to reload")
  if (b.mag === 'out' && withRounds.length && b.chamber !== 'live' && !b.stoppage) ids.push('reload:speed');
  if (b.mag === 'in' && b.chamber === 'empty' && !b.locked && b.count !== 0 && !b.stoppage) ids.push('ready');
  // (Top up only where it can change the magazine in (kit.js topUpGains, the one rule: a spare the reach would take over the
  // magazine in as stowed, one in a hand, or the coach's named magazine). The reach takes the first by the drills' rule, so with
  // the fullest already in, Top up stowed it and reached it back, 3 s for nothing, and Fix read Top up again for ever (the hunt
  // of v0.0.18: 106 such pauses over 12 of the pairs bot's runs; its review: the same with a spare of a count unknown))
  const spout = !!COURSES[state.armoury?.range?.course]?.spoutTopUp;
  const gains = b.mag === 'in' && topUpGains(state, pid, gunId, b);
  if (b.mag === 'in' && b.locked && b.count === 0 && withRounds.length) ids.push('reload:speed', 'reload:retain');
  else if (b.mag === 'in' && (b.count !== 0 || (b.chamber === 'live' && spout)) && withRounds.length && gains && !b.stoppage) ids.push('reload:tactical');
  // (v0.0.18: the planner's RELOAD where no reload is offered and the rifle can't fire, its way to fed holding a seat: the magazine
  // in believed empty, the bolt home and the chamber empty, spares in reach, was a dead end, Fix "nothing offered now" (MAKE READY
  // needs rounds believed in, RELOAD a locked bolt, Top up rounds): the build sheet 0.0.18 §0 item 2)
  if (!b.stoppage && b.chamber !== 'live' && !ids.some(id => id.startsWith('reload:')) && planFor(state, pid, gunId, 'fed', { look: false }).subs?.some(a => a === 'seat' || a === 'magIn')) ids.push('reload:speed');
  // (the house's Stop: Make safe in one row, its low ready the house's own (COMBAT §25.19.4); CEASE FIRE elsewhere as built)
  const houseStop = state.armoury?.range?.course === 'house' && state.armoury.range.cmd?.id === 'stop';
  if (houseStop && (b.mode !== 'safe' || finger === 'on' || (kit?.carry?.posture ?? 'slungFront') !== 'lowReady')) ids.push('safe');
  else if (b.mode !== 'safe' || finger === 'on') ids.push('cease');
  if (b.mag === 'in' || b.chamber !== 'empty' || b.locked) ids.push('unload');
  if (observerId) ids.push('clear');
  const roller = rollerOf(state, pid), observer = observerId ? rollerOf(state, observerId) : null;
  // (v0.0.18: each reload's sub-steps are the planner's path for its purpose (plan.js), its name the path's; one the planner finds
  // no way for is kept, struck with why (greyed, never removed))
  return ids.map(id => {
    if (!id.startsWith('reload:')) return { id, label: MACROS[id].label, subs: subsOf(id, b), ms: macroMs(roller, g, id, b, 'normal', { observer }) };
    const purpose = id.slice(7), p = planFor(state, pid, gunId, GOAL_OF[purpose], { look: false, purpose });
    if (!p.subs?.length) return { id, label: MACROS[id].label, subs: subsOf(id, b), ms: macroMs(roller, g, id, b, 'normal', { observer }), ...(p.none ? { off: p.none } : {}) };
    return { id, label: MACROS[id].label, name: p.label, subs: p.subs, path: p.subs, ms: p.subs.reduce((t, a) => t + actionMs(roller, g, a, { tempo: 'normal' }), 0) };
  });
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
