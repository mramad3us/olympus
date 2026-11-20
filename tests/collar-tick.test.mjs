// OLYMPUS tests: the boarding's busiest tick within 2 ms, F165's tick half (the build sheet v0.0.27 §6 D, §8; §0 item 13; CLAUDE.md's rule of the code).
//
// tests/zerocqb-tick.test.mjs' method on the boarding's lane: the lane run once to warm the code, then TICK_RUNS (3) times, each tick's cost
// the least of its runs (a lane is deterministic: tick i is the same work in every run), the bot's own time taken out, the machine's factor
// k read before and after. Its busiest tick off a minute boundary at most TICK_BUDGET_MS (2 ms) × k, one on a boundary twice that. The
// lanes: the sergeant by T against pirates on 48213 and 1037 and the tier one by T against pirates on 48213 (four armed and two crew, the
// deckhead man, blind fire and push-offs where they choose them; each reaching the compartments, so the busy fight is ticked: the review of
// D, its pirates lane had ended at tick 725 at the fall back with the lock's hatch shut to sight) and the private by the keys against
// smugglers on 48213, from GO to the card. A time line (tests/run.mjs K7): red on time alone it is run
// again before it counts, the budget unchanged. Where it is red on a quiet machine, the sheet's order holds: C's one replan a tick first,
// then A's 10 Hz brain outside contact, then the armed cap to 3 (§0 items 5, 13), never a brain simplified first.
import { assert, TICK_BUDGET_MS, machineNow } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TICK_RUNS } from './tick-costs.mjs';
import { collarBotOf } from './bots/collar.mjs';

const MIN_MS = 60_000;
function runOnce(L) {
  const g = createGame({ scenario: 'test-collar', seed: L.seed, tier: L.tier, holdouts: L.holdouts, setup: 'go' }), bot = collarBotOf(L.bot, L.tier, L.seed);
  let botMs = 0;
  const timed = (s, me, mem) => { const t = performance.now(); const r = bot(s, me, mem); botMs += performance.now() - t; return r; };
  const xs = [], minute = [], men = [];
  for (let n = 0; !g.state.armoury?.range?.end && n < 40_000; n++) {
    const ms0 = g.state.clock.ms; botMs = 0;
    const t0 = performance.now();
    g.step(1, timed);
    xs.push(performance.now() - t0 - botMs);
    minute.push(Math.floor(g.state.clock.ms / MIN_MS) !== Math.floor(ms0 / MIN_MS));
    men.push(g.state.actors.list.length);
    g.clearFacts?.();
  }
  return { xs, minute, men };
}
function costs(L) {
  runOnce(L);
  const k0 = machineNow().k, all = Array.from({ length: TICK_RUNS }, () => runOnce(L)), k = Math.max(k0, machineNow().k);
  const n = Math.min(...all.map(r => r.xs.length));
  if (all.some(r => r.xs.length !== n)) throw new Error(`the boarding's runs differ in length (${all.map(r => r.xs.length).join(', ')}): not deterministic`);
  const mins = Array.from({ length: n }, (_, i) => Math.min(...all.map(r => r.xs[i]))), on = all[0].minute;
  const plain = mins.filter((_, i) => !on[i]), onMin = mins.filter((_, i) => on[i]), sorted = [...mins].sort((a, b) => a - b);
  const at = mins.indexOf(Math.max(0, ...plain));
  return { ticks: n, k, maxMs: Math.max(0, ...plain), minuteMaxMs: Math.max(0, ...onMin), p50: sorted[Math.floor(n / 2)], p95: sorted[Math.floor(n * 0.95)], actors: Math.max(...all[0].men), atTick: at };
}
function check(lanes) {
  const bad = [];
  for (const L of lanes) {
    const c = costs(L), f = (v) => v.toFixed(2);
    console.log(`      ${L.bot} ${L.tier} ${L.holdouts} ${L.seed}: ${c.ticks} ticks, ${c.actors} actors at most, busiest ${f(c.maxMs)} ms at tick ${c.atTick} (budget ${f(TICK_BUDGET_MS * c.k)} at k ${f(c.k)}), on a minute ${f(c.minuteMaxMs)} (budget ${f(2 * TICK_BUDGET_MS * c.k)}), p50 ${f(c.p50)}, p95 ${f(c.p95)}`);
    if (c.maxMs > TICK_BUDGET_MS * c.k || c.minuteMaxMs > 2 * TICK_BUDGET_MS * c.k) bad.push(`${L.tier}: ${f(c.maxMs)} / ${f(c.minuteMaxMs)} ms at k ${f(c.k)}`);
  }
  assert(!bad.length, bad.join('; '));
}

export default [
  {
    name: 'F165 (the tick\'s half): the sergeant by T against pirates on 48213 and 1037, the tier one by T against pirates on 48213 (lanes that reach the compartments, the busy fight: the review of D) and the private by the keys against smugglers on 48213, the busiest tick of the sim, each the least of three runs, at most 2 ms × the machine\'s factor (4 on a minute boundary)',
    heavy: true,
    timeoutMs: 1_200_000,
    timeLine: true,
    fn() { check([{ tier: 'sgt', seed: 48213, bot: 'honest', holdouts: 'pirates' }, { tier: 'sgt', seed: 1037, bot: 'honest', holdouts: 'pirates' }, { tier: 'tierone', seed: 48213, bot: 'honest', holdouts: 'pirates' }, { tier: 'private', seed: 48213, bot: 'keys', holdouts: 'smugglers' }]); },
  },
];
