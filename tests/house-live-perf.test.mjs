// OLYMPUS tests: "Stack and clear, live" within the sim's budget (CLAUDE.md: "the sim stays under 2 ms a tick in the busiest area"; the build sheet v0.0.19 §9 item 8).
//
// The tier one's lane with both role-players fighting (live:fight,hide: one man fires, one dashes and hides), each tick timed
// on its own: the bot's input made first and given to the tick, so only the sim is timed (the bot's panel reads are the
// player's, not the game's). The busiest tick is held under TICK_BUDGET_MS × machineK() (the background band's factor,
// tests/helpers.mjs), its p50 and p95 printed, and the live men's share read against the same lane with no role-players on the
// same seed and sheet (the turner lane: its mean tick and its own p95). The busy ticks are read at the 95th percentile, one tick in
// twenty (my call, the lane's busiest decisions: a bundle planned, a window opened, a pair fired): the single longest is a
// collector's pause or the JIT's, the turner lane's own over 10 ms on this machine, and is printed. Each lane runs once to warm
// the code before the one timed. And the sergeant's casualty lane (live on 48213, the paint on you in room 3): its 2 s beat
// offers no row and fires no round, its ticks timed apart (the review of track L: a full panel there, 7.5 to 8.9 ms a tick).
import { assert, machineK } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { quantile } from './flawless.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';

/** The sim's tick budget (ms; CLAUDE.md's rule of the code). */
export const TICK_BUDGET_MS = 2;
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
    name: 'v0.0.19: the tier one\'s live lane (live:fight,hide) keeps its busy lived ticks of the sim (the 95th percentile) under 2 ms × the machine\'s factor; its p50, max and the live men\'s share against the turner lane printed',
    timeoutMs: 120_000,
    fn() {
      timed('live:fight,hide'); timed(null);
      const k = machineK(), live = timed('live:fight,hide'), base = timed(null);
      const st = (xs) => ({ n: xs.length, p50: quantile(xs, 0.5), p95: quantile(xs, 0.95), max: Math.max(...xs), mean: xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length) });
      const L = st(live.xs), B = st(base.xs), f = (v) => v.toFixed(3);
      console.log(`      live (${live.end}): ${L.n} lived ticks, mean ${f(L.mean)} ms, p50 ${f(L.p50)}, p95 ${f(L.p95)}, max ${f(L.max)} (budget ${(TICK_BUDGET_MS * k).toFixed(2)} ms at k ${k.toFixed(2)})`);
      console.log(`      the turner lane (${base.end}): ${B.n} lived ticks, mean ${f(B.mean)} ms, p50 ${f(B.p50)}, p95 ${f(B.p95)}, max ${f(B.max)}; the live men's share of the mean tick ${f(L.mean - B.mean)} ms (${Math.round((L.mean - B.mean) / Math.max(1e-9, L.mean) * 100)}%)`);
      assert(L.n > 200 && L.p95 <= TICK_BUDGET_MS * k, JSON.stringify({ n: L.n, p95: L.p95, max: L.max, k }));
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
