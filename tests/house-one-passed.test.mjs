// OLYMPUS tests: a room passed at the door is taught as one (v0.0.23, its build sheet item 11, carried FH-2; COMBAT §25.10).
//
// The T-only recruit and private never cross a door below the corporal (the keys walk them in): on 48213 all three rooms pass
// from 'open' (the door open, never crossed), and v0.0.22's card said "Too slow through the rooms. The same drill, quicker hands."
// (`time`, 3 × 15) beside "NO-GO. A threat left standing.": the lesson missed the one thing that went wrong. From v0.0.23 stall's
// two passes write L.passWhy (shoothouse.js passWhyOf: 'stack', 'door', 'room'; the hall none), legView carries it, and the one
// thing weighs a room passed at its open door PASS_DOOR_W 75 (at its stack 40, inside 30), worded below rung 2 by the keys' way in
// ('passed:doorKeys'). A standing threat in a room passed at the door is the pass's consequence and no longer counted. The verdict
// line is unchanged. The corporal's honest lane (T takes him through) passes no room and keeps its own lesson.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { runHouse } from './bots/house.mjs';
import { runSheetOf, passWhyOf, PASS_DOOR_W } from '../src/sim/scenarios/shoothouse.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';

// (the honest bot's lane from the fill to the card: its legs' states and whys, the one thing, the verdict)
function lane(tier, seed = 48213) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier });
  const r = runHouse(g, botOf('honest', { seed }), { maxMs: 30 * 60_000 });
  const H = g.state.armoury.range.house, sheet = runSheetOf(g.state);
  return { done: r.done, legs: [...H.rooms, H.hall].map(L => ({ state: L.state, why: L.passWhy ?? null })), one: sheet.one, verdict: sheet.verdict?.words ?? null, why: passWhyOf };
}

export default [
  {
    name: 'the honest recruit on 48213 passes rooms 1 to 3 at their open doors: each leg\'s passWhy \'door\', the one thing \'passed:door\' in the keys\' words ("You stood at an open door. …"), the verdict unchanged; the corporal\'s honest lane passes nothing and keeps its own lesson (v0.0.22: "Too slow through the rooms.")',
    fn() {
      const rec = lane('recruit'), cpl = lane('cpl');
      console.log(`      recruit 48213: ${rec.legs.map(L => `${L.state}${L.why ? `/${L.why}` : ''}`).join(' ')}; one "${rec.one.key}" ${rec.one.score} "${rec.one.text}"; "${rec.verdict}"`);
      console.log(`      corporal 48213: ${cpl.legs.map(L => `${L.state}${L.why ? `/${L.why}` : ''}`).join(' ')}; one "${cpl.one.key}" "${cpl.one.text}"`);
      assert(rec.done && rec.legs.slice(0, 3).every(L => L.state === 'passed' && L.why === 'door') && rec.legs[3].why === null, JSON.stringify(rec.legs));
      assert(rec.one.key === 'passed:door' && rec.one.score === 3 * PASS_DOOR_W && HOUSE_CHIEF.one['passed:doorKeys'].includes(rec.one.text) && /standing/i.test(rec.verdict ?? ''), JSON.stringify(rec.one));
      assert(cpl.done && cpl.legs.every(L => L.why === null && L.state === 'clear') && !String(cpl.one.key).startsWith('passed:'), JSON.stringify({ legs: cpl.legs, one: cpl.one }));
    },
  },
  {
    name: 'passWhyOf reads a leg passed by where it stood: \'stack\' (ahead or stacked), \'door\' (open), \'room\' (entered), none for the hall (a leg passed by v0.0.22, with no passWhy, keeps `time`: game-upgrade\'s door save)',
    fn() {
      const rows = [['ahead', 'r1'], ['stacked', 'r1'], ['open', 'r1'], ['entered', 'r1'], ['open', 'hall'], ['clear', 'r1']].map(([state, door]) => [state, door, passWhyOf({ state, door })]);
      console.log(`      ${rows.map(([s, d, w]) => `${d} ${s}: ${w}`).join('; ')}`);
      assert(rows.map(r => r[2]).join(',') === 'stack,stack,door,room,,', JSON.stringify(rows));
    },
  },
];
