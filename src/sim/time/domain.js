// OLYMPUS sim: TIME's domain, as the composition root registers it: its keys, its per-second layer, its jobs and its actions.
//
// TIME owns four of the state's keys (TECH §6.1): clock { ms, tick, holds, seq } (built by TECH in
// src/core/clock.js), events (the queue, src/core/queue.js), skip (the running skip, or null:
// ./skip.js) and time { chapter, voyage, pod, alarms, interrupts, liveSinceSaveMs, slowToMs }.
// slowToMs is the game time the slow contributors have been stepped to (game.js slowStep): every
// slow step spans [slowToMs, t] and moves it, the live minute layer's and a skip's alike, so lived
// and skipped play step each moment of game time once (TIME §5.5's parity; null on an older save,
// where the first step takes its own start). What it does in this round, the skeleton's (the 0.0.2
// build sheet, §2.1):
//   second       on each whole second lived (the fast layer 'second', live only, TECH §3.3), adds
//                1,000 ms to time.liveSinceSaveMs; at AUTOSAVE_LIVE_MS (five minutes of unpaused
//                live play, TIME §13) it asks an autosave ({ why: 'live' }) and starts again. The
//                sim resets the count when it asks, since the writer must not change the state
//                (TECH §7.4).
//   autosaveDay  a job at local@00:00 (the sol's first second after the slip, TIME §11.3), prio 5,
//                src 'time:autosave-day': asks an autosave ({ why: 'day' }), which the writer puts
//                in the day slot of a Standard career (TECH §7.4).
//   actions      ready (G): time stands still for a choice, 'ready' held until a digit; digit:<n>:
//                the choice made, time runs again (TIME's stop-motion hook, a stub until WEAPONS's
//                step panel at 0.0.6); skip:stop and skip:chunk: the player's commands to a running
//                skip, into skip.cmds at the clock. R left this table at 0.0.3: it is PLACES's `hand`,
//                what's at hand (a door within reach, else the wait of WAIT_MS, fifteen minutes, an
//                outcome skip with mask D: src/sim/places/hand.js; the build sheet 0.0.3 §8 item 15).
// A choice or a skip is refused while a skip runs (TIME §5.3, check 1: not in stop motion).
import { holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { fillDomain } from '../../core/state.js';

/** R's wait where no door is at hand (0.0.1's; PLACES's hand.js reads it). */
export const WAIT_MS = 900_000;
/** Live play between autosaves, in game time (TIME §13). */
export const AUTOSAVE_LIVE_MS = 300_000;

const KEYS = Object.freeze(['clock', 'events', 'skip', 'time']);
const nameOf = (action) => (typeof action === 'string' ? action : action?.act ?? '');

/** Ask for an autosave (TIME §13's triggers): the live count starts again, the writer hears { why }. */
export function askAutosave(state, bus, why) {
  if (state.time) state.time.liveSinceSaveMs = 0;
  bus.emit('autosave', { why });
}

function secondStep(state, input, bus) {
  if (state.clock.ms % 1000 !== 0) return;
  const t = state.time;
  t.liveSinceSaveMs = (t.liveSinceSaveMs ?? 0) + 1000;
  if (t.liveSinceSaveMs >= AUTOSAVE_LIVE_MS) askAutosave(state, bus, 'live');
}

function ready(state, action, bus) {
  if (state.skip || isHeld(state, 'ready')) return;
  holdTime(state, 'ready');
  bus.emit('line', { text: 'Weapon ready: time stands still until you choose (a digit).' });
}

function digit(state, action, bus) {
  if (!isHeld(state, 'ready')) return;
  releaseTime(state, 'ready');
  bus.emit('line', { text: `Choice ${nameOf(action).slice(6)}: time runs again.` });
}

function skipCommand(state, action) {
  const cmd = nameOf(action).slice(5);
  if (!state.skip || (cmd !== 'stop' && cmd !== 'chunk')) return;
  state.skip.cmds.push({ atMs: state.clock.ms, cmd });
}

/** TIME's domain descriptor (TECH §2.5; the 0.0.2 build sheet, §2.1). */
export const timeDomain = Object.freeze({
  name: 'time',
  owner: 'TIME',
  keys: KEYS,
  idMaps: Object.freeze({}),
  idFields: Object.freeze({ 'skip.where': 'place' }),
  init(state) {
    for (const k of KEYS) fillDomain(state, k);
    state.time.interrupts ??= { perSol: 0, perSkip: 0 };
  },
  fast: Object.freeze({ second: secondStep }),
  slow: Object.freeze([]),
  jobs: Object.freeze({
    autosaveDay: Object.freeze({ every: 'local@00:00', prio: 5, run: (state, bus) => askAutosave(state, bus, 'day') }),
  }),
  actions: Object.freeze({ ready, digit, skip: skipCommand }),
  upgrades: Object.freeze([]),
});
