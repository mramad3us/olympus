// places-walkers (heavy: the lived tours are longer than the quick suite's 60 s allows): the walker bot
// on Base Melas through the movement layer, as the player's keys would (the build sheet 0.0.3 §5.1).
//   walkFloors    every spot of both of Echo's floors in C0, floor 1's in a tour from the player's
//                 berth, up the east stair, floor 2's, and down again, doors opened by R on the way;
//   walkToFences  from the player's berth out of the front door, then along the ground's waypoint
//                 graph to the inside of the North, main (west), East and South gates in turn (the gates
//                 are closed this release: the walk ends at the fences, the sheet's §8 item 19), on the
//                 ground's windows of 32 m chunks built ahead.
// The player layer is timed by a wrapper round places' own (the domain replaced for the test, as
// game-dummy replaces the world): its mean and its worst tick in node against CONTRACTS §7's ceilings,
// and the chunks it builds a tick (at most NAV_CHUNKS_TICK a class once the walk is under way). The
// tick an area is entered builds that area's first grid (a floor's whole grid, a ground's first
// window of nine chunks) behind the view's cut (main.js holds it up to CUT_MAX_MS 1 s while the stage
// builds the area), so it is printed on its own and left out of the worst tick under way.
import { assert, fmt, machine } from './helpers.mjs';
import { createGame } from './game.mjs';
import { melasGame, walkFloors, walkToFences } from './bots/walker.mjs';
import { placesDomain } from '../src/sim/places/domain.js';
import { groundStats, resetGroundStats, NAV_CHUNKS_TICK } from '../src/sim/places/nav.js';

// (a game whose player layer is timed: { game, times: [ms a tick], builds: [chunks a tick], entries: [ticks an area changed] })
function timedGame(opts) {
  const times = [], builds = [], entries = new Set();
  const player = (state, input, bus, ctx) => {
    const area = state.places?.live?.area, b0 = groundStats().chunksBuilt, t0 = performance.now();
    placesDomain.fast.player(state, input, bus, ctx);
    times.push(performance.now() - t0); builds.push(groundStats().chunksBuilt - b0);
    if (state.places?.live?.area !== area) entries.add(times.length - 1);
  };
  const game = melasGame(createGame, { ...opts, domains: { places: { ...placesDomain, fast: { ...placesDomain.fast, player } } } });
  return { game, times, builds, entries };
}
const stats = (xs) => { const s = [...xs].sort((a, b) => a - b); return { mean: xs.reduce((n, x) => n + x, 0) / Math.max(1, xs.length), max: s.at(-1) ?? 0, p99: s[Math.floor(s.length * 0.99)] ?? 0 }; };

export default [
  {
    name: 'walkFloors: the walker reaches every spot of both of Echo\'s floors through the movement layer (C0), floor 2 by the east stair, doors opened by R',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const { game, times, entries } = timedGame({ seed: 48213, hour: 12 }), t0 = performance.now();
      const r = walkFloors(game, { cls: 'C0' });
      const ms = performance.now() - t0, s = stats(times.filter((_, i) => !entries.has(i))), cut = [...entries].map(i => times[i]);
      for (const [area, f] of Object.entries(r.floors)) {
        console.log(`      ${area}: ${f.reached} of ${f.spots} spots reached, ${f.failed.length} failed`);
        for (const x of f.failed.slice(0, 8)) console.log(`        FAILED ${x.id}: ${x.why}`);
      }
      console.log(`      ${fmt(r.metres, 1)} m planned, ${r.ticks} ticks lived (${fmt(r.ticks / 20 / 60, 1)} game minutes), ${r.doors} doors opened by R, ${r.plans} plans, in ${fmt(ms / 1000, 1)} s; ended in ${r.lastArea}`);
      console.log(`      the player layer under way: mean ${fmt(s.mean, 4)} ms a tick, p99 ${fmt(s.p99, 3)}, max ${fmt(s.max, 3)} over ${times.length - entries.size} ticks; the ${entries.size} ticks entering an area (its grid built behind the cut): ${cut.map(x => fmt(x, 2)).join(', ')} ms`);
      for (const f of Object.values(r.floors)) assert(!f.failed.length && f.reached === f.spots, JSON.stringify(f.failed.slice(0, 5)));
      assert(r.lastArea === 'melas.echo.1', `ended in ${r.lastArea}`);
      assert(s.mean <= 0.1 && s.max <= 4, JSON.stringify(s));
    },
  },
  {
    name: 'walkToFences: from the player\'s berth out of the front door to the inside of the North, main, East and South gates in turn, on the ground\'s windows; no tick builds more than NAV_CHUNKS_TICK chunks a class; the player layer\'s mean at most 0.1 ms and its worst tick at most 4 ms in node',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      resetGroundStats();
      const { game, times, builds, entries } = timedGame({ seed: 48213, hour: 12 });
      const rows = [], marks = [];
      let last = { tick: 0, t: 0, chunks: 0, windows: 0 };
      const r = walkToFences(game, {
        cls: 'C0',
        onLeg(name, g) {
          const st = groundStats(), cur = { tick: times.length, t: times.length, chunks: st.chunksBuilt, windows: st.windowsBuilt };
          const slice = times.slice(last.t, cur.t), s = stats(slice);
          rows.push({ name, ticks: cur.tick - last.tick, chunks: cur.chunks - last.chunks, windows: cur.windows - last.windows, mean: s.mean, max: s.max, at: [g.me().x, g.me().z], area: g.state.places.live.area });
          marks.push(cur.t); last = cur;
        },
      });
      const after = builds.map((b, i) => (entries.has(i) ? 0 : b)), maxBuilds = Math.max(...after), all = stats(times.filter((_, i) => !entries.has(i))), cut = [...entries].map(i => times[i]);
      r.legs.forEach((l, i) => {
        const x = rows[i];
        console.log(`      ${l.name.padEnd(22)} ${l.done ? 'reached' : `FAILED (${l.reason})`}: ${fmt(l.metres, 1).padStart(7)} m, ${fmt(l.ticks / 1200, 2).padStart(5)} game minutes, ${String(l.ticks).padStart(5)} ticks; ${x.chunks} chunks built, ${x.windows} windows; the player layer mean ${fmt(x.mean, 4)} ms, max ${fmt(x.max, 3)} ms (an area's entry included); ends at (${fmt(x.at[0], 2)}, ${fmt(x.at[1], 2)}) in ${x.area}`);
      });
      console.log(`      in all: ${times.length} ticks; under way the player layer mean ${fmt(all.mean, 4)} ms, p99 ${fmt(all.p99, 3)}, max ${fmt(all.max, 3)} ms, at most ${maxBuilds} chunks built in a tick; the ${entries.size} tick entering the ground (its first window built behind the cut): ${cut.map(x => fmt(x, 2)).join(', ')} ms; ${groundStats().chunksBuilt} chunks, ${groundStats().windowsBuilt} windows, ${groundStats().aheadBuilt} built ahead`);
      assert(r.legs.length === 5 && r.legs.every(l => l.done), JSON.stringify(r.legs.filter(l => !l.done)));
      const gates = r.legs.slice(1).map(l => l.end), want = [[550, 1.5], [1.5, 410], [998.5, 410], [550, 698.5]];
      assert(gates.every((p, i) => Math.abs(p[0] - want[i][0]) <= 0.3 && Math.abs(p[1] - want[i][1]) <= 0.3), JSON.stringify(gates));
      assert(maxBuilds <= NAV_CHUNKS_TICK, `a tick built ${maxBuilds} chunks`);
      // (CPU-time ceilings in the foreground's terms: this process may be in macOS's background band, helpers.mjs machine())
      const M = machine();
      console.log(`      the ceilings here: × ${fmt(M.k, 2)} (the reference loop in ${fmt(M.ms, 0)} ms, the foreground ${fmt(M.ms / M.k, 1)}); the worst tick in the foreground's terms ${fmt(all.max / M.k, 3)} ms`);
      assert(all.mean <= 0.1 * M.k && all.max <= 4 * M.k, JSON.stringify({ ...all, k: M.k }));
    },
  },
];
