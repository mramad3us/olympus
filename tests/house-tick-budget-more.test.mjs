// OLYMPUS tests: F60 on every lane of the house (heavy; the build sheet v0.0.21 §6 stage 0, §8 F60; perf lens P4).
//
// Every sheet on 48213 and 1489397426 by its bot, the kit's three loadouts by the kit bot, the live lanes (the four modes of
// v0.0.19's role-players), each tick the least of three runs (tests/tick-costs.mjs): the busiest at most TICK_BUDGET_MS × k
// (4 ms × k on a minute boundary). The fuzz on six seeds is printed beside it (F60's fuzz clause comes with B's route budget:
// flawless-perf.mjs F60_FUZZ_ENFORCED). The drawn house's four lanes (F60_LANES.drawn) joined at A's merge (v0.0.21's integration).
import { assert, machineK } from './helpers.mjs';
import { F60_LANES, f60Run, f60Row, printF60 } from './flawless-perf.mjs';

export default [
  {
    name: 'F60 (heavy): every sheet on 48213 and 1489397426, the kit\'s three loadouts, the live lanes and four drawn lanes, the busiest tick at most 2 ms × k (4 on a minute boundary), each tick the least of three runs; the fuzz on six seeds printed (enforced from B\'s route budget)',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const k = machineK();
      const timed = f60Run([...F60_LANES.sheets, ...F60_LANES.kit, ...F60_LANES.live, ...F60_LANES.drawn], { k }), fuzz = f60Run(F60_LANES.fuzz, { k });
      const row = f60Row(timed, { k, fuzz });
      printF60('F60 on every lane', row);
      assert(row.met, JSON.stringify({ value: row.value, k }));
    },
  },
];
