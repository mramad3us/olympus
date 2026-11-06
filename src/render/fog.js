// OLYMPUS render: the fog of awareness, the mask the stage dims the unseen by.
//
// tradecraft's (src/render/view.js fog()): what the character is aware of is a low-resolution mask
// on the ground, cells of FOG_CELL_M (0.25 m: tradecraft's 0.5 halved in 0.0.3, the sight grid's own
// lattice, so a cell never holds both a wall and the floor past it: with 0.5 m cells the dark past the
// bay's south wall bled over the sleepers' heads against it, or, read the other way, the hall floor past
// it showed lit) round the camera, two channels a cell: red, how much of
// the spot is in sight now (1 seen … 0 unseen); green, how much is felt but not seen (a hunch through a
// wall). The post pass (src/render/post.js) looks each pixel's ground spot up in it (a façade by its
// foot) and, against a 4 × 4 Bayer dither, dims what is unseen (greyer, darker, a little cold: dimK,
// near black at night) or tints what is felt, so the edge of sight is a dithered shadow, as Stoneshard
// draws its unexplored dark.
// This module only holds the mask and puts it on the GPU: what is seen is the sim's to say (its
// perception, from the eyes, the light and the walls: 0.0.3's view writes people's sightMask in whole
// with setSeen()), written in with set(), fill() or setSeen() each time it changes, eased toward with ease() if the caller wants tradecraft's eyes (in quickly, out slowly:
// FOG_IN_S 0.08 s, FOG_OUT_S 0.4 s). The mask is linear-filtered so the dither has a gradient to cut.
// place() moves the mask's window by whole cells and carries every cell's values with it (shown,
// wanted and the texture's bytes), so an eased value stays on its world cell when the window moves
// (v0.0.3's review: the window moved a cell and the fog's edge lagged the world by a cell for the ease
// time); cells new to the window start unseen. A move of the whole window or more starts it afresh.
// The texture's data is small (the game's 192 × 128 cells × 2 bytes = 48 KB) and re-sent only when it changed.
import * as THREE from 'three';

export const FOG_CELL_M = 0.25;
export const FOG_N = Object.freeze([192, 256]);                     // cells: 48 × 64 m
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
    /** The mask's north-west corner, metres (cells snap to the cell grid); the values move with their cells (see the header). */
    place(x, z) {
      const nx0 = Math.floor(x / cellM) * cellM, nz0 = Math.floor(z / cellM) * cellM;
      const di = Math.round((nx0 - x0) / cellM), dj = Math.round((nz0 - z0) / cellM);
      x0 = nx0; z0 = nz0;
      if (!di && !dj) return;
      dirty = true;
      if (Math.abs(di) >= nx || Math.abs(dj) >= nz) { val.fill(0); aim.fill(0); data.fill(0); return; }
      // (row by row in the order that never reads a cell already written: copyWithin within each array)
      const rowOf = (j) => j * nx * 2;
      const shiftRow = (arr, jTo, jFrom) => {
        if (jFrom < 0 || jFrom >= nz) { arr.fill(0, rowOf(jTo), rowOf(jTo + 1)); return; }
        const a = rowOf(jTo), b = rowOf(jFrom);
        if (di >= 0) { arr.copyWithin(a, b + di * 2, b + nx * 2); arr.fill(0, a + (nx - di) * 2, a + nx * 2); }
        else { arr.copyWithin(a - di * 2, b, b + (nx + di) * 2); arr.fill(0, a, a - di * 2); }
      };
      for (const arr of [val, aim, data]) {
        if (dj >= 0) for (let j = 0; j < nz; j++) shiftRow(arr, j, j + dj);
        else for (let j = nz - 1; j >= 0; j--) shiftRow(arr, j, j + dj);
      }
    },
    /** Cell (i, j)'s wanted values, 0..1. */
    set(i, j, seen, felt = 0) { const k = (j * nx + i) * 2; aim[k] = seen; aim[k + 1] = felt; },
    /** Every cell's wanted values from fn(x, z) → [seen, felt] at its centre. */
    fill(fn) {
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const [s, f = 0] = fn(x0 + (i + 0.5) * cellM, z0 + (j + 0.5) * cellM), k = (j * nx + i) * 2;
        aim[k] = s; aim[k + 1] = f;
      }
    },
    /** Every cell's wanted sight from an array of nx × nz values, 0..1 (people's sightMask: perception's one function), felt 0. */
    setSeen(vis) { for (let c = 0; c < nx * nz; c++) { aim[c * 2] = vis[c]; aim[c * 2 + 1] = 0; } },
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
