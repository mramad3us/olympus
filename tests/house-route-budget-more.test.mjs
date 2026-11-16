// OLYMPUS tests: the #2's routing storm, the sweep (heavy; the build sheet v0.0.21 §1 item 14, §6 B, §8 F68): the fuzz bot on twelve seeds of every sheet from GO, every tick's route nodes counted with the fix and without it ($routeFree), and the honest and keys lanes' ends unmoved.
//
// One case a sheet (seeds ROUTE_SEEDS, 1000 to 1011: 72 lanes in all, each played twice, about 4 minutes on the user's Mac). Each
// lane, with the fix: at most ROUTE_NODES_TICK nodes in any tick, under LANE_NODES_MAX in the lane, to its card; and its end the same
// to the byte as without the fix (route.js's regions are the search's own answer, and the budget never bit on them). Measured on
// v0.0.20's tree without the fix: 43 of the 72 over 8,000 nodes in a tick, the most 88,808 (the sergeant on 1002), the worst lane
// 199,033; with it the most 4,104 in a tick and the worst lane 33,134. The last case holds the tier one by T and the private by the
// keys on 48213 (house-pin's quick cell and its keys lane) to their ends without the fix.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { runHouse } from './bots/house.mjs';
import { ROUTE_NODES_TICK } from '../src/sim/combat/route.js';

/** The seeds a sheet (my call: the sweep the fix was measured on). */
export const ROUTE_SEEDS = Object.freeze([1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011]);
/** The worst fuzz lane's route nodes (the build sheet §8 F68). */
export const LANE_NODES_MAX = 200_000;
const SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);

/** One lane from GO (or from the fill: setup null), its route nodes a tick (one route.js record a tick), its end: { most, at, total, ticks, done, digest }. */
export function routeLane({ tier, seed, bot = 'fuzz', setup = 'go', free = false }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, ...(setup === null ? {} : { setup }) });
  if (free) g.state.$routeFree = true;
  const recs = new Set();
  const r = runHouse(g, botOf(bot, { seed }), { each: (gg) => { if (free) gg.state.$routeFree = true; if (gg.state.$route) recs.add(gg.state.$route); } });
  let most = 0, at = -1, total = 0;
  for (const R of recs) { total += R.nodes; if (R.nodes > most) { most = R.nodes; at = R.seq; } }
  return { most, at, total, ticks: r.ticks, done: r.done, digest: g.digest() };
}

const sweep = (tier) => () => {
  const rows = ROUTE_SEEDS.map(seed => ({ seed, off: routeLane({ tier, seed, free: true }), on: routeLane({ tier, seed }) }));
  for (const { seed, off, on } of rows) console.log(`      the ${tier} on ${seed}: without the fix ${off.most} nodes in a tick at most (loop tick ${off.at}), ${off.total} in the lane; with it ${on.most} (${on.at}), ${on.total}; ${on.ticks} ticks, ${on.done ? 'to the card' : 'NO CARD'}, the end ${on.digest === off.digest ? 'the same' : 'DIFFERENT'}`);
  const over = rows.filter(r => r.off.most > ROUTE_NODES_TICK).length, worst = Math.max(...rows.map(r => r.on.total)), most = Math.max(...rows.map(r => r.on.most));
  console.log(`      the ${tier}: ${over} of ${rows.length} lanes over ${ROUTE_NODES_TICK} in a tick without the fix (the most ${Math.max(...rows.map(r => r.off.most))}); with it the most ${most} in a tick and ${worst} in a lane (bounds ${ROUTE_NODES_TICK}, ${LANE_NODES_MAX})`);
  assert(rows.every(r => r.on.done && r.off.done), `a lane short of its card: ${rows.filter(r => !r.on.done || !r.off.done).map(r => r.seed).join(', ')}`);
  assert(most <= ROUTE_NODES_TICK && worst < LANE_NODES_MAX, JSON.stringify({ most, worst }));
  assert(rows.every(r => r.on.digest === r.off.digest), `the fix moved a lane: ${rows.filter(r => r.on.digest !== r.off.digest).map(r => r.seed).join(', ')}`);
};

export default [
  ...SHEETS.map(tier => ({
    name: `F68 (heavy): the ${tier}'s fuzz on twelve seeds from GO, at most 8,000 route nodes in a tick and under 200,000 in a lane, every lane to its card and its end the same as without the fix`,
    heavy: true,
    timeoutMs: 600_000,
    fn: sweep(tier),
  })),
  {
    name: 'the honest tier one by T and the private by the keys on 48213 from GO end the same to the byte without the fix (the regions and the budget move no route of theirs)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      for (const L of [{ tier: 'tierone', seed: 48213, bot: 'honest' }, { tier: 'private', seed: 48213, bot: 'keys' }]) {
        const off = routeLane({ ...L, free: true }), on = routeLane(L);
        console.log(`      the ${L.tier} by ${L.bot}: ${on.ticks} ticks, ${on.digest} (without the fix ${off.digest}); route nodes the most ${on.most} in a tick (${off.most} without), ${on.total} in the lane (${off.total})`);
        assert(on.digest === off.digest && on.ticks === off.ticks && on.done, JSON.stringify({ on, off }));
      }
    },
  },
];
