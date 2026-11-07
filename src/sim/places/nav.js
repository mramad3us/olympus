// OLYMPUS places: the fine nav grid, A* on a binary heap, string pulling, and the path requests' queue.
//
// Rewritten on the rules of tradecraft v0.2.0-rc3 `src/sim/interiors/path.js` (59 lines, `wayAcross`:
// a grid of CELL_M squares, a square free when a mover's circle at its centre touches no blocker,
// eight ways round with a diagonal only where both its sides are free, the way pulled straight
// wherever a line stays on free squares), as PLACES §2.1 and §2.2 have it. What changed:
//   - Clearance classes (PLACES §2.1): C0 0.27 m (PT kit or uniform), C1 0.33 m (fighting load), C2
//     0.40 m (a vac suit). An area has one grid per class, built once (buildGrid) and cached in
//     state.$places.nav[areaId][cls] (navOf): runtime only, rebuilt from the saved state after a load.
//     A cell's byte is its cost: COSTS by surface (10 is a metre of floor; regolith 13, stairs 15…),
//     255 blocked. Blockers are a plan's wall rects (plan.js wallsOf, wallRect: the very walls the
//     cutaway draws), what fixtures stop walkers on (fixtures.js blockRectsOf: a blocking piece's
//     footprint, a stair well but its landing, from 0.0.6 a flight's rails and closed high end), and
//     closed door leaves (plan.js leafRect). People never block the grid ("a crowd would trap the player", tradecraft).
//     A cell whose centre lies in no room is blocked too (the dark between rooms); where rooms share
//     an edge on a cell's centre, the last room listed gives the cell its cost, by one rule
//     (cellSpan) that buildGrid paints with and remarkOpening reads back, so a door toggled in play
//     leaves the costs a grid rebuilt from the save has. grid.floor keeps which cells lie in a room,
//     before any blocker (collide.js stands walkers on it). A door opening or closing re-marks only
//     the cells within its class radius of the leaf (remarkOpening).
//   - A* on a typed-array binary heap (heap.js) instead of a scanned array, and no allocation per
//     solve: one scratch set (g, parent, seen, shut) and one heap serve every solve, reset by a
//     generation counter instead of a fill (PLACES §2.2: 16 bytes a cell, grown only when a bigger
//     grid comes; stats in navStats() count every growth). A step weighs 10 straight and 14 diagonal
//     (PLACES §2.2's whole numbers) times the cell's cost; the heuristic is the octile distance at
//     the cheapest cost (10) with the same weights, so it is admissible and consistent, the path is
//     the cheapest, and every sum is exact. Ties are fixed (the smaller h, then the smaller cell), so
//     a solve gives the same cells in every engine, and on open floor the many equal ways tie exactly
//     and the smaller h takes the one toward the goal (with √2 in floating point they part in their
//     last bits and the search fills the whole parallelogram between the ends: 47 times the work).
//   - NODE_CAP 16,000 expansions a solve: over it a solve fails 'cap' (the planner splits the leg);
//     other failures are 'blocked' (no way), 'locked' (a way only through a closed door: a second
//     solve on the area's all-open grid, built once per area and class and cached, its expansions
//     counted with the first's) and 'access' (kept for PLACES's access rules, not raised this round).
//     An end that is not free (a point against a table) moves to the nearest free cell within
//     NEAREST_FREE_M 2 m.
//   - String pulling walks every cell a segment passes through (a supercover line, corners counted
//     on both sides) instead of tradecraft's samples every half cell, so a pulled leg never clips the
//     corner of a blocked cell between two samples (my call: the walker follows the pulled points).
//   - Grounds: groundGrid(plan, rect, cls) is a window of a site plan's ground (the walk test's
//     measure of the plan's edges): buildings and the fence block (gates open, open structures such
//     as a canopy on posts do not), roads, paths and paved zones cost 10, the rest regolith at 13.
//     The game's ground (0.0.3, the build sheet 0.0.3 §2.1) is an area of its own, melas.ground, its
//     grids CHUNK_M 32 m chunks built lazily from its committed data (chunkGrid: its masses with their
//     doors' reveals as leaves, the fence, closed gates, blocking fixtures; paving and paths 10,
//     regolith 13) and cached in $places.chunks; navOf gives the walker a window of WINDOW_CHUNKS² of
//     them holding it NAV_EDGE_M 16 m from its edge, kept until it does not and then assembled again
//     round its chunk (from the cached chunks, in the replaced window's buffers), and navAhead builds
//     at most NAV_CHUNKS_TICK of the ring round it a tick, so the next window finds its chunks built.
//     A path request on the ground solves on a window placed by its own `from` (windowAt), never the
//     player's, so its answer is a function of the state alone. Each grid keeps `base`, its cells'
//     costs before anything blocks them, from which a leaf's cells are re-marked (remarkLeaf: every
//     cached floor grid, chunk and window holding it, and the ground's shared leaf record first, so a
//     chunk built after the door turned starts from its state now, whatever chunks were built then).
//   - Requests (PLACES §2.2, TECH §3.1 layer 9, correction 7): requestPath() queues one in
//     state.places.nav.queue (the player's own first, then by request id); pathsStep(), the fast
//     layer `paths`, first delivers what is due, then pays off debtNodes from its PATH_NODES_TICK
//     8,000 expansions, then solves whole requests (never sliced across ticks) while fewer than
//     PATH_SOLVES_TICK 6 have run and units remain; a solve that overruns still finishes and its
//     excess becomes debtNodes. Its result waits in nav.pending and is delivered on clock.tick =
//     dequeueTick + max(1, ceil(expanded / PATH_NODES_TICK)) as actor.path = { reqId, pts, lengthM }
//     or { reqId, fail }, with the fact path-done. Queue, pending and debt are saved, so a game saved
//     mid-request delivers the same paths on the same ticks as the unsaved run. Work is counted in
//     node expansions, never in milliseconds (TECH correction 7).
// Lengths are rounded to the millimetre (q, TECH §8.1 rule 11) and taken by Math.sqrt, which IEEE
// rounds exactly, never Math.hypot, which engines may compute differently.
import { planOf, wallsOf, wallRect, leafRect, roomAt, PORCH_M } from './plan.js';
import { footprintOf, blocks, blockRectsOf, kindOf as catalogueKind } from './fixtures.js';
import { createHeap } from './heap.js';
import { areaOf, leafClosed } from './model.js';
import { nextId, numOf, playerActor } from '../../core/ids.js';
import { q } from '../../core/num.js';

export const CELL_M = 0.25;
/** Clearance classes: the mover's radius in metres (PLACES §2.1). */
export const CLASSES = Object.freeze({ C0: 0.27, C1: 0.33, C2: 0.40 });
/** Cost of a cell by surface (10 is a metre of floor); 255 blocked (PLACES §2.1). */
export const COSTS = Object.freeze({ paving: 10, floor: 10, deck: 10, grating: 10, ice: 11, regolith: 13, stairs: 15, wet: 18, rubble: 25, blocked: 255 });
export const NODE_CAP = 16_000, PATH_SOLVES_TICK = 6, PATH_NODES_TICK = 8_000, ESTIMATE_CAP = 400, NEAREST_FREE_M = 2;
/** Ground a floor grid keeps round its plan, metres (the walls' thickness lies outside the plan). */
export const GRID_MARGIN_M = 0.5;
/** A path's lengths, rounded to this (metres). */
export const LENGTH_STEP_M = 0.001;

const BLOCKED = 255, MIN_COST = 10, SQRT2 = Math.SQRT2;
// (a step's weight, straight and diagonal: whole numbers, see the header; a 60 m diagonal on paving
// takes 221 expansions this way and took 11,238 with √2)
const STEP = 10, DIAG = 14;
const floorTo = (v, step) => Math.floor(v / step + 1e-9) * step;

// ---- the scratch: one set and one heap for every solve (runtime, never in the state) ----

let S = null, openGrids = new WeakMap();                           // (openGrids: area record → { <cls>: its all-open grid })
const stats = { solves: 0, expanded: 0, scratchAllocs: 0, scratchCells: 0 };
function scratch(n) {
  if (!S || S.n < n) {
    const m = Math.max(n, S ? Math.ceil(S.n * 1.5) : 0);
    S = { n: m, g: new Float64Array(m), parent: new Int32Array(m), seen: new Uint32Array(m), shut: new Uint32Array(m), gen: 0, heap: S?.heap ?? createHeap(NODE_CAP * 8 + 16) };
    stats.scratchAllocs++; stats.scratchCells = m;
  }
  if (++S.gen === 0xffffffff) { S.seen.fill(0); S.shut.fill(0); S.gen = 1; }
  return S;
}

/** Counters of the solver: solves, expansions, the scratch's allocations and size, the heap's growths. */
export const navStats = () => ({ ...stats, heapGrows: S?.heap.stats.grows ?? 0, heapCapacity: S?.heap.capacity ?? 0 });

/** Drop the scratch and the counters (a test's fresh start; TECH §2.3). */
export function resetCaches() { S = null; openGrids = new WeakMap(); stats.solves = 0; stats.expanded = 0; stats.scratchAllocs = 0; stats.scratchCells = 0; }

// ---- grids ----

const distSq = (cx, cz, r) => {
  const dx = cx < r.x0 ? r.x0 - cx : cx > r.x1 ? cx - r.x1 : 0, dz = cz < r.z0 ? r.z0 - cz : cz > r.z1 ? cz - r.z1 : 0;
  return dx * dx + dz * dz;
};
// (the cells whose centre lies within the rect inflated by rad, as index ranges, clamped)
function span(grid, r, rad) {
  const C = grid.cellM;
  return [
    Math.max(0, Math.floor((r.x0 - rad - grid.x0) / C - 0.5)), Math.max(0, Math.floor((r.z0 - rad - grid.z0) / C - 0.5)),
    Math.min(grid.nx - 1, Math.ceil((r.x1 + rad - grid.x0) / C - 0.5)), Math.min(grid.nz - 1, Math.ceil((r.z1 + rad - grid.z0) / C - 0.5)),
  ];
}
// (mark blocked every cell whose centre a circle of the grid's radius there would touch the rect)
function block(grid, r) {
  const [i0, j0, i1, j1] = span(grid, r, grid.radiusM), C = grid.cellM, rr = grid.radiusM * grid.radiusM;
  for (let j = j0; j <= j1; j++) {
    const cz = grid.z0 + (j + 0.5) * C;
    for (let i = i0; i <= i1; i++) if (distSq(grid.x0 + (i + 0.5) * C, cz, r) < rr) grid.cost[j * grid.nx + i] = BLOCKED;
  }
}
// (the index ranges [i0, i1, j0, j1] of the cells whose centre lies inside a rect, edges included to
// 1e-9 m: the one rule for a room's cells, which buildGrid paints and the remark reads back)
function cellSpan(grid, r) {
  const C = grid.cellM;
  return [
    Math.max(0, Math.ceil((r.x0 - grid.x0) / C - 0.5 - 1e-9)), Math.min(grid.nx - 1, Math.floor((r.x1 - grid.x0) / C - 0.5 + 1e-9)),
    Math.max(0, Math.ceil((r.z0 - grid.z0) / C - 0.5 - 1e-9)), Math.min(grid.nz - 1, Math.floor((r.z1 - grid.z0) / C - 0.5 + 1e-9)),
  ];
}
// (set the cost of every cell whose centre lies inside the rect, edges included, unless blocked)
function surface(grid, r, cost, { over = false } = {}) {
  const [i0, i1, j0, j1] = cellSpan(grid, r);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * grid.nx + i; if (over || grid.cost[k] !== BLOCKED) grid.cost[k] = cost; }
}
const roomRect = (room) => ({ x0: room.rect[0], z0: room.rect[1], x1: room.rect[2], z1: room.rect[3] });
const roomCost = (room) => COSTS[room.surface ?? 'floor'] ?? COSTS.floor;

/** The rects that block a floor area whatever its doors: its wall runs and its fixtures' (fixtures.js blockRectsOf: a stairs well but its top, a flight's rails and closed end), each tagged. */
export function staticBlockers(area) {
  const plan = planOf(area);
  return [
    ...wallsOf(plan).map(w => ({ ...wallRect(w), tag: 'wall' })),
    ...(area.fixtures ?? []).flatMap(f => blockRectsOf(f).map(r => ({ ...r, tag: f.id }))),
  ];
}

/**
 * The porches of a floor: past each outside door a portal crosses (its band's out side in no room),
 * PORCH_M of floor across the band's a..b, so a walker can step STEP_M out through it and the portal
 * fires (PLACES §1.6: "counts from the doorway's band plus STEP_M beyond it").
 */
export function porchesOf(area) {
  const plan = planOf(area), out = [];
  for (const p of area.portals ?? []) {
    const b = p.band, mid = (b.a + b.b) / 2, e = 0.1;
    const probe = b.axis === 'x' ? [mid, b.at + (b.out === 's' ? e : -e)] : [b.at + (b.out === 'e' ? e : -e), mid];
    if (roomAt(plan, probe[0], probe[1])) continue;
    out.push(b.axis === 'x'
      ? (b.out === 's' ? { x0: b.a, x1: b.b, z0: b.at, z1: b.at + PORCH_M } : { x0: b.a, x1: b.b, z0: b.at - PORCH_M, z1: b.at })
      : (b.out === 'e' ? { x0: b.at, x1: b.at + PORCH_M, z0: b.a, z1: b.b } : { x0: b.at - PORCH_M, x1: b.at, z0: b.a, z1: b.b }));
  }
  return out;
}

/**
 * An area's grid for a clearance class: { areaId, kind: 'floor', cls, radiusM, cellM, x0, z0, nx, nz,
 * cost: Uint8Array, base: Uint8Array (each cell's cost before anything blocks it: its room's surface, a
 * porch's floor, a flight's 15), floor: Uint8Array (1 where a cell's centre lies in a room or a porch),
 * blockers, leaves, gen }. closed(o) says whether an opening's leaf blocks (opening(o) → 'open' |
 * 'closed', 0.0.2's form, is read where closed is not given).
 */
export function buildGrid(area, cls, { opening = null, closed = null } = {}) {
  const radiusM = CLASSES[cls];
  if (radiusM === undefined) throw new Error(`places: no clearance class '${cls}' (${Object.keys(CLASSES).join(', ')})`);
  if (area.kind === 'ground') throw new Error(`places: ${area.id} is a ground: its grids are windows of chunks (navOf with a point)`);
  const isClosed = closed ?? (opening ? (o) => opening(o) === 'closed' : (o) => o.state === 'closed');
  const plan = planOf(area), porches = porchesOf(area);
  const ex = porches.reduce((b, p) => ({ x0: Math.min(b.x0, p.x0), z0: Math.min(b.z0, p.z0), x1: Math.max(b.x1, p.x1), z1: Math.max(b.z1, p.z1) }), { x0: plan.x0, z0: plan.z0, x1: plan.x1, z1: plan.z1 });
  const x0 = floorTo(ex.x0 - GRID_MARGIN_M, CELL_M), z0 = floorTo(ex.z0 - GRID_MARGIN_M, CELL_M);
  const nx = Math.ceil((ex.x1 + GRID_MARGIN_M - x0) / CELL_M - 1e-9), nz = Math.ceil((ex.z1 + GRID_MARGIN_M - z0) / CELL_M - 1e-9);
  const grid = { areaId: area.id, kind: 'floor', cls, radiusM, cellM: CELL_M, x0, z0, nx, nz, cost: new Uint8Array(nx * nz).fill(BLOCKED), base: null, floor: null, blockers: staticBlockers(area), leaves: [], gen: 1 };
  for (const r of area.rooms) surface(grid, roomRect(r), roomCost(r), { over: true });
  for (const p of porches) surface(grid, p, COSTS.paving, { over: true });
  for (const f of area.fixtures ?? []) { const c = catalogueKind(f.kind).cost; if (c && grid) surface(grid, footprintOf(f), c); }
  grid.base = grid.cost.slice();
  grid.floor = grid.cost.map(c => (c === BLOCKED ? 0 : 1));       // (the floor: cells whose centre lies in a room or a porch, what collide.js stands walkers on)
  for (const b of grid.blockers) block(grid, b);
  for (const o of plan.openings) {
    if (o.kind !== 'door') continue;
    const leaf = { id: o.id, rect: leafRect(o), closed: !!isClosed(areaOpening(area, o.id)) };
    grid.leaves.push(leaf);
    if (leaf.closed) block(grid, leaf.rect);
  }
  return grid;
}
const areaOpening = (area, id) => (area.openings ?? []).find(o => o.id === id);

// (the cells round a rect recomputed from the base, the blockers and the closed leaves: how many changed)
function remarkRect(grid, rect) {
  const [i0, j0, i1, j1] = span(grid, rect, grid.radiusM + grid.cellM), C = grid.cellM, rr = grid.radiusM * grid.radiusM;
  let changed = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const cx = grid.x0 + (i + 0.5) * C, cz = grid.z0 + (j + 0.5) * C, k = j * grid.nx + i;
    let c = grid.base[k];
    if (c !== BLOCKED && (grid.blockers.some(b => distSq(cx, cz, b) < rr) || grid.leaves.some(l => l.closed && distSq(cx, cz, l.rect) < rr))) c = BLOCKED;
    if (grid.cost[k] !== c) { grid.cost[k] = c; changed++; }
  }
  if (changed) grid.gen = (grid.gen ?? 1) + 1;
  return changed;
}

/**
 * Re-mark a grid's cells round one opening's leaf after it opened or closed: only the cells within the
 * class radius of the leaf (and a cell more) are recomputed. Returns how many cells changed.
 */
export function remarkOpening(grid, area, openingId, s) {
  const leaf = grid.leaves.find(l => l.id === openingId);
  if (!leaf) return 0;
  leaf.closed = s === 'closed';
  return remarkRect(grid, leaf.rect);
}

/**
 * Re-mark an opening's leaf on every grid the state has cached (its floor's, every class; the ground's
 * chunks and windows where its reveal names it), by leafClosed now. Returns the cells changed.
 */
export function remarkLeaf(state, openingId) {
  const closed = leafClosed(state, openingId), nav = state.$places?.nav ?? {};
  // (the ground's shared leaf records first, every class's: a chunk built later reads them, so one
  // turned while no built chunk held it must not keep its old state, or the walk's history decides it)
  for (const byCls of Object.values(state.$places?.leaves ?? {})) for (const m of Object.values(byCls)) { const l = m.get(openingId); if (l) l.closed = closed; }
  let changed = 0;
  for (const byCls of Object.values(nav)) for (const grid of Object.values(byCls)) changed += remarkGrid(grid, openingId, closed);
  for (const byCls of Object.values(state.$places?.solveWin ?? {})) for (const grid of Object.values(byCls)) changed += remarkGrid(grid, openingId, closed);
  for (const byCls of Object.values(state.$places?.chunks ?? {})) for (const chunks of Object.values(byCls)) for (const ch of chunks.values()) changed += remarkGrid(ch, openingId, closed);
  return changed;
}
function remarkGrid(grid, id, closed) {
  const leaf = grid.leaves?.find(l => l.id === id);
  if (!leaf) return 0;
  leaf.closed = closed;
  return remarkRect(grid, leaf.rect);
}

// ---- the ground: chunks, and the window round the walker ----

/** A ground's chunk, metres (PLACES §2.4, CONTRACTS §6), and its cells a side. */
export const CHUNK_M = 32, CHUNK_CELLS = CHUNK_M / CELL_M;
/** A ground's window is WINDOW_CHUNKS chunks a side, and holds the walker at least NAV_EDGE_M from its edge (my calls). */
export const WINDOW_CHUNKS = 3, NAV_EDGE_M = 16;
/** Chunks built ahead a tick, per class, once the walk is under way (work units: TECH correction 7). */
export const NAV_CHUNKS_TICK = 1;
/** The ring of chunks kept built ahead of the window, chunks either side of the walker's (my call). */
export const AHEAD_RING = 2;
const navStatsG = { chunksBuilt: 0, windowsBuilt: 0, aheadBuilt: 0, maxTickBuilds: 0 };
/** The ground's counters: chunks built, windows assembled, chunks built ahead, the most built in one tick by one class. */
export const groundStats = () => ({ ...navStatsG });
/** Reset the ground's counters (a test's fresh start). */
export function resetGroundStats() { for (const k of Object.keys(navStatsG)) navStatsG[k] = 0; }

let groundFixed = new WeakMap();                                   // (a ground's blocking fixtures as rects, built once)
function fixtureBlockers(area) {
  let list = groundFixed.get(area);
  if (!list) groundFixed.set(area, list = Object.freeze((area.fixtures ?? []).filter(blocks).map(f => Object.freeze({ ...footprintOf(f), tag: f.id }))));
  return list;
}
const chunkRect = (i, j) => ({ x0: i * CHUNK_M, z0: j * CHUNK_M, x1: (i + 1) * CHUNK_M, z1: (j + 1) * CHUNK_M });
// (the ground's leaves for a class: one shared object a leaf, so a chunk and a window agree)
function groundLeaves(state, area, cls) {
  const P = (state.$places ??= {}), byArea = ((P.leaves ??= {})[area.id] ??= {});
  return (byArea[cls] ??= new Map(area.nav.leaves.map(l => [l.id, { id: l.id, kind: l.kind, rect: l.rect, closed: l.kind === 'gate' ? (area.gates.find(g => g.id === l.id)?.state ?? 'closed') === 'closed' : leafClosed(state, l.id) }])));
}

/**
 * A ground's chunk (i, j) as a grid for a class: regolith at 13, the paved zones, roads and paths at
 * 10, the masses, the fence, blocking fixtures and closed leaves (a reveal while its opening is shut,
 * a gate) blocked. Built from the ground's committed data alone (PLACES §2.4, §9.5).
 */
export function chunkGrid(state, area, i, j, cls) {
  const radiusM = CLASSES[cls], R = chunkRect(i, j), near = { x0: R.x0 - radiusM - CELL_M, z0: R.z0 - radiusM - CELL_M, x1: R.x1 + radiusM + CELL_M, z1: R.z1 + radiusM + CELL_M };
  const g = { areaId: area.id, kind: 'chunk', i, j, cls, radiusM, cellM: CELL_M, x0: R.x0, z0: R.z0, nx: CHUNK_CELLS, nz: CHUNK_CELLS, cost: new Uint8Array(CHUNK_CELLS * CHUNK_CELLS).fill(COSTS.regolith), base: null, floor: null, blockers: [], leaves: [], gen: 1 };
  for (const s of area.surfaces) {
    if (s.rect) { const r = { x0: s.rect[0], z0: s.rect[1], x1: s.rect[2], z1: s.rect[3] }; if (overlaps(r, near)) surface(g, r, COSTS.paving); continue; }
    const xs = s.pts.map(p => p[0]), zs = s.pts.map(p => p[1]), h = s.widthM / 2;
    if (overlaps({ x0: Math.min(...xs) - h, z0: Math.min(...zs) - h, x1: Math.max(...xs) + h, z1: Math.max(...zs) + h }, near)) strip(g, s.pts, s.widthM, COSTS.paving);
  }
  g.base = g.cost.slice();
  for (const b of [...area.nav.blockers, ...fixtureBlockers(area)]) if (overlaps(b, near)) { g.blockers.push(b); block(g, b); }
  for (const l of groundLeaves(state, area, cls).values()) if (overlaps(l.rect, near)) { g.leaves.push(l); if (l.closed) block(g, l.rect); }
  navStatsG.chunksBuilt++;
  return g;
}
// (a chunk from the cache, built when missing)
function chunkOf(state, area, i, j, cls) {
  const P = (state.$places ??= {}), byCls = ((P.chunks ??= {})[area.id] ??= {}), map = (byCls[cls] ??= new Map()), key = `${i},${j}`;
  let ch = map.get(key);
  if (!ch) { ch = chunkGrid(state, area, i, j, cls); map.set(key, ch); }
  return ch;
}
// (a window of WINDOW_CHUNKS² chunks from (i0, j0), assembled from the cached chunks; the window it
// replaces lends its two buffers, so a walk across the base allocates no new ones: nothing keeps a
// window once navOf has dropped it, a walker's path being points, not cells)
function windowGrid(state, area, cls, i0, j0, old = null) {
  const n = WINDOW_CHUNKS, N = n * CHUNK_CELLS, cost = old?.cost ?? new Uint8Array(N * N), base = old?.base ?? new Uint8Array(N * N);
  if (old) { old.cost = null; old.base = null; }
  const blockers = new Set(), leaves = new Set();
  for (let cj = 0; cj < n; cj++) for (let ci = 0; ci < n; ci++) {
    const ch = chunkOf(state, area, i0 + ci, j0 + cj, cls);
    for (let r = 0; r < CHUNK_CELLS; r++) {
      const at = (cj * CHUNK_CELLS + r) * N + ci * CHUNK_CELLS;
      cost.set(ch.cost.subarray(r * CHUNK_CELLS, (r + 1) * CHUNK_CELLS), at);
      base.set(ch.base.subarray(r * CHUNK_CELLS, (r + 1) * CHUNK_CELLS), at);
    }
    for (const b of ch.blockers) blockers.add(b);
    for (const l of ch.leaves) leaves.add(l);
  }
  navStatsG.windowsBuilt++;
  return { areaId: area.id, kind: 'ground', cls, radiusM: CLASSES[cls], cellM: CELL_M, x0: i0 * CHUNK_M, z0: j0 * CHUNK_M, nx: N, nz: N, cost, base, floor: null, blockers: [...blockers], leaves: [...leaves], win: { i0, j0, n }, gen: 1 };
}
// (whether a window holds (x, z) at least NAV_EDGE_M from its edge)
const holds = (g, x, z) => x >= g.x0 + NAV_EDGE_M && x <= g.x0 + g.nx * g.cellM - NAV_EDGE_M && z >= g.z0 + NAV_EDGE_M && z <= g.z0 + g.nz * g.cellM - NAV_EDGE_M;

/**
 * The grid of an area for a class, as the state has its doors, cached in state.$places.nav[areaId][cls]:
 * a floor's whole grid, built once; a ground's window round (x, z) (the area's spawn when none is
 * given), kept while it holds the point NAV_EDGE_M from its edge and assembled again round the point's
 * chunk when it does not, from chunks built lazily and cached. The window's placement is runtime only
 * and never changes an outcome: a walker collides with the rects near it, which every window holding
 * it 16 m in contains.
 */
export function navOf(state, areaId, cls, x = null, z = null) {
  const P = (state.$places ??= {});
  const byArea = ((P.nav ??= {})[areaId] ??= {});
  const area = areaOf(areaId);
  if (!area) { if (byArea[cls]) return byArea[cls]; throw new Error(`places: no area '${areaId}' to build a nav grid for`); }
  if (area.kind !== 'ground') return (byArea[cls] ??= buildGrid(area, cls, { closed: (o) => leafClosed(state, o) }));
  const px = x ?? area.spawn.x, pz = z ?? area.spawn.z, g = byArea[cls];
  if (g && (x === null || holds(g, px, pz))) return g;
  const c = Math.floor(WINDOW_CHUNKS / 2);
  return (byArea[cls] = windowGrid(state, area, cls, Math.floor(px / CHUNK_M) - c, Math.floor(pz / CHUNK_M) - c, g));
}

/**
 * Build ahead on a ground: at most budget chunks of the ring AHEAD_RING round the walker's chunk that
 * are not yet built, nearest first (ties by row, then column), so the window's next placement finds
 * its chunks built and no tick builds more than NAV_CHUNKS_TICK a class. Returns how many it built.
 */
export function navAhead(state, areaId, cls, x, z, budget = NAV_CHUNKS_TICK) {
  const area = areaOf(areaId);
  if (!area || area.kind !== 'ground' || budget <= 0) return 0;
  const map = state.$places?.chunks?.[areaId]?.[cls], ci = Math.floor(x / CHUNK_M), cj = Math.floor(z / CHUNK_M);
  let built = 0;
  for (let d = 1; d <= AHEAD_RING && built < budget; d++) for (let j = cj - d; j <= cj + d && built < budget; j++) for (let i = ci - d; i <= ci + d && built < budget; i++) {
    if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== d || map?.has(`${i},${j}`)) continue;
    chunkOf(state, area, i, j, cls); built++; navStatsG.aheadBuilt++;
  }
  return built;
}

/**
 * A ground's window placed by a point alone (centred on the chunk holding it), for a path request: the
 * request's answer then depends on its own `from`, never on where the player's window happens to be,
 * so a game saved mid-request and loaded solves it on the same cells. Cached one per area and class.
 */
export function windowAt(state, areaId, cls, x, z) {
  const area = areaOf(areaId), c = Math.floor(WINDOW_CHUNKS / 2), i0 = Math.floor(x / CHUNK_M) - c, j0 = Math.floor(z / CHUNK_M) - c;
  const P = (state.$places ??= {}), byArea = ((P.solveWin ??= {})[areaId] ??= {}), w = byArea[cls];
  if (w && w.win.i0 === i0 && w.win.j0 === j0) return w;
  return (byArea[cls] = windowGrid(state, area, cls, i0, j0, w));
}

/** An area's grid with every door open, for the 'locked' check and the bots' way through closed doors (floors only; cached). */
export function openNavOf(areaId, cls) {
  const area = areaOf(areaId);
  return area && area.kind !== 'ground' ? openGridOf(area, cls) : null;
}

// (a polyline strip: every cell whose centre lies within half its width of a segment)
function strip(grid, pts, widthM, cost) {
  const h = widthM / 2, C = grid.cellM;
  for (let s = 0; s + 1 < pts.length; s++) {
    const [ax, az] = pts[s], [bx, bz] = pts[s + 1];
    const r = { x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz) };
    const [i0, j0, i1, j1] = span(grid, r, h);
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    for (let j = j0; j <= j1; j++) {
      const cz = grid.z0 + (j + 0.5) * C;
      for (let i = i0; i <= i1; i++) {
        const cx = grid.x0 + (i + 0.5) * C;
        let t = L2 ? ((cx - ax) * dx + (cz - az) * dz) / L2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = ax + t * dx - cx, ez = az + t * dz - cz, k = j * grid.nx + i;
        if (ex * ex + ez * ez <= h * h && grid.cost[k] !== BLOCKED) grid.cost[k] = cost;
      }
    }
  }
}
const rectOf = (r) => (Array.isArray(r) ? { x0: r[0], z0: r[1], x1: r[2], z1: r[3] } : r);
const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
/** The fence of a site plan as thin blocking rects, cut at its gates (0.1 m thick, on its line). */
export function fenceRects(plan) {
  if (!plan.fence) return [];
  const [x0, z0, x1, z1] = plan.fence.rect, t = 0.05, out = [];
  const sides = [['x', z0, x0, x1], ['x', z1, x0, x1], ['z', x0, z0, z1], ['z', x1, z0, z1]];
  for (const [axis, at, a, b] of sides) {
    let runs = [[a, b]];
    for (const g of plan.gates ?? []) {
      const on = axis === 'x' ? Math.abs(g.z - at) < 0.01 : Math.abs(g.x - at) < 0.01;
      if (!on) continue;
      const c = axis === 'x' ? g.x : g.z, ga = c - g.widthM / 2, gb = c + g.widthM / 2;
      runs = runs.flatMap(([p, r]) => (gb <= p || ga >= r ? [[p, r]] : [[p, ga], [gb, r]].filter(([u, v]) => v - u > 0.01)));
    }
    for (const [p, r] of runs) out.push(axis === 'x' ? { x0: p, z0: at - t, x1: r, z1: at + t, tag: 'fence' } : { x0: at - t, z0: p, x1: at + t, z1: r, tag: 'fence' });
  }
  return out;
}
/** Whether a building of a site plan stands in the way on the ground (open structures and zones do not). */
export const buildingBlocks = (b) => !b.open;

/**
 * A window [x0, z0, x1, z1] of a site plan's ground as a grid for a class (PLACES §2.4): regolith at
 * 13 by default; roads, paths and paved zones at 10; buildings and the fence blocked (gates open).
 * The walk test's measure of the plan's edges (v0.0.2); the game's ground is the area's chunks above.
 */
export function groundGrid(plan, rect, cls) {
  const radiusM = CLASSES[cls];
  if (radiusM === undefined) throw new Error(`places: no clearance class '${cls}'`);
  const w = rectOf(rect);
  const x0 = floorTo(w.x0, CELL_M), z0 = floorTo(w.z0, CELL_M);
  const nx = Math.ceil((w.x1 - x0) / CELL_M - 1e-9), nz = Math.ceil((w.z1 - z0) / CELL_M - 1e-9);
  const grid = { areaId: plan.area, kind: 'ground', planId: plan.id, cls, radiusM, cellM: CELL_M, x0, z0, nx, nz, cost: new Uint8Array(nx * nz).fill(COSTS[plan.ground ?? 'regolith']), base: null, floor: null, blockers: [], leaves: [] };
  const win = { x0, z0, x1: x0 + nx * CELL_M, z1: z0 + nz * CELL_M }, near = (r) => overlaps({ x0: r.x0 - 30, z0: r.z0 - 30, x1: r.x1 + 30, z1: r.z1 + 30 }, win);
  for (const z of plan.zones ?? []) if (z.surface && COSTS[z.surface] !== undefined) { const r = rectOf(z.rect); if (near(r)) surface(grid, r, COSTS[z.surface]); }
  for (const r of [...(plan.roads ?? []), ...(plan.paths ?? [])]) {
    const xs = r.pts.map(p => p[0]), zs = r.pts.map(p => p[1]);
    if (near({ x0: Math.min(...xs), z0: Math.min(...zs), x1: Math.max(...xs), z1: Math.max(...zs) })) strip(grid, r.pts, r.widthM, COSTS[r.surface ?? 'paving']);
  }
  grid.base = grid.cost.slice();
  for (const b of plan.buildings ?? []) {
    if (!buildingBlocks(b)) continue;
    for (const r of b.rects) { const rr = { ...rectOf(r), tag: b.id }; if (near(rr)) { grid.blockers.push(rr); block(grid, rr); } }
  }
  for (const f of fenceRects(plan)) if (near(f)) { grid.blockers.push(f); block(grid, f); }
  return grid;
}

// ---- cells ----

/** The cell of a point, or -1 off the grid. */
export function cellOf(grid, x, z) {
  const i = Math.floor((x - grid.x0) / grid.cellM), j = Math.floor((z - grid.z0) / grid.cellM);
  return i < 0 || j < 0 || i >= grid.nx || j >= grid.nz ? -1 : j * grid.nx + i;
}
/** A cell's centre [x, z]. */
export const centreOf = (grid, c) => [grid.x0 + ((c % grid.nx) + 0.5) * grid.cellM, grid.z0 + (Math.floor(c / grid.nx) + 0.5) * grid.cellM];
/** Whether the cell of a point is free for the grid's class. */
export function isFree(grid, x, z) { const c = cellOf(grid, x, z); return c >= 0 && grid.cost[c] !== BLOCKED; }
/** How many cells are free. */
export function freeCount(grid) { let n = 0; for (let k = 0; k < grid.cost.length; k++) if (grid.cost[k] !== BLOCKED) n++; return n; }

/** The free cell nearest a point within maxM (ties by the smaller index), or -1. */
export function nearestFree(grid, x, z, maxM = NEAREST_FREE_M) {
  const C = grid.cellM, ci = Math.floor((x - grid.x0) / C), cj = Math.floor((z - grid.z0) / C), R = Math.ceil(maxM / C);
  let best = -1, bd = Infinity;
  for (let j = Math.max(0, cj - R); j <= Math.min(grid.nz - 1, cj + R); j++) {
    const cz = grid.z0 + (j + 0.5) * C - z;
    for (let i = Math.max(0, ci - R); i <= Math.min(grid.nx - 1, ci + R); i++) {
      const k = j * grid.nx + i;
      if (grid.cost[k] === BLOCKED) continue;
      const cx = grid.x0 + (i + 0.5) * C - x, d = cx * cx + cz * cz;
      if (d <= maxM * maxM && (d < bd || (d === bd && k < best))) { bd = d; best = k; }
    }
  }
  return best;
}

// (whether a segment passes through a rect's inside: Liang–Barsky's clip, a touch along an edge not counted)
function crosses(ax, az, bx, bz, r) {
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dz = bz - az;
  for (const [p, q] of [[-dx, ax - r.x0], [dx, r.x1 - ax], [-dz, az - r.z0], [dz, r.z1 - az]]) {
    if (p === 0) { if (q <= 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t0) t0 = t; } else if (t < t1) t1 = t;
    if (t0 >= t1) return false;
  }
  return t1 - t0 > 1e-9;
}
/**
 * The free cell nearest a point within maxM on the point's own side of every blocker: of the cells a
 * flood from the point's cell reaches, cell to cell across no blocker (a wall run, a fixture's rects, a
 * closed leaf; one that holds the point itself excepted), the free one nearest, else nearestFree's.
 * Where a walker who may not stand where it is gets put (move.js settle), so it is never put through a
 * wall or over a flight's rail (the review of 0.0.6: a walker squeezed between a flight's closed top and
 * the vestibule's wall was settled across the top into the lane, a step from its band). Ties as
 * nearestFree's.
 */
export function nearestFreeInReach(grid, x, z, maxM = NEAREST_FREE_M) {
  const C = grid.cellM, ci = Math.floor((x - grid.x0) / C), cj = Math.floor((z - grid.z0) / C), R = Math.ceil(maxM / C);
  if (ci < 0 || cj < 0 || ci >= grid.nx || cj >= grid.nz) return nearestFree(grid, x, z, maxM);
  const near = { x0: x - maxM - C, z0: z - maxM - C, x1: x + maxM + C, z1: z + maxM + C };
  const walls = [...(grid.blockers ?? []), ...(grid.leaves ?? []).filter(l => l.closed).map(l => l.rect)]
    .filter(b => overlaps(b, near) && !(x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1));
  const i0 = Math.max(0, ci - R), j0 = Math.max(0, cj - R), i1 = Math.min(grid.nx - 1, ci + R), j1 = Math.min(grid.nz - 1, cj + R), W = i1 - i0 + 1;
  const seen = new Uint8Array(W * (j1 - j0 + 1)), queue = [[ci, cj]];
  seen[(cj - j0) * W + (ci - i0)] = 1;
  let best = -1, bd = Infinity;
  for (let h = 0; h < queue.length; h++) {
    const [i, j] = queue[h], k = j * grid.nx + i, [px, pz] = h === 0 ? [x, z] : centreOf(grid, k);
    if (grid.cost[k] !== BLOCKED) {
      const dx = grid.x0 + (i + 0.5) * C - x, dz = grid.z0 + (j + 0.5) * C - z, d = dx * dx + dz * dz;
      if (d <= maxM * maxM && (d < bd || (d === bd && k < best))) { bd = d; best = k; }
    }
    for (const [ni, nj] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]) {
      if (ni < i0 || nj < j0 || ni > i1 || nj > j1 || seen[(nj - j0) * W + (ni - i0)]) continue;
      const [tx, tz] = centreOf(grid, nj * grid.nx + ni);
      if ((tx - x) * (tx - x) + (tz - z) * (tz - z) > (maxM + C) * (maxM + C) || walls.some(b => crosses(px, pz, tx, tz, b))) continue;
      seen[(nj - j0) * W + (ni - i0)] = 1;
      queue.push([ni, nj]);
    }
  }
  return best >= 0 ? best : nearestFree(grid, x, z, maxM);
}

// ---- A* ----

const pt = (p) => (Array.isArray(p) ? p : [p.x, p.z]);
const lenOf = (pts) => { let L = 0; for (let k = 1; k < pts.length; k++) { const dx = pts[k][0] - pts[k - 1][0], dz = pts[k][1] - pts[k - 1][1]; L += Math.sqrt(dx * dx + dz * dz); } return L; };
/** A polyline's length in metres (Math.sqrt per segment), rounded to the millimetre. */
export const polylineM = (pts) => q(lenOf(pts), LENGTH_STEP_M);
// (an end of a solve: its own point where its cell is free, else the nearest free cell's centre)
function endOf(grid, p) {
  const [x, z] = pt(p), c = cellOf(grid, x, z);
  if (c >= 0 && grid.cost[c] !== BLOCKED) return { c, at: [x, z] };
  const n = nearestFree(grid, x, z);
  return n < 0 ? null : { c: n, at: centreOf(grid, n) };
}

/**
 * The cheapest way across a grid: { pts: [[x, z]…], lengthM, cells, expanded } or { fail: 'blocked' |
 * 'cap', expanded }. corridor(cell) → bool, if given, keeps the search to the cells it allows.
 */
export function path(grid, from, to, { cap = NODE_CAP, corridor = null } = {}) {
  const A = endOf(grid, from), B = endOf(grid, to);
  if (!A || !B) return { fail: 'blocked', expanded: 0 };
  stats.solves++;
  if (A.c === B.c) return { pts: [A.at, B.at], lengthM: polylineM([A.at, B.at]), cells: [A.c], expanded: 0 };
  const n = grid.nx * grid.nz, s = scratch(n), g = s.g, parent = s.parent, seen = s.seen, shut = s.shut, heap = s.heap, gen = s.gen;
  const cost = grid.cost, nx = grid.nx, nz = grid.nz, B0 = B.c, bi = B0 % nx, bj = (B0 - bi) / nx;
  // (the octile distance to B at the cheapest cost: admissible and consistent, so the first pop of B is the cheapest way)
  const hOf = (i, j) => { const dx = i > bi ? i - bi : bi - i, dz = j > bj ? j - bj : bj - j; return dx > dz ? STEP * MIN_COST * dx + (DIAG - STEP) * MIN_COST * dz : STEP * MIN_COST * dz + (DIAG - STEP) * MIN_COST * dx; };
  heap.reset();
  const ai = A.c % nx;
  seen[A.c] = gen; g[A.c] = 0; parent[A.c] = -1;
  const h0 = hOf(ai, (A.c - ai) / nx); heap.push(A.c, h0, h0);
  let expanded = 0, found = false;
  while (heap.size && expanded < cap) {
    const u = heap.pop();
    if (shut[u] === gen) continue;
    shut[u] = gen; expanded++;
    if (u === B0) { found = true; break; }
    const ui = u % nx, uj = (u - ui) / nx, gu = g[u];
    const W = ui > 0, E = ui < nx - 1, N = uj > 0, S = uj < nz - 1;
    // (the four sides first; a diagonal only where both its sides are free: no corner cutting)
    const fw = W && cost[u - 1] !== BLOCKED, fe = E && cost[u + 1] !== BLOCKED, fn = N && cost[u - nx] !== BLOCKED, fs = S && cost[u + nx] !== BLOCKED;
    for (let d = 0; d < 8; d++) {
      let v, vi, vj, diag = false;
      switch (d) {
        case 0: if (!fn) continue; v = u - nx; vi = ui; vj = uj - 1; break;
        case 1: if (!fw) continue; v = u - 1; vi = ui - 1; vj = uj; break;
        case 2: if (!fe) continue; v = u + 1; vi = ui + 1; vj = uj; break;
        case 3: if (!fs) continue; v = u + nx; vi = ui; vj = uj + 1; break;
        case 4: if (!(fn && fw)) continue; v = u - nx - 1; vi = ui - 1; vj = uj - 1; diag = true; break;
        case 5: if (!(fn && fe)) continue; v = u - nx + 1; vi = ui + 1; vj = uj - 1; diag = true; break;
        case 6: if (!(fs && fw)) continue; v = u + nx - 1; vi = ui - 1; vj = uj + 1; diag = true; break;
        default: if (!(fs && fe)) continue; v = u + nx + 1; vi = ui + 1; vj = uj + 1; diag = true;
      }
      const cv = cost[v];
      if (cv === BLOCKED || shut[v] === gen) continue;
      if (corridor !== null && !corridor(v)) continue;
      const ng = gu + (diag ? DIAG : STEP) * cv;
      if (seen[v] !== gen) { seen[v] = gen; g[v] = ng; parent[v] = u; const hv = hOf(vi, vj); heap.push(v, ng + hv, hv); }
      else if (ng < g[v]) { g[v] = ng; parent[v] = u; const hv = hOf(vi, vj); heap.push(v, ng + hv, hv); }
    }
  }
  stats.expanded += expanded;
  if (!found) return { fail: expanded >= cap ? 'cap' : 'blocked', expanded };
  const cells = [];
  for (let c = B0; c !== -1; c = parent[c]) cells.push(c);
  cells.reverse();
  const pts = stringPull(grid, cells, A.at, B.at);
  return { pts, lengthM: polylineM(pts), cells, expanded };
}

/** Whether every cell a segment passes through is free (a supercover line: through a corner, both side cells count). */
export function clearLine(grid, ax, az, bx, bz) {
  const C = grid.cellM, cost = grid.cost, nx = grid.nx;
  const fx = (ax - grid.x0) / C, fz = (az - grid.z0) / C, tx = (bx - grid.x0) / C, tz = (bz - grid.z0) / C;
  let i = Math.floor(fx), j = Math.floor(fz);
  const ie = Math.floor(tx), je = Math.floor(tz), dx = tx - fx, dz = tz - fz;
  const si = dx > 0 ? 1 : dx < 0 ? -1 : 0, sj = dz > 0 ? 1 : dz < 0 ? -1 : 0;
  const free = (a, b) => a >= 0 && b >= 0 && a < nx && b < grid.nz && cost[b * nx + a] !== BLOCKED;
  const tdx = si ? 1 / Math.abs(dx) : Infinity, tdz = sj ? 1 / Math.abs(dz) : Infinity;
  let tmx = si > 0 ? (i + 1 - fx) / dx : si < 0 ? (fx - i) / -dx : Infinity;
  let tmz = sj > 0 ? (j + 1 - fz) / dz : sj < 0 ? (fz - j) / -dz : Infinity;
  for (let steps = Math.abs(ie - i) + Math.abs(je - j) + 2; steps > 0; steps--) {
    if (!free(i, j)) return false;
    if (i === ie && j === je) return true;
    if (tmx < tmz) { i += si; tmx += tdx; }
    else if (tmz < tmx) { j += sj; tmz += tdz; }
    else { if (!free(i + si, j) || !free(i, j + sj)) return false; i += si; j += sj; tmx += tdx; tmz += tdz; }
  }
  return free(i, j);
}

/** A cell path pulled straight: from start, as far along as a clear line reaches, to end ([[x, z]…]). */
export function stringPull(grid, cells, start = centreOf(grid, cells[0]), end = centreOf(grid, cells[cells.length - 1])) {
  const out = [start];
  let at = start, k = 1;
  const P = (m) => (m === cells.length - 1 ? end : centreOf(grid, cells[m]));
  if (cells.length === 1) { out.push(end); return out; }
  while (k < cells.length) {
    let far = k;                                                    // (the next cell always: progress whatever the line test says)
    while (far + 1 < cells.length) { const p = P(far + 1); if (!clearLine(grid, at[0], at[1], p[0], p[1])) break; far++; }
    at = P(far); out.push(at); k = far + 1;
  }
  return out;
}

/** A capped solve for an estimate (COMBAT's and PEOPLE's "how far is it"): the length in metres, or 'far'. */
export function pathEstimate(grid, from, to, capNodes = ESTIMATE_CAP) {
  const r = path(grid, from, to, { cap: capNodes });
  return r.fail ? 'far' : r.lengthM;
}

/** The octile length of a cell path in metres (the grid's own measure, before pulling). */
export function octileM(grid, cells) {
  let L = 0;
  for (let k = 1; k < cells.length; k++) { const a = cells[k - 1], b = cells[k], d = Math.abs((a % grid.nx) - (b % grid.nx)) + Math.abs(Math.floor(a / grid.nx) - Math.floor(b / grid.nx)); L += d === 2 ? SQRT2 : 1; }
  return L * grid.cellM;
}

// ---- requests and their delivery (the fast layer `paths`) ----

// (the player's own requests first: the actor playerActor() finds)
const rank = (meId, who) => (who && who === meId ? 0 : 1);

/** Queue a path request for an actor: { who, area, cls, from: [x, z], to: [x, z] } → its id, 'pr<n>'. */
export function requestPath(state, { who, area, cls = 'C0', from, to }) {
  if (CLASSES[cls] === undefined) throw new Error(`places: no clearance class '${cls}'`);
  if (!areaOf(area) && !state.$places?.nav?.[area]?.[cls]) throw new Error(`places: no area '${area}' to find a path on`);
  const nav = navState(state);
  const id = nextId(state, 'pr');
  const req = { id, who, area, cls, from: [...pt(from)], to: [...pt(to)], atTick: state.clock.tick };
  const meId = playerActor(state)?.id ?? null, r = rank(meId, who), n = numOf(id);
  let at = nav.queue.findIndex(e => rank(meId, e.who) > r || (rank(meId, e.who) === r && numOf(e.id) > n));
  if (at < 0) at = nav.queue.length;
  nav.queue.splice(at, 0, req);
  return id;
}
/** The saved nav record, made if missing: { queue, pending, debtNodes }. */
export function navState(state) {
  const P = (state.places ??= { live: null, sites: {} });
  const nav = (P.nav ??= { queue: [], pending: [], debtNodes: 0 });
  nav.queue ??= []; nav.pending ??= []; nav.debtNodes ??= 0;
  return nav;
}

// (an area's grid with every door open, for the 'locked' check: a pure function of the frozen template,
// built once per area and class and kept here, so the check costs its expansions, which the budget
// counts, and never a grid build, which it can't)
function openGridOf(area, cls) {
  let byCls = openGrids.get(area);
  if (!byCls) openGrids.set(area, byCls = {});
  return (byCls[cls] ??= buildGrid(area, cls, { closed: () => false }));
}
// (a solve as a request asks it: on its area's grid as the state has it; a 'blocked' that only a closed door causes is 'locked')
function solve(state, req) {
  if (!areaOf(req.area) && !state.$places?.nav?.[req.area]?.[req.cls]) return { fail: 'blocked', expanded: 0 };   // (an area gone since the request: answered, never thrown in the tick)
  const area = areaOf(req.area), grid = area?.kind === 'ground' ? windowAt(state, req.area, req.cls, req.from[0], req.from[1]) : navOf(state, req.area, req.cls);
  const r = path(grid, req.from, req.to);
  if (r.fail !== 'blocked' || !grid.leaves.some(l => l.closed) || !area || area.kind === 'ground') return r;
  const o = path(openGridOf(areaOf(req.area), req.cls), req.from, req.to);
  return o.fail ? { fail: 'blocked', expanded: r.expanded + o.expanded } : { fail: 'locked', expanded: r.expanded + o.expanded };
}

/** The fast layer `paths` (TECH §3.1, layer 9): deliver what is due, pay the debt, solve within the tick's budget. */
export function pathsStep(state, input, bus, ctx) {
  const nav = state.places?.nav;
  if (!nav) return;
  const tick = state.clock.tick;
  // (delivery first: every result due on this tick or before, in deliverTick then id order)
  if (nav.pending.length && nav.pending[0].deliverTick <= tick) {
    const due = [], keep = [];
    for (const p of nav.pending) (p.deliverTick <= tick ? due : keep).push(p);
    nav.pending = keep;
    for (const p of due) {
      const actor = state.actors?.list?.find(a => a.id === p.who);
      if (actor) actor.path = p.fail ? { reqId: p.id, fail: p.fail } : { reqId: p.id, pts: p.pts, lengthM: p.lengthM };
      if (bus) bus.emit('path-done', { reqId: p.id, who: p.who, ok: !!actor && !p.fail, lengthM: p.fail ? 0 : p.lengthM, reason: !actor ? 'gone' : p.fail ?? null });
    }
  }
  let budget = PATH_NODES_TICK;
  if (nav.debtNodes > 0) { const pay = Math.min(nav.debtNodes, budget); nav.debtNodes -= pay; budget -= pay; }
  let solves = 0;
  while (nav.queue.length && solves < PATH_SOLVES_TICK && budget > 0) {
    const req = nav.queue.shift();
    solves++;
    const r = solve(state, req), spent = r.expanded;
    if (spent > budget) { nav.debtNodes += spent - budget; budget = 0; } else budget -= spent;
    const deliverTick = tick + Math.max(1, Math.ceil(spent / PATH_NODES_TICK));
    const res = r.fail ? { id: req.id, who: req.who, deliverTick, fail: r.fail } : { id: req.id, who: req.who, deliverTick, pts: r.pts, lengthM: r.lengthM };
    let at = nav.pending.findIndex(p => p.deliverTick > deliverTick || (p.deliverTick === deliverTick && numOf(p.id) > numOf(req.id)));
    if (at < 0) at = nav.pending.length;
    nav.pending.splice(at, 0, res);
  }
}

/** A fixture's catalogue kind is known (re-exported for the validator's convenience). */
export const hasKind = (kind) => { try { catalogueKind(kind); return true; } catch { return false; } };
