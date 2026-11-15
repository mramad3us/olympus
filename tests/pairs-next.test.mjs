// After the first man of a string falls, the DI's "Next" names a row the panel has and T aims at him (the fixer's of 0.0.16: in
// test-pairs and "Three bangs", on every sheet, "He is down. Next: the rifle, lane one." came with no act and no row, T showed
// "nothing now", the aim stayed held on the man who fell and only Q or D then Enter went on, named nowhere: three times a
// course in all 18 courses of the play review). F24's rule on the bay: every DI line names a row the panel has, live.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { pairsNow } from '../src/sim/scenarios/pairs.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { stepsOf } from '../src/sim/arms/shooting.js';

// (a course by its bot: every choose stop whose line is pairs-contact's "Next" (its words or its short), its act and row checked against the panel)
function nextStops(tier, seed, setup = null) {
  const g = createGame({ scenario: 'test-pairs', seed, tier, setup }), s = g.state, bot = pairsBot();
  let lastMs = null, n = 0;
  const bad = [], seen = [];
  for (; n < 20 * 60 * 20 && !pairsNow(s)?.end; n++) {
    g.step(1, bot); g.clearFacts?.();
    const S = s.stop;
    if (S?.mode !== 'stop' || S.phase !== 'choose' || S.reflex || s.clock.ms === lastMs) continue;
    const L = instinctNow(s).line;
    if (!L || L.id !== 'pairs-contact' || L.short !== 'Next') continue;
    lastMs = s.clock.ms;
    const steps = stepsOf(s, s.clock.ms), m = /^stop:aim>(.+)$/.exec(L.act ?? '');
    const row = m ? steps.find(st => st.id === 'aim' && st.target === m[1] && !st.off) : null;
    const ok = !!row && L.row === 'aim' && /Aim: [^.]+\.$/.test(L.text);
    seen.push(L.text);
    if (!ok) bad.push({ text: L.text, act: L.act, row: L.row, aim: S.aim?.key ?? null, pick: S.pick, steps: steps.filter(st => /^(aim|hold|fire)$/.test(st.id)).map(st => `${st.id}>${st.target ?? ''}${st.off ? `[${st.off}]` : ''}`) });
  }
  return { tier, seed, setup, end: !!pairsNow(s)?.end, seen, bad };
}

export default [
  {
    name: 'test-pairs and Three bangs: every "Next" after a man falls names the aim row and its key, and T aims at the next man (the play review of 2026-11-15)',
    fn() {
      const runs = [['recruit', 48213], ['private', 1037], ['tierone', 1111], ['private', 48213, 'bangs']].map(([t, sd, su]) => nextStops(t, sd, su));
      for (const r of runs) console.log(`      ${r.tier} ${r.seed}${r.setup ? ` ${r.setup}` : ''}: to the card ${r.end}, "Next" stops ${r.seen.length}, naming no live aim row ${r.bad.length}; e.g. "${r.seen[0] ?? ''}"`);
      for (const r of runs) {
        assert(r.end, JSON.stringify({ tier: r.tier, seed: r.seed, end: r.end }));
        assert(r.seen.length >= 1, JSON.stringify({ tier: r.tier, seed: r.seed, why: 'the course never reached a Next stop: the check covers nothing' }));
        assert(!r.bad.length, JSON.stringify(r.bad.slice(0, 3)));
      }
    },
  },
];
