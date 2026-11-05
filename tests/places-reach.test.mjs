// places-reach: every spot of the test rooms reachable for every clearance class, then walked (PLACES
// §9.6, §11; the build sheet 0.0.2 §5.3). "Pathfinding that works 100% of the time" (the user,
// tradecraft, 2026-10-26) is a test, not a hope.
//
// By A*: from the spawn and from every spot to every other, for C0, C1 and C2; a pair is reached when
// a way is found that ends within REACH_SLACK_M 0.5 m of the spot (a spot's own cell may not be free
// for a wide class: a locker's spot between two racks takes a C2 suit a quarter metre over). Then
// lived: the walker bot goes from the spawn to every spot in C0 through the movement layer, as the
// player's keys would, set back to the spawn before each.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { CLASSES, buildGrid, path } from '../src/sim/places/nav.js';
import { spotsOfArea } from '../src/sim/places/fixtures.js';
import { walkRoom, REACH_SLACK_M } from './bots/walker.mjs';

export default [
  {
    name: 'every spot of the test rooms is reachable from the spawn and from every other spot, for C0, C1 and C2, by A*',
    fn() {
      const spots = spotsOfArea(TEST_AREA), origins = [{ id: 'spawn', x: TEST_AREA.spawn.x, z: TEST_AREA.spawn.z }, ...spots];
      const uses = {};
      for (const s of spots) uses[s.use] = (uses[s.use] ?? 0) + 1;
      console.log(`      ${spots.length} spots on ${TEST_AREA.fixtures.length} fixtures (${Object.entries(uses).map(([u, n]) => `${u} ${n}`).join(', ')})`);
      for (const cls of Object.keys(CLASSES)) {
        const g = buildGrid(TEST_AREA, cls), bad = [];
        let pairs = 0, worstGap = 0, longest = 0, maxExp = 0;
        for (const o of origins) for (const s of spots) {
          if (o.id === s.id) continue;
          pairs++;
          const r = path(g, [o.x, o.z], [s.x, s.z]);
          if (r.fail) { bad.push(`${o.id} → ${s.id}: ${r.fail}`); continue; }
          const end = r.pts[r.pts.length - 1], gap = Math.sqrt((end[0] - s.x) ** 2 + (end[1] - s.z) ** 2);
          worstGap = Math.max(worstGap, gap); longest = Math.max(longest, r.lengthM); maxExp = Math.max(maxExp, r.expanded);
          if (gap > REACH_SLACK_M) bad.push(`${o.id} → ${s.id}: ends ${fmt(gap, 2)} m short`);
        }
        console.log(`      ${cls}: ${pairs} pairs, ${bad.length} unreachable; the longest way ${fmt(longest, 2)} m, the most expansions ${maxExp}, the widest end gap ${fmt(worstGap, 3)} m`);
        assert(!bad.length, bad.slice(0, 5).join('\n'));
      }
    },
  },
  {
    name: 'the walker reaches every spot from the spawn through the movement layer (C0, walking)',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 1 }), t0 = performance.now();
      const { spots } = walkRoom(g, { cls: 'C0' });
      const ms = performance.now() - t0, ok = spots.filter(s => s.reached), failed = spots.filter(s => !s.reached);
      const metres = ok.reduce((n, s) => n + (s.lengthM ?? 0), 0), ticks = ok.reduce((n, s) => n + s.ticks, 0);
      console.log(`      ${ok.length} of ${spots.length} reached, ${failed.length} failed; ${fmt(metres, 1)} m planned, ${ticks} ticks lived (${fmt(ticks / 20 / 60, 1)} game minutes) in ${fmt(ms, 0)} ms`);
      for (const s of spots) console.log(`        ${s.reached ? 'reached' : 'FAILED '} ${s.id.padEnd(22)} ${s.use.padEnd(8)} ${fmt(s.lengthM ?? 0, 2).padStart(6)} m ${String(s.ticks).padStart(4)} ticks, ${fmt(s.gapM, 2)} m off the spot, ${s.plans} plan${s.plans === 1 ? '' : 's'}${s.reason ? `: ${s.reason}` : ''}`);
      assert(!failed.length, failed.map(s => `${s.id}: ${s.reason ?? `${s.gapM} m off`}`).join('; '));
      assert(g.me().x === TEST_AREA.spawn.x && g.me().z === TEST_AREA.spawn.z, 'the game set back to the spawn after the walks');
    },
  },
];
