// OLYMPUS tests: the shoot house's "flawless" gauges by the keys and the fuzz (heavy; COMBAT §25.19.8 F1, F2, F7, F8, F11, F14, F17, F19, F21; R9 of §25.19.10).
//
// The recruit and the private walk the lane by the keys (tests/bots/house.mjs houseKeysBot: their grain, step by step), 100
// seeds each and seed 48213 against the routed v0.0.12 figures (F21: no watering down); T alone below rung 2 leaves them
// out of stop motion for the keys, printed as F11's grain; the fuzz bot (houseFuzzBot) on 10 seeds of every sheet holds
// that each fault it earns is evidenced, recomputed independently (F8: the 3-D capsule, the feet), and that nothing
// dead-ends. Failing criteria: each fails once tests/flawless.mjs ENFORCED names it, and from R9 (2026-11-13) every one does.
import { assert } from './helpers.mjs';
import { flawlessSeeds, flawlessLane, laneSet, gaugeOf, printGauge, failing, keysGauge, SHEETS, ENFORCED } from './flawless.mjs';

export default [
  {
    name: 'the recruit and the private by the keys over 100 seeds and on 48213 against the routed v0.0.12 figures, T alone below rung 2 on 10, and the fuzz bot on 10 seeds of every sheet: each criterion printed (failing criteria: every one enforced from R9)',
    heavy: true,
    timeoutMs: 40 * 60_000,
    fn() {
      const keys = laneSet({ sheets: ['recruit', 'private'], seeds: flawlessSeeds(100), bot: 'keys' });
      const on48213 = ['recruit', 'private'].map(tier => flawlessLane({ tier, seed: 48213, bot: 'keys' }));
      const grain = laneSet({ sheets: ['recruit', 'private'], seeds: flawlessSeeds(10), bot: 'honest' });
      const fuzz = laneSet({ sheets: SHEETS, seeds: flawlessSeeds(10), bot: 'fuzz' });
      const rows = [...gaugeOf([...keys, ...grain, ...fuzz]).filter(r => ['F1', 'F2', 'F3', 'F4', 'F7', 'F8', 'F11', 'F14', 'F17', 'F19'].includes(r.id)), keysGauge(keys, on48213)];
      printGauge(`the keys ${keys.length} lanes, T below rung 2 ${grain.length}, the fuzz ${fuzz.length} (ENFORCED: ${[...ENFORCED].join(', ') || 'none yet'})`, rows);
      printGauge('the keys alone', gaugeOf(keys).filter(r => ['F1', 'F2', 'F4', 'F7', 'F14', 'F17', 'F19'].includes(r.id)));
      printGauge('the fuzz alone', gaugeOf(fuzz).filter(r => ['F1', 'F2', 'F4', 'F8', 'F11', 'F14'].includes(r.id)));
      assert(keys.length === 200 && fuzz.length === 60, `${keys.length} keys lanes, ${fuzz.length} fuzz`);
      const f = failing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
];
