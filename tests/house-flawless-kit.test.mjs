// OLYMPUS tests: the shoot house's gauges on the kit's lanes (COMBAT §25.19.8, §25.20; the build sheet 0.0.18 §5.3; tests/flawless-kit.mjs), heavy: every sheet, three seeds, the flash and the breach loadouts.
//
// The user's rule (2026-11-11, scoring "Stack and clear" 25/25/25): the AI clears the house flawlessly, and that holds with the
// kit in the stack's hands (the user, 2026-11-15: "breaching options and equipment ... and grenades ... and a loadout screen").
// F1 to F26 are tests/flawless.mjs's own, with two read the kit's way and declared on the gauge's rows: F15 against the kit's
// lane band (KIT_LANE_MAX_S, the build sheet's), and F6 on a charge's leg from #1 back on his stack after the blast (not the
// sheet's: the lead's call, tests/flawless-kit.mjs's header). F27 to F29 are the kit's. The kit's fuzz is printed, its lanes
// to their card with no device live at the end.
import { assert } from './helpers.mjs';
import { printGauge, ENFORCED, flawlessSeeds } from './flawless.mjs';
import { kitLanes, kitGaugeOf, kitFailing, kitFuzz, KIT_ENFORCED } from './flawless-kit.mjs';

export default [
  {
    name: 'F1 to F26 hold on the flash and breach loadouts over the honest kit bot (the keys\' below rung 2), every sheet, 3 seeds; F15 within KIT_LANE_MAX_S 120 s; F27 BANG TO ENTRY at most 2 s from the corporal up, F28 nobody of the stack over 27.6 kPa at a fire, F29 no device live or held at the lane\'s end',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const recs = kitLanes({ seeds: flawlessSeeds(3) });
      const rows = kitGaugeOf(recs);
      printGauge(`the kit's gauges over ${recs.length} lanes (ENFORCED: ${[...ENFORCED, ...KIT_ENFORCED].length} criteria)`, rows);
      assert(recs.length === 36 && recs.every(r => !r.err && r.done), JSON.stringify(recs.filter(r => r.err || !r.done).map(r => [r.kit, r.tier, r.seed, r.err, r.end])));
      const f = kitFailing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'the kit\'s fuzz (kit rows, the device rows and the variants pressed at random through the house fuzz): every lane to its card, no page error, no device left burning or live on a door (a charge left there marked and made safe)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const out = kitFuzz();
      for (const o of out) console.log(`      ${o.use} ${o.tier.padEnd(8)} ${o.seed}: ${o.done ? 'card' : 'NOT DONE'} ${o.end} ${o.laneS} s, bursts ${o.bursts}, burning at the end ${o.left}, live on the floor or a door ${o.lying}, charges left and made safe ${o.marked}; kit rows ${Object.entries(o.kitSteps).map(([k, v]) => `${k.replace(/>.*$/, '').replace(/@.*$/, '')} ${v}`).join(', ') || 'none'}`);
      // (no device live at the end at all: a charge left on its door is the instructor's to make safe, and marked (the review of
      // 2026-11-16: five of six breach lanes ended with a charge live on an open door, printed and not failed))
      assert(out.every(o => o.done && !o.errors && !o.left && !o.lying), JSON.stringify(out.filter(o => !o.done || o.errors || o.left || o.lying)));
    },
  },
];
