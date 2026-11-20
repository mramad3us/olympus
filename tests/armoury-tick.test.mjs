// OLYMPUS tests: "The window and the canopy"'s busiest tick within 2 ms, F181 (the build sheet v0.0.28 §8; CLAUDE.md's rule of the code).
//
// tests/collar-tick.test.mjs' method on the scene's lanes: a lane run once to warm the code, then TICK_RUNS (3) times, each tick's cost the
// least of its runs (a lane is deterministic), the bot's own time taken out, the machine's factor k read before and after. Lived ticks only:
// a tick that begins or ends a splash (the clock moving more than one tick: the bus, the relay, the clean, an outcome skip) is the skip
// engine's, timed by its own suites. Its busiest lived tick at most TICK_BUDGET_MS (2 ms) × k, the ground with seventeen people placed
// (your squad, its leader, the armourers, the NCO) and nobody walking but you. The lanes: the private by the keys and the sergeant by T on
// 48213. A time line (tests/run.mjs K7): red on time alone it is run again before it counts, the budget unchanged.
import { assert, TICK_BUDGET_MS, machineNow } from './helpers.mjs';
import { TICK_MS } from '../src/core/clock.js';
import { TICK_RUNS } from './tick-costs.mjs';
import { armGame } from './armoury-world.mjs';
import { armouryBot, armouryTBot } from './bots/armoury.mjs';

function runOnce(L) {
  const g = armGame({ seed: L.seed, tier: L.tier }), bot = L.bot === 'T' ? armouryTBot() : armouryBot();
  let botMs = 0;
  const timed = (s, me, mem) => { const t = performance.now(); const r = bot(s, me, mem); botMs += performance.now() - t; return r; };
  const xs = [], lived = [], men = [];
  for (let n = 0; !g.state.armoury?.range?.end && n < 20 * 60 * 15; n++) {
    const ms0 = g.state.clock.ms, sk0 = !!g.state.skip || !!g.state.time?.doing; botMs = 0;
    const t0 = performance.now();
    g.step(1, timed);
    xs.push(performance.now() - t0 - botMs);
    lived.push(!sk0 && !g.state.skip && !g.state.time?.doing && g.state.clock.ms - ms0 <= TICK_MS);
    men.push(g.state.actors.list.length);
    g.clearFacts?.();
  }
  return { xs, lived, men };
}
function costs(L) {
  runOnce(L);
  const k0 = machineNow().k, all = Array.from({ length: TICK_RUNS }, () => runOnce(L)), k = Math.max(k0, machineNow().k);
  const n = Math.min(...all.map(r => r.xs.length));
  if (all.some(r => r.xs.length !== n)) throw new Error(`the armoury's runs differ in length (${all.map(r => r.xs.length).join(', ')}): not deterministic`);
  const mins = Array.from({ length: n }, (_, i) => Math.min(...all.map(r => r.xs[i]))), ok = all[0].lived;
  const plain = mins.filter((_, i) => ok[i]), sorted = [...plain].sort((a, b) => a - b), max = Math.max(0, ...plain);
  const after = Math.max(0, ...mins.filter((_, i) => ok[i] && i > 0));
  return { ticks: n, lived: plain.length, k, maxMs: max, afterMs: after, p50: sorted[sorted.length >> 1], p95: sorted[Math.floor(sorted.length * 0.95)], actors: Math.max(...all[0].men), atTick: mins.indexOf(max) };
}

export default [
  {
    name: 'F181 (heavy): the private by the keys and the sergeant by T on 48213, the busiest lived tick at most 2 ms × k, the least of three runs',
    heavy: true,
    timeoutMs: 1_200_000,
    timeLine: true,
    fn() {
      const bad = [];
      for (const L of [{ tier: 'private', seed: 48213, bot: 'keys' }, { tier: 'sgt', seed: 48213, bot: 'T' }]) {
        const c = costs(L), f = (v) => v.toFixed(2);
        console.log(`      ${L.bot} ${L.tier} ${L.seed}: ${c.ticks} ticks (${c.lived} lived), ${c.actors} actors at most, busiest ${f(c.maxMs)} ms at tick ${c.atTick} (budget ${f(TICK_BUDGET_MS * c.k)} at k ${f(c.k)}), p50 ${f(c.p50)}, p95 ${f(c.p95)}; after the first tick (the ground's grids built for the first walk) at most ${f(c.afterMs)} ms`);
        if (c.maxMs > TICK_BUDGET_MS * c.k) bad.push(`${L.tier}: ${f(c.maxMs)} ms at k ${f(c.k)}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
];
