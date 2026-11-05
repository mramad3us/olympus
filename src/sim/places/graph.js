// OLYMPUS places: the site graph and the room graph, and routes over them (PLACES §1.9, §2.3).
//
// Navigation is three-level (PLACES's summary): the fine A* on the 0.25 m grid inside the live area
// (nav.js), the room graph of a floor's openings to pick which rooms a route crosses, and the site
// graph across a site and for everyone off-map. This module holds the two coarse ones.
//   - siteGraph(plan): a site plan's waypoints (doors 0.5 m outside their footprints, gates, muster
//     marks, junctions of roads and paths) and its buildings' interior routes, joined by edges whose
//     lengths are the polylines' (computed, never authored: Math.sqrt per segment, rounded to the
//     millimetre). An edge is 'ground' (the ground waypoint graph, PLACES §1.9: what long outdoor
//     routes are planned on, checked against A* on the ground within WAYPOINT_AGREE_FRAC 5%) or
//     'interior' (a building's route, by polyline until its floor is a live area). Cached per plan.
//   - roomGraph(area, grid): the openings of a floor as nodes, joined across each room by the A*
//     length between them on the grid given (PLACES §1.9). Cached per area and class. Solves use it
//     as a corridor from 0.0.4; this round it is built and measured.
//   - route(graph, from, to): Dijkstra by length, the frontier's ties by cmpId (TECH §2.3.1), so a
//     route is the same in every run: { ids, lengthM, legs } or null when there is none.
// Edge weights are metres; TIME's seconds at a gait are the walker's to take (BODY's speeds).
import { cmpId } from '../../core/ids.js';
import { polylineM, path } from './nav.js';
import { planOf } from './plan.js';

/** Ground waypoint edges agree with A* on the ground within this fraction (PLACES §1.9, §9.6). */
export const WAYPOINT_AGREE_FRAC = 0.05;

let graphs = new WeakMap(), roomGraphs = new Map();
/** Forget the cached graphs (TECH §2.3). */
export function resetCaches() { graphs = new WeakMap(); roomGraphs = new Map(); }

/**
 * A site plan's graph: { id, nodes: { [id]: { id, x, z, kind, area } }, edges: [{ a, b, lengthM, pts,
 * kind: 'ground' | 'interior', role }], adj: { [id]: [edge index…] } }. Runtime: never put in the state.
 */
export function siteGraph(plan) {
  let g = graphs.get(plan);
  if (g) return g;
  const nodes = {}, edges = [], adj = {};
  const node = (w, area) => { if (nodes[w.id]) throw new Error(`places: waypoint ${w.id} twice in ${plan.id}`); nodes[w.id] = { id: w.id, x: w.x, z: w.z, kind: w.kind, area }; adj[w.id] = []; };
  for (const w of plan.waypoints) node(w, plan.area);
  for (const it of Object.values(plan.interiors ?? {})) for (const w of it.waypoints) node(w, it.area);
  const edge = (e, kind) => {
    const A = nodes[e.a], B = nodes[e.b];
    if (!A || !B) throw new Error(`places: edge ${e.a} to ${e.b} in ${plan.id} names a waypoint it lacks`);
    const pts = [[A.x, A.z], ...(e.via ?? []).map(p => [p[0], p[1]]), [B.x, B.z]];
    const k = edges.length;
    edges.push({ a: e.a, b: e.b, lengthM: polylineM(pts), pts, kind, role: e.role ?? kind });
    adj[e.a].push(k); adj[e.b].push(k);
  };
  for (const e of plan.edges) edge(e, 'ground');
  for (const it of Object.values(plan.interiors ?? {})) for (const e of it.edges) edge(e, 'interior');
  g = { id: plan.id, nodes, edges, adj };
  if (Object.isFrozen(plan)) graphs.set(plan, g);
  return g;
}

const other = (e, v) => (e.a === v ? e.b : e.a);

/** Dijkstra over a graph by length; the frontier's ties by cmpId. → { ids, lengthM, legs: [{ a, b, lengthM, kind, role, pts }] } or null. */
export function route(graph, fromId, toId) {
  if (!graph.nodes[fromId] || !graph.nodes[toId]) return null;
  const dist = { [fromId]: 0 }, prev = {}, done = new Set();
  const open = [fromId];
  while (open.length) {
    let k = 0;
    for (let i = 1; i < open.length; i++) { const d = dist[open[i]] - dist[open[k]]; if (d < 0 || (d === 0 && cmpId(open[i], open[k]) < 0)) k = i; }
    const u = open.splice(k, 1)[0];
    if (done.has(u)) continue;
    done.add(u);
    if (u === toId) break;
    for (const ei of graph.adj[u]) {
      const e = graph.edges[ei], v = other(e, u);
      if (done.has(v)) continue;
      const nd = dist[u] + e.lengthM;
      if (dist[v] === undefined || nd < dist[v] || (nd === dist[v] && cmpId(u, other(graph.edges[prev[v]], v)) < 0)) {
        if (dist[v] === undefined) open.push(v);
        dist[v] = nd; prev[v] = ei;
      }
    }
  }
  if (dist[toId] === undefined) return null;
  const legs = [];
  for (let v = toId; v !== fromId;) {
    const e = graph.edges[prev[v]], u = other(e, v);
    legs.push({ a: u, b: v, lengthM: e.lengthM, kind: e.kind, role: e.role, pts: e.a === u ? e.pts : [...e.pts].reverse() });
    v = u;
  }
  legs.reverse();
  return { ids: [fromId, ...legs.map(l => l.b)], lengthM: legs.reduce((s, l) => s + l.lengthM, 0), legs };
}

/** Every node reachable from one, as a Set (the validator's "joined" rule). */
export function reachable(graph, fromId) {
  const seen = new Set([fromId]), stack = [fromId];
  while (stack.length) for (const ei of graph.adj[stack.pop()] ?? []) { const e = graph.edges[ei]; for (const v of [e.a, e.b]) if (!seen.has(v)) { seen.add(v); stack.push(v); } }
  return seen;
}

const mid = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);

/**
 * A floor's room graph on a grid: { nodes: { [openingId]: { id, x, z, rooms } }, edges: [{ a, b, room,
 * lengthM, expanded } | { a, b, room, fail }] }: each room's openings joined by A* between their middles.
 */
export function roomGraph(area, grid) {
  const key = `${area.id}|${grid.cls}`;
  const cached = roomGraphs.get(key);
  if (cached && cached.grid === grid) return cached.graph;
  const plan = planOf(area), nodes = {}, edges = [];
  for (const o of plan.openings) { const [x, z] = mid(o); nodes[o.id] = { id: o.id, x, z, rooms: [...o.rooms] }; }
  for (const r of plan.rooms) {
    const os = plan.openings.filter(o => o.rooms.includes(r.id)).map(o => o.id).sort(cmpId);
    for (let i = 0; i < os.length; i++) for (let k = i + 1; k < os.length; k++) {
      const A = nodes[os[i]], B = nodes[os[k]], res = path(grid, [A.x, A.z], [B.x, B.z]);
      edges.push(res.fail ? { a: A.id, b: B.id, room: r.id, fail: res.fail } : { a: A.id, b: B.id, room: r.id, lengthM: res.lengthM, expanded: res.expanded });
    }
  }
  const graph = { area: area.id, cls: grid.cls, nodes, edges };
  roomGraphs.set(key, { grid, graph });
  return graph;
}
