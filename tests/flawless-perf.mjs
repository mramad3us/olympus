// OLYMPUS tests: F60, the shoot house's busiest tick of the sim within CLAUDE.md's budget (the build sheet v0.0.21 §8; perf lens P4; COMBAT §25.19.8's gauges).
//
//   F60  the house's busiest tick, each tick's own cost the least of TICK_RUNS 3 runs of the same lane (tests/tick-costs.mjs),
//        at most TICK_BUDGET_MS 2 ms × the machine's factor, and a tick on a minute boundary at most twice that (TECH §16.1's own
//        row: 4 ms there), on every sheet, the kit's, the live and (once the drawn house merges) the drawn lanes and the fuzz.
//
// The clauses, by the lanes they hold (the build sheet §8: enforced at once but for the fuzz's, which B's route budget brings in;
// printed until then):
//   quick  the tier one by T and the private by the keys on 48213 (house-tick-budget, quick)
//   sheets every sheet on 48213 and 1489397426 by its bot (the recruit and the private by the keys), the kit's three loadouts by
//          the kit bot, the live lanes (house-tick-budget-more, heavy)
//   fuzz   the fuzz bot on six seeds (printed only until B's route budget; enforced from v0.0.21's B: F60_FUZZ_ENFORCED)
// Measured at stage 0 (k 1.00 on a shared machine): v0.0.20's snapshot 3.17 and 2.18 ms on the quick lanes (the step panel built
// two to four times an evaluation, the body deep-copied for every roll); with the read scope 1.34 and 1.07 ms.
import { tickCosts, costLine, TICK_RUNS } from './tick-costs.mjs';
import { TICK_BUDGET_MS } from './helpers.mjs';

/**
 * Whether F60's fuzz clause is enforced (false until B's route budget, the build sheet §8). True from v0.0.21's B (combat/route.js:
 * no search for a way that is not there, and the tick's budget): the six fuzz lanes' busiest ticks 0.93 to 1.53 ms at k 1.00 (the
 * sergeant on 1037 was 5.11 ms at stage 0, his #2's stepOffPath expanding 51,294 route nodes in one tick).
 */
export const F60_FUZZ_ENFORCED = true;
/** A tick on a minute boundary's budget, as a multiple of TICK_BUDGET_MS (TECH §16.1: 4 ms there). */
export const MINUTE_K = 2;

const SHEETS6 = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
const keysOf = (tier) => (tier === 'recruit' || tier === 'private' ? 'keys' : 'honest');
/** F60's lanes by clause (see the header). */
export const F60_LANES = Object.freeze({
  quick: [{ tier: 'tierone', seed: 48213, bot: 'honest' }, { tier: 'private', seed: 48213, bot: 'keys' }],
  sheets: SHEETS6.flatMap(tier => [48213, 1489397426].map(seed => ({ tier, seed, bot: keysOf(tier) }))),
  kit: [{ tier: 'tierone', seed: 48213, bot: 'kit:flash', loadout: 'flash' }, { tier: 'tierone', seed: 48213, bot: 'kit:breach', loadout: 'breach' }, { tier: 'tierone', seed: 48213, bot: 'kit:both', loadout: 'full' }],
  live: [{ tier: 'tierone', seed: 48213, opfor: 'live:fight,hide' }, { tier: 'tierone', seed: 48213, opfor: 'live:fight,give' }, { tier: 'tierone', seed: 48213, opfor: 'live:give,give' },
    { tier: 'sgt', seed: 48213, opfor: 'live' }, { tier: 'private', seed: 48213, opfor: 'live' }, { tier: 'raider', seed: 1037, opfor: 'live' }],
  // (v0.0.21's integration: the drawn house's four lanes, A's handoff: the tier one on three seeds and the private by the keys)
  drawn: [{ tier: 'tierone', seed: 48213, bot: 'honest', draw: 'drawn' }, { tier: 'tierone', seed: 1489397426, bot: 'honest', draw: 'drawn' }, { tier: 'tierone', seed: 1037, bot: 'honest', draw: 'drawn' }, { tier: 'private', seed: 48213, bot: 'keys', draw: 'drawn' }],
  fuzz: [[1037, 'sgt'], [1185, 'recruit'], [1074, 'sgt'], [3101, 'private'], [1222, 'sgt'], [2813, 'cpl']].map(([seed, tier]) => ({ tier, seed, bot: 'fuzz' })),
});

/** Each lane of a clause timed: [{ lane, c }] (c: tickCosts'), printed one line each. */
export function f60Run(lanes, { k = 1, print = true, runs = TICK_RUNS } = {}) {
  return lanes.map(lane => { const c = tickCosts(lane, { runs }); if (print) console.log(`      ${costLine(lane, c, k)}`); return { lane, c }; });
}

/** F60's row over timed lanes (the fuzz's printed beside, enforced only with F60_FUZZ_ENFORCED). */
export function f60Row(timed, { k = 1, fuzz = [] } = {}) {
  // (each lane against its own k, read around its timed runs: tick-costs.mjs; at least the suite's)
  const kOf = (x) => Math.max(k, x.c.k ?? 1), lim = TICK_BUDGET_MS * k, limMin = MINUTE_K * TICK_BUDGET_MS * k;
  const over = (x) => x.c.maxMs > TICK_BUDGET_MS * kOf(x) || x.c.minuteMaxMs > MINUTE_K * TICK_BUDGET_MS * kOf(x);
  const bad = [...timed, ...(F60_FUZZ_ENFORCED ? fuzz : [])].filter(over);
  const worst = timed.reduce((a, x) => (!a || x.c.maxMs > a.c.maxMs ? x : a), null), fw = fuzz.reduce((a, x) => (!a || x.c.maxMs > a.c.maxMs ? x : a), null);
  const name = (x) => `${x.lane.bot ?? 'honest'} ${x.lane.tier} ${x.lane.seed}${x.lane.loadout ? ` ${x.lane.loadout}` : ''}${x.lane.opfor ? ` ${x.lane.opfor}` : ''}${x.lane.draw ? ` ${x.lane.draw}` : ''}`;
  return {
    id: 'F60', name: 'the house\'s busiest tick of the sim (each tick the least of three runs)',
    met: timed.length > 0 && !bad.length,
    value: `${timed.length} lanes: busiest ${worst ? `${worst.c.maxMs.toFixed(2)} ms (${name(worst)}, tick ${worst.c.top[0]?.tick})` : '-'}, on a minute at most ${Math.max(0, ...timed.map(x => x.c.minuteMaxMs)).toFixed(2)} ms; lanes' k ${Math.min(...timed.map(kOf)).toFixed(2)} to ${Math.max(...timed.map(kOf)).toFixed(2)}; over: ${bad.length ? bad.map(x => `${name(x)} ${x.c.maxMs.toFixed(2)} at k ${kOf(x).toFixed(2)}`).join(', ') : 'none'}${fuzz.length ? `; the fuzz (${F60_FUZZ_ENFORCED ? 'enforced' : 'printed, enforced from B\'s route budget'}): ${fuzz.length} lanes, busiest ${fw.c.maxMs.toFixed(2)} ms (${name(fw)}), ${fuzz.filter(over).length} over` : ''}`,
    target: `at most ${TICK_BUDGET_MS} ms × each lane's k (${lim.toFixed(2)} at the suite's ${k.toFixed(2)}), ${limMin.toFixed(2)} on a minute boundary`,
  };
}

/** F60's row printed as the gauges print theirs (six spaces in, "[enforced]": F60 is enforced from stage 0). */
export function printF60(head, row) {
  console.log(`      ${head}`);
  console.log(`      ${row.id.padEnd(3)} ${row.met ? 'MET ' : 'OPEN'} ${row.name}: ${row.value} (target ${row.target}) [enforced]`);
}
