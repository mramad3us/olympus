// OLYMPUS sim: WEAPONS' domain, as game.js composes it in place of the skeleton's stub (TECH §2.5; the build sheet 0.0.5 §2.6, §8 item 9).
//
// WEAPONS owns three of the state's keys (TECH §6.1): stop (stop motion, src/sim/arms/shooting.js; null
// outside it), items (one record per item, src/sim/arms/kit.js) and armoury { guns, ammoIssues, range }
// (the range session, src/sim/scenarios/handling.js). init fills each exactly as the stub did (null, {},
// { guns: {}, ammoIssues: [] }), so a gunless game (the sandbox, a career's barracks: no rifle this
// round) saves byte for byte as v0.0.4's and a v0.0.4 save loads unchanged (no upgrade). It adds to the
// tick (TECH §3.1):
//   input    stopInput: the steps' boundaries (runs while time stands still), and out of the mode a
//            move key stands a kneeling or prone player;
//   rules    one contributor, in this order: stopRules (the aim's turn, the facing held to the muzzle),
//            carry.js habitStep (the carry habit against everyone near), handling.js rangeRules (range
//            safety's verdicts);
//   second   handling.js rangeSecond (live only: the range officer watches the line and gives the next
//            command);
//   events   'range-cmd' (the tower's commands: handling.js onRangeCmd);
//   actions  ready (G): with a rifle on the player, into the mode with the rifle up (enterStop); with
//            none, v0.0.4's stub unchanged (time held for 'ready', the line "Weapon ready: time stands
//            still until you choose (a digit)."), moved here from TIME's domain; digit:<n> releases
//            'ready' and nothing else (v0.0.4's: the line "Choice <n>: time runs again."); shoot (X):
//            into the mode, or out of it while choosing or in a chained wait; stop ({ act: 'stop', args: { step, tempo,
//            target, keep } }, or 'stop:<step>'): chooseStep, a reflex's answer ('reflex:<key>') and the
//            brackets ('pick:±1'); carry (V) and stance (A, W: 'stance:up' | 'stance:down' |
//            'stance:<stance>'): a step in the mode, a live step out of it.
// Its id fields: items' and armoury.guns' keys are item ids; kit.worn, kit.hands, a gun's mag, a
// container's holds, stop.gun and the things lying on a site's ground (places.sites.<site>.items[].id,
// kit.js lyingOf) hold them.
// 0.0.7 (the build sheet 0.0.7 §2.7): test-range's KD course (src/sim/scenarios/range.js) adds to the tick:
//   actors   range.js kdActors: the corpsman's run and care, then the relay (gunner.js gunnerStep: each gunner's
//            next sub-step on the tower's command), lived only;
//   rules    range.js safety after handling.js rangeRules (which keeps test-handling's verdicts): range safety in
//            full on the KD (the cold line, forward of the line, the muzzle over people, the ND's rule);
//   events   'pit' (range.js onPitEvent: a carrier down, marked, up, the disk);
//   actions  kd:police, kd:turnIn, kd:declare (range.js kdAct: the player's range actions at their commands);
// and its id fields the relay's rifles and magazines (armoury.range.relay[].gunId, .magIds[]) and the dummy's
// magazine (armoury.range.dummy.magId).
// 0.0.8 (the build sheet 0.0.8 §2.6): test-pairs' pairs course (src/sim/scenarios/pairs.js) adds to the actors layer, after
// kdActors, pairsActors (lived: the coach's walk, the turn armed, disarmed and taken, the string's time), and its id fields
// the session's named magazines (armoury.range.mags{}, the short one named for Top up: armoury.range.wantMag).
import { fillDomain } from '../../core/state.js';
import { holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { playerId } from '../../core/ids.js';
import { enterStop, chooseStep, stopInput, stopRules, carryAction, stanceAction, gunOn } from './shooting.js';
import { habitStep } from './carry.js';
import { onRangeCmd, rangeRules, rangeSecond } from '../scenarios/handling.js';
import { onPitEvent, safety, kdActors, kdAct } from '../scenarios/range.js';
import { pairsActors } from '../scenarios/pairs.js';

const KEYS = Object.freeze(['stop', 'items', 'armoury']);
const nameOf = (action) => (typeof action === 'string' ? action : action?.act ?? '');
const argsOf = (action) => (typeof action === 'object' ? action?.args ?? {} : {});

// (G: with a rifle, intent; with none, v0.0.4's stub, word for word)
function ready(state, action, bus) {
  const pid = playerId(state);
  if (gunOn(state, pid)) { if (!state.stop && !isHeld(state)) enterStop(state, bus, { pid, via: 'ready' }); return; }
  if (state.skip || isHeld(state, 'ready')) return;
  holdTime(state, 'ready');
  bus.emit('line', { text: 'Weapon ready: time stands still until you choose (a digit).' });
}

function digit(state, action, bus) {
  if (!isHeld(state, 'ready')) return;
  releaseTime(state, 'ready');
  bus.emit('line', { text: `Choice ${nameOf(action).slice(6)}: time runs again.` });
}

// (X: into the mode, or out of it while choosing or in a chained wait, which X cuts as any step does: the
// integrator's, played by the keys: X after LOAD did nothing while the wait for the tower ran)
function shoot(state, action, bus) {
  if (state.stop?.mode === 'stop') { chooseStep(state, bus, { step: 'leave' }); return; }
  const pid = playerId(state);
  if (gunOn(state, pid) && !isHeld(state)) enterStop(state, bus, { pid, via: 'shoot' });
}

// (a step chosen: { act: 'stop', args: { step, tempo, target, keep } }, or 'stop:<step>')
function stop(state, action, bus, ctx) {
  const name = nameOf(action), a = argsOf(action);
  const step = a.step ?? (name.length > 5 ? name.slice(5) : null);
  if (!step) return;
  chooseStep(state, bus, { step, tempo: a.tempo ?? 'normal', target: a.target ?? null, keep: !!a.keep }, ctx);
}

function carry(state, action, bus) { carryAction(state, bus); }

// (0.0.7: the KD's range actions, 'kd:<id>' (police, turnIn, declare))
function kd(state, action, bus, ctx) {
  const name = nameOf(action), id = argsOf(action).id ?? (name.length > 3 ? name.slice(3) : null);
  if (id) kdAct(state, bus, id, ctx);
}

function stance(state, action, bus) {
  const name = nameOf(action), a = argsOf(action);
  const dir = a.to ?? a.dir ?? (name.length > 7 ? name.slice(7) : 'down');
  stanceAction(state, bus, dir);
}

// (the rules layer's one contributor: stop motion's, the carry habit's, the range's, in that order)
function rules(state, input, bus, ctx) {
  stopRules(state, input, bus, ctx);
  habitStep(state, input, bus, ctx);
  rangeRules(state, input, bus, ctx);
  safety(state, input, bus, ctx);
}

/** WEAPONS' domain descriptor (see the header). */
export const weaponsDomain = Object.freeze({
  name: 'weapons',
  owner: 'WEAPONS',
  keys: KEYS,
  idMaps: Object.freeze({ items: 'i', 'armoury.guns': 'i' }),
  idFields: Object.freeze({ 'people{}.kit.worn{}': 'i', 'people{}.kit.hands[]': 'i', 'items{}.mag': 'i', 'items{}.holds[]': 'i', 'stop.gun': 'i', 'places.sites{}.items[].id': 'i',
    'armoury.range.relay[].gunId': 'i', 'armoury.range.relay[].magIds[]': 'i', 'armoury.range.dummy.magId': 'i', 'armoury.range.mags{}': 'i', 'armoury.range.wantMag': 'i' }),
  init(state) { for (const k of KEYS) fillDomain(state, k); },
  fast: Object.freeze({ input: stopInput, actors: (s, i, b, c) => { kdActors(s, i, b, c); pairsActors(s, i, b); }, rules, second: rangeSecond }),
  slow: Object.freeze([]),
  jobs: Object.freeze({}),
  events: Object.freeze({ 'range-cmd': onRangeCmd, pit: onPitEvent }),
  actions: Object.freeze({ ready, digit, shoot, stop, carry, stance, kd }),
  upgrades: Object.freeze([]),
});
