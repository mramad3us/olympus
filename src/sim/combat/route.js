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
// clipped(state, from, to) is a straight line cut short, CLIP_STEP_M at a time, where the walker's circle would next
// touch a rect (a braking body stops at the wall, never in it). lineClear(state, from, to) is the same rects against a line
// with no radius, exactly: the rifle's line of fire where the sight grid's cells are coarser than the walls (2026-11-12).
// From 2026-11-12 the authored paths are walkable as drawn (x4-plans.js: each door's outer middle and a lane per slot), so
// routed keeps their legs and only holds them off the corners. Lengths by Math.sqrt, which IEEE rounds exactly, never
// Math.hypot (TECH §8.1 rule 11: positions must agree between engines). Pure: grids are read, never written; the state
// is read.
import { q } from '../../core/num.js';
import { areaOf, leafClosed } from '../places/model.js';
import { buildGrid, openNavOf, path as navPath, clearLine } from '../places/nav.js';
import { turns } from '../places/doors.js';

/** The clearance class a drill's routes are solved on (nav.js CLASSES: C0 0.27 m, the player's walker's). */
export const ROUTE_CLS = 'C0';
/** A clipped line's step, metres (my call: a centimetre). */
export const CLIP_STEP_M = 0.01;
/** A corner's waypoint stands this far beyond the radius off it (m), and a leg is split at most CORNER_DEPTH deep (my calls). */
export const CORNER_KEEP_M = 0.005, CORNER_DEPTH = 4;

let grids = new WeakMap();                                          // (area → { 'cls|closed ids': grid }: runtime only)
/** Forget the routing grids (TECH §2.3: every module with a cache exports this). */
export function resetCaches() { grids = new WeakMap(); }

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

/**
 * A polyline made walkable (see the header): [[x, z]…] with each leg's line clear on the routing grid, its
 * points the given ones and, where a leg was not clear, the nav's way round between them (to 1e-4 m).
 */
export function routed(state, pts, { area = routeAreaOf(state), open = [] } = {}) {
  if (!pts || pts.length < 2) return pts;
  const G = routeGridOf(state, area, { open });
  if (!G) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = out[out.length - 1], b = pts[i];
    if (clearLine(G, a[0], a[1], b[0], b[1])) { out.push(b); continue; }
    let r = navPath(G, a, b);
    if (r.fail) { const O = openNavOf(area, G.cls); r = O ? navPath(O, a, b) : r; }
    if (!r.fail) for (const p of r.pts.slice(1, -1)) out.push([q(p[0], 1e-4), q(p[1], 1e-4)]);
    out.push(b);
  }
  // (each leg held off the corners, exactly: see the header)
  const rects = rectsOf(G), held = [out[0]];
  for (let i = 1; i < out.length; i++) held.push(...offCorners(rects, held[held.length - 1], out[i], G.radiusM, CORNER_DEPTH));
  // (two points the same in a row would make a leg of no length and no heading: dropped)
  return held.filter((p, k) => k === 0 || Math.abs(p[0] - held[k - 1][0]) > 1e-9 || Math.abs(p[1] - held[k - 1][1]) > 1e-9);
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
