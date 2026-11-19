// OLYMPUS tests: no dead end on the Wreck (v0.0.25 "Hold to hold", its build sheet §1 item 1, §8 F125's second part; heavy).
//
// tests/flawless-wreck.mjs' dead-end rule over 40 seeds × the six sheets (T from the corporal, the keys below) and the fuzz on 40 seeds
// × three sheets: every lane to the card by the lane's due (585 s), never ended by 'time', no floating body with nothing to push from
// (freefall.js pushFrom on 8 bearings), no marine of the lane between the decks, no brace never let go, no error. "A hatch left
// between decks" is printed (apartAtEnd: a compartment the stall passed may leave one of you behind the trunk), not counted: a marine
// left in the trunk itself is `between`. The Tests menu's switch (scenes.js `menu`) waits on this suite and F124.
import { assert } from './helpers.mjs';
import { wreckLane, deadEnds, laneLine, WRECK_SHEETS, wreckSeeds } from './flawless-wreck.mjs';

const SEEDS = 40, FUZZ_SHEETS = ['private', 'sgt', 'tierone'];

function sweep(lanes) {
  const bad = [], by = {};
  for (const L of lanes) {
    const { rec } = wreckLane(L), d = deadEnds(rec), k = `${L.bot} ${L.tier}`;
    const b = (by[k] ??= { n: 0, clear: 0, passed: 0, dead: 0, apart: 0, max: 0 });
    b.n++; if (rec.why === 'clear') b.clear++; else b.passed++; if (d.length) b.dead++; if (rec.apartAtEnd) b.apart++; b.max = Math.max(b.max, rec.laneS ?? 0);
    if (d.length) { bad.push(laneLine(rec)); console.log(`      ${laneLine(rec)}`); }
  }
  for (const [k, b] of Object.entries(by)) console.log(`      ${k.padEnd(16)} ${b.n} lanes: clear ${b.clear}, passed ${b.passed}, dead ${b.dead}, apart at the end ${b.apart}, longest ${b.max} s`);
  return bad;
}

export default [
  {
    name: 'F125: 40 seeds on each of the six sheets (T from the corporal, the keys below), every Wreck lane to the card with no dead end',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const bad = sweep(WRECK_SHEETS.flatMap(tier => wreckSeeds(SEEDS).map(seed => ({ tier, seed, bot: 'honest' }))));
      assert(!bad.length, `${bad.length} dead: ${bad.slice(0, 4).join(' | ')}`);
    },
  },
  {
    name: 'F125: the fuzz on 40 seeds at the private, the sergeant and the tier one, every Wreck lane to the card with no dead end',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const bad = sweep(FUZZ_SHEETS.flatMap(tier => wreckSeeds(SEEDS).map(seed => ({ tier, seed, bot: 'fuzz' }))));
      assert(!bad.length, `${bad.length} dead: ${bad.slice(0, 4).join(' | ')}`);
    },
  },
  {
    name: 'F125: the tests\' starts (setups trunk, hold and tug) by T on the corporal, the sergeant, the raider and the tier one, 5 seeds each: every lane to the card, no dead end, never ended by \'time\' and no \'corner\' (the review of C and D: from \'hold\' and \'tug\' T looked at r3:sw again and again until the hold was passed by \'time\')',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const bad = [];
      for (const setup of ['trunk', 'hold', 'tug']) for (const tier of ['cpl', 'sgt', 'raider', 'tierone']) {
        const recs = wreckSeeds(5).map(seed => wreckLane({ tier, seed, bot: 'honest', setup }).rec);
        const off = recs.filter(r => deadEnds(r).length || r.why === 'time' || r.faults.includes('corner'));
        console.log(`      ${setup.padEnd(5)} ${tier.padEnd(7)} ${recs.length} lanes: ${recs.map(r => `${r.why} ${r.laneS} s${r.faults.length ? ` [${r.faults.join(',')}]` : ''}`).join(', ')}`);
        bad.push(...off.map(r => `${setup} ${laneLine(r)} faults ${r.faults.join(',')}`));
      }
      assert(!bad.length, `${bad.length}: ${bad.slice(0, 4).join(' | ')}`);
    },
  },
];
