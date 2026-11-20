// OLYMPUS tests: "The window and the canopy" never dead-ends, F171 to F174 (the build sheet v0.0.28 §6 B, §8; the user, 2026-11-07: "a scene never dead-ends").
//
// Five sheets (the picker's) × the keys, T, the panel (the keys with the show clears by the step panel, the review of v0.0.28 B) and the fuzz
// × ten seeds chosen so the lanes meet the slip and the short count (printed: how many lanes met each), each to its card
// (tests/flawless-armoury.mjs laneOf): F171 0 stuck and every honest lane ending 'clear', the longest printed; F172 the slip never carried past
// the rank's check; F173 at every declaration issued = fired + back + held + losses (the short count found counted as such); F174 on the honest
// lanes the brass policed equal to fired and none left.
import { assert } from './helpers.mjs';
import { lanesOf, gauges } from './flawless-armoury.mjs';
import { seedWith } from './armoury-world.mjs';

const SHEETS = Object.freeze(['recruit', 'private', 'sgt', 'raider', 'tierone']);
// (ten seeds: the first with each pair of the two draws, then the next ones from 1)
function seeds() {
  const out = new Set([48213, seedWith(d => d.slip && d.short), seedWith(d => d.slip && !d.short), seedWith(d => !d.slip && d.short), seedWith(d => d.air === 'gusty')]);
  for (let s = 1; out.size < 10; s++) out.add(s);
  return [...out];
}

export default [
  {
    name: 'F171 to F174 (heavy): 5 sheets × the keys, T, the panel and the fuzz × 10 seeds to the card, 0 stuck, every honest lane clear; the slip never past the check; the issue\'s identity at every declaration, the fault \'count\' only on a short carton signed uncounted; the honest lanes\' brass equal to fired',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const S = seeds(), lanes = lanesOf(SHEETS, ['keys', 'T', 'panel', 'fuzz'], S), G = gauges(lanes);
      const met = { slip: lanes.filter(l => l.slip).length, short: lanes.filter(l => l.short).length, far: lanes.filter(l => l.far).length };
      for (const bot of ['keys', 'T', 'panel', 'fuzz']) {
        const L = lanes.filter(l => l.bot === bot), real = L.map(l => l.realMin).sort((a, b) => a - b);
        console.log(`      ${bot}: ${L.length} lanes, ${L.filter(l => l.done).length} to the card; real min median ${real[real.length >> 1].toFixed(2)}, max ${real.at(-1).toFixed(2)}; faults ${L.reduce((t, l) => t + l.faults.length, 0)}`);
      }
      console.log(`      seeds ${S.join(' ')}; lanes meeting the slip ${met.slip}, the short count ${met.short}, far cases ${met.far}; the longest ${G.longest.bot}/${G.longest.tier}/${G.longest.seed} ${G.longest.realMin.toFixed(2)} real min`);
      for (const k of ['F171', 'F172', 'F173', 'F174']) console.log(`      ${k}: ${G[k].length} off${G[k].length ? ` (${G[k].slice(0, 4).map(l => `${l.bot}/${l.tier}/${l.seed}${k === 'F173' ? ` ${JSON.stringify(l.sums)}` : k === 'F174' ? ` ${JSON.stringify(l.brass)}` : ''}`).join(', ')})` : ''}`);
      assert(!G.F171.length && !G.F172.length && !G.F173.length && !G.F174.length && met.slip && met.short, JSON.stringify({ F171: G.F171.length, F172: G.F172.length, F173: G.F173.length, F174: G.F174.length, met }));
    },
  },
];
