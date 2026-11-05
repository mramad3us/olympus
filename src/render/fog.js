// OLYMPUS render: the fog of awareness, the mask the stage dims the unseen by.
//
// tradecraft's (src/render/view.js fog()): what the character is aware of is a low-resolution mask
// on the ground, cells of FOG_CELL_M (0.5 m) round the camera, two channels a cell: red, how much of
// the spot is in sight now (1 seen … 0 unseen); green, how much is felt but not seen (a hunch through a
// wall). The post pass (src/render/post.js) looks each pixel's ground spot up in it (a façade by its
// foot) and, against a 4 × 4 Bayer dither, dims what is unseen (greyer, darker, a little cold: dimK,
// near black at night) or tints what is felt, so the edge of sight is a dithered shadow, as Stoneshard
// draws its unexplored dark.
// This module only holds the mask and puts it on the GPU: what is seen is the sim's to say (its
// perception, from the eyes, the light and the walls), written in with set() or fill() each time it
// changes, eased toward with ease() if the caller wants tradecraft's eyes (in quickly, out slowly:
// FOG_IN_S 0.08 s, FOG_OUT_S 0.4 s). The mask is linear-filtered so the dither has a gradient to cut.
// The texture's data is small (96 × 128 cells × 2 bytes = 24 KB) and re-sent only when it changed.
import * as THREE from 'three';

export const FOG_CELL_M = 0.5;
export const FOG_N = Object.freeze([96, 128]);                      // cells: 48 × 64 m
export const FOG_IN_S = 0.08, FOG_OUT_S = 0.4;

/** A mask of nx × nz cells of cellM metres: { texture, place(x0, z0), set(i, j, seen, felt), fill(fn), ease(dtS), upload(), box }. */
export function createFogMask({ nx = FOG_N[0], nz = FOG_N[1], cellM = FOG_CELL_M } = {}) {
  const data = new Uint8Array(nx * nz * 2), val = new Float32Array(nx * nz * 2), aim = new Float32Array(nx * nz * 2);
  const texture = new THREE.DataTexture(data, nx, nz, THREE.RGFormat, THREE.UnsignedByteType);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  let x0 = 0, z0 = 0, dirty = true;
  const mask = {
    texture, nx, nz, cellM,
    /** The mask's north-west corner, metres (cells snap to the cell grid). */
    place(x, z) { x0 = Math.floor(x / cellM) * cellM; z0 = Math.floor(z / cellM) * cellM; dirty = true; },
    /** Cell (i, j)'s wanted values, 0..1. */
    set(i, j, seen, felt = 0) { const k = (j * nx + i) * 2; aim[k] = seen; aim[k + 1] = felt; },
    /** Every cell's wanted values from fn(x, z) → [seen, felt] at its centre. */
    fill(fn) {
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const [s, f = 0] = fn(x0 + (i + 0.5) * cellM, z0 + (j + 0.5) * cellM), k = (j * nx + i) * 2;
        aim[k] = s; aim[k + 1] = f;
      }
    },
    /** Ease the shown values toward the wanted (dtS seconds; Infinity: at once). */
    ease(dtS = Infinity) {
      const kin = 1 - Math.exp(-dtS / FOG_IN_S), kout = 1 - Math.exp(-dtS / FOG_OUT_S);
      for (let k = 0; k < val.length; k++) {
        const a = aim[k], v = val[k], n = v + (a - v) * (a > v ? kin : kout);
        if (n !== v) { val[k] = n; const b = Math.round(n * 255); if (data[k] !== b) { data[k] = b; dirty = true; } }
      }
    },
    /** Mark it for upload if anything changed; returns the stage's setFog() arguments. */
    upload() { if (dirty) { texture.needsUpdate = true; dirty = false; } return [texture, x0, z0, nx * cellM, nz * cellM]; },
    /** Seen value at a spot (0 outside the mask). */
    at(x, z) { const i = Math.floor((x - x0) / cellM), j = Math.floor((z - z0) / cellM); return i >= 0 && j >= 0 && i < nx && j < nz ? val[(j * nx + i) * 2] : 0; },
    get box() { return [x0, z0, nx * cellM, nz * cellM]; },
    dispose() { texture.dispose(); },
  };
  return mask;
}
