// OLYMPUS tests: the sim's cost of each tick of a house lane, by the minimum of several runs (the build sheet v0.0.21 §1 item 13, §8 F60; perf lens P4).
//
// CLAUDE.md's rule of the code: "The sim stays under 2 ms a tick in the busiest area." A lane is deterministic, so tick i is
// the same work in every run of it, and what a shared machine adds (a collection, the scheduler, a neighbour) only adds. So the
// lane runs once to warm the code, then `runs` times (TICK_RUNS 3), and each tick's own cost is the least of its runs; the
// busiest tick is the largest of those minima. Measured on v0.0.20's tree: a single run's 3.68 ms on the tier one's 48213 is
// 3.12 ms by the minimum of three, and the same ticks come out on top run after run (the panel built twice in one evaluation:
// not noise, the reading v0.0.19's house-live-perf had of its maximum).
//
// Only the sim is timed: the bot runs inside the step, as runHouse runs it (game.step(1, bot)), its own time taken out, so the
// lane is the one every gauge plays. The machine's factor k is read just before and just after the timed runs (helpers.mjs
// machineNow; the slower of the two, at least the process's first): a neighbour that loads the whole of them slows every run of a
// tick alike. A tick on a minute boundary (the clock's minute layer: the body, the needs) is held apart
// (TECH §16.1's own row: 4 ms there), so `maxMs` is the busiest other tick and `minuteMaxMs` the busiest on a boundary.
//
// tickCosts(lane, { runs }) → { ticks, maxMs, minuteMaxMs, p50, p95, meanMs, over: n over TICK_BUDGET_MS, top: [{ tick, ms, atMs,
// minute, facts }] }, lane = { tier, seed, bot ('honest' | 'keys' | 'fuzz' | 'kit:flash' … as flawless.mjs botOf), setup ('go'
// unless null: from the fill), loadout, opfor, draw, house }.
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { TICK_BUDGET_MS, machineNow } from './helpers.mjs';

/** The runs a lane is timed over after its warm run (each tick's cost the least of them). */
export const TICK_RUNS = 3;
const MIN_MS = 60_000;

// (one run of a lane: each tick's sim ms, its clock ms, whether it crossed a minute, and its facts' names)
function runOnce(L, { facts = false, maxTicks = 40_000 } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, ...(L.setup === null ? {} : { setup: L.setup ?? 'go' }),
    ...(L.loadout ? { loadout: L.loadout } : {}), ...(L.opfor ? { opfor: L.opfor } : {}), ...(L.draw ? { draw: L.draw } : {}), ...(L.house ? { house: L.house } : {}) });
  const bot = botOf(L.bot ?? 'honest', { seed: L.seed });
  let botMs = 0;
  const timedBot = (s, me, mem) => { const t = performance.now(); const r = bot(s, me, mem); botMs += performance.now() - t; return r; };
  const xs = [], at = [], minute = [], names = [];
  for (let n = 0; !g.state.armoury?.range?.end && n < maxTicks; n++) {
    const ms0 = g.state.clock.ms;
    botMs = 0;
    const t0 = performance.now();
    g.step(1, timedBot);
    xs.push(performance.now() - t0 - botMs);
    const ms1 = g.state.clock.ms;
    at.push(ms0); minute.push(Math.floor(ms1 / MIN_MS) !== Math.floor(ms0 / MIN_MS));
    if (facts) names.push([...new Set(g.facts().map(([t]) => t))].join(','));
    g.clearFacts?.();
  }
  return { xs, at, minute, names, end: g.state.armoury?.range?.house?.end?.why ?? null };
}

const quantile = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };

/** Each tick's cost of a house lane as the least of `runs` runs after a warm one (see the header). */
export function tickCosts(lane, { runs = TICK_RUNS, top = 5, budgetMs = TICK_BUDGET_MS } = {}) {
  runOnce(lane);
  // (the machine's factor read just before and just after the timed runs, the slower of the two: a neighbour that loads the
  // machine for the whole of them slows every run of a tick alike, which no minimum takes out)
  const k0 = machineNow().k;
  const all = Array.from({ length: runs }, (_, i) => runOnce(lane, { facts: i === 0 }));
  const k = Math.max(k0, machineNow().k);
  const n = Math.min(...all.map(r => r.xs.length));
  if (all.some(r => r.xs.length !== n)) throw new Error(`tickCosts: the lane's runs differ in length (${all.map(r => r.xs.length).join(', ')}): not deterministic`);
  const mins = Array.from({ length: n }, (_, i) => Math.min(...all.map(r => r.xs[i])));
  const R0 = all[0], plain = mins.filter((_, i) => !R0.minute[i]), onMin = mins.filter((_, i) => R0.minute[i]);
  const idx = mins.map((_, i) => i).sort((a, b) => mins[b] - mins[a]).slice(0, top);
  return {
    ticks: n, end: R0.end, k, maxMs: Math.max(0, ...plain), minuteMaxMs: Math.max(0, ...onMin), minutes: onMin.length,
    p50: quantile(mins, 0.5), p95: quantile(mins, 0.95), meanMs: mins.reduce((a, b) => a + b, 0) / Math.max(1, n),
    over: plain.filter(v => v > budgetMs * k).length,
    top: idx.map(i => ({ tick: i, ms: mins[i], atMs: R0.at[i], minute: R0.minute[i], facts: R0.names[i] })),
  };
}

/** One line of a lane's costs, for the tests' prints. */
export function costLine(lane, c, k0 = 1) {
  const k = Math.max(k0, c.k ?? 1);
  const f = (v) => v.toFixed(2), name = `${lane.bot ?? 'honest'} ${lane.tier} ${lane.seed}${lane.loadout ? ` ${lane.loadout}` : ''}${lane.opfor ? ` ${lane.opfor}` : ''}${lane.setup === null ? ' (fill)' : ''}${lane.draw ? ` ${lane.draw}` : ''}${lane.house ? ` ${lane.house}` : ''}`;
  return `${name}: ${c.ticks} ticks to ${c.end ?? 'its end'}, busiest ${f(c.maxMs)} ms (budget ${f(TICK_BUDGET_MS * k)} at k ${f(k)}), on a minute ${f(c.minuteMaxMs)} of ${c.minutes} (budget ${f(2 * TICK_BUDGET_MS * k)}), p50 ${f(c.p50)}, p95 ${f(c.p95)}, mean ${f(c.meanMs)}; top ${c.top.map(t => `${f(t.ms)}@${t.tick}${t.minute ? 'm' : ''}${t.facts ? ` (${t.facts})` : ''}`).join(' ')}`;
}
