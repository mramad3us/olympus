// OLYMPUS tests: the house's gauges on the Wreck, every sheet (v0.0.25, "Hold to hold"; its build sheet §8 F132, heavy).
//
// zerocqb-quick's hold (WRECK_ENFORCED met, WRECK_OPEN printed with their causes) over every sheet on 48213, 1037 and 1074: the T
// sheets (the corporal to the tier one) by T, the boot recruit and the private by the keys, eighteen lanes.
import { holdWreck } from './zerocqb-quick.test.mjs';
import { WRECK_SHEETS, T_SHEETS, wreckSeeds } from './flawless-wreck.mjs';

export default [
  {
    name: 'F132: the house\'s F1, F2, F6, F9, F10, F14 and F26 met on the Wreck on every sheet on 48213, 1037 and 1074 (T from the corporal, the keys below)',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const lanes = WRECK_SHEETS.flatMap(tier => wreckSeeds(3).map(seed => ({ tier, seed, bot: T_SHEETS.includes(tier) ? 'honest' : 'keys' })));
      holdWreck('F132 on the Wreck, every sheet, 3 seeds', lanes);
    },
  },
];
