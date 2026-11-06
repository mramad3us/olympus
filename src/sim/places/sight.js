// OLYMPUS places: the sight grid, what hides what from an eye at three heights (PEOPLE §7.6; the build sheet 0.0.3 §2.1).
//
// PEOPLE's perception (src/sim/people/perception.js) walks lines over this grid: cells on the area
// frame's SIGHT_CELL_M 0.25 m lattice (x0, z0 multiples of 0.25: the nav's lattice, and the fog mask's,
// src/render/fog.js), each a byte of three bits,
// PRONE 1, CROUCH 2, STAND 4, set where something there hides an eye at that height (PLACES §2.4's
// eye heights: prone 0.3, crouched 1.0, standing 1.6 m). A cell takes every layer up to its blocker's
// sight height: a wall run and a closed leaf all three; a fixture by its kind's sightH (its h, but a
// rack's 1.0, so a standing eye sees over a bay's racks into them: the sheet's §8 item 12; a locker,
// a stall, a shower by their h; wall pieces, chairs, stools, a flight of stairs and a lamp post none);
// on a ground, a building's mass all three and a closed door's reveal in it all three, the fence and
// its gates none (mesh). A layer at height L is hidden where sightH ≥ L. A cell is marked when a
// blocker overlaps its interior by more than MARK_M 1 mm on both axes, so a 0.16 m wall never leaks
// between two cells and a rect that only touches a cell's edge never marks it.
// Why 0.25 m and not the 0.5 m of the first build (v0.0.3's review): perception's two end cells never block, so an
// eye whose cell held a wall saw through it. A walker's centre stays its clearance radius (C0 0.27 m,
// the least) from a blocker's face, and a marked cell reaches less than 0.25 m past the face, so no
// walker's eye or body is ever in a wall's cell: a wall's face still lights, nothing behind it does.
// With 0.5 m cells a walker pressed to bay-2-2's west wall (x 60.95, in the cell [60.5, 61) that holds
// the wall at 60.52 to 60.68) saw 250 cells of bay-2-1 and ten of the squad through it.
//
// sightGridOf(state, areaId, x, z): a floor's grid covers the area (its plan and 0.5 m round it),
// built once and cached in state.$places.sight (runtime); a ground's is a window SIGHT_WINDOW_M 192 m
// wide holding (x, z) at least SIGHT_EDGE_M from its edge, assembled from 32 m chunks cached as built
// (only the window's are kept: a chunk dropped is built again from the state when it is next needed).
// SIGHT_EDGE_M is perception's farthest reach, SIGHT_REACH_M 54 m (SIGHT_M 10 + LIGHT_M 42 at full
// light + the reach's 2 m soft edge), and a little: cells outside a window block nothing, so with a
// window nearer the eye than sight reaches, which masses hid what would hang on where the window was
// last built, not on the state (v0.0.3's review: 919 cells of a 120 m mask differed after a 43 m walk).
// A window is centred on the chunk corner nearest the point, so it opens with the point 80 m or more
// from every edge. A door opening or closing re-marks only its leaf's cells (remarkSight, called by model.js
// setOpening and doors.js's step) and bumps the grid's gen, which every new build bumps too, so a
// reader that cached a picture knows when it is stale. Pure but for the state's runtime cache.
import { planOf, wallsOf, wallRect, leafRect } from './plan.js';
import { footprintOf, blockRectOf, mountOf, sightHOf } from './fixtures.js';
import { areaOf, leafClosed } from './model.js';

/** The sight grid's cell, metres (the nav's lattice and the fog's: under the least clearance radius, see the header). */
export const SIGHT_CELL_M = 0.25;
/** The layers' bits, and the eye heights they stand for (PLACES §2.4), metres. */
export const PRONE = 1, CROUCH = 2, STAND = 4;
export const LAYER_M = Object.freeze({ PRONE: 0.3, CROUCH: 1.0, STAND: 1.6 });
/** The farthest any eye sees, metres: perception's SIGHT_M 10 + LIGHT_M 42 × full light + REACH_SOFT_M 2 (perception.js keeps it equal: people-sight). */
export const SIGHT_REACH_M = 54;
/** A ground's sight window, and how far in it holds the eye, metres (my calls: the edge past the reach, see the header). */
export const SIGHT_WINDOW_M = 192, SIGHT_EDGE_M = SIGHT_REACH_M + 2;
/** A blocker marks a cell only where it overlaps its interior by more than this on both axes, metres. */
export const MARK_M = 0.001;
const CHUNK_M = 32, CN = CHUNK_M / SIGHT_CELL_M, ALL = PRONE | CROUCH | STAND;

/** The bits a sight height hides: every layer whose eye height is at or under it. */
export const bitsFor = (h) => (h >= LAYER_M.STAND ? ALL : h >= LAYER_M.CROUCH ? PRONE | CROUCH : h >= LAYER_M.PRONE ? PRONE : 0);

// (mark a rect's cells with bits, by the 1 mm overlap rule)
function mark(bits, g, r, b) {
  if (!b) return;
  const C = SIGHT_CELL_M, i0 = Math.max(0, Math.floor((r.x0 + MARK_M - g.x0) / C)), i1 = Math.min(g.nx - 1, Math.ceil((r.x1 - MARK_M - g.x0) / C) - 1);
  const j0 = Math.max(0, Math.floor((r.z0 + MARK_M - g.z0) / C)), j1 = Math.min(g.nz - 1, Math.ceil((r.z1 - MARK_M - g.z0) / C) - 1);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) bits[j * g.nx + i] |= b;
}
const floorTo = (v, s) => Math.floor(v / s + 1e-9) * s;
const gens = (state, areaId) => { const P = (state.$places ??= {}); const G = (P.sightGen ??= {}); return (G[areaId] = (G[areaId] ?? 0) + 1); };

// (a floor's sight grid: its static marks, then its leaves)
function floorSight(state, area) {
  const plan = planOf(area), C = SIGHT_CELL_M;
  const x0 = floorTo(plan.x0 - 0.5, C), z0 = floorTo(plan.z0 - 0.5, C);
  const nx = Math.ceil((plan.x1 + 0.5 - x0) / C - 1e-9), nz = Math.ceil((plan.z1 + 0.5 - z0) / C - 1e-9);
  const g = { areaId: area.id, kind: 'floor', x0, z0, nx, nz, cellM: C, bits: new Uint8Array(nx * nz), base: null, leaves: [], gen: 0 };
  for (const w of wallsOf(plan)) mark(g.bits, g, wallRect(w), ALL);
  for (const f of area.fixtures ?? []) if (!mountOf(f)) mark(g.bits, g, f.kind === 'stairsWell' ? blockRectOf(f) : footprintOf(f), bitsFor(sightHOf(f)));
  g.base = g.bits.slice();
  for (const o of plan.openings) {
    if (o.kind !== 'door') continue;
    const leaf = { id: o.id, rect: leafRect(o), closed: leafClosed(state, o.id) };
    g.leaves.push(leaf);
    if (leaf.closed) mark(g.bits, g, leaf.rect, ALL);
  }
  g.gen = gens(state, area.id);
  return g;
}
// (a ground's chunk of the sight grid: masses all three, the fence and gates none, fixtures by sightH)
function chunkSight(state, area, i, j) {
  const g = { x0: i * CHUNK_M, z0: j * CHUNK_M, nx: CN, nz: CN, cellM: SIGHT_CELL_M, bits: new Uint8Array(CN * CN), base: null, leaves: [] };
  const R = { x0: g.x0, z0: g.z0, x1: g.x0 + CHUNK_M, z1: g.z0 + CHUNK_M }, hit = (r) => r.x0 < R.x1 && R.x0 < r.x1 && r.z0 < R.z1 && R.z0 < r.z1;
  for (const b of area.nav.blockers) if (!b.see && hit(b)) mark(g.bits, g, b, ALL);
  for (const f of area.fixtures ?? []) { if (mountOf(f)) continue; const r = footprintOf(f); if (hit(r)) mark(g.bits, g, r, bitsFor(sightHOf(f))); }
  g.base = g.bits.slice();
  for (const l of area.nav.leaves) if (l.kind === 'reveal' && hit(l.rect)) { const leaf = { id: l.id, rect: l.rect, closed: leafClosed(state, l.id) }; g.leaves.push(leaf); if (leaf.closed) mark(g.bits, g, l.rect, ALL); }
  return g;
}

/**
 * The sight grid of an area round (x, z): { areaId, x0, z0, nx, nz, cellM: 0.25, bits: Uint8Array, gen }
 * (see the header). A floor's covers the area; a ground's is a window round the point.
 */
export function sightGridOf(state, areaId, x = null, z = null) {
  const area = areaOf(areaId);
  if (!area) throw new Error(`places: no area '${areaId}' for a sight grid`);
  const P = (state.$places ??= {}), S = (P.sight ??= {});
  if (area.kind !== 'ground') return (S[areaId] ??= floorSight(state, area));
  const px = x ?? area.spawn.x, pz = z ?? area.spawn.z, w = S[areaId];
  if (w && px >= w.x0 + SIGHT_EDGE_M && px <= w.x0 + w.nx * w.cellM - SIGHT_EDGE_M && pz >= w.z0 + SIGHT_EDGE_M && pz <= w.z0 + w.nz * w.cellM - SIGHT_EDGE_M) return w;
  // (centred on the chunk corner nearest the point: it then lies 80 m or more from every edge)
  const n = SIGHT_WINDOW_M / CHUNK_M, ci0 = Math.round(px / CHUNK_M) - n / 2, cj0 = Math.round(pz / CHUNK_M) - n / 2;
  const N = n * CN, bits = new Uint8Array(N * N), base = new Uint8Array(N * N), chunks = ((P.sightChunks ??= {})[areaId] ??= new Map()), leaves = new Map();
  const keep = new Set();
  for (let cj = 0; cj < n; cj++) for (let ci = 0; ci < n; ci++) {
    const key = `${ci0 + ci},${cj0 + cj}`;
    let ch = chunks.get(key);
    if (!ch) chunks.set(key, ch = chunkSight(state, area, ci0 + ci, cj0 + cj));
    keep.add(key);
    for (let r = 0; r < CN; r++) { const at = (cj * CN + r) * N + ci * CN; bits.set(ch.bits.subarray(r * CN, (r + 1) * CN), at); base.set(ch.base.subarray(r * CN, (r + 1) * CN), at); }
    for (const l of ch.leaves) leaves.set(l.id, l);
  }
  // (only the window's chunks are kept: 32 KB each at 0.25 m, and one built again reads the state)
  for (const key of [...chunks.keys()]) if (!keep.has(key)) chunks.delete(key);
  const g = { areaId, kind: 'ground', x0: ci0 * CHUNK_M, z0: cj0 * CHUNK_M, nx: N, nz: N, cellM: SIGHT_CELL_M, bits, base, leaves: [...leaves.values()], gen: gens(state, areaId) };
  return (S[areaId] = g);
}

// (a grid's cells under a leaf recomputed from its base and its closed leaves)
function remarkGrid(g, id, closed) {
  const leaf = g.leaves.find(l => l.id === id);
  if (!leaf) return false;
  leaf.closed = closed;
  const C = g.cellM, r = leaf.rect;
  const i0 = Math.max(0, Math.floor((r.x0 - g.x0) / C) - 1), i1 = Math.min(g.nx - 1, Math.ceil((r.x1 - g.x0) / C));
  const j0 = Math.max(0, Math.floor((r.z0 - g.z0) / C) - 1), j1 = Math.min(g.nz - 1, Math.ceil((r.z1 - g.z0) / C));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g.bits[j * g.nx + i] = g.base[j * g.nx + i];
  for (const l of g.leaves) if (l.closed) mark(g.bits, g, l.rect, ALL);
  return true;
}

/** Re-mark an opening's leaf on the cached sight grids (its floor's; the ground's where its reveal names it), bumping their gen. */
export function remarkSight(state, openingId) {
  const S = state.$places?.sight;
  if (!S) return;
  const closed = leafClosed(state, openingId);
  for (const [areaId, g] of Object.entries(S)) if (remarkGrid(g, openingId, closed)) g.gen = gens(state, areaId);
  for (const chunks of Object.values(state.$places?.sightChunks ?? {})) for (const ch of chunks.values()) remarkGrid(ch, openingId, closed);
}
