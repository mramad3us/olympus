// places-reach: every spot of the test rooms reachable for every clearance class, then walked (PLACES
// §9.6, §11; the build sheet 0.0.2 §5.3). "Pathfinding that works 100% of the time" (the user,
// tradecraft, 2026-10-26) is a test, not a hope.
//
// By A*: from the spawn and from every spot to every other, for C0, C1 and C2; a pair is reached when
// a way is found that ends within REACH_SLACK_M 0.5 m of the spot (a spot's own cell may not be free
// for a wide class: a locker's spot between two racks takes a C2 suit a quarter metre over). Then
// lived: the walker bot goes from the spawn to every spot in C0 through the movement layer, as the
// player's keys would, set back to the spawn before each.
//
// 0.0.3 (the build sheet 0.0.3 §5.1): every spot of Echo Company's two floors from every portal into
// them (the arrivals of the stairs and of the outside doors), for C0, C1 and C2, the doors open (a door
// is R away). Answered by a flood over the very graph A* searches (8 ways, a diagonal only where both
// its sides are free), which reaches a cell exactly when A* finds a way to it, from each portal once
// instead of a solve a pair; a spot counts as A* counts it (its own cell, or the nearest free cell
// within NEAREST_FREE_M, then REACH_SLACK_M). A* itself is run on a seeded sample of the pairs and
// must agree. The lived walk of both floors is places-walkers' (heavy).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { ECHO_1, ECHO_2 } from '../src/sim/places/echo.js';
import { AREA_RECORDS } from '../src/sim/places/model.js';
import { CLASSES, buildGrid, path, cellOf, centreOf, nearestFree } from '../src/sim/places/nav.js';
import { spotsOfArea } from '../src/sim/places/fixtures.js';
import { stream, int } from '../src/core/rng.js';
import { walkRoom, REACH_SLACK_M } from './bots/walker.mjs';

// (every cell reached from a point over A*'s graph: a byte a cell)
function flood(grid, x, z) {
  const seen = new Uint8Array(grid.nx * grid.nz), c0 = cellOf(grid, x, z), start = c0 >= 0 && grid.cost[c0] !== 255 ? c0 : nearestFree(grid, x, z);
  if (start < 0) return seen;
  const q = new Int32Array(grid.nx * grid.nz), nx = grid.nx, nz = grid.nz, free = (k) => grid.cost[k] !== 255;
  let h = 0, t = 0;
  q[t++] = start; seen[start] = 1;
  while (h < t) {
    const u = q[h++], i = u % nx, j = (u - i) / nx;
    const W = i > 0 && free(u - 1), E = i < nx - 1 && free(u + 1), N = j > 0 && free(u - nx), S = j < nz - 1 && free(u + nx);
    const go = (v) => { if (!seen[v] && free(v)) { seen[v] = 1; q[t++] = v; } };
    if (W) go(u - 1); if (E) go(u + 1); if (N) go(u - nx); if (S) go(u + nx);
    if (N && W) go(u - nx - 1); if (N && E) go(u - nx + 1); if (S && W) go(u + nx - 1); if (S && E) go(u + nx + 1);
  }
  return seen;
}
// (a spot's end cell as A* takes it, and its gap)
function endOf(grid, s) {
  const c = cellOf(grid, s.x, s.z);
  if (c >= 0 && grid.cost[c] !== 255) return { c, gap: 0 };
  const n = nearestFree(grid, s.x, s.z);
  if (n < 0) return { c: -1, gap: Infinity };
  const [x, z] = centreOf(grid, n);
  return { c: n, gap: Math.sqrt((x - s.x) ** 2 + (z - s.z) ** 2) };
}
// (the portals that arrive in an area: each other area's portal whose to is this one)
const arrivalsIn = (areaId) => Object.values(AREA_RECORDS).flatMap(a => (a.portals ?? []).filter(p => p.to.area === areaId).map(p => ({ id: `${p.id} from ${a.id}`, x: p.to.x, z: p.to.z })));

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
    name: 'every spot of Echo\'s two floors is reachable from every portal into them, for C0, C1 and C2, with the doors open (the build sheet 0.0.3 §5.1); A* agrees on a sample',
    fn() {
      for (const area of [ECHO_1, ECHO_2]) {
        const spots = spotsOfArea(area), origins = arrivalsIn(area.id), uses = {};
        for (const s of spots) uses[s.use] = (uses[s.use] ?? 0) + 1;
        console.log(`      ${area.id}: ${spots.length} spots on ${area.fixtures.length} fixtures (${Object.entries(uses).map(([u, n]) => `${u} ${n}`).join(', ')}); ${origins.length} portals in: ${origins.map(o => o.id).join(', ')}`);
        for (const cls of Object.keys(CLASSES)) {
          const t0 = performance.now(), g = buildGrid(area, cls, { closed: () => false }), bad = [];
          let worstGap = 0;
          for (const o of origins) {
            const seen = flood(g, o.x, o.z);
            for (const s of spots) {
              const e = endOf(g, s);
              if (e.c < 0 || !seen[e.c] || e.gap > REACH_SLACK_M) bad.push(`${o.id} → ${s.id}: ${e.c < 0 ? 'no free cell' : !seen[e.c] ? 'not reached' : `${fmt(e.gap, 2)} m off`}`);
              else worstGap = Math.max(worstGap, e.gap);
            }
          }
          const floodMs = performance.now() - t0;
          // (A* on 60 pairs drawn by a seeded stream: it must find a way exactly where the flood did)
          const r = stream('places-reach', area.id, cls);
          let disagree = 0, maxExp = 0, longest = 0;
          for (let k = 0; k < 60; k++) {
            const o = origins[int(r, origins.length)], s = spots[int(r, spots.length)], res = path(g, [o.x, o.z], [s.x, s.z]), e = endOf(g, s);
            const flooded = e.c >= 0 && flood(g, o.x, o.z)[e.c] === 1;
            if (!!res.fail === flooded) disagree++;
            if (!res.fail) { maxExp = Math.max(maxExp, res.expanded); longest = Math.max(longest, res.lengthM); }
          }
          console.log(`        ${cls} (r ${CLASSES[cls]} m): ${origins.length * spots.length} pairs, ${bad.length} unreachable, the widest end gap ${fmt(worstGap, 3)} m, flooded in ${fmt(floodMs, 0)} ms; A* on 60 pairs: ${disagree} disagreeing, the longest ${fmt(longest, 1)} m, the most expansions ${maxExp}`);
          assert(!bad.length, bad.slice(0, 6).join('\n'));
          assert(disagree === 0, `A* and the flood disagree on ${disagree} pairs`);
        }
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
