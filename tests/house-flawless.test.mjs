// OLYMPUS tests: the shoot house's "flawless" gauges over 100 seeds (heavy; COMBAT §25.19.8; R9 of §25.19.10): the corporal, the sergeant, the Raider and the tier one by the honest bot, every criterion printed.
//
// The honest bot (tests/bots/house.mjs houseHonestBot) presses T and the shot the DI's line names on a man of his own,
// nothing else; where that leaves it nothing to press it writes a dead end and falls back so the measure goes on. Seed 0
// is the user's 1489397426, then 1000 + 37i, at setup 'go'. Each criterion prints its value and threshold, MET or OPEN,
// and fails once tests/flawless.mjs ENFORCED names it (from R9, 2026-11-13, every criterion). The recruit and
// the private are house-flawless-keys' (their grain is by the keys); the rest of §25.19.8 is house-flawless-more's.
// v0.0.21: and the ten seeds of the tier one by T and the private by the keys, moved here from house-flawless-quick (which keeps
// three), word for word but its name's "(heavy)".
import { assert } from './helpers.mjs';
import { flawlessSeeds, laneSet, gaugeOf, printGauge, failing, keysGauge, T_SHEETS, ENFORCED } from './flawless.mjs';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';

/** Seeds a sheet (COMBAT §25.19.8: 100). */
export const SEEDS_N = 100;

export default [
  {
    name: 'a hundred seeds of every sheet T plays (the corporal to the tier one) by the honest bot: walls, bodies, doorways, the first round, the feet, corners, faults, sectors, pars, dead ends, "Carry on" after a row, stops, hangs, lane times, names, the #2 at his slot and drawn walking, the DI\'s rows, each printed against its threshold (failing criteria: every one enforced from R9)',
    heavy: true,
    timeoutMs: 40 * 60_000,
    fn() {
      const recs = laneSet({ sheets: T_SHEETS, seeds: flawlessSeeds(SEEDS_N), bot: 'honest' });
      const rows = gaugeOf(recs);
      printGauge(`the gauges over ${recs.length} lanes (ENFORCED: ${[...ENFORCED].join(', ') || 'none yet'})`, rows);
      // (each sheet alone: the rows its rung is held to (F5, F6 from rung 3), the stops and the lane time the tier one's)
      for (const tier of T_SHEETS) {
        const ids = ['F4', 'F8', 'F9', 'F10', 'F11', 'F12', 'F14', 'F17', ...(RUNG_OF_TIER[tier] >= 3 ? ['F5', 'F6'] : []), ...(tier === 'tierone' ? ['F13', 'F15'] : [])];
        printGauge(`${tier} alone`, gaugeOf(recs.filter(r => r.tier === tier)).filter(r => ids.includes(r.id)));
      }
      assert(recs.length === T_SHEETS.length * SEEDS_N, `${recs.length} lanes`);
      const f = failing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'ten seeds (seed 0 the user\'s 1489397426, then 1000 + 37i): the tier one by the honest bot (T and the shot the line names, nothing else) and the private by the keys, every criterion F1 to F24 the lanes measure printed against its threshold (failing criteria: every one enforced from R9) (heavy: moved from house-flawless-quick in v0.0.21)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const seeds = flawlessSeeds(10);
      const recs = [...laneSet({ sheets: ['tierone'], seeds, bot: 'honest' }), ...laneSet({ sheets: ['private'], seeds, bot: 'keys' })];
      const rows = [...gaugeOf(recs), keysGauge(recs)];
      printGauge(`the gauges over ${recs.length} lanes (ENFORCED: ${[...ENFORCED].join(', ') || 'none yet'})`, rows);
      assert(recs.length === 20 && recs.every(r => !r.err), JSON.stringify(recs.filter(r => r.err).map(r => [r.tier, r.seed, r.err])));
      const f = failing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
];
