// OLYMPUS places: collision, a walker's circle against the rects its grid was built from (TECH §3.1 layer 2's places/collide.js).
//
// The nav grid (nav.js) says where a path may go: a cell is free when a circle of the class radius at
// its centre touches no blocker (PLACES §2.1). A walker is a point anywhere in a cell, not a cell, and
// tested by its cell alone it stood off a wall by anything from 0.145 to 0.395 m for C0 by where the
// cells fell (0.21 m at the bay's west wall, so the figure's cap crossed the wall line), and a 0.9 m
// door let it through on one column of cells, a 0.22 m keyhole. So a walker collides as its own
// circle of the class radius (C0 0.27, C1 0.33, C2 0.40 m) against the very rects its grid was built
// from: grid.blockers (wall runs and blocking fixtures) and grid.leaves while closed (my call, after
// the 0.0.2 review). It then stands off every wall and fixture by exactly its radius, and the office's
// 0.9 m door passes C0 over a 0.36 m band. Where a walker may stand at all is still the grid's floor:
// a point whose cell's centre lies in no room (the dark between rooms, the ground past an exterior
// door before area changes come) is out (grid.floor; a ground window is floor everywhere).
//
// standOk(grid, x, z) is whether a walker may stand at a point: on the grid, on its floor, its circle
// clear of every blocker. A circle touching a rect is clear: an overlap is a squared distance under
// r² − TOUCH_M2 (1e-9 m², a penetration of about 2 nm), so a walker put exactly at contact, and the
// rounding of its position after, never reads as inside. sweep(grid, x, z, axis, d) is how far a
// circle clear at (x, z) may move along one axis toward d before it touches a rect, exactly: against a
// rect's face, the radius; against its corner, the half chord √(r² − dz²). Both read the rects through
// a bin index of BIN_M 2 m cells (each rect in every bin its inflated extent touches), built once per
// grid and kept in a WeakMap, so a step looks at the rects near it, never at all of a ground's.
// Lengths by Math.sqrt, which IEEE rounds exactly (TECH §8.1 rule 11). Pure: the grids are read, never
// written.
import { cellOf } from './nav.js';

/** The bin index's cell (metres). */
export const BIN_M = 2;
/** A circle overlaps a rect when its squared distance is under r² less this (m²): touching is clear. */
export const TOUCH_M2 = 1e-9;
// (a rect ahead of a sweep is one the circle's centre has not passed, to this much: positions are 1e-4 m)
const AHEAD_M = 1e-6;

let bins = new WeakMap();                                          // (grid → its bin index: runtime only)
/** Forget the bin indexes (TECH §2.3: every module with a cache exports this). */
export function resetCaches() { bins = new WeakMap(); }

// (a grid's bin index: every blocker and every leaf, each in the bins its extent plus the radius touches)
function binsOf(grid) {
  let B = bins.get(grid);
  if (B) return B;
  const x0 = grid.x0, z0 = grid.z0, nbx = Math.max(1, Math.ceil(grid.nx * grid.cellM / BIN_M)), nbz = Math.max(1, Math.ceil(grid.nz * grid.cellM / BIN_M));
  const lists = Array.from({ length: nbx * nbz }, () => []), r = grid.radiusM;
  const add = (rect, leaf) => {
    const i0 = Math.max(0, Math.floor((rect.x0 - r - x0) / BIN_M)), i1 = Math.min(nbx - 1, Math.floor((rect.x1 + r - x0) / BIN_M));
    const j0 = Math.max(0, Math.floor((rect.z0 - r - z0) / BIN_M)), j1 = Math.min(nbz - 1, Math.floor((rect.z1 + r - z0) / BIN_M));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) lists[j * nbx + i].push({ rect, leaf });
  };
  for (const b of grid.blockers ?? []) add(b, null);
  for (const l of grid.leaves ?? []) add(l.rect, l);
  B = { x0, z0, nbx, nbz, lists };
  bins.set(grid, B);
  return B;
}
// (the rects of the bin a point is in, the point clamped onto the index)
function near(B, x, z) {
  const i = Math.max(0, Math.min(B.nbx - 1, Math.floor((x - B.x0) / BIN_M))), j = Math.max(0, Math.min(B.nbz - 1, Math.floor((z - B.z0) / BIN_M)));
  return B.lists[j * B.nbx + i];
}
const live = (e) => !e.leaf || e.leaf.closed;
const distSq = (x, z, r) => {
  const dx = x < r.x0 ? r.x0 - x : x > r.x1 ? x - r.x1 : 0, dz = z < r.z0 ? r.z0 - z : z > r.z1 ? z - r.z1 : 0;
  return dx * dx + dz * dz;
};

/** Whether a point is on the grid and on its floor (a cell whose centre lies in a room; a ground window is floor everywhere). */
export function onFloor(grid, x, z) {
  const c = cellOf(grid, x, z);
  return c >= 0 && (!grid.floor || grid.floor[c] === 1);
}

/** Whether a circle of radius r (the grid's class radius by default) at a point overlaps a blocker or a closed leaf. */
export function overlaps(grid, x, z, r = grid.radiusM) {
  const lim = r * r - TOUCH_M2;
  for (const e of near(binsOf(grid), x, z)) if (live(e) && distSq(x, z, e.rect) < lim) return true;
  return false;
}

/** Whether a walker of the grid's class may stand at a point: on the grid, on its floor, its circle clear. */
export const standOk = (grid, x, z) => onFloor(grid, x, z) && !overlaps(grid, x, z);

/**
 * How far a circle clear at (x, z) may move along axis ('x' | 'z') toward a signed distance d before it
 * touches a blocker or a closed leaf: a distance in [0, |d|] (|d| when nothing is in the way).
 */
export function sweep(grid, x, z, axis, d) {
  const s = d > 0 ? 1 : d < 0 ? -1 : 0;
  if (!s) return 0;
  const r = grid.radiusM, B = binsOf(grid);
  let t = Math.abs(d);
  const ax = axis === 'x', p = ax ? x : z, o = ax ? z : x;
  const seen = near(B, x, z), ahead = near(B, ax ? x + d : x, ax ? z : z + d);
  for (const list of seen === ahead ? [seen] : [seen, ahead]) for (const e of list) {
    if (!live(e)) continue;
    const R = e.rect, lo = ax ? R.x0 : R.z0, hi = ax ? R.x1 : R.z1, olo = ax ? R.z0 : R.x0, ohi = ax ? R.z1 : R.x1;
    const off = o < olo ? olo - o : o > ohi ? o - ohi : 0;
    if (off >= r) continue;                                        // (the circle passes beside it)
    const h = off === 0 ? r : Math.sqrt(r * r - off * off);         // (the half chord: contact when the centre is h from its face)
    if (s > 0 && p <= lo - h + AHEAD_M) t = Math.min(t, Math.max(0, lo - h - p));
    else if (s < 0 && p >= hi + h - AHEAD_M) t = Math.min(t, Math.max(0, p - hi - h));
  }
  return t;
}
