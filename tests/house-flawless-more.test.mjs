// OLYMPUS tests: the shoot house's "flawless" gauges that are not one lane's watch (heavy; COMBAT §25.19.8 F18, F20, F22, F23; R9 of §25.19.10).
//   - F18 the #2's admin: every sheet on 5 seeds from the fill (no setup), his rifle's condition after each tower command
//     (LOAD, MAKE READY, Stop, UNLOAD SHOW CLEAR) within his macro's time, and the steps his record shows;
//   - F20 the stoppage: the stoppage bot (the honest bot with the reflex card's answer forced) on every sheet T plays, each
//     of the design's answers (§25.19.6), until it has gone unoffered 5 lanes running, then 100 seeds where it is offered;
//   - F22 the reference room: the tier one's room 1 to his own "Clear!" on 48213 and 20 seeds, against 5.27 s ±15%;
//   - F23 determinism: the honest tier one on 3 seeds, a save at every stop (and inside a suspended flow), each carried on to
//     the card byte for byte against the unbroken run.
// Failing criteria: each fails once tests/flawless.mjs ENFORCED names it, and from R9 (2026-11-13) every one does.
import { assert } from './helpers.mjs';
import { flawlessSeeds, flawlessAdmin, stoppageRun, refRoom, saveRun, adminGauge, stoppageGauge, refGauge, saveGauge, printGauge, failing, SHEETS, T_SHEETS, STOPPAGE_ANSWERS, ENFORCED } from './flawless.mjs';

export default [
  {
    name: 'the #2\'s admin (F18), the stoppage\'s answers (F20), the operator\'s room against doctrine (F22) and a save at every stop carried on byte for byte (F23), each printed against its threshold (failing criteria: every one enforced from R9)',
    heavy: true,
    timeoutMs: 40 * 60_000,
    fn() {
      const admin = SHEETS.flatMap(tier => flawlessSeeds(5).map(seed => flawlessAdmin({ tier, seed })));
      const stops = T_SHEETS.flatMap(tier => STOPPAGE_ANSWERS.map(answer => stoppageRun({ tier, seeds: flawlessSeeds(100), answer })));
      const ref = [48213, ...flawlessSeeds(20)].map(seed => refRoom({ tier: 'tierone', seed }));
      const saves = flawlessSeeds(3).map(seed => saveRun({ tier: 'tierone', seed }));
      const rows = [adminGauge(admin), stoppageGauge(stops), refGauge(ref), saveGauge(saves)];
      printGauge(`(ENFORCED: ${[...ENFORCED].join(', ') || 'none yet'})`, rows);
      assert(admin.length === 30 && saves.every(s => s.saves > 0), JSON.stringify({ admin: admin.length, saves: saves.map(s => s.saves) }));
      const f = failing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
];
