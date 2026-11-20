// OLYMPUS tests: "Stack and clear, live" within the sim's budget (CLAUDE.md: "the sim stays under 2 ms a tick in the busiest area"; the build sheet v0.0.19 §9 item 8, v0.0.21 §1 item 13 and F60).
//
// The tier one's lane with both role-players fighting (live:fight,hide: one man fires, one dashes and hides), each tick's own
// cost the least of three runs after a warm one (tests/tick-costs.mjs: only the sim timed, the bot's own time taken out), the
// busiest at most TICK_BUDGET_MS × machineK() (the background band's factor, tests/helpers.mjs) and a tick on a minute boundary
// twice that; its p50 and p95 printed, and the live men's share read against the same lane with no role-players (the turner
// lane's mean tick). Until v0.0.21 this case held the 95th percentile and printed the maximum on the reading that the single
// longest tick was "a collector's pause or the JIT's". It was not: the same ticks topped every run and replayed from their saves
// cost the same (the perf lens of v0.0.21: the step panel built by both of the instinct's rule sets in one evaluation, the body
// deep-copied for every roll; 3.31 ms on v0.0.19's live lane), so the maximum is the measure, its noise removed by the minimum
// of three runs (F60). And the sergeant's casualty lane (live on 48213, the paint on you in room 3): its 2 s beat offers no row
// and fires no round, its ticks timed apart (the review of track L: a full panel there, 7.5 to 8.9 ms a tick).
import { assert, machineK, TICK_BUDGET_MS } from './helpers.mjs';
import { tickCosts, costLine } from './tick-costs.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { quantile } from './flawless.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';

/** The ticks left out at the start: the first ones compile the code paths (ms of a cold JIT, not the sim's). */
const WARM = 200;

function timed(opfor, { tier = 'tierone' } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', ...(opfor ? { opfor } : {}) }), bot = houseHonestBot(), xs = [], beat = { xs: [], rows: 0, ticks: 0, shots: 0 };
  let n = 0;
  g.bus.on('shot', f => { const H = g.state.armoury.range.house; if (f.fired && H.live?.casualty && !H.end && f.atMs > H.live.casualty.atMs) beat.shots++; });
  while (!g.state.armoury.range.end && n++ < 12_000) {
    const s = g.state, me = s.actors.list.find(a => a.who === s.player.id), H = s.armoury.range.house, lived = H.goAtMs !== null && !H.end;
    const inBeat = lived && !!H.live?.casualty && s.clock.ms > H.live.casualty.atMs;
    // (the casualty's beat: what the panel offers (nothing: the stack is out of the fight), read before the tick)
    if (inBeat) { beat.ticks++; beat.rows += stepsOf(s).filter(r => !r.off).length; }
    const input = s.skip ? null : bot(s, me, (me.bot ??= {}));
    const t0 = performance.now();
    g.step(1, input ?? bot);
    const dt = performance.now() - t0;
    g.clearFacts?.();
    if (lived && n > WARM) xs.push(dt);
    if (inBeat) beat.xs.push(dt);
  }
  return { xs, end: g.state.armoury.range.house.end?.why ?? null, beat };
}

export default [
  {
    name: 'v0.0.19, v0.0.21 (F60): the tier one\'s live lane (live:fight,hide) keeps the sim\'s busiest tick, each tick the least of three runs, under 2 ms × the machine\'s factor (4 on a minute boundary); its p50, p95 and the live men\'s share against the turner lane printed',
    timeoutMs: 180_000,
    // (v0.0.27's stage 0, K7: a time line; red on time alone it is run again before it counts (tests/run.mjs), the budget unchanged)
    timeLine: true,
    fn() {
      const k = machineK(), LIVE = { tier: 'tierone', seed: 48213, opfor: 'live:fight,hide' }, BASE = { tier: 'tierone', seed: 48213 };
      const L = tickCosts(LIVE), B = tickCosts(BASE), f = (v) => v.toFixed(3);
      console.log(`      ${costLine(LIVE, L, k)}`);
      console.log(`      ${costLine(BASE, B, k)}`);
      console.log(`      the live men's share of the mean tick ${f(L.meanMs - B.meanMs)} ms (${Math.round((L.meanMs - B.meanMs) / Math.max(1e-9, L.meanMs) * 100)}%)`);
      const kL = Math.max(k, L.k);   // (the machine's factor read around the lane's own runs: tick-costs.mjs)
      assert(L.ticks > 200 && L.maxMs <= TICK_BUDGET_MS * kL && L.minuteMaxMs <= 2 * TICK_BUDGET_MS * kL, JSON.stringify({ n: L.ticks, max: L.maxMs, minute: L.minuteMaxMs, p95: L.p95, top: L.top, k: kL }));
    },
  },
  {
    name: 'v0.0.19 (the review of track L): the sergeant\'s casualty lane (live, 48213): through the 2 s beat no row is offered and no round fired, and its ticks (the 95th percentile) and the whole lane\'s are under 2 ms × the machine\'s factor (before: a full panel cut on every press, the instinct rebuilding it, 7.5 to 8.9 ms a tick)',
    timeoutMs: 120_000,
    fn() {
      timed('live', { tier: 'sgt' });
      const k = machineK(), r = timed('live', { tier: 'sgt' }), b = r.beat, f = (v) => (Number.isFinite(v) ? v.toFixed(3) : '-');
      const all = { p95: quantile(r.xs, 0.95), max: Math.max(...r.xs) }, beatP95 = quantile(b.xs, 0.95), beatMax = Math.max(...b.xs);
      console.log(`      the sergeant on 48213 (${r.end}): ${r.xs.length} lived ticks, p95 ${f(all.p95)} ms, max ${f(all.max)}; the beat ${b.ticks} ticks, p95 ${f(beatP95)} ms, max ${f(beatMax)}; rows offered in it ${b.rows}, rounds fired in it ${b.shots} (budget ${(TICK_BUDGET_MS * k).toFixed(2)} ms at k ${k.toFixed(2)})`);
      assert(r.end === 'casualty' && b.ticks >= 30, JSON.stringify({ end: r.end, ticks: b.ticks }));
      assert(b.rows === 0 && b.shots === 0, JSON.stringify({ rows: b.rows, shots: b.shots }));
      assert(beatP95 <= TICK_BUDGET_MS * k && all.p95 <= TICK_BUDGET_MS * k, JSON.stringify({ beatP95, beatMax, p95: all.p95, k }));
    },
  },
];
