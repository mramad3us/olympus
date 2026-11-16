// OLYMPUS tests: F55, the causes over many lanes (the build sheet v0.0.20 §1 item 4, §8; card C1's heavy test).
//
// tests/flawless-card.mjs causeGauge: the honest tier one on the card's 40 seeds (101 to 140) and each other sheet's bot on six,
// from GO; prints the causes of every missed par by sheet and the one thing's keys; enforces F55: no par missed only by the click is
// FIRED FIRST, no T sheet whose rifle was up at the sighting is told the Watch, and the tier one clean on at least 80%.
import { assert } from './helpers.mjs';
import { causeGauge, CAUSE_SEEDS } from './flawless-card.mjs';
import { printGauge } from './flawless.mjs';

export default [
  {
    name: 'F55: no click-only miss is FIRED FIRST, no T sheet with its rifle up is told the Watch, and the honest tier one is clean on at least 80% of 40 seeds (0 of 20 on v0.0.19)',
    heavy: true,
    timeoutMs: 1_200_000,
    fn() {
      const g = causeGauge({ seeds: CAUSE_SEEDS });
      for (const l of g.lines) console.log(`      ${l}`);
      printGauge('the card (F55)', g.rows);
      assert(g.met, g.fails.join('\n'));
    },
  },
];
