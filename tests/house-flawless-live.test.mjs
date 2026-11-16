// OLYMPUS tests: the shoot house's gauges on the live lane, "Stack and clear, live" (COMBAT §25.18, §25.19.8; the build sheet v0.0.19 §8; tests/flawless-live.mjs), heavy: every sheet, three seeds with their drawn cards, and three forced card pairs.
//
// The user's rule (2026-11-11, scoring "Stack and clear" 25/25/25: the AI clears the house flawlessly) holds with men who fire
// back: F1 to F26 are tests/flawless.mjs's own, three read the live lane's way and declared on their rows (F15 against
// LIVE_LANE_MAX_S 120 s, F21 and F22 printed only, a casualty's lane measured over the legs it reached); F38 to F44 are the live
// men's (perception honest, no round on a man believed down or given up, every man accounted for at "Clear!", the interrupts,
// role-players as bodies, the figure as the sim, the balance by sheet). Any of them failing fails the suite (LIVE_ENFORCED).
import { assert } from './helpers.mjs';
import { printGauge, ENFORCED, flawlessSeeds } from './flawless.mjs';
import { liveLanes, liveGaugeOf, liveFailing, LIVE_ENFORCED } from './flawless-live.mjs';

export default [
  {
    name: 'v0.0.19: F1 to F26 hold on the live lane over the honest bot (the keys\' below rung 2), every sheet, 3 seeds with their drawn cards and 3 forced card pairs; F15 within LIVE_LANE_MAX_S 120 s; F38 to F44 the live men\'s',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const recs = liveLanes({ seeds: flawlessSeeds(3) });
      const rows = liveGaugeOf(recs);
      printGauge(`the live lane's gauges over ${recs.length} lanes (ENFORCED: ${ENFORCED.size} criteria, LIVE_ENFORCED ${LIVE_ENFORCED.size})`, rows);
      assert(recs.length === 36 && recs.every(r => !r.err && r.done), JSON.stringify(recs.filter(r => r.err || !r.done).map(r => [r.tier, r.seed, r.opfor, r.err, r.end])));
      const f = liveFailing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
];
