// OLYMPUS tests: the sim's busiest tick in "Bang, then go" within 2 ms (CLAUDE.md's rule of the code; v0.0.26, its build sheet §6 B, §8 F148's tick half).
//
// tests/tick-costs.mjs' method on the scene's lane: the lane run once to warm the code, then TICK_RUNS (3) times, each tick's cost the
// least of its runs (a lane is deterministic, so tick i is the same work in every run, and what a shared machine adds only adds), the
// bot's own time taken out; the machine's factor k read before and after the timed runs, the slower. The busiest tick off a minute
// boundary at most TICK_BUDGET_MS (2 ms) × k, one on a boundary twice that (TECH §16.1's row). The scene's own per tick: the window's
// transitions and the track's compare for two men (shoothouse.js breachWindow), the search's wait after "Clear!". The tier one by T with
// the bang on the loose door on 48213 (quick, as F60's and F133's quick cases are the tier one's); the sergeant by T on the held door and
// the private by the keys on the quiet held door (heavy). The sergeant's busiest tick is the house's own (a contact's hold with the room
// bundle planned, 'bundle,log,contact,hold'), the same tick the live lane's sergeant spends on 48213 (1.98 ms there, 1.87 to 2.23 ms here
// on a shared machine at a load of 5 on 15 cores, k 1.00): the lead's quiet run judges it.
import { assert, TICK_BUDGET_MS, machineNow } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TICK_RUNS } from './tick-costs.mjs';
import { breachBot } from './breach-lanes.mjs';

const MIN_MS = 60_000;
// (one run of a lane: each tick's sim ms with the bot's taken out, and whether it crossed a minute)
function runOnce(L) {
  const g = createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, breach: L.code, setup: 'go' }), bot = breachBot('auto', L);
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
  if (all.some(r => r.xs.length !== n)) throw new Error(`the scene's runs differ in length (${all.map(r => r.xs.length).join(', ')}): not deterministic`);
  const mins = Array.from({ length: n }, (_, i) => Math.min(...all.map(r => r.xs[i]))), on = all[0].minute;
  const plain = mins.filter((_, i) => !on[i]), onMin = mins.filter((_, i) => on[i]), sorted = [...mins].sort((a, b) => a - b);
  const top = plain.indexOf(Math.max(0, ...plain));
  return { ticks: n, k, maxMs: Math.max(0, ...plain), at: top, minuteMaxMs: Math.max(0, ...onMin), p50: sorted[Math.floor(n / 2)], p95: sorted[Math.floor(n * 0.95)] };
}

function check(lanes) {
  const bad = [];
  for (const L of lanes) {
    const c = costs(L), f = (v) => v.toFixed(2);
    console.log(`      ${L.tier} ${L.seed} ${L.code}: ${c.ticks} ticks, busiest ${f(c.maxMs)} ms at tick ${c.at} (budget ${f(TICK_BUDGET_MS * c.k)} at k ${f(c.k)}), on a minute ${f(c.minuteMaxMs)} (budget ${f(2 * TICK_BUDGET_MS * c.k)}), p50 ${f(c.p50)}, p95 ${f(c.p95)}`);
    if (c.maxMs > TICK_BUDGET_MS * c.k || c.minuteMaxMs > 2 * TICK_BUDGET_MS * c.k) bad.push(`${L.tier} ${L.code}: ${f(c.maxMs)} / ${f(c.minuteMaxMs)} ms at k ${f(c.k)}`);
  }
  assert(!bad.length, bad.join('; '));
}

export default [
  {
    name: 'F148 (the tick\'s half, quick): the tier one by T with the bang on the loose door on 48213 from GO to the card, the busiest tick of the sim, each the least of three runs, at most 2 ms × the machine\'s factor (4 on a minute boundary)',
    timeoutMs: 180_000,
    fn() { check([{ tier: 'tierone', seed: 48213, code: 'bang,loose' }]); },
  },
  {
    name: 'F148 (the tick\'s half): the sergeant by T with the bang on the held door and the private by the keys on the quiet held door, on 48213, the same budget',
    heavy: true,
    timeoutMs: 300_000,
    fn() { check([{ tier: 'sgt', seed: 48213, code: 'bang,held' }, { tier: 'private', seed: 48213, code: 'quiet,held' }]); },
  },
];
