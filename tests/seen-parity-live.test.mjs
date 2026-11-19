// OLYMPUS tests: the Seen record agrees with the stage on the live lane's quick cell (F85, F86, F97; tests/flawless-seen.mjs; the build sheet v0.0.23 §6 A, §8).
//
// seen-parity's second half, a file of its own so each stays inside a quick file's CPU budget: the live lane's quick cell (the sergeant
// by T on 48213, live:fight,hide), where the role-players aim, sit when hit and give up, so the record's role-player frames are held to
// the stage's on every tick. The boot recruit's live lane on 1 by the keys ran here too until the review of 2026-11-18 measured the
// file at its CPU edge (3.1 s in the pool, 3.6 s at load 7, against 3 s × k): it adds no hold or pose the sergeant's lane lacks (sit
// 5,512 against 4,388, rifle-slung 251 against 1), so it runs in seen-parity's heavy case with the other 27.
import { assert } from './helpers.mjs';
import { liveCells, pinCells, laneRun, report, QUICK_LIVE_LANES } from './seen-parity.test.mjs';

export default [
  {
    name: 'the record agrees with the stage on the live lane (F85, F86, F97): its quick cell, the sergeant by T on 48213; every tick, every man and stand, the role-players\' frames; the stage\'s look keys as recorded; the lane held to its pin (the boot recruit\'s live lane: seen-parity\'s heavy case)',
    timeoutMs: 120_000,
    fn() {
      const all = [...pinCells(), ...liveCells()], cells = QUICK_LIVE_LANES.map(n => all.find(c => c.name === n));
      assert(cells.every(Boolean), JSON.stringify(QUICK_LIVE_LANES));
      report(cells.map(laneRun));
    },
  },
];
