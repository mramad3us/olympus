// OLYMPUS sim: the drill's moves made walkable, every leg the nav's (the user, 2026-11-11: "Operators path through walls when automatic pathing").
//
// A drill's moves (bundle.js: the approach, the entry, the far leg, the carry on, the panel's Move rows; the #2's slot;
// shooting.js: a shot row's feet moving on or braking) are polylines: a room plan's authored waypoints
// (src/data/places/x4-plans.js) joined to wherever the body stands, and the stepper places the body on them each tick
// by their closed form (stepper.js moveAt), with no collision. Before 2026-11-11 a leg was a straight line, so a
// move from the last room's point to the next stack, a carry cut on a shot, or the authored stack-to-threshold leg
// past a jamb walked through the wall (the bugs auditor of 2026-11-11: 13 to 20 sources a run, the body's centre
// 0.26 to 0.35 m into the wall's clearance, every sheet, every seed).
//
// routed(state, pts, { area, open }) keeps each leg whose line is clear on the routing grid (nav.js clearLine, a
// supercover line: every cell it passes through free) and splices in the nav's way round (nav.js path, A* pulled
// straight) where it is not, its own ends kept. The routing grid is the area's at ROUTE_CLS (C0 0.27 m, the class the
// player's own walk collides at: move.js PLAYER_CLS; C1's 0.33 m cannot pass the house's 0.9 m doors on the 0.25 m
// grid) with the doors as they stand: a leaf closed or still swinging blocks (model.js leafClosed), but for the doors
// the move's own bundle opens (`open`: its door beat swings the leaf before the feet reach it, the entry waiting on the
// leaf's passMs), so a closed door the plan does not take (room 2's locked closet) is walked round, never through.
// Grids are built once per area, class and set of closed leaves and kept in a WeakMap (runtime only, a function of
// the area's data and that set, so a game loaded routes as the unsaved run). A leg the nav cannot solve at all
// ('blocked': a door shut across the only way) is solved on the all-open grid, then kept straight as a last resort.
// A free cell's centre stands its class radius off every wall, but a point anywhere in it may not, and a line between
// two free cells' centres can cut a jamb's corner closer: the walk of 2026-11-11 grazed corners by 0.01 to 0.046 m. So
// each leg is then held to the exact rule the player's own walker obeys (collide.js: its circle against the very rects
// the grid was built from, the blockers and the closed leaves): where a leg passes a rect's corner within the radius, a
// waypoint is set CORNER_KEEP_M beyond the radius off that corner, square to the leg, and both halves are held to it in
// turn (at most CORNER_DEPTH times a leg). A leg whose own end is too close is the end's affair (the body's place).
// A body against a wall stands, by the walker's circle, in a cell the grid blocks; the nav steps out of it to the nearest free
// cell's centre, and where the leg kept from the body itself would have the hold set a waypoint in a blocked cell, the
// route is spliced again with that step out kept (routes that never meet it are unchanged).
// clipped(state, from, to) is a straight line cut short, CLIP_STEP_M at a time, where the walker's circle would next
// touch a rect (a braking body stops at the wall, never in it). lineClear(state, from, to) is the same rects against a line
// with no radius, exactly: the rifle's line of fire where the sight grid's cells are coarser than the walls (2026-11-12).
// From 2026-11-12 the authored paths are walkable as drawn (x4-plans.js: each door's outer middle and a lane per slot), so
// routed keeps their legs and only holds them off the corners. Lengths by Math.sqrt, which IEEE rounds exactly, never
// Math.hypot (TECH §8.1 rule 11: positions must agree between engines). Pure: grids are read, never written; the state
// is read, but for its runtime budget record (state.$route, below).
// v0.0.20 (the build sheet v0.0.20 item 1, the user's "soldiers need to stay fluidly moving", 2026-11-13): **round a body**.
// routed takes `bodies`, [{ x, z, rM }], each a disc a walk must keep out of (a teammate standing on your way: the body gap and
// its guard, bundle.js BODY_GAP_M + GAP_GUARD_M, 0.52 m). The discs are laid on a copy of the routing grid for the one solve,
// every cell whose centre lies within rM + half a cell's diagonal of a disc's centre blocked (BODY_PAD_K: a line pulled through
// free cells then passes no nearer than rM), never cached; a walk that starts inside a disc leaves it by the nearest free cell
// first. With bodies, a leg the nav cannot solve is no way at all: routed returns null (no all-open grid, no straight last resort),
// and the caller hands the walk back (places/move.js roundAbout).
// v0.0.21 (its build sheet's item 14, the perf lens's P2): **a tick's budget, and no search for a way that is not there**. Every solve
// routed runs counts its A* expansions on the state's runtime record, state.$route = { seq (the loop's tick, clock.seq, which moves
// in stop motion too), nodes, fail } (a `$` key: never saved; the tick's first solve starts it afresh). A caller that may storm passes
// `cap` (places/move.js stepAside: your #2's step off your walk's path, tried at up to 18 points a tick, every tick it failed): its
// solves then get only what is left of ROUTE_NODES_TICK this tick, and a solve that runs out fails 'cap', "no way this tick": routed
// returns null, never the all-open grid's retry (that follows a 'blocked' alone) nor the straight last resort. And no solve searches
// for a way that is not there: each cached routing grid's free cells are labelled once by the region they reach (4-connected: the
// nav's diagonal step needs both its sides free, so it reaches nothing more), and a leg whose ends stand, as the nav takes them (its
// own cell, else the nearest free one: nav.js endOf), in two regions is 'blocked' at once. The nav's A* expanded the whole of the
// first region to say so: about 12,700 cells of the house's hall and rooms, on the grid and again on the all-open one, for each of
// stepOffPath's tries toward a point inside or through a wall. That is the solve's own answer, so no route that was found changes:
// every lane's end state is the same to the byte. Measured on 72 fuzz lanes from GO (six sheets, seeds 1000 to 1011): 43 spent over
// 8,000 nodes in a tick, the most 88,808 (the sergeant on 1002, 10.9 ms) and a lane's most 199,033; now the most in a tick 4,104
// and a lane's 33,134 (the perf lens's boot recruit on 1185: 29,007,687 nodes in a lane on v0.0.19's tree, 948 on v0.0.20's with
// this). The honest and keys lanes never pass 1,485 nodes a tick, so the budget never bites there. routeFailOf(state) says why the
// last routed of the tick came to nothing ('cap' or 'blocked').
import { q } from '../../core/num.js';
import { areaOf, leafClosed } from '../places/model.js';
import { buildGrid, openNavOf, path as navPath, clearLine, isFree, cellOf, nearestFree, COSTS, NODE_CAP } from '../places/nav.js';
import { turns } from '../places/doors.js';

/** The clearance class a drill's routes are solved on (nav.js CLASSES: C0 0.27 m, the player's walker's). */
export const ROUTE_CLS = 'C0';
/** A clipped line's step, metres (my call: a centimetre). */
export const CLIP_STEP_M = 0.01;
/** A corner's waypoint stands this far beyond the radius off it (m), and a leg is split at most CORNER_DEPTH deep (my calls). */
export const CORNER_KEEP_M = 0.005, CORNER_DEPTH = 4;

/** A tick's synchronous route nodes (A* expansions) for the callers that pass `cap` (see the header; nav.js PATH_NODES_TICK's figure, the walkers' queue's: about 0.8 ms). */
export const ROUTE_NODES_TICK = 8000;

let grids = new WeakMap();                                          // (area → { 'cls|closed ids': grid }: runtime only)
let regions = new WeakMap();                                        // (cached grid → its free cells' regions: runtime only)
/** Forget the routing grids and their regions (TECH §2.3: every module with a cache exports this). */
export function resetCaches() { grids = new WeakMap(); regions = new WeakMap(); }

/** The area a person's route lies on: the live area's (the shoot house's, the range's), else null. */
export const routeAreaOf = (state) => state?.places?.live?.area ?? null;

/** The routing grid of an area now (see the header): its leaves as they stand, but the `open` doors'. */
export function routeGridOf(state, areaId, { open = [], cls = ROUTE_CLS } = {}) {
  const area = areaId ? areaOf(areaId) : null;
  if (!area || area.kind === 'ground') return null;
  const shut = (area.openings ?? []).filter(o => turns(o) && !open.includes(o.id) && leafClosed(state, o)).map(o => o.id).sort();
  let byKey = grids.get(area);
  if (!byKey) grids.set(area, byKey = new Map());
  const key = `${cls}|${shut.join(',')}`;
  let g = byKey.get(key);
  if (!g) { const set = new Set(shut); g = buildGrid(area, cls, { closed: (o) => set.has(o.id) }); byKey.set(key, g); }
  return g;
}

// (the loop's tick: clock.seq, which moves in stop motion too, where clock.tick (the lived ticks) stands)
const seqOf = (state) => state?.clock?.seq ?? state?.clock?.tick ?? 0;
/** The tick's route record (see the header), started afresh on the tick's first solve: { seq, nodes, fail }. */
export function routeTick(state) {
  const tick = seqOf(state);
  let R = state.$route;
  if (!R || R.seq !== tick) state.$route = R = { seq: tick, nodes: 0, fail: null };
  // (the tests' switch, state.$routeFree: the budget and the regions' answer off, every node still counted (house-route-budget's
  // "without the fix", as shooting.js's $readsOff is the read scope's))
  R.free = !!state.$routeFree;
  return R;
}
/** Why the last routed of this tick came to nothing: 'cap' (the tick's budget spent: no way this tick), 'blocked' (no way round the bodies), or null. */
export const routeFailOf = (state) => (state?.$route?.seq === seqOf(state) ? state.$route.fail ?? null : null);
// (a grid's free cells labelled by the region they reach, 4-connected (see the header); -1 for a blocked cell; once a grid)
function regionsOf(G) {
  let L = regions.get(G);
  if (L) return L;
  const nx = G.nx, n = nx * G.nz, cost = G.cost, B = COSTS.blocked, stack = new Int32Array(n);
  L = new Int32Array(n).fill(-1);
  let id = 0;
  for (let c = 0; c < n; c++) {
    if (L[c] !== -1 || cost[c] === B) continue;
    let top = 0;
    stack[top++] = c; L[c] = id;
    while (top) {
      const u = stack[--top], ui = u % nx;
      if (ui > 0 && L[u - 1] === -1 && cost[u - 1] !== B) { L[u - 1] = id; stack[top++] = u - 1; }
      if (ui < nx - 1 && L[u + 1] === -1 && cost[u + 1] !== B) { L[u + 1] = id; stack[top++] = u + 1; }
      if (u >= nx && L[u - nx] === -1 && cost[u - nx] !== B) { L[u - nx] = id; stack[top++] = u - nx; }
      if (u + nx < n && L[u + nx] === -1 && cost[u + nx] !== B) { L[u + nx] = id; stack[top++] = u + nx; }
    }
    id++;
  }
  regions.set(G, L);
  return L;
}
// (the cell the nav's search starts or ends a point at (nav.js endOf: its own cell where free, else the nearest free one within
// NEAREST_FREE_M), or -1 where there is none (the search fails then with no expansion))
const endCell = (G, p) => {
  const c = cellOf(G, p[0], p[1]);
  return c >= 0 && G.cost[c] !== COSTS.blocked ? c : nearestFree(G, p[0], p[1]);
};
// (one solve, counted on the tick's record: 'blocked' with no search where its ends' cells lie in two regions (a cached grid's only: a
// bodies' copy is made for one solve, and labelling it would cost more than its search); capped, only what is left of ROUTE_NODES_TICK,
// a 'cap' when it runs out)
function solve(R, G, a, b, capped, cached = true) {
  if (cached && !R.free) {
    const ca = endCell(G, a), cb = endCell(G, b);
    if (ca >= 0 && cb >= 0 && ca !== cb) { const L = regionsOf(G); if (L[ca] !== L[cb]) return { fail: 'blocked', expanded: 0 }; }
  }
  const r = capped ? navPath(G, a, b, { cap: Math.max(0, Math.min(NODE_CAP, ROUTE_NODES_TICK - R.nodes)) }) : navPath(G, a, b);
  R.nodes += r.expanded ?? 0;
  return r;
}

/** A body's disc is laid on the grid out to its radius plus this share of a cell's side (√2 / 2: half the diagonal; see the header). */
export const BODY_PAD_K = Math.SQRT1_2;
// (a copy of a routing grid with the bodies' discs blocked (see the header): for one solve, never cached)
function withBodies(G, bodies) {
  const g = { ...G, cost: G.cost.slice() }, C = G.cellM;
  for (const b of bodies) {
    const R = (b.rM ?? 0) + C * BODY_PAD_K, i0 = Math.max(0, Math.floor((b.x - R - G.x0) / C)), i1 = Math.min(G.nx - 1, Math.floor((b.x + R - G.x0) / C));
    const j0 = Math.max(0, Math.floor((b.z - R - G.z0) / C)), j1 = Math.min(G.nz - 1, Math.floor((b.z + R - G.z0) / C));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const cx = G.x0 + (i + 0.5) * C - b.x, cz = G.z0 + (j + 0.5) * C - b.z;
      if (Math.sqrt(cx * cx + cz * cz) <= R) g.cost[j * G.nx + i] = COSTS.blocked;
    }
  }
  return g;
}

/**
 * A polyline made walkable (see the header): [[x, z]…] with each leg's line clear on the routing grid, its
 * points the given ones and, where a leg was not clear, the nav's way round between them (to 1e-4 m). bodies: discs
 * kept out of, [{ x, z, rM }]; with any, null where a leg has no way round them. cap: the tick's budget applies, and
 * null where it runs out (routeFailOf 'cap').
 */
export function routed(state, pts, { area = routeAreaOf(state), open = [], bodies = [], cap = false } = {}) {
  if (!pts || pts.length < 2) return pts;
  const G0 = routeGridOf(state, area, { open });
  if (!G0) return pts;
  const R = routeTick(state), capped = !!cap && !state.$routeFree;
  R.fail = null;
  const G = bodies?.length ? withBodies(G0, bodies) : G0;
  const first = spliced(R, G, G0, area, pts, false, capped);
  if (!first) return null;
  let held = holdOff(G, first);
  // (a body against a wall stands, by the walker's circle, in a cell the grid blocks; the nav steps out of it to the nearest
  // free cell's centre, and dropping that step left the first leg cutting a corner, so the hold set its waypoint in a blocked
  // cell, and the leg after it was no leg of the grid's (the hunt of v0.0.18's fixes, merged: house-flawless-keys F3, the fuzz
  // tier one on 1185, #1's approach to the hall from (19.363, 7.528) by (19.297, 7.554), a 0.3 m dance out and back). Only
  // there is the route spliced again with the nav's step out kept, so every route that never met it is unchanged)
  if (held.some((p, k) => k > 0 && !isFree(G, p[0], p[1]))) {
    const again = spliced(R, G, G0, area, pts, true, capped);
    if (again) held = holdOff(G, again);
    else if (R.fail === 'cap') return null;
  }
  // (two points the same in a row would make a leg of no length and no heading: dropped)
  return held.filter((p, k) => k === 0 || Math.abs(p[0] - held[k - 1][0]) > 1e-9 || Math.abs(p[1] - held[k - 1][1]) > 1e-9);
}
// (the legs kept where clear and the nav's way spliced in where not, its own ends the given points; null where a leg has no way
// round the bodies (G, the bodies' grid, not G0, the walls' own); stepOut keeps the nav's first point where it is not the leg's
// start, its step out of a blocked cell, as a walk begun inside a body's disc always does (see the header))
// (capped, v0.0.21: a solve out of the tick's budget is no way this tick, null, R.fail 'cap'; never the all-open grid's retry)
function spliced(R, G, G0, area, pts, stepOut, capped = false) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = out[out.length - 1], b = pts[i];
    if (clearLine(G, a[0], a[1], b[0], b[1])) { out.push(b); continue; }
    let r = solve(R, G, a, b, capped, G === G0);
    if (capped && r.fail === 'cap') { R.fail = 'cap'; return null; }
    if (r.fail && G !== G0) { R.fail = 'blocked'; return null; }
    if (r.fail) {
      const O = openNavOf(area, G.cls);
      if (O) r = solve(R, O, a, b, capped);
      if (capped && r.fail === 'cap') { R.fail = 'cap'; return null; }
    }
    const out0 = (G !== G0 && !isFree(G, a[0], a[1])) || (stepOut && !r.fail && (r.pts[0][0] !== a[0] || r.pts[0][1] !== a[1]));
    if (!r.fail) for (const p of r.pts.slice(out0 ? 0 : 1, -1)) out.push([q(p[0], 1e-4), q(p[1], 1e-4)]);
    out.push(b);
  }
  return out;
}
// (each leg held off the corners, exactly: see the header)
function holdOff(G, out) {
  const rects = rectsOf(G), held = [out[0]];
  for (let i = 1; i < out.length; i++) held.push(...offCorners(rects, held[held.length - 1], out[i], G.radiusM, CORNER_DEPTH));
  return held;
}

// (the rects a walker of the grid's class collides with: collide.js's, the blockers and the closed leaves)
function rectsOf(G) { return [...(G.blockers ?? []), ...(G.leaves ?? []).filter(l => l.closed).map(l => l.rect)]; }
const d2Rect = (x, z, r) => { const dx = x < r.x0 ? r.x0 - x : x > r.x1 ? x - r.x1 : 0, dz = z < r.z0 ? r.z0 - z : z > r.z1 ? z - r.z1 : 0; return dx * dx + dz * dz; };
/** Whether a circle of radius R at a point is clear of every rect (touching is clear, as collide.js's TOUCH_M2). */
export const pointClear = (rects, x, z, R) => rects.every(r => d2Rect(x, z, r) >= R * R - 1e-9);
// (the leg a → b as [..waypoints, b]: where it passes a rect's corner within R strictly between its ends, a waypoint
// CORNER_KEEP_M beyond R off the worst such corner, square to the leg on the corner's far side, and each half again)
function offCorners(rects, a, b, R, depth) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
  if (depth <= 0 || L2 < 1e-12) return [b];
  let worst = null;
  for (const r of rects) {
    if (Math.min(a[0], b[0]) > r.x1 + R || Math.max(a[0], b[0]) < r.x0 - R || Math.min(a[1], b[1]) > r.z1 + R || Math.max(a[1], b[1]) < r.z0 - R) continue;
    for (const [cx, cz] of [[r.x0, r.z0], [r.x1, r.z0], [r.x0, r.z1], [r.x1, r.z1]]) {
      const t = ((cx - a[0]) * dx + (cz - a[1]) * dz) / L2;
      if (t <= 1e-6 || t >= 1 - 1e-6) continue;
      const px = a[0] + t * dx, pz = a[1] + t * dz, d = Math.sqrt((px - cx) * (px - cx) + (pz - cz) * (pz - cz));
      if (d < R - 1e-6 && (!worst || d < worst.d)) worst = { d, cx, cz, px, pz, r };
    }
  }
  if (!worst) return [b];
  // (away from the corner, on the side of the leg the rect is not: square to the leg)
  let nx = -dz, nz = dx;
  const mid = [(worst.r.x0 + worst.r.x1) / 2, (worst.r.z0 + worst.r.z1) / 2];
  if ((mid[0] - worst.px) * nx + (mid[1] - worst.pz) * nz > 0) { nx = -nx; nz = -nz; }
  const n = Math.sqrt(nx * nx + nz * nz), k = R + CORNER_KEEP_M;
  // (the waypoint: the corner plus k along that normal, abreast of the corner's foot on the leg)
  const w = [q(worst.cx + nx / n * k, 1e-4), q(worst.cz + nz / n * k, 1e-4)];
  if (!pointClear(rects, w[0], w[1], R)) return [b];
  return [...offCorners(rects, a, w, R, depth - 1), ...offCorners(rects, w, b, R, depth - 1)];
}

/**
 * Whether the straight line from `from` to `to` touches none of the rects a walker collides with (the walls, the blocking
 * fixtures, the leaves closed now: the routing grid's own, see the header), exactly, with no radius: the line of fire as
 * the walls stand, for the rifle's frame (shooting.js targetsOf), where the sight grid's 0.25 m cells are coarser than the
 * walls (a cell a jamb only grazes blocks the whole cell: from a doorway's outer half, the far corner of the room was hidden
 * on the grid by a jamb the line passed 0.18 m clear of). Slabs, per rect (Liang and Barsky's clip). Null area: true.
 */
export function lineClear(state, from, to, { area = routeAreaOf(state) } = {}) {
  const G = routeGridOf(state, area);
  if (!G) return true;
  const dx = to[0] - from[0], dz = to[1] - from[1];
  for (const r of rectsOf(G)) {
    if (Math.max(from[0], to[0]) < r.x0 || Math.min(from[0], to[0]) > r.x1 || Math.max(from[1], to[1]) < r.z0 || Math.min(from[1], to[1]) > r.z1) continue;
    let t0 = 0, t1 = 1, hit = true;
    for (const [p, q0] of [[-dx, from[0] - r.x0], [dx, r.x1 - from[0]], [-dz, from[1] - r.z0], [dz, r.z1 - from[1]]]) {
      if (p === 0) { if (q0 < 0) { hit = false; break; } continue; }
      const t = q0 / p;
      if (p < 0) { if (t > t1) { hit = false; break; } if (t > t0) t0 = t; } else { if (t < t0) { hit = false; break; } if (t < t1) t1 = t; }
    }
    if (hit) return false;
  }
  return true;
}

/** A straight line from `from` toward `to`, cut short where the walker's circle would touch a rect (see the header): the point it reaches, [x, z]. */
export function clipped(state, from, to, { area = routeAreaOf(state), open = [] } = {}) {
  const G = routeGridOf(state, area, { open });
  if (!G) return to;
  const rects = rectsOf(G), R = G.radiusM, dx = to[0] - from[0], dz = to[1] - from[1], L = Math.sqrt(dx * dx + dz * dz);
  if (!(L > 0) || !pointClear(rects, from[0], from[1], R)) return L > 0 ? from : to;
  const n = Math.ceil(L / CLIP_STEP_M);
  let k = 0;
  while (k < n && pointClear(rects, from[0] + dx * (k + 1) / n, from[1] + dz * (k + 1) / n, R)) k++;
  return k === n ? to : [q(from[0] + dx * k / n, 1e-4), q(from[1] + dz * k / n, 1e-4)];
}
