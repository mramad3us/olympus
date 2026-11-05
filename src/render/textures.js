// OLYMPUS render: paintings onto the GPU, whole or in budgeted bands.
//
// A Pixmap (src/art/paint.js) is plain pixels. toTexture() makes it a three.js DataTexture: nearest
// filtered, no mipmaps, sRGB, sent in one upload the first time it is drawn (or at once by
// renderer.initTexture()). An Atlas packs many paintings into pages (src/render/pack.js), copies their
// pixels in on the CPU and sends each page to the GPU in bands of rows (upload(): at most budgetBytes
// a call), as tradecraft's crowd atlas was sent a sheet at a time (renderer.copyTextureToTexture: a
// texSubImage2D from the CPU page into a GPU texture allocated empty): a page never goes up whole in
// the middle of play unless asked to (the user, tradecraft 2026-10-29: a big re-sent texture
// "staggers almost a second" on Windows). Built at an area's load, a page goes up at once.
// Page row y is texel row y (no flip): the batch shader addresses texels as the CPU wrote them.
import * as THREE from 'three';
import { pack } from './pack.js';
import { paint } from '../art/paint.js';

/** A painting as a texture (one upload). flipY: for ordinary UVs (v up); false for shaders that address rows as painted. */
export function toTexture(pm, { flipY = true } = {}) {
  const t = new THREE.DataTexture(new Uint8Array(pm.data.buffer, pm.data.byteOffset, pm.data.byteLength), pm.w, pm.h);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = flipY;
  t.unpackAlignment = 4;
  if (pm.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData.size = [pm.w, pm.h];
  t.needsUpdate = true;
  return t;
}

/** A white texel: the colour every flat-coloured face multiplies. */
export const WHITE = paint(1, 1, (px) => px(0, 0, 1, 1, 0xffffff), { key: 'white' });

/**
 * An atlas of paintings (Pixmaps, deduplicated by identity): pages of texels, each painting's region
 * [x, y, w, h] and page (regionOf()). The GPU textures are made empty and filled by upload().
 */
export function createAtlas(pixmaps, { maxSize = 4096 } = {}) {
  const list = [...new Set(pixmaps.filter(p => p && p !== WHITE))];
  const { pages: dims, places } = pack(list.length ? list.map(p => ({ w: p.w, h: p.h })) : [{ w: 1, h: 1 }], { maxSize: maxSize - 4 });
  // (each page four rows taller than its paintings: its white texel at the start of the first spare row,
  // the region every flat-coloured face on that page reads)
  const pages = dims.map(({ w, h }) => {
    const H = h + 4, cpu = new Uint32Array(w * H);
    cpu[h * w] = WHITE.data[0];
    const gpu = new THREE.DataTexture(null, w, H);
    gpu.magFilter = gpu.minFilter = THREE.NearestFilter;
    gpu.generateMipmaps = false;
    gpu.colorSpace = THREE.SRGBColorSpace;
    gpu.flipY = false;
    gpu.source.dataReady = false;                                      // (storage made on first use, nothing sent with it)
    gpu.needsUpdate = true;
    const src = new THREE.DataTexture(new Uint8Array(cpu.buffer), w, H);   // (never drawn: only copied from)
    src.flipY = false;
    return { w, h: H, white: [0, h, 1, 1], cpu, gpu, src, sentRows: 0 };
  });
  const regions = new Map();
  list.forEach((p, i) => {
    const { page, x, y } = places[i], P = pages[page];
    for (let r = 0; r < p.h; r++) P.cpu.set(p.data.subarray(r * p.w, (r + 1) * p.w), (y + r) * P.w + x);
    regions.set(p, { page, region: [x, y, p.w, p.h] });
  });
  const whiteOf = (page) => pages[page].white;

  const box = new THREE.Box2(), at = new THREE.Vector2();
  let sentBytes = 0;
  /** Send the pages' rows not yet sent, at most budgetBytes this call. Returns true when all are on the GPU. */
  function upload(renderer, budgetBytes = Infinity) {
    let left = budgetBytes, first = true;
    for (const P of pages) {
      while (P.sentRows < P.h) {
        const rowBytes = P.w * 4;
        let rows = Math.min(P.h - P.sentRows, Math.floor(left / rowBytes));
        if (rows < 1) { if (!first) return false; rows = 1; }      // (a call sends one row at least)
        // (the GPU texture is allocated empty by its first use here: dataReady false)
        box.min.set(0, P.sentRows); box.max.set(P.w, P.sentRows + rows);
        renderer.copyTextureToTexture(P.src, P.gpu, box, at.set(0, P.sentRows));
        P.sentRows += rows; sentBytes += rows * rowBytes; left -= rows * rowBytes; first = false;
      }
    }
    return true;
  }
  return {
    pages, regions, upload, whiteOf,
    /** A painting's { page, region } (null: not in this atlas). */
    regionOf: (p) => regions.get(p) ?? null,
    get bytes() { return pages.reduce((a, P) => a + P.w * P.h * 4, 0); },
    get sentBytes() { return sentBytes; },
    get done() { return pages.every(P => P.sentRows >= P.h); },
    dispose() { for (const P of pages) { P.gpu.dispose(); P.src.dispose(); } },
  };
}
