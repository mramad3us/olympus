// The slow layer covers game time once (TIME §5.5's parity, src/sim/game.js slowStep): live play
// steps the slow contributors once a game minute, a skip once a grid step, and the saved mark
// time.slowToMs makes every step start where the last one ended. Without it, store's agent measured
// (90.5 s lived, a 5-minute skip, 90.5 s lived) 481 s elapsed and 480 s stepped, [60, 90.5] s never
// stepped and [360, 390.5] s stepped twice: a closed-form contributor would have lost or doubled
// half a minute of its process at each edge of every skip.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { MIN_MS, TICK_MS } from '../src/core/clock.js';

// (a slow contributor that only records the spans it is stepped over)
const probe = () => {
  const spans = [];
  return {
    spans,
    domains: { probe: { owner: 'TECH', keys: [], slow: [{ name: 'probe', step: (state, bus, fromMs, toMs, ctx) => spans.push([fromMs, toMs, !!ctx?.skipping]) }] } },
  };
};

// (the spans in order: no gap, no overlap, and their sum)
function cover(spans, startMs) {
  let at = startMs, gaps = 0, overlaps = 0, total = 0;
  for (const [a, b] of spans) {
    if (a > at) gaps++;
    if (a < at) overlaps++;
    total += b - a;
    at = b;
  }
  return { gaps, overlaps, total, endMs: at };
}

export default [
  {
    name: 'the slow layer steps each moment of game time once, lived or skipped: 90.5 s lived, a 5-minute skip, 90.5 s lived (store\'s probe)',
    fn() {
      const p = probe();
      const g = createGame({ seed: 7, domains: p.domains });
      const t0 = g.state.clock.ms;
      g.run(90_500);
      g.skipNow({ activity: 'wait', planMs: 5 * MIN_MS });
      g.run(90_500);
      const t1 = g.state.clock.ms, c = cover(p.spans, t0), lastMinute = Math.floor(t1 / MIN_MS) * MIN_MS;
      assert(c.gaps === 0 && c.overlaps === 0 && c.endMs === lastMinute && c.total === lastMinute - t0,
        JSON.stringify({ ...c, elapsed: t1 - t0, lastMinute: lastMinute - t0, spans: p.spans.map(([a, b, k]) => [(a - t0) / 1000, (b - t0) / 1000, k]) }));
      const skipped = p.spans.filter(s => s[2]);
      console.log(`      ${fmt((t1 - t0) / 1000, 1)} s elapsed; ${fmt(c.total / 1000, 1)} s stepped up to the last whole minute, in ${p.spans.length} steps (${skipped.length} in the skip); no gap, no overlap`);
      console.log(`      the skip's first step [${fmt((skipped[0][0] - t0) / 1000, 1)}, ${fmt((skipped[0][1] - t0) / 1000, 1)}] s, the live minute after it [${fmt((p.spans[p.spans.indexOf(skipped.at(-1)) + 1][0] - t0) / 1000, 1)}, ${fmt((p.spans[p.spans.indexOf(skipped.at(-1)) + 1][1] - t0) / 1000, 1)}] s`);
    },
  },
  {
    name: 'the slow mark is saved: a game saved mid-minute before a skip and loaded steps the same spans as one played through',
    fn() {
      const a = probe(), b = probe();
      const ga = createGame({ seed: 9, domains: a.domains }), gb = createGame({ seed: 9, domains: b.domains });
      const t0 = ga.state.clock.ms;
      ga.run(75_250); ga.skipNow({ activity: 'wait', planMs: 3 * MIN_MS }); ga.run(130_000);
      gb.run(75_250);
      const json = gb.save();
      gb.load(json);
      gb.skipNow({ activity: 'wait', planMs: 3 * MIN_MS }); gb.run(130_000);
      const same = JSON.stringify(a.spans) === JSON.stringify(b.spans);
      assert(same && ga.digest() === gb.digest(), JSON.stringify({ a: a.spans.length, b: b.spans.length, da: ga.digest(), db: gb.digest() }));
      const c = cover(a.spans, t0);
      assert(c.gaps === 0 && c.overlaps === 0, JSON.stringify(c));
      console.log(`      ${a.spans.length} spans each, the same; digests ${ga.digest()}; mark saved at ${fmt((JSON.parse(json).time.slowToMs - t0) / 1000, 1)} s with the clock at ${fmt((JSON.parse(json).clock.ms - t0) / 1000, 2)} s (${TICK_MS} ms ticks)`);
    },
  },
  {
    name: 'a slow contributor that throws loses its own span and no other: the one before it is stepped over each minute once (0.0.2: [0, 60] s, then [0, 120] s again)',
    fn() {
      const spans = { a: [], b: [] };
      let thrown = 0;
      const domains = { probe: { owner: 'TECH', keys: [], slow: [
        { name: 'a', step: (state, bus, fromMs, toMs) => spans.a.push([fromMs, toMs]) },
        { name: 'b', step: (state, bus, fromMs, toMs) => { spans.b.push([fromMs, toMs]); if (!thrown++) throw new Error('b breaks once'); } },
      ] } };
      const g = createGame({ seed: 3, domains, strict: false });
      const t0 = g.state.clock.ms, first = Math.floor(t0 / MIN_MS) * MIN_MS + MIN_MS;
      g.run(3 * MIN_MS);
      const ca = cover(spans.a, spans.a[0]?.[0] ?? t0), rel = (list) => list.map(([x, y]) => `[${fmt((x - t0) / 1000, 0)}, ${fmt((y - t0) / 1000, 0)}]`).join(' ');
      console.log(`      a: ${rel(spans.a)} s; b: ${rel(spans.b)} s; the error noted: ${JSON.stringify(g.state.meta.errors)}`);
      assert(ca.gaps === 0 && ca.overlaps === 0 && spans.a.length === 3 && spans.a[0][1] === first, JSON.stringify({ ca, a: spans.a }));
      assert(cover(spans.b, spans.b[0][0]).overlaps === 0 && g.state.meta.errors.length === 1 && /b breaks once/.test(g.state.meta.errors[0]), JSON.stringify({ b: spans.b, errors: g.state.meta.errors }));
    },
  },
];
