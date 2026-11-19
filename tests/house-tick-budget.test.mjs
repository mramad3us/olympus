// OLYMPUS tests: the sim's busiest tick in the shoot house within 2 ms (CLAUDE.md's rule of the code; the build sheet v0.0.21 §1 item 13, §6 stage 0, §8 F60; perf lens P1, P4).
//
// The tier one by T (the honest bot) and the private by the keys, both on 48213, each tick the least of three runs after a warm
// one (tests/tick-costs.mjs), the busiest at most TICK_BUDGET_MS × the machine's factor and a tick on a minute boundary at most
// twice that. It fails on v0.0.20's tree (3.17 and 2.18 ms, measured at stage 0: the step panel built by the instinct's two
// rule sets in one evaluation, the body deep-copied for every roll) and passes with the read scope (src/core/reads.js: 1.34 and
// 1.07 ms). The heavy file house-tick-budget-more holds every sheet, the kit's and the live lanes and prints the fuzz's.
// v0.0.26's stage 0 (its build sheet §2 step 3; the carried lens §4.2 item 4): the quick case plays the tier one by T alone, the
// busiest lane (2,938 ticks); the keys private on 48213 is held by house-tick-budget-more, whose sheets (F60_LANES.sheets) play him
// in every full run. The file was 3.0 to 3.5 s of CPU against its 3 s; the threshold, TICK_RUNS and the warm run are unchanged.
import { assert, machineK } from './helpers.mjs';
import { F60_LANES, f60Run, f60Row, printF60 } from './flawless-perf.mjs';

export default [
  {
    name: 'F60 (quick): the tier one by T on 48213 (the keys private\'s lane in house-tick-budget-more\'s sheets), the busiest tick of the sim, each tick the least of three runs, at most 2 ms × the machine\'s factor (4 on a minute boundary); fails on v0.0.20 (3.17 ms)',
    timeoutMs: 120_000,
    fn() {
      const lanes = F60_LANES.quick.filter(L => L.tier === 'tierone' && L.bot === 'honest');
      assert(lanes.length === 1 && F60_LANES.sheets.some(L => L.tier === 'private' && L.seed === 48213 && L.bot === 'keys'), JSON.stringify({ quick: F60_LANES.quick }));
      const k = machineK(), timed = f60Run(lanes, { k }), row = f60Row(timed, { k });
      printF60('F60 on the quick lanes', row);
      assert(row.met, JSON.stringify({ value: row.value, k }));
    },
  },
];
