// OLYMPUS render: the light as maps the shaders read, computed from places' one light helper.
//
// The sim says how much light there is (src/sim/places/light.js: lightLevel(state, x, z, ms) in
// [0, 1], lampsOf, lightingOf, skyAt; TECH §9.6, correction 14), and this module turns its numbers
// into what the stage draws with, so a pool on the floor, a figure's tint and perception's reach are
// one quantity (the hub: "one quantity shows one number on every screen"). Nothing here decides how
// much light there is: it only carries places' numbers to the GPU.
//
// The eye adapts. VIEWS §2.7 writes a lit room's overheads as a fill of 0.75 and calibrates the stage
// so a face toward the camera shows its painted colour; outdoors at noon lightLevel is 1. The picture
// shows lightLevel L through one exposure, exposure(L) = min(1, (L / ADAPT_L)^ADAPT_GAMMA) with ADAPT_L
// 0.75 and ADAPT_GAMMA 0.6 (my calls): a room at its day fill shows its painted colours, the same room
// at lights out (0.04) a sixth of them (the dark-adapted eye: a straight line gave a twentieth, and the
// bay at 23:00 was a black screen), the fire watch's red pool (0.35 over it) two thirds, a street lamp's
// (0.45 + 0.20 over a night of 0.02) most. Monotone, so the tint's brightness is a monotone function of
// the level (the build sheet's rule), and the same curve lights the floor under a figure and the figure.
//
// Three maps:
//   - the lamp table and grid (TECH §9.6's tiled pools): every lit lamp of lampsOf() but the ceiling
//     kind (ceiling lamps are the room's fill: the build sheet's §8, item 7, after the look round's
//     blotches in L1 and L3) is two texels, (x, z, r, core) and (colour, ring), its strengths through
//     the exposure; a grid of GRID_CELL_M 4 m cells holds up to GRID_PER_CELL 4 lamps each (index + 1),
//     every lamp in every cell its 1.5 r ring touches. The shader adds each pool hard-edged, a core to r
//     and a ring to 1.5 r, as places' lightLevel counts them;
//   - the room map (a floor's): ROOM_CELL_M 0.25 m cells over the area, each the fill of its room
//     (places' lightLevel at a point of the room no pool reaches: the fill exactly, windows included),
//     through the exposure, in the fill's colour normalised to unit luma (the interior table's: day
//     overheads 0xf2f0ea, evening 0xf6e6cc: places' src/data/places/sky.js; lights out, which has no
//     overheads, the cold of the night lights' surround), stored
//     halved so a channel may pass 1; cells outside every room take the mean;
//   - the tint of a figure: exposure(lightLevel at its feet) in the colour of what lights it there (the
//     room's fill or the sky's row, and the pools it stands in, weighted by their share).
// Pure. Plain arrays; src/render/lighting.js puts them on the GPU.
import { linear } from '../art/tone.js';
import { MOODS as INTERIOR } from '../data/places/sky.js';

/** The level a lit room's overheads give, which the picture shows as its painted colours (VIEWS §2.7's day fill). */
export const ADAPT_L = 0.75, ADAPT_GAMMA = 0.6;
/** The lamp grid's cell, metres, and the lamps a cell holds (TECH §9.6). */
export const GRID_CELL_M = 4, GRID_PER_CELL = 4;
/** The room map's cell, metres (a quarter of a metre: a wall's thickness never leaks a room's light). */
export const ROOM_CELL_M = 0.25;
/** Lamps a table row holds (two texels each: 256 texels a row), and the rows the table may grow to. */
export const LAMPS_PER_ROW = 128, LAMP_ROWS_MAX = 16;
/** The interior fills' colours by lighting state: places' sky table's (src/data/places/sky.js MOODS, one table), lights out (no overheads) the cold of the night lights' surround (my call). */
export const FILL_COLOURS = Object.freeze({ day: INTERIOR.day?.color ?? 0xf2f0ea, evening: INTERIOR.evening?.color ?? 0xf6e6cc, lightsOut: INTERIOR.lightsOut?.color ?? 0x8a96c8 });

/** The picture's light for a level: the eye adapted to a lit room (see the header). */
export const exposure = (L) => Math.min(1, (Math.max(0, L) / ADAPT_L) ** ADAPT_GAMMA);
const luma = (c) => 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2];
/** A linear colour scaled to unit luma (black stays black). */
export function unitLuma(c) { const l = luma(c); return l > 1e-6 ? [c[0] / l, c[1] / l, c[2] / l] : [0, 0, 0]; }

/** Whether a lamp makes a pool (a lit lamp with a radius: every kind but the ceiling's, which is the fill, and the exit signs', which only glow). */
export const isPool = (l) => l.on !== false && (l.kind ?? 'ceiling') !== 'ceiling' && (l.r === undefined || (l.r ?? 0) > 0);

/** The pools a lamp list makes at (x, z): { k (their summed strength, lightLevel's units), rgb (linear, strength-weighted) }. */
export function poolAt(lamps, x, z) {
  let k = 0; const rgb = [0, 0, 0];
  for (const l of lamps) {
    if (!isPool(l)) continue;
    const d = Math.hypot(x - l.x, z - l.z), r = l.r ?? 2, s = d < r ? (l.core ?? 0.5) : d < 1.5 * r ? (l.ring ?? 0.2) : 0;
    if (!s) continue;
    const c = linear(l.color ?? 0xffe9c0);
    k += s; for (let j = 0; j < 3; j++) rgb[j] += c[j] * s;
  }
  return { k, rgb };
}

/**
 * The lamp table and its grid over box { x0, z0, x1, z1 } (metres): { table: Float32Array (RGBA, rows ×
 * 256 texels), rows, n (pools), grid: Float32Array (RGBA, nx × nz cells), nx, nz, cellM, x0, z0, overflow
 * (cells that had more than GRID_PER_CELL lamps), lamps (the pools, in table order) }.
 */
export function lampMaps(lamps, box, { cellM = GRID_CELL_M } = {}) {
  const pools = lamps.filter(isPool).slice(0, LAMPS_PER_ROW * LAMP_ROWS_MAX);
  const rows = Math.max(1, Math.ceil(pools.length / LAMPS_PER_ROW)), table = new Float32Array(rows * LAMPS_PER_ROW * 2 * 4);
  pools.forEach((l, i) => {
    const t = ((Math.floor(i / LAMPS_PER_ROW) * LAMPS_PER_ROW) + (i % LAMPS_PER_ROW)) * 2 * 4, c = linear(l.color ?? 0xffe9c0);
    const ring = exposure(l.ring ?? 0.2), inner = exposure(l.core ?? 0.5);
    table.set([l.x, l.z, l.r ?? 2, inner - ring], t);
    table.set([c[0], c[1], c[2], ring], t + 4);
  });
  const x0 = Math.floor(box.x0 / cellM) * cellM, z0 = Math.floor(box.z0 / cellM) * cellM;
  const nx = Math.max(1, Math.ceil((box.x1 - x0) / cellM)), nz = Math.max(1, Math.ceil((box.z1 - z0) / cellM));
  const grid = new Float32Array(nx * nz * 4), count = new Uint8Array(nx * nz);
  let overflow = 0;
  pools.forEach((l, i) => {
    const R = 1.5 * (l.r ?? 2);
    const i0 = Math.max(0, Math.floor((l.x - R - x0) / cellM)), i1 = Math.min(nx - 1, Math.floor((l.x + R - x0) / cellM));
    const j0 = Math.max(0, Math.floor((l.z - R - z0) / cellM)), j1 = Math.min(nz - 1, Math.floor((l.z + R - z0) / cellM));
    for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) {
      // (only cells the ring really reaches: the nearest point of the cell within R)
      const cx = Math.max(x0 + k * cellM, Math.min(l.x, x0 + (k + 1) * cellM)), cz = Math.max(z0 + j * cellM, Math.min(l.z, z0 + (j + 1) * cellM));
      if (Math.hypot(cx - l.x, cz - l.z) >= R) continue;
      const c = j * nx + k;
      if (count[c] >= GRID_PER_CELL) { overflow++; continue; }
      grid[c * 4 + count[c]] = i + 1; count[c]++;
    }
  });
  return { table, rows, n: pools.length, grid, nx, nz, cellM, x0, z0, overflow, lamps: pools };
}

/**
 * Each room's fill, places' own number: lightLevel at a point of the room that no pool reaches (its
 * centre, else the first of a 3 × 3 lattice inset 0.3 m; with none free, the centre less the pools
 * there). level(x, z) is lightLevel bound to the state, the area and the time. Returns Map id → fill.
 */
export function roomFills(area, lamps, level) {
  const out = new Map(), pools = lamps.filter(isPool);
  const free = (x, z) => !pools.some(l => Math.hypot(x - l.x, z - l.z) < 1.5 * (l.r ?? 2));
  for (const r of area.rooms ?? []) {
    const [x0, z0, x1, z1] = r.rect, pts = [[(x0 + x1) / 2, (z0 + z1) / 2]];
    for (const u of [0, 0.5, 1]) for (const v of [0, 0.5, 1]) pts.push([x0 + 0.3 + u * (x1 - x0 - 0.6), z0 + 0.3 + v * (z1 - z0 - 0.6)]);
    const p = pts.find(([x, z]) => free(x, z));
    out.set(r.id, p ? level(p[0], p[1]) : Math.max(0, level(pts[0][0], pts[0][1]) - poolAt(pools, pts[0][0], pts[0][1]).k));
  }
  return out;
}

/**
 * The room map of a floor: { data: Uint8Array RGBA (nx × nz, rows by z), nx, nz, box: [x0, z0, w, d],
 * mean: [r, g, b] (what lies outside the rooms, ×2 as stored), key (a digest: unchanged maps keep their
 * upload) }. fills: Map room id → level; colours: Map room id → 0xrrggbb (the fill's colour).
 */
export function roomMap(area, fills, colours, { cellM = ROOM_CELL_M } = {}) {
  const b = area.boundsM, x0 = Math.floor(b.x0 / cellM) * cellM, z0 = Math.floor(b.z0 / cellM) * cellM;
  const nx = Math.max(1, Math.ceil((b.x1 - x0) / cellM)), nz = Math.max(1, Math.ceil((b.z1 - z0) / cellM));
  const data = new Uint8Array(nx * nz * 4), set = new Uint8Array(nx * nz);
  const sum = [0, 0, 0];
  let rooms = 0, key = 0;
  for (const r of area.rooms ?? []) {
    const k = exposure(fills.get(r.id) ?? 1), c = unitLuma(linear(colours.get(r.id) ?? FILL_COLOURS.day));
    const v = c.map(x => Math.max(0, Math.min(255, Math.round(x * k * 127.5))));
    for (let j = 0; j < 3; j++) sum[j] += v[j];
    rooms++;
    key = (Math.imul(key, 31) + v[0] * 65536 + v[1] * 256 + v[2]) >>> 0;
    const [rx0, rz0, rx1, rz1] = r.rect;
    const i0 = Math.max(0, Math.round((rx0 - x0) / cellM)), i1 = Math.min(nx, Math.round((rx1 - x0) / cellM));
    const j0 = Math.max(0, Math.round((rz0 - z0) / cellM)), j1 = Math.min(nz, Math.round((rz1 - z0) / cellM));
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) { const p = (j * nx + i) * 4; data[p] = v[0]; data[p + 1] = v[1]; data[p + 2] = v[2]; data[p + 3] = 255; set[j * nx + i] = 1; }
  }
  const mean = sum.map(x => (rooms ? x / rooms : 127.5));
  for (let c = 0; c < nx * nz; c++) if (!set[c]) { const p = c * 4; data[p] = mean[0]; data[p + 1] = mean[1]; data[p + 2] = mean[2]; data[p + 3] = 255; }
  return { data, nx, nz, box: [x0, z0, nx * cellM, nz * cellM], mean: mean.map(x => x / 127.5), key };
}

/**
 * A figure's tint (linear RGB) at level L lit by a base light of colour `base` (linear, the fill's or
 * the sky's) and the pools there: exposure(L) in the light's colour at unit luma, the base and each
 * pool weighted by its share of L. Its luma is exposure(L), so its brightness rises with the level.
 */
export function tintOf(L, base, pool = { k: 0, rgb: [0, 0, 0] }) {
  const e = exposure(L), b = unitLuma(base), baseK = Math.max(0, L - pool.k), mix = [0, 0, 0];
  for (let j = 0; j < 3; j++) mix[j] = b[j] * baseK + pool.rgb[j];
  const u = unitLuma(mix.some(v => v > 0) ? mix : b);
  return [u[0] * e, u[1] * e, u[2] * e];
}
