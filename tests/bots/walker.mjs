// OLYMPUS bots: the walker (TECH §13.2, ROADMAP §4.1's walk test): a site plan's sol walked leg by leg, and a room's every spot.
//
// Two jobs, both measured, both printed by their tests:
//   walkPlan(plan, legs)  the walk test (places-walk-sol). Each leg (from one waypoint to another)
//                         is routed on the plan's site graph (graph.js route: the shortest by the
//                         edges' polyline lengths); then each ground edge of the route is measured
//                         by A* on a window of the ground (nav.js groundGrid round the edge, the
//                         clearance class's grid, its costs by surface), and each interior edge by its
//                         polyline (Echo's floor is not a live area until 0.0.4). The leg's length is
//                         their sum, its time that over the walking speed. Speeds: BODY §16.1's 1.14
//                         m/s walk on Mars (WALK_MS), ROADMAP's earlier 1.2, and PLACES's brisk
//                         1.32 (Froude 0.5), all printed (build sheet §8 item 2). Edge measures are
//                         memoised per plan, edge and class (a test-side cache).
//   walkRoom(game)        every spot of the live area from the spawn, lived: the game is set back to
//                         its start for each spot, and a goTo bot walks there through the movement
//                         layer (move.js), as the player's keys would.
//   walkFloors(game)      (0.0.3) every spot of both of Echo's floors in one tour through the movement
//                         layer, up the east stair and down again, doors opened by R.
//   walkToFences(game)    (0.0.3) from the player's berth out of Echo's front door, then along the
//                         ground's waypoint graph to the inside of each of the four gates in turn.
//   melasGame(createGame) (0.0.3) a game with the player at their berth: people's barracks scenario
//                         where it exists, else the sandbox moved into Echo (a local fixture).
// REF_SOL is TIME §9.2's training sol as PLACES §4.3 counts it (three chow windows, six head visits,
// three formations, the armoury at maintenance, the evening in the barracks), in the build sheet's
// twenty legs (§5.3): marches to and from blocks and PT's run are the Corps moving you (TIME's
// `march`), not walked. GYM_EVENING puts the head → battalion gym → head for legs 18 and 19 (the
// lounge's). The mess is walked door to door until its floor is built (0.0.9).
import { siteGraph, route } from '../../src/sim/places/graph.js';
import { groundGrid, path, octileM } from '../../src/sim/places/nav.js';
import { WALK_MS } from '../mars-gaits.mjs';
import { spotsOfArea } from '../../src/sim/places/fixtures.js';
import { areaOf } from '../../src/sim/places/model.js';
import { moveTo } from '../../src/sim/places/portals.js';
import { MELAS_PLAN } from '../../src/sim/places/siteplan.js';
import { SCENARIOS } from '../../src/sim/game.js';
import { goTo, crossTo, plan, runBot, ARRIVE_M } from './lib.mjs';

/** The training sol's walking, at most, in real minutes (ROADMAP §4.1). */
export const SOL_WALK_MAX_MIN = 12;
/** The sol with an evening at the battalion gym, at most, in real minutes (PLACES §4.3). */
export const GYM_EVENING_MAX_MIN = 15;
/** The speeds the walk test prints, m/s: BODY's walk, ROADMAP's earlier 1.2, PLACES's brisk walk. */
export const SPEEDS_MS = Object.freeze([WALK_MS, 1.2, 1.32]);
/** The ground kept round an edge for its A* window, metres. */
export const EDGE_WINDOW_M = 20;
/** A spot is reached when a walk ends this near it (its own cell may not be free for a class: a locker's spot between two racks). */
export const REACH_SLACK_M = 0.5;

const L = (n, from, to, why) => Object.freeze({ n, from, to, why });
/** The reference training sol's walks, leg by leg (the build sheet §5.3). */
export const REF_SOL = Object.freeze([
  L(1, 'w:echo:rack', 'w:echo:head', 'reveille, the head'),
  L(2, 'w:echo:head', 'w:echo:rack', 'back to dress'),
  L(3, 'w:echo:rack', 'w:echo:street', '05:45 PT muster'),
  L(4, 'w:echo:street', 'w:echo:head', '06:45 the shower'),
  L(5, 'w:echo:head', 'w:echo:rack', 'dress'),
  L(6, 'w:echo:rack', 'w:mess:north', '06:50 chow'),
  L(7, 'w:mess:north', 'w:echo:street', '07:50 formation'),
  L(8, 'w:echo:street', 'w:echo:head', '11:30, marched back'),
  L(9, 'w:echo:head', 'w:mess:north', 'noon chow'),
  L(10, 'w:mess:north', 'w:echo:street', '12:40 formation'),
  L(11, 'w:echo:street', 'w:armoury:window', '16:30 maintenance: draw the rifle'),
  L(12, 'w:armoury:window', 'w:canopy', 'clean it'),
  L(13, 'w:canopy', 'w:armoury:window', 'turn it in'),
  L(14, 'w:armoury:window', 'w:echo:head', 'wash up'),
  L(15, 'w:echo:head', 'w:mess:north', '17:15 evening chow'),
  L(16, 'w:mess:north', 'w:echo:rack', '18:30 mail call'),
  L(17, 'w:echo:rack', 'w:echo:head', 'the evening shower'),
  L(18, 'w:echo:head', 'w:echo:lounge', 'the lounge'),
  L(19, 'w:echo:lounge', 'w:echo:head', 'the head before taps'),
  L(20, 'w:echo:head', 'w:echo:rack', 'taps'),
]);
/** The same sol with an evening at the battalion gym instead of the lounge (legs 18 and 19). */
export const GYM_EVENING = Object.freeze(REF_SOL.map(l => (l.n === 18 ? L(18, 'w:echo:head', 'w:gym:west', 'the battalion gym') : l.n === 19 ? L(19, 'w:gym:west', 'w:echo:head', 'the head before taps') : l)));

const edgeCache = new Map();
/** Forget the measured edges (a fresh run). */
export const resetWalker = () => edgeCache.clear();

/** One ground edge measured by A* on a window of the ground: { polyM, astarM, expanded, cells, octM, fail }. */
export function measureEdge(plan, e, cls = 'C0') {
  const key = `${plan.id}|${e.a}|${e.b}|${cls}`;
  if (edgeCache.has(key)) return edgeCache.get(key);
  const xs = e.pts.map(p => p[0]), zs = e.pts.map(p => p[1]);
  const win = [Math.min(...xs) - EDGE_WINDOW_M, Math.min(...zs) - EDGE_WINDOW_M, Math.max(...xs) + EDGE_WINDOW_M, Math.max(...zs) + EDGE_WINDOW_M];
  const grid = groundGrid(plan, win, cls);
  const a = e.pts[0], b = e.pts[e.pts.length - 1];
  const r = path(grid, a, b, { cap: grid.nx * grid.nz });
  const out = r.fail ? { polyM: e.lengthM, astarM: null, expanded: r.expanded, fail: r.fail }
    : { polyM: e.lengthM, astarM: r.lengthM, expanded: r.expanded, cells: grid.nx * grid.nz, octM: octileM(grid, r.cells), pts: r.pts };
  edgeCache.set(key, out);
  return out;
}

/** Every ground edge of a plan measured: [{ a, b, role, polyM, astarM, diffFrac, expanded }], plus the time taken. */
export function measureEdges(plan, { cls = 'C0' } = {}) {
  const g = siteGraph(plan), t0 = performance.now();
  const edges = g.edges.filter(e => e.kind === 'ground' && e.lengthM > 0).map(e => {
    const m = measureEdge(plan, e, cls);
    return { a: e.a, b: e.b, role: e.role, polyM: m.polyM, astarM: m.astarM, diffFrac: m.astarM === null ? null : Math.abs(m.astarM - m.polyM) / m.polyM, expanded: m.expanded, fail: m.fail ?? null };
  });
  return { edges, ms: performance.now() - t0 };
}

/**
 * The walk test over a plan: { legs: [{ n, from, to, why, lengthM, s, edges }], totalM, minutes (one
 * per speed), speedsMs, computeMs }. A leg with no route has lengthM null and a reason.
 */
export function walkPlan(plan, legs, { cls = 'C0', speedsMs = SPEEDS_MS } = {}) {
  const t0 = performance.now(), g = siteGraph(plan), out = [];
  let totalM = 0;
  for (const leg of legs) {
    const r = route(g, leg.from, leg.to);
    if (!r) { out.push({ ...leg, lengthM: null, s: null, reason: 'no route' }); continue; }
    let m = 0, ground = 0, interior = 0;
    for (const e of r.legs) {
      if (e.kind === 'interior') { m += e.lengthM; interior += e.lengthM; continue; }
      const me = measureEdge(plan, { ...e, pts: e.pts }, cls);
      const len = me.astarM ?? me.polyM;
      m += len; ground += len;
    }
    const lengthM = Math.round(m * 10) / 10;
    totalM += m;
    out.push({ ...leg, lengthM, s: Math.round(m / speedsMs[0] * 10) / 10, groundM: Math.round(ground * 10) / 10, interiorM: Math.round(interior * 10) / 10, graphM: Math.round(r.lengthM * 10) / 10, via: r.ids.length });
  }
  return { legs: out, totalM: Math.round(totalM * 10) / 10, minutes: speedsMs.map(v => totalM / v / 60), speedsMs: [...speedsMs], computeMs: performance.now() - t0 };
}

/**
 * Every spot of the live area walked from the game's state as it is (the spawn, for a new sandbox),
 * through the movement layer: { spots: [{ id, reached, lengthM, ticks, reason, gapM }] }. The game is
 * set back to where it started before each walk, and after the last.
 */
export function walkRoom(game, { cls = 'C0', maxTicks = 20 * 120 } = {}) {
  const start = game.save(), area = areaOf(game.state.places.live.area), out = [];
  for (const s of spotsOfArea(area)) {
    game.load(start);
    const r = runBot(game, plan([goTo(s.id, { cls })]), { maxTicks });
    const me = game.me(), log = me.bot?.plan?.log ?? [], first = log[0] ?? {};
    const gapM = Math.sqrt((me.x - s.x) ** 2 + (me.z - s.z) ** 2);
    out.push({ id: s.id, use: s.use, reached: r.done && gapM <= REACH_SLACK_M, lengthM: first.lengthM ?? me.bot?.plan?.m?.lengthM ?? null, ticks: r.ticks, reason: r.reason, gapM: Math.round(gapM * 1000) / 1000, plans: first.plans ?? me.bot?.plan?.m?.plans ?? null });
  }
  game.load(start);
  return { spots: out };
}

// ---- 0.0.3: the barracks' floors and the base's fences, lived (the build sheet 0.0.3 §2.1, §5.1) ----

/** Where the 1st Squad's player sleeps: the foot of rack n1 in bay-2-1, facing down (the sheet's §2.1 table). */
export const BERTH_FOOT = Object.freeze({ area: 'melas.echo.1', x: 52.075, z: 3.3, face: 'down' });
/** Where the walk to the fences ends at each gate: 1.5 m inside it (the gates are closed this release: the sheet's §8 item 19). */
export const GATE_INSIDE_M = 1.5;
/** A walk along the ground's waypoint graph is cut into goTo legs this long (each inside the nav window), metres. */
export const ROUTE_LEG_M = 12;

/**
 * A headless game with the player at a point of Base Melas (BERTH_FOOT by default): people's barracks
 * scenario where game.js has it, else the sandbox with its player moved there by places' moveTo (a
 * local fixture until people's `barracks` lands: the round's rule).
 */
export function melasGame(createGame, { seed = 48213, hour = null, at = BERTH_FOOT, ...opts } = {}) {
  const g = createGame({ scenario: SCENARIOS.barracks ? 'barracks' : 'sandbox', seed, hour, ...opts });
  if (!SCENARIOS.barracks || at !== BERTH_FOOT) moveTo(g.state, g.me().id, at, null, { why: 'test' });
  g.clearFacts();
  return g;
}

// (a floor's spots, ordered nearest first from a point by straight distance: a tour)
function tourOf(area, from) {
  const left = spotsOfArea(area).slice(), out = [];
  let [x, z] = from;
  while (left.length) {
    let k = 0, best = Infinity;
    for (let i = 0; i < left.length; i++) { const d = (left[i].x - x) ** 2 + (left[i].z - z) ** 2; if (d < best) { best = d; k = i; } }
    const s = left.splice(k, 1)[0];
    out.push(s); x = s.x; z = s.z;
  }
  return out;
}

/**
 * Every spot of both of Echo's floors walked through the movement layer (the sheet's §5.1): floor 1's
 * spots in a nearest-first tour from where the player stands, up the east stair, floor 2's, and down
 * again, doors opened by R where they stand in the way. → { floors: { <area>: { spots, reached, failed:
 * [{ id, why }] } }, metres, ticks, doors, plans }.
 */
export function walkFloors(game, { cls = 'C0', maxTicks = 400_000 } = {}) {
  const me = game.me();
  const one = tourOf(areaOf('melas.echo.1'), [me.x, me.z]), two = tourOf(areaOf('melas.echo.2'), [80.95, 16.0]);
  const steps = [...one.map(s => goTo(s.id, { cls, area: 'melas.echo.1' })), crossTo({ area: 'melas.echo.2', x: 80.95, z: 16.0 }, { cls }),
    ...two.map(s => goTo(s.id, { cls, area: 'melas.echo.2' })), crossTo({ area: 'melas.echo.1', x: me.x, z: me.z }, { cls })];
  const spotsBy = [...one.map(s => ['melas.echo.1', s]), null, ...two.map(s => ['melas.echo.2', s]), null];
  const r = runBot(game, plan(steps, { keepGoing: true }), { maxTicks });
  const floors = { 'melas.echo.1': { spots: one.length, reached: 0, failed: [] }, 'melas.echo.2': { spots: two.length, reached: 0, failed: [] } };
  let metres = 0, doors = 0, plans = 0;
  for (const e of r.log) {
    metres += e.lengthM ?? 0; doors += e.doors ?? 0; plans += e.plans ?? 0;
    const sb = spotsBy[e.k];
    if (!sb) { if (e.fail) floors['melas.echo.2'].failed.push({ id: e.name, why: e.fail }); continue; }
    const [area, s] = sb, gap = Math.sqrt((e.x - s.x) ** 2 + (e.z - s.z) ** 2);
    if (e.done && e.area === area && gap <= REACH_SLACK_M) floors[area].reached++;
    else floors[area].failed.push({ id: s.id, why: e.fail ?? `${gap.toFixed(2)} m off in ${e.area}` });
  }
  return { floors, metres: Math.round(metres * 10) / 10, ticks: r.ticks, doors, plans, done: r.done, reason: r.reason, lastArea: game.state.places.live.area };
}

// (the ground's waypoint graph without the buildings' interiors: what an outdoor walk is routed on)
let groundOnly = null;
const groundGraph = () => (groundOnly ??= siteGraph({ ...MELAS_PLAN, interiors: {} }));
/** The gates in the order the walk visits them, with the point GATE_INSIDE_M inside each. */
export const FENCE_GATES = Object.freeze([
  Object.freeze({ id: 'w:gate:north', name: 'the North gate', inside: [550, GATE_INSIDE_M] }),
  Object.freeze({ id: 'w:gate:main', name: 'the main gate', inside: [GATE_INSIDE_M, 410] }),
  Object.freeze({ id: 'w:gate:east', name: 'the East gate', inside: [1000 - GATE_INSIDE_M, 410] }),
  Object.freeze({ id: 'w:gate:south', name: 'the South gate', inside: [550, 700 - GATE_INSIDE_M] }),
]);

// (a route on the ground graph from one waypoint to another as one polyline, its last point replaced)
function routeLine(fromId, toId, end = null) {
  const r = route(groundGraph(), fromId, toId);
  if (!r) return null;
  const pts = [];
  for (const l of r.legs) for (const p of l.pts) if (!pts.length || Math.abs(pts[pts.length - 1][0] - p[0]) + Math.abs(pts[pts.length - 1][1] - p[1]) > 1e-6) pts.push([p[0], p[1]]);
  if (end) pts[pts.length - 1] = end;
  return { pts, lengthM: r.lengthM };
}
// (a polyline cut into points every legM, its corners kept)
function legsOf(pts, legM) {
  const out = [];
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], L = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2), n = Math.max(1, Math.ceil(L / legM));
    for (let i = 1; i <= n; i++) out.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]);
  }
  return out;
}

/**
 * From where the player stands (their berth) out of Echo's front door, then along the ground's
 * waypoint graph to the inside of the North, main, East and South gates in turn (the sheet's §5.1),
 * each leg a plan of goTo legs of ROUTE_LEG_M on the ground's windows. onLeg(name, game) is called
 * after each leg (the test reads its counters there). → { legs: [{ name, metres, ticks, done, reason, end }] }.
 */
export function walkToFences(game, { cls = 'C0', onLeg = () => {}, maxTicks = 200_000 } = {}) {
  const legs = [];
  const run = (name, steps, metres) => {
    const t0 = game.state.clock.tick, r = runBot(game, plan(steps), { maxTicks }), me = game.me();
    game.me().bot = {};
    legs.push({ name, metres: Math.round(metres * 10) / 10, ticks: game.state.clock.tick - t0, done: r.done, reason: r.reason, end: [me.x, me.z], area: game.state.places.live.area });
    onLeg(name, game);
  };
  run('out of the front door', [crossTo({ area: 'melas.ground', x: 522, z: 216.5 }, { cls })], 0);
  legs[0].metres = Math.round((game.me().bot?.plan?.log?.[0]?.lengthM ?? 0) * 10) / 10;
  let from = 'w:echo:front';
  for (const gt of FENCE_GATES) {
    const line = routeLine(from, gt.id, gt.inside);
    if (!line) { legs.push({ name: gt.name, done: false, reason: 'no route' }); continue; }
    const pts = legsOf(line.pts, ROUTE_LEG_M);
    run(`to ${gt.name}`, pts.map((p, i) => goTo(p, { cls, area: 'melas.ground', arriveM: i === pts.length - 1 ? ARRIVE_M : 0.6, openDoors: false })), line.lengthM);
    from = gt.id;
  }
  return { legs };
}
