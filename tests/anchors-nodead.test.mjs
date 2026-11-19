// test-anchors never dead-ends (the build sheet v0.0.24 §6, §8 F114, its numbers read three higher; the user, 2026-11-07: "a scene never dead-ends"): the keys bot on 40 seeds × the picker's five sheets and by T on the tier one, every course to its card with every station fired from its anchor, and the fuzz bot's 40 seeds to the card all the same (heavy).
import { assert } from './helpers.mjs';
import { anchorsBot, voidFuzzBot } from './bots/void.mjs';
import { anchorsRun } from './scene-anchors.test.mjs';
import { STATIONS } from '../src/sim/scenarios/anchors.js';
import { PICKER_TIERS } from '../src/sim/skills/templates.js';

/** The heavy seeds (40). */
export const SEEDS40 = Object.freeze(Array.from({ length: 40 }, (_, i) => (i === 0 ? 48213 : 3000 + i)));

export default [
  {
    name: 'anchors-nodead (F114): the keys bot on 40 seeds × the picker\'s five sheets, every course to its card, every station fired from the anchor it wants; T on the tier one the same',
    heavy: true,
    timeoutMs: 3_600_000,
    fn() {
      const bad = [], rows = {};
      for (const [mode, tiers] of [['keys', PICKER_TIERS], ['T', ['tierone']]]) for (const tier of tiers) {
        const tally = { done: 0, fired: 0, passed: 0, short: 0, towed: 0, hits: 0, rounds: 0, ticks: [] };
        for (const seed of SEEDS40) {
          const r = anchorsRun({ seed, tier, bot: anchorsBot({ mode }) });
          tally.ticks.push(r.ticks);
          if (r.done) tally.done++; else bad.push(`${mode} ${tier} ${seed}: not done (${r.N.phase} at station ${r.N.st + 1})`);
          for (const x of r.N.stations) {
            if (x.end === 'fired') tally.fired++; else if (x.end === 'passed') tally.passed++; else if (x.end === 'short') tally.short++;
            tally.hits += x.hits; tally.rounds += x.of; tally.towed += x.towed ?? 0;
            if (x.end === 'fired' && !x.anchors.includes(STATIONS[x.n - 1].want)) bad.push(`${mode} ${tier} ${seed} station ${x.n}: fired from ${x.anchors.join(', ')}`);
            if (x.end !== 'fired') bad.push(`${mode} ${tier} ${seed} station ${x.n}: ${x.end}`);
          }
        }
        const t = [...tally.ticks].sort((a, b) => a - b);
        rows[`${mode} ${tier}`] = tally;
        console.log(`      ${mode.padEnd(4)} ${tier.padEnd(8)} ${tally.done}/${SEEDS40.length} to the card; stations fired ${tally.fired}, short ${tally.short}, passed ${tally.passed}; the boat's tows ${tally.towed}; hits ${tally.hits} of ${tally.rounds}; ticks p50 ${t[t.length >> 1]}, max ${t.at(-1)}`);
      }
      assert(!bad.length, `${bad.length}: ${bad.slice(0, 12).join('; ')}`);
    },
  },
  {
    name: 'anchors-nodead (F114): the fuzz bot\'s 40 seeds as the private, each course to its card: no dead end, the cadre passing what it never reached',
    heavy: true,
    timeoutMs: 3_600_000,
    fn() {
      const bad = [], ends = {};
      for (const seed of SEEDS40) {
        const r = anchorsRun({ seed, tier: 'private', bot: voidFuzzBot({ seed }), maxTicks: 20 * 60 * 20 });
        if (!r.done) bad.push(`${seed}: not done (${r.N.phase} at station ${r.N.st + 1}, ${r.ticks} ticks)`);
        for (const x of r.N.stations) ends[x.end ?? 'none'] = (ends[x.end ?? 'none'] ?? 0) + 1;
        if (r.ids.invalid.length || r.ids.dangling.length) bad.push(`${seed}: ids`);
      }
      console.log(`      ${SEEDS40.length - bad.filter(b => /not done/.test(b)).length}/${SEEDS40.length} to the card; the stations' ends ${JSON.stringify(ends)}`);
      assert(!bad.length, `${bad.length}: ${bad.slice(0, 12).join('; ')}`);
    },
  },
];
