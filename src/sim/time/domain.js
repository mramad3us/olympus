// OLYMPUS sim: TIME's domain, as the composition root registers it: its keys, its layers, its jobs, its events and its actions.
//
// TIME owns four of the state's keys (TECH §6.1): clock { ms, tick, holds, seq } (built by TECH in
// src/core/clock.js), events (the queue, src/core/queue.js), skip (the running skip, or null:
// ./skip.js) and time { chapter, voyage, pod, alarms, interrupts, liveSinceSaveMs, slowToMs, drills,
// doing, lead, resume, chain, attend, prefs }. slowToMs is the game time the slow contributors have been stepped to
// (game.js slowStep): every slow step spans [slowToMs, t] and moves it, the live minute layer's and a
// skip's alike, so lived and skipped play step each moment of game time once (TIME §5.5's parity).
// pod is the night posted (./pod.js), drills { open, last, forced } the alert drill, doing the
// activity under way (./doing.js), lead one waiting while the player lies down in sight before it
// (./activities.js), resume a cut one R may finish, chain several single actions at one fixture run
// behind one splash (./chain.js, 0.0.6), attend the arrivals at musters (the
// last 50), prefs the player's (prefs.mute: the S kinds muted, none this round), interrupts the S
// stops counted (./interrupts.js). What it does (the 0.0.2 sheet §2.1; the 0.0.4 sheet §2.2.9):
//   input        an activity lived at 1:1 (under 45 s: a drink, a bar) ends at its time, or is cut
//                by a move key at its fraction; a lead (time.lead: the page's R lay the player down
//                in sight before a sleep or a nap, ./activities.js) begins its activity once they
//                are down, and a move key before then takes it back (people/place.js backActor: up
//                again from the frame shown, the activity dropped); a move key while the player lies
//                or sits gets them up (people/place.js riseActor), as R and T do.
//   second       on each whole second lived (the fast layer 'second', live only, TECH §3.3), adds
//                1,000 ms to time.liveSinceSaveMs; at AUTOSAVE_LIVE_MS (five minutes of unpaused
//                live play, TIME §13) it asks an autosave ({ why: 'live' }) and starts again (the
//                sim resets the count when it asks, since the writer must not change the state:
//                TECH §7.4); then, while a drill is open, the muster check (./pod.js), a resume
//                forgotten past its time or its distance, and a chunk's "carry on" once time moved.
//   autosaveDay  a job at local@00:00 (the sol's first second after the slip, TIME §11.3), prio 5,
//                src 'time:autosave-day': asks an autosave ({ why: 'day' }), which the writer puts
//                in the day slot of a Standard career (TECH §7.4).
//   solDirector  a job at local@20:00 (CONTRACTS §5; TIME §9.8's sol director, this round only the
//                night): posts the night's taps, reveille and, on its drawn night, the alert drill
//                (./pod.js postNight). start(state) (a new game) and the upgrade 'time:pod' (a
//                v0.0.3 save) post tonight's too, so a game begun at 23:00 has its reveille.
//   events       taps, reveille, alert, alert-count, alert-end (./pod.js), activity-part (an
//                activity's part ended at its second: ./activities.js), chain-next (a chain's step
//                ended at its second, the next begun: ./chain.js).
//   actions      (G's ready and the digits moved to WEAPONS's domain at 0.0.5: src/sim/arms/domain.js
//                keeps v0.0.4's stub for a player with no rifle); skip:stop and skip:chunk: the player's commands to a running
//                skip, into skip.cmds at the clock, or, just after a chunked skip ended, 'carry on'
//                (the same activity again for its chunk: TIME §6.4), and while a chain runs
//                skip:stop is Backspace's "stop after this step" (./chain.js chainStop); activity ({
//                act: 'activity', args: { id, spotId, args, late, lead } }): an activity started (the
//                late card's answers, R held's menu sending one row, tests; lead: the page's, see
//                ./activities.js); chain ({ act: 'chain', args: { spotId, steps: [{ id, args }], late,
//                force } }): R held's menu sending two rows or more (./chain.js startChain). R is
//                places' `hand` (src/sim/places/hand.js).
// A choice or a skip is refused while a skip runs (TIME §5.3, check 1: not in stop motion).
import { isHeld } from '../../core/clock.js';
import { fillDomain } from '../../core/state.js';
import { playerActor } from '../../core/ids.js';
import { WAIT_MS } from '../../data/activities.js';
import { postNight, fillPod, onTaps, onReveille, onAlert, onAlertCount, onAlertEnd, musterCheck } from './pod.js';
import { startActivity, liveStep, leadStep, onActivityPart, resumeStep } from './activities.js';
import { startChain, onChainNext, chainStop } from './chain.js';
import { riseActor, backActor } from '../people/place.js';

export { WAIT_MS };
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
  if (t.drills?.open) musterCheck(state, bus);
  resumeStep(state);
  if (t.chunk && t.chunk.atMs !== state.clock.ms) delete t.chunk;          // (the strip's "carry on" passed: time has moved on)
}

// (the input layer: a lived activity's end or cut; a lead's activity once the player is down; a move key gets a lying or sitting player up)
function activityInput(state, input, bus, ctx) {
  if (state.time?.doing) { liveStep(state, input, bus); return; }
  if (state.time?.lead) {
    // (a move key while you lie down takes it back: up again from the frame shown, the activity dropped)
    if ((input?.mx || input?.mz) && !state.skip && !isHeld(state)) { delete state.time.lead; backActor(state, playerActor(state), state.clock.ms); return; }
    leadStep(state, bus, ctx); return;
  }
  if (state.skip || isHeld(state) || !(input?.mx || input?.mz)) return;
  const me = playerActor(state);
  if (me && (me.posture ?? 'stand') !== 'stand') riseActor(state, me, state.clock.ms);
}

// (skip:stop and skip:chunk into the running skip's commands; a chunk asked just after a chunked skip ended carries it on)
function skipCommand(state, action, bus, ctx) {
  const cmd = nameOf(action).slice(5);
  if (cmd !== 'stop' && cmd !== 'chunk') return;
  // (Backspace in a chain: stop after the running step, chain.js; kept in the commands, done, for the record)
  if (state.skip && cmd === 'stop' && state.skip.chain && state.time?.chain) { chainStop(state, bus); state.skip.cmds.push({ atMs: state.clock.ms, cmd, done: true }); return; }
  if (state.skip) { state.skip.cmds.push({ atMs: state.clock.ms, cmd }); return; }
  const c = state.time?.chunk;
  if (cmd === 'chunk' && c && c.atMs === state.clock.ms) {
    delete state.time.chunk;
    startActivity(state, bus, ctx, { id: c.activity, spotId: c.spotId ?? null, args: c.args ?? {} });
  }
}

// (R held's menu, two rows or more: one chain at one fixture)
function chainAction(state, action, bus, ctx) {
  const a = typeof action === 'object' ? action?.args ?? {} : {};
  if (!Array.isArray(a.steps) || !a.steps.length) return;
  startChain(state, bus, ctx, { spotId: a.spotId ?? null, steps: a.steps.map(s => ({ id: s.id, args: s.args ?? {} })), late: a.late ?? null, force: a.force ?? null });
}

function activityAction(state, action, bus, ctx) {
  const a = typeof action === 'object' ? action?.args ?? {} : {};
  if (!a.id) return;
  startActivity(state, bus, ctx, { id: a.id, spotId: a.spotId ?? null, args: a.args ?? {}, late: a.late ?? null, force: a.force ?? null, lead: !!a.lead });
}

/** A new game's night (a roster's): tonight's taps, reveille and drill posted. */
function start(state) { postNight(state, state.clock.ms); }

/** The upgrade of a v0.0.3 save (flag mig:time-pod): the night's records, and tonight posted. A save made since (time.pod.sol set, or no roster) is left as it is. */
function upgradePod(state) {
  if (!state.time) return;
  fillPod(state.time);
  if (Number.isFinite(state.time.pod?.sol) || state.flags?.['mig:time-pod']) return;
  if (postNight(state, state.clock?.ms ?? 0)) (state.flags ??= {})['mig:time-pod'] = true;
}

/** TIME's domain descriptor (TECH §2.5; the 0.0.2 build sheet, §2.1; the 0.0.4 sheet §2.2.9). */
export const timeDomain = Object.freeze({
  name: 'time',
  owner: 'TIME',
  keys: KEYS,
  idMaps: Object.freeze({}),
  idFields: Object.freeze({ 'skip.where': 'place' }),
  init(state) {
    for (const k of KEYS) fillDomain(state, k);
    state.time.interrupts ??= { perSol: 0, perSkip: 0 };
    fillPod(state.time);
  },
  start,
  fast: Object.freeze({ input: activityInput, second: secondStep }),
  slow: Object.freeze([]),
  jobs: Object.freeze({
    autosaveDay: Object.freeze({ every: 'local@00:00', prio: 5, run: (state, bus) => askAutosave(state, bus, 'day') }),
    solDirector: Object.freeze({ every: 'local@20:00', prio: 5, run: (state) => postNight(state, state.clock.ms) }),
  }),
  events: Object.freeze({ taps: onTaps, reveille: onReveille, alert: onAlert, 'alert-count': onAlertCount, 'alert-end': onAlertEnd, 'activity-part': onActivityPart, 'chain-next': onChainNext }),
  actions: Object.freeze({ skip: skipCommand, activity: activityAction, chain: chainAction }),
  upgrades: Object.freeze([['time:pod', upgradePod]]),
});
