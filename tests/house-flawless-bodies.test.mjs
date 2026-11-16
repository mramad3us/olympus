// OLYMPUS tests: the bodies and the line's gauges over the lanes (v0.0.20, the build sheet v0.0.20 §6 and §8; heavy): F45 to F49 (tests/flawless-bodies.mjs) on three seeds (the user's 1489397426, then 1000 + 37i) by the honest bot on every T sheet and the keys bot on the boot recruit and the private, and the fuzz bot on every sheet, every criterion printed against its threshold; F1 to F26 untouched (tests/flawless.mjs).
import { assert } from './helpers.mjs';
import { printGauge } from './flawless.mjs';
import { bodiesLanes, bodiesGauge, bodiesFailing, BODIES_ENFORCED } from './flawless-bodies.mjs';

export default [
  {
    name: 'F45 to F49, the bodies and the line: no walk held over 2 s and Backspace ends a held one, your #2 routed round you or calling and the DI saying why, no round through a teammate, your #2 on your heels within 2 s, the pair in the hall (enforced at once; the build sheet v0.0.20 §8)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const lanes = bodiesLanes(3, 3), rows = bodiesGauge(lanes);
      printGauge(`the bodies' gauges over ${lanes.length} lanes (enforced: ${[...BODIES_ENFORCED].join(', ')})`, rows);
      const f = bodiesFailing(rows);
      assert(lanes.every(l => l.done) && !f.length, f.join(' | ') || JSON.stringify(lanes.filter(l => !l.done).map(l => [l.tier, l.seed, l.bot])));
    },
  },
];
