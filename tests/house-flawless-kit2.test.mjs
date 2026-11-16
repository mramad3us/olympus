// OLYMPUS tests: the shoot house's gauges on the second slice's lanes (kit2 §6 test 38, §7; the build sheet 0.0.19 §8; tests/flawless-kit.mjs), heavy: every sheet, three seeds, the frag, conc, cut and mixed loadouts by the honest kit bot, the shoot lanes for F32; the kit's fuzz over the new device states.
//
// The user's rule (2026-11-11): the AI clears the house flawlessly, and that holds with the kit in the stack's hands. F1 to F26
// are tests/flawless.mjs's own (F15 against KIT_LANE_MAX_S 120 and F6 on a charge's leg read as v0.0.18's kit gauges read them,
// declared on their rows); F27 widened to every grenade kind, F29 to a charge left placed; F30 to F33 the second slice's
// (tests/flawless-kit.mjs kit2Rows). The shoot lanes (the closet's lock shot) are F32's alone: the closet opened is one room more
// to clear, never read against F1 to F29 (kit2's test 38 names the frag, conc, cut and mixed loadouts).
import { assert } from './helpers.mjs';
import { printGauge, ENFORCED, flawlessSeeds } from './flawless.mjs';
import { kitLanes, kitGaugeOf, kitFailing, kitFuzz, KIT_ENFORCED, KIT2_USES, fragSeeds } from './flawless-kit.mjs';

export default [
  {
    name: 'F1 to F33 hold on the frag, conc, cut and mixed loadouts over the honest kit bot (the keys\' below rung 2), every sheet, 3 seeds and 2 more where room 1 is hostiles only; F15 within KIT_LANE_MAX_S 120 s; F27 on every grenade kind; F30 no man of the stack in a read, F31 no frag or concussion fault, F32 the ballistic breach (the shoot lanes), F33 a practice grenade on the floor at most 2.5 s from the sergeant up',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      // (the three seeds hold no room hostiles only, so two that do are added: the frags and concussions thrown, F30, F31 and F33 read)
      const seeds = [...flawlessSeeds(3), ...fragSeeds(2)], recs = kitLanes({ uses: KIT2_USES, seeds });
      console.log(`      seeds ${seeds.join(', ')} (${fragSeeds(2).join(', ')} with room 1 hostiles only)`);
      const rows = kitGaugeOf(recs);
      printGauge(`the second slice's gauges over ${recs.length} lanes (ENFORCED: ${[...ENFORCED, ...KIT_ENFORCED].length} criteria)`, rows);
      assert(recs.length === KIT2_USES.length * 6 * seeds.length && recs.every(r => !r.err && r.done) && rows.find(r => r.id === 'F30').value.startsWith(`${recs.filter(r => r.kit !== 'shoot').reduce((n, r) => n + r.reads.length, 0)} reads`) && recs.some(r => r.reads.length), JSON.stringify(recs.filter(r => r.err || !r.done).map(r => [r.kit, r.tier, r.seed, r.err, r.end])));
      const f = kitFailing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'the kit\'s fuzz over the second slice (the practice grenades, the cut, the mixed and the shot breach\'s rows, the device rows and the variants pressed at random through the house fuzz): every lane to its card, no page error, no device left burning or live on a door',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const out = kitFuzz({ uses: ['frag', 'conc', 'cut', 'mixed'] });
      for (const o of out) console.log(`      ${o.use} ${o.tier.padEnd(8)} ${o.seed}: ${o.done ? 'card' : 'NOT DONE'} ${o.end} ${o.laneS} s, bursts ${o.bursts}, burning at the end ${o.left}, live on the floor or a door ${o.lying}, charges left and made safe ${o.marked}; kit rows ${Object.entries(o.kitSteps).map(([k, v]) => `${k.replace(/>.*$/, '').replace(/@.*$/, '')} ${v}`).join(', ') || 'none'}`);
      assert(out.every(o => o.done && !o.errors && !o.left && !o.lying), JSON.stringify(out.filter(o => !o.done || o.errors || o.left || o.lying)));
    },
  },
];
