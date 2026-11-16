// OLYMPUS tests: the shoot house's "flawless" gauges, the quick cut (COMBAT §25.19.8; R9 of §25.19.10): the data's paths and names, then three seeds of the tier one by the honest bot and of the private by the keys, every criterion printed.
//
// The user's rule (2026-11-11, scoring "Stack and clear" 25/25/25): the shoot house is the pilot for the whole game, and the
// AI clears it flawlessly. These are gauges first (tests/flawless.mjs): each criterion prints its value against its
// threshold and says MET or OPEN, and fails once flawless.mjs ENFORCED names it (from R9, 2026-11-13, every criterion). The
// full 100 seeds of every sheet are house-flawless (the T sheets), house-flawless-keys (the keys and the fuzz) and
// house-flawless-more (the #2's admin, the stoppage, the reference room, the saves), all heavy.
// v0.0.21 (the build sheet v0.0.21 §1 item 26, §0 item 45; the perf lens P5): the lanes cut from ten seeds to three, the user's
// 1489397426, 48213 and 1037 (six lanes), so the file stays inside the quick suite's CPU budget; the ten seeds are house-flawless'
// heavy case "ten seeds … (heavy)", unchanged, so a filter on its name still finds it.
import { assert } from './helpers.mjs';
import { flawlessSeeds, laneSet, gaugeOf, printGauge, failing, flawlessPaths, flawlessNames, keysGauge, ENFORCED } from './flawless.mjs';

/** The quick cut's seeds (v0.0.21): the user's, the bench's and the second of flawlessSeeds. */
export const QUICK_SEEDS = Object.freeze([1489397426, 48213, 1037]);

export default [
  {
    name: 'the data (F3, F16): every authored path leg by leg on the C0 grid, and the catalogue\'s rows naming a lane or a house, printed (failing criteria: every one enforced from R9)',
    fn() {
      const p = flawlessPaths(), names = flawlessNames();
      console.log(`      F3  ${p.cut.length ? 'OPEN' : 'MET '} the authored paths: ${p.cut.length} of ${p.legs} legs not clear on the C0 grid, ${p.cut.filter(c => c.walker).length} by the walker's rule too${p.cut.length ? `: ${p.cut.map(c => `${c.what} ${JSON.stringify(c.from)}→${JSON.stringify(c.to)}${c.walker ? '' : ' (grid only)'}`).join('; ')}` : ''}`);
      console.log(`      F16 ${names.length ? 'OPEN' : 'MET '} the catalogue: ${names.join(', ') || 'nothing names a lane or a house'}`);
      assert(p.legs > 0, 'no authored path read');
      assert(!(ENFORCED.has('F3') && p.cut.length) && !(ENFORCED.has('F16') && names.length), JSON.stringify({ cut: p.cut.slice(0, 3), names }));
    },
  },
  {
    name: 'three seeds (the user\'s 1489397426, 48213 and 1037; the ten are house-flawless\' heavy case from v0.0.21): the tier one by the honest bot (T and the shot the line names, nothing else) and the private by the keys, every criterion F1 to F24 the lanes measure printed against its threshold (failing criteria: every one enforced from R9)',
    timeoutMs: 120_000,
    fn() {
      const seeds = QUICK_SEEDS;
      const recs = [...laneSet({ sheets: ['tierone'], seeds, bot: 'honest' }), ...laneSet({ sheets: ['private'], seeds, bot: 'keys' })];
      const rows = [...gaugeOf(recs), keysGauge(recs)];
      printGauge(`the gauges over ${recs.length} lanes (ENFORCED: ${[...ENFORCED].join(', ') || 'none yet'})`, rows);
      assert(recs.length === 6 && recs.every(r => !r.err), JSON.stringify(recs.filter(r => r.err).map(r => [r.tier, r.seed, r.err])));
      const f = failing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
];
