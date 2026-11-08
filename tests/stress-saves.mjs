// OLYMPUS tests: the save points of "Bang" (test-stress), shared by stress-save.test.mjs (node) and browser.test.mjs (the
// page imports this module, so it imports nothing of node's): each a name and a test on the state, the range record and
// supp.js suppNow, the first tick it holds taken once.
import { recOf, RELOAD_STRING } from '../src/sim/scenarios/stress.js';

/** The save points: each taken once, the first tick its test holds. */
export const STRESS_SAVES = Object.freeze([
  ['the din, the horn sounding', (s, R, u) => R.str?.k === 1 && !R.str.done && (R.stress.plan ?? []).some(e => e.k === 1 && e.kind === 'horn' && e.atMs < s.clock.ms && e.untilMs > s.clock.ms)],
  ['the din, between two blanks', (s, R) => R.str?.k === 1 && !R.str.done && (R.stress.plan ?? []).filter(e => e.k === 1 && e.kind === 'blank' && e.done).length >= 10],
  ['in a Breathe', (s) => s.stop?.doing?.step === 'breathe' && (s.stop.doing.i ?? 0) >= 1],
  ['a tick into the called bang\'s startle', (s, R, u) => R.str?.k === 2 && !!u?.startle && s.clock.ms === u.startle.fromMs + 50],
  ['a tick into the three bangs\' startle', (s, R, u) => R.str?.k === 3 && !!u?.startle && s.clock.ms === u.startle.fromMs + 50],
  ['the bangs\' pause, the pool draining', (s, R, u) => R.str?.k === 3 && s.stop?.via === 'contact' && s.stop.phase === 'choose' && (u?.pool ?? 0) > 0],
  ['in the RELOAD of string 5', (s, R) => R.str?.k === RELOAD_STRING && !!recOf(R, RELOAD_STRING)?.reload && recOf(R, RELOAD_STRING).reload.endMs === null && !!s.stop?.doing],
  ['the second turner turned', (s, R) => R.str?.k === RELOAD_STRING && !!recOf(R, RELOAD_STRING)?.turned2 && !R.str.done],
  ['between strings, the truth up', (s, R) => !!R.str?.done && R.str.k >= 1 && R.str.k < RELOAD_STRING],
]);
