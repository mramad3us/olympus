// OLYMPUS people: perception's sight, the one visibility primitive the fog of awareness and every sighting read (PEOPLE §7.1, §7.2, §7.6).
//
// Adapted from tradecraft v0.2.0-rc3 `src/sim/perception.js` (265 lines): eyes() and openness() with
// their constants (CONE_DEG 100 plus CONE_PER_AWARENESS 2 a point of Awareness, at most CONE_MAX_DEG
// 170; an all-round radius AWARE_M 2.5 plus AWARE_PER 0.2 a point, with a 1.5 m soft edge; anyone
// within ALWAYS_M 1 m perceived; the reach SIGHT_M 10 + LIGHT_M 42 × the light at the spot looked at,
// with a 4 m soft edge; a cone with a 0.24 rad soft edge; SEEN 0.5 the rules' threshold). What changed
// (PEOPLE §7.6): tradecraft's rays against binned wall segments are replaced by clearLine over PLACES's
// sight grid, so the fog on the screen and the dice agree cell for cell ("what we see is what our
// character evaluates as being true", the user, tradecraft 2026-10-28); the glass, the felt (sense.js,
// 0.0.10) and the weather's cap (0.0.12) are not ported yet; the light is PLACES's lightLevel (TECH
// correction 14); the eye's height picks the grid's layer.
//
// eyeOf(state, actor) → { x, z, headRad, coneRad (half-angle), awareM, eyeLayer, asleep, areaId } (and
// the heading's unit vector and the cone's outer cosine, so a cell plainly outside it costs no atan2): the
// heading from the actor's face (right 0, down π/2, left π, up −π/2: x east, z south), Awareness
// PLAYER_AWARENESS 5 for the player (SKILLS's out-of-boot floor, until SKILLS) and MARINE_AWARENESS 5
// for everyone else (my call: marines read as marines); the eye's height is EYE_M by posture (stand
// 1.6, sit 1.0, lie 0.3: PLACES §2.4's eye heights) plus the actor's y, and its layer the highest of
// the grid's three it reaches (stand at 1.6 m, crouch at 1.0, prone below). A lying person but the
// player is asleep this round (they lie only in their racks after taps) and sees nothing (PEOPLE §7.2);
// the player sees from the berth unless their body sleeps (BODY's isAsleep: the 0.0.4 sheet §8, item 22).
// A berth is a blocker on the low layers (a rack's cells hold PRONE and CROUCH, its footlocker PRONE),
// so an eye lying in one would see only its own cell: a lying, awake player's eye looks out of the
// berth instead (lookOut, the integrator's call for 0.0.4: woken by the klaxon you lift your head and
// look past the rack's foot), moved along its facing through the run of cells that block its layer,
// from its own, onto the last of them (an end cell, which never blocks), at most BERTH_LOOK_M 2 m.
//
// clearLine(grid, ax, az, bx, bz, layer): the segment between the centres of the two points' cells,
// walked cell by cell in exact integer arithmetic (the cells it passes through, compared as
// (1 + 2k) × |dz| against (1 + 2m) × |dx|), so the walk from either end visits the same cells and
// clearLine(a, b) = clearLine(b, a) bit for bit. A cell blocks when its bits hold the layer's
// (PRONE 1, CROUCH 2, STAND 4); the two end cells never block (a wall's face lights when seen, a body
// in a rack is seen from the aisle: the 0.0.3 sheet §8, item 13). The grid's cells are 0.25 m, under
// the least clearance radius, so no walker's eye or body is in a wall's cell and the rule never sees
// through a wall (sight.js says why). Where the segment passes exactly
// through a lattice corner it is blocked only if both cells beside the corner block (no seeing through
// a diagonal crack; touching one blocking cell's corner is not blocked). Cells outside the grid block
// nothing: a floor's grid covers its walls, a ground's window holds the eye farther from its edge than
// anyone sees (sight.js SIGHT_EDGE_M, past SIGHT_M + LIGHT_M + REACH_SOFT_M 54 m).
//
// visibility(state, eye, x, z, ms) is the one primitive: openness (tradecraft's, unchanged: 1 within
// ALWAYS_M; the awareness radius's soft edge; else the cone's soft edge × the reach's, where the reach
// needs the light at (x, z) only between SIGHT_M − 2 and SIGHT_M + LIGHT_M + 2 m) × clearLine on the
// eye's area's grid, 0 to 1. sightOf(state, viewer, target) → { vis, seen }: the target's spot, a
// target behind its own drawn rack curtain seen only within ALWAYS_M; canSee its seen. sightMask(state,
// eye, mask) fills mask.vis (Float32Array, nx × nz) with visibility at each cell's centre (x0 +
// (i + 0.5) × cellM), by the same per-cell function, the grid and the eye's cell taken once: the fog
// draws this mask (VIEWS §2.11) and the poses read canSee, one function (the 0.0.3 sheet §2.2;
// people-sight proves the mask equals visibility at every cell).
// Pure.
import { lightLevel } from '../places/light.js';
import { sightGridOf } from '../places/sight.js';
import { isAsleep } from '../body/body.js';

export const CONE_DEG = 100, CONE_PER_AWARENESS = 2, CONE_MAX_DEG = 170;
export const AWARE_M = 2.5, AWARE_PER = 0.2, ALWAYS_M = 1;
export const SIGHT_M = 10, LIGHT_M = 42;
export const SEEN = 0.5;
/** The player's Awareness until SKILLS gives it (SKILLS's out-of-boot floor: the sheet's call). */
export const PLAYER_AWARENESS = 5;
/** Everyone else's this round (my call: a marine's floor, PEOPLE §1 "marines read as marines"). */
export const MARINE_AWARENESS = 5;
/** Eye heights above the actor's y by posture (PLACES §2.4: 1.6, 1.0, 0.3 m). */
export const EYE_M = Object.freeze({ stand: 1.6, sit: 1.0, lie: 0.3 });
/** The sight grid's layers (PLACES's sight.js bits) and the eye heights they stand for. */
export const LAYER_BIT = Object.freeze({ prone: 1, crouch: 2, stand: 4 });
export const LAYER_M = Object.freeze({ stand: 1.6, crouch: 1.0, prone: 0.3 });
/** The soft edges: the awareness radius's (1.5 m, its middle AWARE_SOFT_M past the radius), the reach's (4 m), the cone's (0.24 rad). */
export const AWARE_SOFT_M = 0.75, REACH_SOFT_M = 2, CONE_SOFT_RAD = 0.12;

const TAU = Math.PI * 2;
const HEADS = Object.freeze({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 });
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** An angle wrapped to [−π, π). */
export const wrap = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
/** The heading of a sprite facing, radians (x east, z south). */
export const headOf = (face) => HEADS[face] ?? HEADS.down;
/** How far a lying player's eye looks out of the berth along its facing (see the header). */
export const BERTH_LOOK_M = 2;
/** The grid layer an eye at heightM reaches. */
export const layerAt = (heightM) => (heightM >= LAYER_M.stand ? 'stand' : heightM >= LAYER_M.crouch ? 'crouch' : 'prone');

/** Someone's eyes (see the header). */
export function eyeOf(state, actor) {
  const isPlayer = !!actor && actor.id === state?.player?.actor;
  const aw = isPlayer ? PLAYER_AWARENESS : MARINE_AWARENESS;
  const posture = actor.posture ?? 'stand';
  const eyeM = (EYE_M[posture] ?? EYE_M.stand) + (actor.y ?? 0);
  const headRad = headOf(actor.face), coneRad = Math.min(CONE_MAX_DEG, CONE_DEG + CONE_PER_AWARENESS * aw) * Math.PI / 360;
  const outer = coneRad + CONE_SOFT_RAD + 1e-6;
  const eye = {
    x: actor.x, z: actor.z, headRad, coneRad,
    awareM: AWARE_M + AWARE_PER * aw, eyeLayer: layerAt(eyeM), asleep: isPlayer ? isAsleep(state, actor.who, state.clock?.ms) : posture === 'lie',
    areaId: state?.places?.live?.area ?? null,
    // (the heading's unit vector and the cosine past which nothing is in the cone's soft edge: a quick test before the angle)
    hx: Math.cos(headRad), hz: Math.sin(headRad), outerCos: outer >= Math.PI ? -2 : Math.cos(outer),
  };
  if (isPlayer && posture === 'lie' && !eye.asleep) lookOut(state, eye);
  return eye;
}

// (a lying player's eye out of the berth: along the facing through the cells that block its layer, onto the last; see the header)
function lookOut(state, eye) {
  const grid = gridFor(state, eye);
  if (!grid) return;
  const C = grid.cellM, bit = LAYER_BIT[eye.eyeLayer];
  const cell = (x, z) => { const i = Math.floor((x - grid.x0) / C), j = Math.floor((z - grid.z0) / C); return i >= 0 && j >= 0 && i < grid.nx && j < grid.nz ? j * grid.nx + i : -1; };
  const c0 = cell(eye.x, eye.z);
  if (c0 < 0 || (grid.bits[c0] & bit) === 0) return;               // (an eye not in a blocker sees from where it is)
  let x = eye.x, z = eye.z;
  for (let d = C; d <= BERTH_LOOK_M + 1e-9; d += C) {
    const nx = eye.x + eye.hx * d, nz = eye.z + eye.hz * d, c = cell(nx, nz);
    if (c < 0 || (grid.bits[c] & bit) === 0) break;
    x = nx; z = nz;
  }
  eye.x = Math.round(x * 1e4) / 1e4; eye.z = Math.round(z * 1e4) / 1e4;
}

// ---- the line ----

/**
 * Whether the segment between the centres of the cells holding (ax, az) and (bx, bz) is clear for an
 * eye on layer ('stand' | 'crouch' | 'prone', or its bit): see the header.
 */
export function clearLine(grid, ax, az, bx, bz, layer = 'stand') {
  const bit = typeof layer === 'number' ? layer : LAYER_BIT[layer] ?? LAYER_BIT.stand;
  const C = grid.cellM, nx = grid.nx, nz = grid.nz, bits = grid.bits;
  let i = Math.floor((ax - grid.x0) / C), j = Math.floor((az - grid.z0) / C);
  const i1 = Math.floor((bx - grid.x0) / C), j1 = Math.floor((bz - grid.z0) / C);
  return walk(bits, nx, nz, bit, i, j, i1, j1);
}

// (the cells between two cells' centres, exactly: see the header; true when none blocks. ex and ez are
// (1 + 2k) × |dz| and (1 + 2m) × |dx|, kept by adding; the walk stays inside the two cells' bounding
// box, so when both lie in the grid no cell needs a bounds check)
function walk(bits, nx, nz, bit, i, j, i1, j1) {
  const di = i1 - i, dj = j1 - j, sx = di > 0 ? 1 : -1, sz = dj > 0 ? 1 : -1;
  const ax = di < 0 ? -di : di, az = dj < 0 ? -dj : dj, dex = 2 * az, dez = 2 * ax, step = sz * nx;
  if (i < 0 || j < 0 || i >= nx || j >= nz || i1 < 0 || j1 < 0 || i1 >= nx || j1 >= nz) return walkChecked(bits, nx, nz, bit, i, j, ax, az, sx, sz);
  let k = 0, m = 0, ex = az, ez = ax, idx = j * nx + i;
  while (k < ax || m < az) {
    if (k < ax && (m >= az || ex < ez)) { idx += sx; k++; ex += dex; }
    else if (m < az && (k >= ax || ez < ex)) { idx += step; m++; ez += dez; }
    else {                                                          // (exactly through a corner: the two cells beside it)
      if ((bits[idx + sx] & bit) !== 0 && (bits[idx + step] & bit) !== 0) return false;
      idx += sx + step; k++; m++; ex += dex; ez += dez;
    }
    if (k === ax && m === az) return true;                          // (the far end cell never blocks)
    if ((bits[idx] & bit) !== 0) return false;
  }
  return true;
}
// (the same walk where an end lies outside the grid: cells outside it block nothing)
function walkChecked(bits, nx, nz, bit, i, j, ax, az, sx, sz) {
  let k = 0, m = 0;
  while (k < ax || m < az) {
    if (k < ax && (m >= az || (1 + 2 * k) * az < (1 + 2 * m) * ax)) { i += sx; k++; }
    else if (m < az && (k >= ax || (1 + 2 * m) * ax < (1 + 2 * k) * az)) { j += sz; m++; }
    else {
      if (blocksAt(bits, nx, nz, bit, i + sx, j) && blocksAt(bits, nx, nz, bit, i, j + sz)) return false;
      i += sx; j += sz; k++; m++;
    }
    if (k === ax && m === az) return true;
    if (blocksAt(bits, nx, nz, bit, i, j)) return false;
  }
  return true;
}
const blocksAt = (bits, nx, nz, bit, i, j) => i >= 0 && j >= 0 && i < nx && j < nz && (bits[j * nx + i] & bit) !== 0;

// ---- visibility ----

// (the one per-cell function, visibility()'s and sightMask()'s alike: the grid given, the eye's cell given)
function visAt(state, eye, grid, ei, ej, bit, x, z, ms) {
  const dx = x - eye.x, dz = z - eye.z, d = Math.sqrt(dx * dx + dz * dz);
  let open, far = -1, c = 0;
  if (d < ALWAYS_M) open = 1;
  else {
    const v = clamp01((eye.awareM + AWARE_SOFT_M - d) / (2 * AWARE_SOFT_M));
    if (v >= 1) open = 1;
    else {
      // (outside the cone's soft edge by the dot product, a hair inside its true angle: no atan2 needed, c is 0)
      const outside = eye.outerCos !== undefined && dx * eye.hx + dz * eye.hz < d * eye.outerCos;
      let off = 0;
      if (!outside) { off = Math.atan2(dz, dx) - eye.headRad; if (off > Math.PI) off -= TAU; else if (off < -Math.PI) off += TAU; }   // (both in [−π, π]: one turn at most)
      c = outside ? 0 : clamp01((eye.coneRad + CONE_SOFT_RAD - Math.abs(off)) / (2 * CONE_SOFT_RAD));
      if (c <= v) open = v;                                         // (far ≤ 1, so the cone can add nothing: tradecraft's far <= v)
      else if (d <= SIGHT_M - REACH_SOFT_M) open = c;              // (the reach is at least SIGHT_M: full, whatever the light)
      else if (d >= SIGHT_M + LIGHT_M + REACH_SOFT_M) open = v;    // (beyond any reach)
      else { open = v; far = 0; }                                   // (the light decides: after the line, which may make it moot)
    }
  }
  if (open <= 0 && far < 0) return 0;
  if (grid) {
    const C = grid.cellM, ti = Math.floor((x - grid.x0) / C), tj = Math.floor((z - grid.z0) / C);
    if (!walk(grid.bits, grid.nx, grid.nz, bit, ei, ej, ti, tj)) return 0;
  }
  if (far === 0) {
    const L = lightLevel(state, x, z, ms, eye.areaId);
    far = clamp01((SIGHT_M + LIGHT_M * L + REACH_SOFT_M - d) / (2 * REACH_SOFT_M));
    const fc = far * c;
    if (fc > open) open = fc;
  }
  return open;
}

/** The sight grid an eye looks over (PLACES's), or null when its area has none. */
const gridFor = (state, eye) => (eye.areaId ? sightGridOf(state, eye.areaId, eye.x, eye.z) : null);

/** How well eye takes in (x, z), 0 to 1, at game time ms: openness × clearLine (see the header). */
export function visibility(state, eye, x, z, ms = state.clock.ms) {
  if (eye.asleep) return 0;
  const grid = gridFor(state, eye);
  const ei = grid ? Math.floor((eye.x - grid.x0) / grid.cellM) : 0, ej = grid ? Math.floor((eye.z - grid.z0) / grid.cellM) : 0;
  return visAt(state, eye, grid, ei, ej, LAYER_BIT[eye.eyeLayer], x, z, ms);
}

/** What a viewer actor makes of a target actor: { vis, seen } (a target behind its own drawn curtain only within ALWAYS_M). */
export function sightOf(state, viewer, target, ms = state.clock.ms) {
  if (!viewer || !target) return { vis: 0, seen: false };
  if (target.curtain && Math.hypot(target.x - viewer.x, target.z - viewer.z) >= ALWAYS_M) return { vis: 0, seen: false };
  const vis = visibility(state, eyeOf(state, viewer), target.x, target.z, ms);
  return { vis, seen: vis >= SEEN };
}

/** Whether a viewer actor sees a target actor (sightOf's seen). */
export const canSee = (state, viewer, target, ms = state.clock.ms) => sightOf(state, viewer, target, ms).seen;

/**
 * Fill mask.vis (a Float32Array of nx × nz) with visibility() at each cell's centre, x0 + (i + 0.5) ×
 * cellM by z0 + (j + 0.5) × cellM: exactly what visibility gives there (see the header). Returns mask.
 */
export function sightMask(state, eye, mask) {
  const { x0, z0, nx, nz, cellM } = mask;
  const vis = mask.vis ?? (mask.vis = new Float32Array(nx * nz));
  if (eye.asleep) { vis.fill(0); return mask; }
  const ms = state.clock.ms, grid = gridFor(state, eye), bit = LAYER_BIT[eye.eyeLayer];
  const ei = grid ? Math.floor((eye.x - grid.x0) / grid.cellM) : 0, ej = grid ? Math.floor((eye.z - grid.z0) / grid.cellM) : 0;
  // (beyond the farthest any cell can be open, nothing to compute)
  const maxM = Math.max(eye.awareM + AWARE_SOFT_M, SIGHT_M + LIGHT_M + REACH_SOFT_M) + 0.01, max2 = maxM * maxM;
  for (let j = 0; j < nz; j++) {
    const z = z0 + (j + 0.5) * cellM, dz = z - eye.z, row = j * nx;
    for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * cellM, dx = x - eye.x;
      vis[row + i] = dx * dx + dz * dz >= max2 ? 0 : visAt(state, eye, grid, ei, ej, bit, x, z, ms);
    }
  }
  return mask;
}
