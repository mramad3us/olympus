// OLYMPUS tests: the sim's busiest tick on the Wreck within 2 ms (CLAUDE.md's rule of the code; v0.0.25 "Hold to hold", its build sheet §8 F133's tick half).
//
// tests/tick-costs.mjs' method on the Wreck's lane: the lane run once to warm the code, then TICK_RUNS (3) times, each tick's cost the
// least of its runs (a lane is deterministic, so tick i is the same work in every run, and what a shared machine adds only adds), the
// bot's own time taken out; the machine's factor k read before and after the timed runs, the slower. The busiest tick off a minute
// boundary at most TICK_BUDGET_MS (2 ms) × k, one on a boundary twice that (TECH §16.1's row). The tier one by T on 48213 (quick), the
// private by the keys and the corporal by T (heavy), from GO through the trunk, the tug and the hold to the card.
import { assert, TICK_BUDGET_MS, machineNow } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TICK_RUNS } from './tick-costs.mjs';
import { wreckBot } from './flawless-wreck.mjs';

const MIN_MS = 60_000;
// (one run of a Wreck lane: each tick's sim ms with the bot's taken out, and whether it crossed a minute)
function runOnce(L) {
  const g = createGame({ scenario: 'test-zerocqb', seed: L.seed, tier: L.tier, setup: 'go' }), bot = wreckBot(L.bot, L.tier, L.seed);
  let botMs = 0;
  const timed = (s, me, mem) => { const t = performance.now(); const r = bot(s, me, mem); botMs += performance.now() - t; return r; };
  const xs = [], minute = [];
  for (let n = 0; !g.state.armoury?.range?.end && n < 40_000; n++) {
    const ms0 = g.state.clock.ms; botMs = 0;
    const t0 = performance.now();
    g.step(1, timed);
    xs.push(performance.now() - t0 - botMs);
    minute.push(Math.floor(g.state.clock.ms / MIN_MS) !== Math.floor(ms0 / MIN_MS));
    g.clearFacts?.();
  }
  return { xs, minute };
}
function costs(L) {
  runOnce(L);
  const k0 = machineNow().k, all = Array.from({ length: TICK_RUNS }, () => runOnce(L)), k = Math.max(k0, machineNow().k);
  const n = Math.min(...all.map(r => r.xs.length));
  if (all.some(r => r.xs.length !== n)) throw new Error(`the Wreck's runs differ in length (${all.map(r => r.xs.length).join(', ')}): not deterministic`);
  const mins = Array.from({ length: n }, (_, i) => Math.min(...all.map(r => r.xs[i]))), on = all[0].minute;
  const plain = mins.filter((_, i) => !on[i]), onMin = mins.filter((_, i) => on[i]), sorted = [...mins].sort((a, b) => a - b);
  return { ticks: n, k, maxMs: Math.max(0, ...plain), minuteMaxMs: Math.max(0, ...onMin), p50: sorted[Math.floor(n / 2)], p95: sorted[Math.floor(n * 0.95)] };
}

function check(lanes) {
  const bad = [];
  for (const L of lanes) {
    const c = costs(L), f = (v) => v.toFixed(2);
    console.log(`      ${L.bot} ${L.tier} ${L.seed}: ${c.ticks} ticks, busiest ${f(c.maxMs)} ms (budget ${f(TICK_BUDGET_MS * c.k)} at k ${f(c.k)}), on a minute ${f(c.minuteMaxMs)} (budget ${f(2 * TICK_BUDGET_MS * c.k)}), p50 ${f(c.p50)}, p95 ${f(c.p95)}`);
    if (c.maxMs > TICK_BUDGET_MS * c.k || c.minuteMaxMs > 2 * TICK_BUDGET_MS * c.k) bad.push(`${L.tier}: ${f(c.maxMs)} / ${f(c.minuteMaxMs)} ms at k ${f(c.k)}`);
  }
  assert(!bad.length, bad.join('; '));
}

export default [
  {
    name: 'F133 (the tick\'s half, quick): the tier one by T on the Wreck on 48213, the busiest tick of the sim, each the least of three runs, at most 2 ms × the machine\'s factor (4 on a minute boundary)',
    timeoutMs: 180_000,
    // (v0.0.27's stage 0, K7: a time line; red on time alone it is run again before it counts (tests/run.mjs), the budget unchanged)
    timeLine: true,
    fn() { check([{ tier: 'tierone', seed: 48213, bot: 'honest' }]); },
  },
  {
    name: 'F133 (the tick\'s half): the private by the keys and the corporal by T on the Wreck on 48213, the same budget',
    heavy: true,
    timeoutMs: 300_000,
    fn() { check([{ tier: 'private', seed: 48213, bot: 'keys' }, { tier: 'cpl', seed: 48213, bot: 'honest' }]); },
  },
];
