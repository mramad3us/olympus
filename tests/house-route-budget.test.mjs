// OLYMPUS tests: the #2's routing storm (the build sheet v0.0.21 §1 item 14, §8 F68; perf lens P2): no tick of the house spends more than ROUTE_NODES_TICK route nodes, and no solve searches for a way that is not there.
//
// combat/route.js counts every A* expansion routed runs on the tick's runtime record (state.$route), gives a caller that may storm
// (places/move.js stepAside: your #2's step off your walk's path, up to 18 tries a tick) only what is left of ROUTE_NODES_TICK 8,000,
// and answers a leg whose two ends lie in two regions of the routing grid 'blocked' with no search. state.$routeFree (a test switch,
// as $readsOff is the read scope's) turns both off and still counts: the run "without the fix", in the same process.
// The storm lane: the boot recruit's fuzz on seed 1007 from GO (66,323 nodes in one tick at loop tick 606, his #2's tries toward
// points beyond a wall, each expanding the whole of his region of the routing grid, about 12,700 cells, and again on the all-open
// grid; of 72 fuzz lanes on v0.0.20's tree, six sheets on seeds 1000 to 1011, 43 spent over 8,000 nodes in a tick, the worst the
// sergeant on 1002, 88,808 in one, 10.9 ms: house-route-budget-more holds them all). The perf lens's own lane, the boot recruit's
// on 1185, no longer storms on v0.0.20's tree (948 nodes in the lane), so the test plays one that does, early enough to be quick.
import { assert, fmt, machineNow } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { routed, routeFailOf, routeGridOf, ROUTE_NODES_TICK } from '../src/sim/combat/route.js';
import { TICK_BUDGET_MS } from './helpers.mjs';

/** The storm's window: the lane, the loop tick it starts at, its length in ticks, and the bounds (the build sheet §6 B). */
export const STORM = Object.freeze({ tier: 'recruit', seed: 1007, bot: 'fuzz', fromSeq: 400, ticks: 600 });
export const WINDOW_NODES_MAX = 60_000;

// (the lane from GO to the window's start, saved: made by the test from the seed; the game kept to play the window again from it)
function stormSave() {
  const g = createGame({ scenario: 'test-shoothouse', seed: STORM.seed, tier: STORM.tier, setup: 'go' }), bot = botOf(STORM.bot, { seed: STORM.seed });
  while (g.state.clock.seq < STORM.fromSeq && !g.state.armoury.range.end) { g.step(1, bot); g.clearFacts?.(); }
  return { g, save: g.save(), seq: g.state.clock.seq };
}
// (the window played from the save on the game g: each tick's route nodes (one record a tick: route.js routeTick), its sim ms, and the
// end's digest)
function windowRun(g, save, { free = false, time = false } = {}) {
  g.load(save);
  if (free) g.state.$routeFree = true;
  const bot = botOf(STORM.bot, { seed: STORM.seed }), nodes = [], ms = [];
  let last = null, botMs = 0;
  const timed = (s, me, mem) => { const t = performance.now(); const r = bot(s, me, mem); botMs += performance.now() - t; return r; };
  for (let i = 0; i < STORM.ticks && !g.state.armoury.range.end; i++) {
    botMs = 0;
    const t0 = performance.now();
    g.step(1, time ? timed : bot);
    if (time) ms.push(performance.now() - t0 - botMs);
    g.clearFacts?.();
    const R = g.state.$route;
    if (R && R !== last) { nodes.push(R.nodes); last = R; } else if (R) nodes[nodes.length - 1] = R.nodes;
  }
  return { nodes, ms, digest: g.digest(), most: Math.max(0, ...nodes), sum: nodes.reduce((a, b) => a + b, 0) };
}

export default [
  {
    name: 'F68: the boot recruit\'s fuzz on 1007, 600 ticks from loop tick 400 (his #2\'s step off your path): at most 8,000 route nodes in a tick and 60,000 in all, the busiest tick under 2 ms × k (the least of three runs), the same end as without the fix; without it ($routeFree) 66,323 in one tick',
    timeoutMs: 120_000,
    fn() {
      const { g, save, seq } = stormSave();
      // (the run without the fix warms the code; the run with it is the first of three timed, each tick's cost the least of them; the
      // machine's factor read just before and just after them, the slower (tests/tick-costs.mjs's way: a neighbour that loads the
      // whole of them slows every run of a tick alike))
      const off = windowRun(g, save, { free: true }), k0 = machineNow().k, on = windowRun(g, save, { time: true });
      const runs = [on.ms, windowRun(g, save, { time: true }).ms, windowRun(g, save, { time: true }).ms], n = Math.min(...runs.map(r => r.length)), k = Math.max(k0, machineNow().k);
      const mins = Array.from({ length: n }, (_, i) => Math.min(...runs.map(r => r[i]))), busiest = Math.max(0, ...mins), at = mins.indexOf(busiest);
      console.log(`      the window from loop tick ${seq}, ${on.nodes.length} ticks with a route: without the fix ${off.most} nodes in a tick at most, ${off.sum} in all; with it ${on.most} and ${on.sum} (budget ${ROUTE_NODES_TICK} a tick, ${WINDOW_NODES_MAX} in all)`);
      console.log(`      the busiest tick with the fix ${fmt(busiest, 2)} ms (the least of three, its ${at}th; budget ${fmt(TICK_BUDGET_MS * k, 2)} at k ${fmt(k, 2)}); the end's digest ${on.digest} with, ${off.digest} without`);
      assert(off.most > ROUTE_NODES_TICK, `without the fix the window should storm: ${off.most}`);
      assert(on.most <= ROUTE_NODES_TICK && on.sum <= WINDOW_NODES_MAX, JSON.stringify({ most: on.most, sum: on.sum }));
      assert(busiest <= TICK_BUDGET_MS * k, `the busiest tick ${fmt(busiest, 2)} ms over ${fmt(TICK_BUDGET_MS * k, 2)}`);
      assert(on.digest === off.digest, `the fix moved the lane: ${on.digest} against ${off.digest}`);
    },
  },
  {
    name: 'the tick\'s budget and the regions, by hand on the house: a leg into the hall\'s south wall from the hall, as the 1002 storm\'s tries, spends a hundredth of its nodes and is routed the same, and a capped solve with the budget spent comes to nothing this tick (routeFailOf \'cap\') where an uncapped one is routed',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state;
      g.step(1, {});
      const area = s.places.live.area, G = routeGridOf(s, area);
      // (from the hall to a point in its south wall's far side, as stepOffPath's tries reached: the 1002 storm's own pair)
      const from = [22.2, 13.95], wall = [22.3408, 14.605];
      const run = (free, pts, o = {}) => { s.$routeFree = free; delete s.$route; s.clock.seq += 1; const r = routed(s, pts, { area, ...o }); const n = s.$route?.nodes ?? 0; delete s.$routeFree; return { r, n, fail: routeFailOf(s) }; };
      const a = run(true, [from, wall]), b = run(false, [from, wall]);
      console.log(`      into the wall: without the fix ${a.n} nodes, with it ${b.n}; the routes ${JSON.stringify(a.r) === JSON.stringify(b.r) ? 'the same' : 'DIFFERENT'} (${b.r?.length ?? 0} points); the grid ${G.nx} × ${G.nz}`);
      assert(a.n > 10_000 && b.n * 50 < a.n && JSON.stringify(a.r) === JSON.stringify(b.r), JSON.stringify({ free: a.n, fixed: b.n, same: JSON.stringify(a.r) === JSON.stringify(b.r) }));
      // (the budget spent, 7,999 nodes already this tick, and a leg that must search: from the hall into room 1, its door shut)
      const far = [31.5, 9.0], legs = (cap) => { delete s.$route; s.clock.seq += 1; routed(s, [from, from], { area }); s.$route.nodes = ROUTE_NODES_TICK - 1; const r = routed(s, [from, far], { area, cap }); return { r, fail: routeFailOf(s), n: s.$route.nodes }; };
      const capped = legs(true), free = legs(false);
      console.log(`      the budget spent (7,999 this tick): capped ${capped.r ? `${capped.r.length} points` : 'null'} (${capped.fail}), uncapped ${free.r ? `${free.r.length} points` : 'null'} after ${free.n - (ROUTE_NODES_TICK - 1)} more nodes`);
      assert(capped.r === null && capped.fail === 'cap' && Array.isArray(free.r) && free.r.length >= 3, JSON.stringify({ capped, free: free.r?.length }));
    },
  },
];
