// OLYMPUS tests: a dummy world and a scripted player, for the determinism suite until the real
// domains exist (TECH §8.2: "with a dummy domain where real ones are missing"; the build sheet's
// §2.3).
//
// dummyWorld is a domain descriptor (src/sim/game.js's shape) that replaces game.js's world stub:
// it owns the top-level key 'world' and does a little of everything the background world will do,
// so a determinism test has something to diverge on:
//   - its own dice: the saved stream rngOf(state, 'world'), never main's;
//   - pre-drawn events: an incident (1 to 60 game minutes apart, drawn uniform from its own
//     stream, so no transcendental is involved) posted into the queue as a one-shot job and handled
//     by its job handler, which draws and posts the next; an alarm, a process of ALARM_RATE_PER_MIN
//     pre-drawn by core's hazard() (queue.js: -ln(u) / rate from its own pure stream, generation n
//     for the nth), an event of kind 'dummy-alarm' handled through the descriptor's events table;
//     and a recurring job every hour at :47 UTC (hour@:47Z: inside the quick run, which starts
//     at 02:20 UTC), posted by newGame and re-posted by the dispatcher;
//   - a slow contributor that is steady in even game hours and not in odd ones (TECH §3.4): it
//     counts the game time it was stepped over (exact for any split of a span), and while not steady
//     it rolls a die a step, so the step grid shows in the result;
//   - a fast contributor on the per-second layer (whole seconds lived: live play and fast-forward,
//     not the outcome engine), counting seconds and rolling every tenth.
// Everything it keeps is plain data under world.dummy, with no ids (nothing for checkIds to
// misread), and its init is a ??= fill, so it serves as the domain's upgrade too.
//
// scriptInput(i) is tick i's input, chosen by hash (cosmetic: no dice), so two runs are fed the
// same: walking about (the moves, sometimes running, sometimes strolling), G ('ready': time held)
// at ticks 100, 400, 700… and a digit 30 ticks later (time runs again), and R ('hand': 15 minutes'
// wait, an outcome skip) at ticks 520, 2,520….
import { NO_INPUT } from '../src/core/loop.js';
import { post, hazard } from '../src/core/queue.js';
import { rngOf, int } from '../src/core/rng.js';
import { hash01, hashInt } from '../src/core/hash.js';
import { SEC_MS, MIN_MS, HOUR_MS } from '../src/core/clock.js';

export const DUMMY_SRC = 'world:dummy';
export const HAZARD_MIN_S = 60, HAZARD_MAX_S = 3600;               // an incident 1 to 60 game minutes after the last
export const HAZARD_PRIO = 4;
export const ALARM_RATE_PER_MIN = 1 / 20;                          // an alarm every 20 game minutes, on average

const dummyOf = (state) => state.world.dummy;
const steadyAt = (ms) => Math.floor(ms / HOUR_MS) % 2 === 0;       // (steady in even game hours)

// (the next incident: drawn from the world's own stream, posted as a one-shot job)
function postHazard(state, afterMs) {
  const d = dummyOf(state), r = rngOf(state, 'world');
  const delayS = HAZARD_MIN_S + int(r, HAZARD_MAX_S - HAZARD_MIN_S + 1);
  d.hazards += 1;
  d.pendingAtMs = afterMs + delayS * SEC_MS;
  post(state, { atMs: d.pendingAtMs, prio: HAZARD_PRIO, kind: 'job', src: DUMMY_SRC, payload: { job: 'dummyHazard', n: d.hazards } });
}

function init(state) {
  state.world ??= {};
  state.world.dummy ??= { hazards: 0, incidents: 0, lastIncidentMs: null, pendingAtMs: null, alarms: 0, alarmPending: false, hours: 0, tension: 0, steppedMs: 0, unsteadySteps: 0, seconds: 0, secondRolls: 0 };
}

// (the next alarm: core's pre-drawn hazard, its generation the alarm's number)
function postAlarm(state) {
  const d = dummyOf(state);
  d.alarmPending = true;
  hazard(state, { src: DUMMY_SRC, key: 'alarm', ratePerMin: ALARM_RATE_PER_MIN, gen: d.alarms, kind: 'dummy-alarm', prio: HAZARD_PRIO });
}
function onAlarm(state) {
  const d = dummyOf(state);
  d.alarms += 1;
  d.alarmPending = false;
  d.tension = (d.tension + 100) % 1000;
  postAlarm(state);
}

function slowStep(state, bus, fromMs, toMs) {
  const d = dummyOf(state);
  d.steppedMs += toMs - fromMs;
  if (!steadyAt(fromMs)) { d.unsteadySteps += 1; d.tension = (d.tension * 7 + int(rngOf(state, 'world'), 100)) % 1000; }
  if (d.pendingAtMs === null) postHazard(state, toMs);
  if (!d.alarmPending) postAlarm(state);
}

function secondStep(state) {
  if (state.clock.ms % SEC_MS !== 0) return;
  const d = dummyOf(state);
  d.seconds += 1;
  if (d.seconds % 10 === 0) { d.secondRolls += 1; d.tension = (d.tension + int(rngOf(state, 'world'), 10)) % 1000; }
}

function onHazard(state, bus, ev) {
  const d = dummyOf(state);
  d.incidents += 1;
  d.lastIncidentMs = ev.atMs;
  d.pendingAtMs = null;
  d.tension = (d.tension + 50 + int(rngOf(state, 'world'), 50)) % 1000;
  postHazard(state, ev.atMs);
}

function onHourly(state) {
  const d = dummyOf(state);
  d.hours += 1;
  d.tension = (d.tension * 3 + int(rngOf(state, 'world'), 1000)) % 1000;
}

/** The dummy world: a domain descriptor that replaces game.js's world stub (see the header). */
export const dummyWorld = Object.freeze({
  name: 'world', owner: 'TECH', keys: ['world'], idMaps: {}, idFields: {},
  init,
  fast: { second: secondStep },
  slow: [{ name: 'dummyWorld', step: slowStep, steady: (state) => steadyAt(state.clock.ms), nextChangeMs: (state, fromMs) => (Math.floor(fromMs / HOUR_MS) + 1) * HOUR_MS }],
  jobs: { dummyHazard: { run: onHazard }, dummyHourly: { every: 'hour@:47Z', prio: 5, run: onHourly } },
  events: { 'dummy-alarm': onAlarm },
  actions: {}, upgrades: [],
});

/** Tick i's input (see the header); hands: false leaves R out. */
export function scriptInput(i, { hands = true } = {}) {
  const act = [];
  if (i % 300 === 100) act.push('ready');
  if (i % 300 === 130) act.push(`digit:${1 + hashInt(3, 'digit', i)}`);
  if (hands && i % 2000 === 520) act.push('hand');
  const hx = hash01('mx', i >> 5), hz = hash01('mz', i >> 6), gait = hash01('gait', i >> 7);
  return { ...NO_INPUT, mx: hx < 0.35 ? -1 : hx > 0.65 ? 1 : 0, mz: hz < 0.3 ? -1 : hz > 0.7 ? 1 : 0, run: gait < 0.15, stroll: gait > 0.9, act };
}

/** What the dummy world did, for a test to print: { incidents, alarms, hours, steppedMin, unsteadySteps, seconds, tension }. */
export function dummyStats(state) {
  const d = state.world?.dummy;
  return d ? { incidents: d.incidents, alarms: d.alarms, hours: d.hours, steppedMin: d.steppedMs / MIN_MS, unsteadySteps: d.unsteadySteps, seconds: d.seconds, tension: d.tension } : null;
}
