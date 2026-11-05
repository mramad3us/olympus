// places-nav: the fine grid per clearance class, A* on its heap, string pulling, the ground waypoint
// edges against A*, the path requests' deterministic delivery, and the player's walk (PLACES §2.1,
// §2.2, §1.9; the build sheet 0.0.2 §5.3).
//
// The delivery test needs solves over PATH_NODES_TICK 8,000 expansions, which the test rooms cannot
// give (their C0 grid has 3,471 free cells), so it sets a window of Base Melas's ground (the Two-Four
// lines) as the nav grid of the area 'melas.ground' in the state's runtime cache, as the chunk
// builder will at 0.1, and sets it again after a load (the grid is a pure function of the plan).
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { MELAS_PLAN } from '../src/sim/places/siteplan.js';
import {
  CELL_M, CLASSES, NODE_CAP, PATH_NODES_TICK, PATH_SOLVES_TICK, buildGrid, groundGrid, path, octileM, centreOf, freeCount,
  navStats, navOf, requestPath, pathEstimate, cellOf, remarkOpening,
} from '../src/sim/places/nav.js';
import { setOpening } from '../src/sim/places/model.js';
import { WALK_MS, RUN_MS, STROLL_MS, POS_STEP_M, faceOf, speedOf } from '../src/sim/places/move.js';
import { WAYPOINT_AGREE_FRAC } from '../src/sim/places/graph.js';
import { measureEdges } from './bots/walker.mjs';
import { stream, int } from '../src/core/rng.js';
import { TICK_MS } from '../src/core/clock.js';

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; };
/** The ground window the nav tests use: 64 m round Echo's door and the company street (a near ring's size). */
const LINES_WINDOW = Object.freeze([490, 196, 554, 260]);
/** The whole of the Two-Four lines (PLACES §4.1), for solves long enough to overrun a tick. */
const LINES_RING = Object.freeze([410, 182, 764, 360]);

// (random free pairs of a grid, by a seeded stream: the same pairs every run)
function pairsOf(grid, n, name) {
  const free = [];
  for (let k = 0; k < grid.cost.length; k++) if (grid.cost[k] !== 255) free.push(k);
  const r = stream('places-nav', name);
  return Array.from({ length: n }, () => [centreOf(grid, free[int(r, free.length)]), centreOf(grid, free[int(r, free.length)])]);
}
function bench(grid, pairs) {
  for (const [a, b] of pairs.slice(0, 50)) path(grid, a, b);       // (warm-up)
  const s0 = navStats(), us = [], exp = [], ratio = [];
  let fails = 0;
  for (const [a, b] of pairs) {
    const t = performance.now(), r = path(grid, a, b);
    us.push((performance.now() - t) * 1000); exp.push(r.expanded);
    if (r.fail) { fails++; continue; }
    const o = octileM(grid, r.cells);
    if (o > 0) ratio.push(r.lengthM / o);
  }
  const s1 = navStats();
  return { us, exp, fails, ratio: ratio.reduce((s, x) => s + x, 0) / ratio.length, allocs: s1.scratchAllocs - s0.scratchAllocs, grows: s1.heapGrows - s0.heapGrows };
}

export default [
  {
    name: 'the test rooms\' grids: free cells per class, both doors passing C0, C1 and C2',
    fn() {
      for (const cls of Object.keys(CLASSES)) {
        const g = buildGrid(TEST_AREA, cls);
        const toBay = path(g, [10, 1.2], [26, 6]), toOffice = path(g, [10, 1.2], [42, 6]);
        console.log(`      ${cls} (r ${CLASSES[cls]} m): ${g.nx} × ${g.nz} cells of ${CELL_M} m, ${freeCount(g)} free; hall → bay ${fmt(toBay.lengthM, 2)} m, hall → office ${fmt(toOffice.lengthM, 2)} m`);
        assert(!toBay.fail && !toOffice.fail, JSON.stringify({ cls, toBay: toBay.fail, toOffice: toOffice.fail }));
      }
    },
  },
  {
    name: 'a door closed re-marks only the cells round its leaf, and the same grid as a full rebuild',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 1 });
      const grids = Object.keys(CLASSES).map(cls => navOf(g.state, 'test.rooms', cls));
      const before = grids.map(gr => gr.cost.slice());
      const changed = setOpening(g.state, 'o:t1:office', 'closed');
      const per = grids.map((gr, k) => { let n = 0; for (let i = 0; i < gr.cost.length; i++) if (gr.cost[i] !== before[k][i]) n++; return n; });
      const rebuilt = Object.keys(CLASSES).map(cls => buildGrid(TEST_AREA, cls, { opening: (o) => (o.id === 'o:t1:office' ? 'closed' : o.state) }));
      const same = grids.every((gr, k) => gr.cost.every((c, i) => c === rebuilt[k].cost[i]));
      const blocked = path(grids[0], [10, 1.2], [42, 6]);
      requestPath(g.state, { who: 'a1', area: 'test.rooms', cls: 'C0', from: [24.9, 4.4], to: [42, 6] });
      g.step(2);
      const answer = g.facts('path-done').at(-1);
      console.log(`      closed: ${changed} cells re-marked over three classes (${per.join(', ')}); the office ${blocked.fail} by A*, the request answered '${answer?.reason}'; the save holds ${JSON.stringify(g.state.places.sites.test.openings)}`);
      assert(same, 'the re-marked grids equal a full rebuild with the door closed');
      assert(per.every(n => n > 0 && n < 40), JSON.stringify(per));
      assert(blocked.fail === 'blocked' && answer?.reason === 'locked', JSON.stringify({ blocked: blocked.fail, answer }));
      setOpening(g.state, 'o:t1:office', 'open');
      assert(grids.every((gr, k) => gr.cost.every((c, i) => c === before[k][i])), 'reopened: the grids as they were');
      assert(g.state.places.sites.test.openings === undefined, `reopened: no delta left in the save: ${JSON.stringify(g.state.places.sites.test)}`);
    },
  },
  {
    name: 'a door toggled where two rooms of different surfaces share an edge on a cell centre leaves the grid a full rebuild gives (0.0.2: 2 cells differed)',
    fn() {
      // (a synthetic area: floor from z 0 to 3.125, a wet floor from 3.125, a door on that line; the grid's
      // origin is z -0.5, so the line falls on the centre of the row from 3.0 to 3.25)
      const area = Object.freeze({
        id: 'test.shared', kind: 'floor', boundsM: Object.freeze({ x0: 0, z0: 0, x1: 4, z1: 6 }),
        rooms: Object.freeze([
          Object.freeze({ id: 's.dry', kind: 'hall', rect: Object.freeze([0, 0, 4, 3.125]) }),
          Object.freeze({ id: 's.wet', kind: 'head', surface: 'wet', rect: Object.freeze([0, 3.125, 4, 6]) }),
        ]),
        openings: Object.freeze([Object.freeze({ id: 'o:s:door', kind: 'door', axis: 'x', at: 3.125, a: 1.5, b: 2.5, rooms: ['s.dry', 's.wet'], state: 'open' })]),
        fixtures: Object.freeze([]),
      });
      const rows = [];
      for (const cls of Object.keys(CLASSES)) {
        const live = buildGrid(area, cls), fresh = buildGrid(area, cls);
        remarkOpening(live, area, 'o:s:door', 'closed');
        remarkOpening(live, area, 'o:s:door', 'open');
        let differ = 0;
        for (let k = 0; k < live.cost.length; k++) if (live.cost[k] !== fresh.cost[k]) differ++;
        const closed = buildGrid(area, cls, { opening: () => 'closed' }), shut = buildGrid(area, cls);
        remarkOpening(shut, area, 'o:s:door', 'closed');
        let differShut = 0;
        for (let k = 0; k < shut.cost.length; k++) if (shut.cost[k] !== closed.cost[k]) differShut++;
        rows.push(`${cls}: closed then opened, ${differ} cells differ from a fresh build; closed, ${differShut} from a build with it closed`);
        assert(differ === 0 && differShut === 0, `${cls}: ${differ}, ${differShut}`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'A* on 1,000 random free pairs in the test rooms and a ground window of the Two-Four lines: all found, p95 at most 2 ms, no allocation per solve',
    fn() {
      const rooms = buildGrid(TEST_AREA, 'C0'), ground = groundGrid(MELAS_PLAN, LINES_WINDOW, 'C0');
      for (const [name, grid] of [['the test rooms', rooms], [`the lines' ground ${JSON.stringify(LINES_WINDOW)}`, ground]]) {
        const b = bench(grid, pairsOf(grid, 1000, name));
        console.log(`      ${name}: ${grid.nx * grid.nz} cells, ${freeCount(grid)} free; µs p50 ${fmt(q(b.us, 0.5), 0)}, p95 ${fmt(q(b.us, 0.95), 0)}, max ${fmt(Math.max(...b.us), 0)}; expansions p50 ${q(b.exp, 0.5)}, p95 ${q(b.exp, 0.95)}, max ${Math.max(...b.exp)}; pulled over octile ${fmt(b.ratio, 3)}; scratch allocations ${b.allocs}, heap growths ${b.grows}`);
        assert(b.fails === 0, `${name}: ${b.fails} pairs not found`);
        assert(q(b.us, 0.95) <= 2000, `${name}: p95 ${q(b.us, 0.95)} µs`);
        assert(b.allocs === 0 && b.grows === 0, JSON.stringify({ allocs: b.allocs, grows: b.grows }));
      }
      const est = pathEstimate(rooms, [24.9, 4.4], [26, 6]), far = pathEstimate(rooms, [1, 1], [47, 9]);
      console.log(`      estimates (cap 400): spawn to the bay's middle ${est} m; the hall's west end to the office's far corner '${far}'`);
      assert(typeof est === 'number' && far === 'far', JSON.stringify({ est, far }));
    },
  },
  {
    name: 'the ground waypoint edges agree with A* on the ground within 5%',
    fn() {
      const m = measureEdges(MELAS_PLAN), worst = m.edges.filter(e => e.astarM !== null).sort((a, b) => b.diffFrac - a.diffFrac || a.a.localeCompare(b.a));
      const fails = m.edges.filter(e => e.fail);
      console.log(`      ${m.edges.length} ground edges of ${MELAS_PLAN.id} measured in ${fmt(m.ms, 0)} ms; ${fails.length} not found; the worst five:`);
      for (const e of worst.slice(0, 5)) console.log(`        ${e.a} → ${e.b} (${e.role}): polyline ${fmt(e.polyM, 2)} m, A* ${fmt(e.astarM, 2)} m, ${fmt(e.diffFrac * 100, 2)}%, ${e.expanded} expansions`);
      assert(!fails.length, JSON.stringify(fails.slice(0, 3)));
      assert(worst[0].diffFrac <= WAYPOINT_AGREE_FRAC, JSON.stringify(worst[0]));
    },
  },
  {
    name: 'path requests are delivered on dequeueTick + max(1, ceil(expanded / 8,000)), and the same after a save and load mid-queue',
    fn() {
      const ground = groundGrid(MELAS_PLAN, LINES_RING, 'C0');
      const setGround = (state) => { ((state.$places ??= {}).nav ??= {})['melas.ground'] = { C0: ground }; };
      // (twenty requests across the lines: a seeded mix of short ones and long ones round the buildings)
      const pairs = pairsOf(ground, 20, 'delivery');
      const run = (saveAt = null) => {
        let g = createGame({ scenario: 'sandbox', seed: 7 });
        setGround(g.state);
        const got = [];
        const hear = (G) => G.bus.on('path-done', (d) => got.push({ id: d.reqId, tick: G.state.clock.tick, ok: d.ok, lengthM: d.lengthM, reason: d.reason }));
        hear(g);
        pairs.forEach(([a, b], k) => { if (k < 12) requestPath(g.state, { who: 'a1', area: 'melas.ground', cls: 'C0', from: a, to: b }); });
        for (let t = 0; t < 40; t++) {
          if (t === 3) pairs.slice(12).forEach(([a, b]) => requestPath(g.state, { who: 'a1', area: 'melas.ground', cls: 'C0', from: a, to: b }));
          if (t === saveAt) {
            const json = g.save(), queued = g.state.places.nav.queue.length, pending = g.state.places.nav.pending.length, debt = g.state.places.nav.debtNodes;
            g = createGame({ scenario: 'sandbox', seed: 7 }); g.load(json); setGround(g.state); hear(g);
            got.push({ save: { atTick: g.state.clock.tick, queued, pending, debt } });
          }
          g.step(1);
        }
        return got;
      };
      const plain = run(), loaded = run(2);
      const save = loaded.find(x => x.save)?.save;
      // (the rule, worked out from the solves themselves: each tick pays the debt, then solves whole requests within its units)
      const expect = [], queue = pairs.map(([a, b], k) => ({ k, a, b, at: k < 12 ? 0 : 3 }));
      let debt = 0;
      for (let tick = 0, waiting = []; tick < 40; tick++) {
        waiting.push(...queue.filter(r => r.at === tick));
        let budget = PATH_NODES_TICK, solves = 0;
        const pay = Math.min(debt, budget); debt -= pay; budget -= pay;
        while (waiting.length && solves < PATH_SOLVES_TICK && budget > 0) {
          const r = waiting.shift(), res = path(ground, r.a, r.b); solves++;
          if (res.expanded > budget) { debt += res.expanded - budget; budget = 0; } else budget -= res.expanded;
          expect.push({ k: r.k, tick: tick + Math.max(1, Math.ceil(res.expanded / PATH_NODES_TICK)), expanded: res.expanded, fail: res.fail ?? null });
        }
      }
      const ticksOf = (got) => got.filter(x => !x.save).map(x => x.tick);
      const over = expect.filter(e => e.expanded > PATH_NODES_TICK);
      console.log(`      20 requests: expansions ${expect.map(e => e.expanded).join(', ')}`);
      console.log(`      ${over.length} over ${PATH_NODES_TICK}; ${expect.filter(e => e.fail).length} failed '${[...new Set(expect.filter(e => e.fail).map(e => e.fail))].join(', ')}' (NODE_CAP ${NODE_CAP})`);
      console.log(`      delivered on ticks ${ticksOf(plain).join(', ')} (expected ${expect.map(e => e.tick).sort((a, b) => a - b).join(', ')})`);
      console.log(`      saved after tick ${save?.atTick} with ${save?.queued} queued, ${save?.pending} pending, ${save?.debt} expansions of debt; delivered after the load on ${ticksOf(loaded).join(', ')}`);
      assert(over.length >= 2, `some requests over ${PATH_NODES_TICK} expansions: ${over.length}`);
      assert(ticksOf(plain).length === 20 && JSON.stringify(ticksOf(plain)) === JSON.stringify(expect.map(e => e.tick).sort((a, b) => a - b)), JSON.stringify({ got: ticksOf(plain), expect: expect.map(e => e.tick) }));
      assert(save && (save.queued > 0 || save.pending > 0), JSON.stringify(save));
      assert(JSON.stringify(plain) === JSON.stringify(loaded.filter(x => !x.save)), 'the same deliveries, ticks and lengths across a save and load');
    },
  },
  {
    name: 'walking, running and strolling over 100 ticks in the hallway: 1.14, 2.69 and 0.75 m/s within 0.5%; a wall stops one axis while the other slides; the doorway passes; facing follows the keys',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 1 }), start = g.save();
      const put = (x, z, face = 'right') => { g.load(start); Object.assign(g.me(), { x, z, face }); };
      const rows = [];
      for (const [gait, inp, want] of [['walk', { mx: 1 }, WALK_MS], ['run', { mx: 1, run: true }, RUN_MS], ['stroll', { mx: 1, stroll: true }, STROLL_MS], ['run over stroll', { mx: 1, run: true, stroll: true }, RUN_MS]]) {
        put(3, 1.2);
        const x0 = g.me().x;
        g.step(100, inp);
        const ms = (g.me().x - x0) / (100 * TICK_MS / 1000);
        rows.push(`${gait} ${fmt(ms, 3)} m/s (gait '${g.me().gait}', stride ${fmt(g.me().strideM, 2)} m)`);
        near(ms, want, want * 0.005, `${gait}:`);
        assert(g.me().gait === (gait === 'run over stroll' ? 'run' : gait), `${gait}: gait ${g.me().gait}`);
      }
      // (a diagonal: the same speed; up against the hallway's north wall, z stops and x slides on)
      put(10, 1.2);
      g.step(20, { mx: 1, mz: -1 });
      const dM = Math.sqrt((g.me().x - 10) ** 2 + (g.me().z - 1.2) ** 2), diagMs = dM / 1;
      put(14, 0.6);                                                 // (east of the hallway's bin at x 12)
      g.step(60, { mx: 1, mz: -1 });
      const slid = { x: g.me().x, z: g.me().z };
      // (south through the bay's doorway, from the hallway; west into the bay's west wall, which stops it)
      put(28.4, 1.2);
      g.step(60, { mz: 1 });
      const through = g.me().z;
      put(21.5, 5.0);
      g.step(40, { mx: -1 });
      const stopped = g.me().x;
      rows.push(`diagonal ${fmt(diagMs, 3)} m/s; against the north wall z held at ${fmt(slid.z, 3)} while x slid to ${fmt(slid.x, 2)}; south through the doorway to z ${fmt(through, 2)}; west against the bay's wall stopped at x ${fmt(stopped, 3)}`);
      const faces = [['right', 1, 0], ['right', 0, -1], ['up', 1, -1], ['up', -1, 0], ['left', 1, 1], ['down', 0, 0]].map(([f, mx, mz]) => `${f}+(${mx},${mz})→${faceOf(mx, mz, f)}`);
      rows.push(`facing: ${faces.join(' ')}; speedOf(no keys) ${speedOf({ mx: 0, mz: 0, run: true })}; positions on a ${POS_STEP_M} m step`);
      for (const r of rows) console.log(`      ${r}`);
      near(diagMs, WALK_MS, WALK_MS * 0.005, 'diagonal:');
      assert(slid.z < 0.6 && slid.z >= 0.25 && slid.x > 16.3, JSON.stringify(slid));
      assert(through > 2.4 + 0.5, `through the doorway: z ${through}`);
      assert(stopped > 20.08 + 0.27 - 0.06 && stopped < 20.75, `stopped by the wall: x ${stopped}`);
      assert(faces.join(' ') === 'right+(1,0)→right right+(0,-1)→up up+(1,-1)→up up+(-1,0)→left left+(1,1)→down down+(0,0)→down', faces.join(' '));
      assert(cellOf(navOf(g.state, 'test.rooms', 'C0'), g.me().x, g.me().z) >= 0, 'on the grid');
    },
  },
];
