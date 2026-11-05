// OLYMPUS art: a canyon wall where the picture can show one. A scarp's face, its spurs and gullies, its talus.
//
// The camera looks north and 45° down, orthographically (src/render/camera.js), so a wall is in the
// picture only where it stands inside the frame and faces south: its foot within the frame's top half,
// its face rising off the top of the picture (a face h metres tall shows h · ppm pixels, as a building's
// front does). PLACES §3.15 puts Base Melas 10 km from the foot of Melas Chasma's south wall, whose face
// looks north, away from this camera, and says "the walls are never in the stage's picture"; a south-facing
// face near enough to fill the top of the frame is a scarp of the canyon floor's own layered deposits (the
// light-toned beds of the Valles Marineris, mounds and mesas standing on the floor), or the foot of the
// north wall seen from close under it. This builds either: a face of columns (spurs stand forward, gullies
// set back, each column a box of its own so the outline draws between them), painted with the layered
// rock in world pixels so the beds run level across the columns, and a talus apron at its foot: rows of
// boxes rising toward the face, scree on their tops and rubble on their fronts, boulders fallen onto it.
// Pure.
import { tone, hash3, mixHex } from '../tone.js';
import { tile, regolith } from '../materials/surfaces.js';
import { boulder } from './rocks.js';
import { GROUND } from './ground.js';

const frac = (h) => (h >>> 8) / 16777216;
const FACE = 0xb08b77;

/** Scree: the talus's top, pebbles and broken rock in the regolith, more stone than dust. */
function screeTop(ppm, seed) {
  const f = (px, w, h) => {
    const wx = Math.round(seed * 37) % 997;
    regolith(px, 0, 0, w, h, { c: mixHex(GROUND.regolith, FACE, 0.4), ppm, seed, wx, wy: 0, dust: 0.2, ripples: 0, pebbles: 3, basalt: GROUND.basalt });
    for (let k = 0; k < w * h / (ppm * 1.2); k++) { const r = hash3(k, seed, 5), x = r % w, y = (r >>> 9) % h, s = 1 + (r >>> 20) % Math.max(2, Math.round(ppm / 8)); px(x, y, s + 1, s, tone(FACE, ((r >>> 4) % 5 - 2) * 0.03)); px(x, y + s, s + 1, 1, tone(FACE, -0.14)); px(x, y, s, 1, tone(FACE, 0.06)); }
  };
  f.key = `scree:${seed}`;
  return f;
}
/** The talus's front: broken rock heaped, lit tops, dark gaps between the blocks. */
function rubbleFront(seed) {
  const f = (px, w, h, ppm) => {
    px(0, 0, w, h, tone(FACE, -0.1));
    const s = Math.max(3, Math.round(0.18 * ppm));
    for (let y = 0; y < h; y += Math.max(2, s - 1)) for (let x = -((y * 7) % s); x < w; x += s) {
      const r = hash3(x + seed * 13, y, seed), bw = s - 1 + (r % 2), bh = Math.max(2, s - 1 - (r >>> 3) % 2), c = tone(r % 3 ? FACE : GROUND.basalt, ((r >>> 5) % 5 - 2) * 0.025);
      px(x, y, bw, bh, c); px(x, y, bw, 1, tone(c, 0.07)); px(x + bw - 1, y, 1, bh, tone(c, -0.08));
    }
  };
  f.key = `rubble:${seed}`;
  return f;
}

/**
 * A scarp along z (its foot), from x0 to x1: its face heightM tall, columns 1.5–4 m wide stepping ±0.7 m,
 * a talus apron reaching talusM south from the foot, up to talusH at the face, boulders on it.
 */
export function scarp(area, { x0, x1, z, heightM = 24, talusM = 4.5, talusH = 1.6, seed = 1, boulders = 10 }) {
  const ppm = area.ppm;
  const face = tile('rock', { metres: 8, ppm, c: FACE, kind: 'layered', bedM: 0.55, seed, fractures: 0.5 });
  // (the face's columns: spurs forward, gullies back; each its own part, its own tint)
  let x = x0, k = 0;
  while (x < x1 - 0.05) {
    const r = hash3(k, seed, 71), w = Math.min(x1 - x, 1.0 + frac(r) ** 1.5 * 4.5), dz = (frac(hash3(r, 3)) - 0.6) * (k % 3 === 2 ? 1.2 : 0.45), h = heightM * (0.9 + 0.2 * frac(hash3(r, 5)));
    const t = 0.88 + 0.12 * frac(hash3(r, 9));
    area.box({ x0: x, x1: x + w, z0: z - 6 + dz, z1: z + dz, y0: 0, y1: h, faces: { front: { pixmap: face, anchor: 'world', tint: mixHex(0xffffff, 0xd8c8c0, 1 - t) }, top: tone(FACE, -0.05), sides: tone(FACE, -0.12) } });
    x += w; k++;
  }
  // (the talus: rows a third of a metre deep rising toward the face, broken into runs along x, scree on top, rubble in front)
  const rows = Math.max(2, Math.round(talusM / 0.6)), part = area.part();
  for (let row = 0; row < rows; row++) {
    const za = z + talusM * (1 - (row + 1) / rows), zb = z + talusM * (1 - row / rows) + 0.4, hBase = talusH * ((row + 1) / rows) ** 1.4;
    let xx = x0;
    for (let s = 0; xx < x1 - 0.05; s++) {
      const r = hash3(row, s, seed + 7), w = Math.min(x1 - xx, 1 + frac(r) * 2.5), h = Math.max(0.12, hBase * (0.7 + 0.6 * frac(hash3(r, 1)))), jz = (frac(hash3(r, 2)) - 0.5) * 0.3;
      area.box({ x0: xx, x1: xx + w, z0: za + jz, z1: zb + jz, y0: 0, y1: h, part, faces: { top: screeTop(ppm, (row * 7 + s) % 5 + seed), front: rubbleFront((row + s) % 4 + seed), sides: tone(FACE, -0.14) } });
      xx += w;
    }
  }
  for (let b = 0; b < boulders; b++) {
    // (a boulder rests on the talus where it stopped: at the height of the row under it)
    const r = hash3(b, seed, 909), bx = x0 + frac(r) * (x1 - x0), bz = z + 0.4 + frac(hash3(r, 1)) * (talusM + 1.5);
    const row = Math.floor((1 - (bz - z) / talusM) * rows), y = bz - z >= talusM ? 0 : talusH * (Math.min(rows, Math.max(1, row + 1)) / rows) ** 1.4 * 0.7;
    boulder(area, { x: bx, z: bz, y, sizeM: 0.35 + 1.3 * frac(hash3(r, 2)) ** 2, kind: r % 3 ? 'layered' : 'basalt', seed: hash3(r, 3) % 997 });
  }
}
