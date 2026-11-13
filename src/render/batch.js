// OLYMPUS render: an area, built. Its static boxes batched into a handful of draw calls.
//
// An area (a deck, a building's floor, an outdoor chunk: DESIGN.md, Areas) is built once when it goes
// live and freed when it goes. Everything static in it (walls, floors, thresholds, furniture made of
// boxes) is described as boxes and flat pieces with faces that are colours or paintings, and built
// into as few meshes as there are atlas pages (one, for a room or a deck): one material, one draw
// call, where tradecraft drew every box as its own mesh with a material a face (821 draw calls in its
// furnished flat). How a face maps (one texel a screen pixel, tiles running on across pieces) is the
// batching maths' (src/render/batch-math.js); the shader that reads it, the materials' (batchMaterial).
//
// Building is a generator (build()): it yields between paintings and stages, so a caller can spread
// it over frames within a budget (runFor()), or run it whole at a load (buildNow()). Its textures go
// to the GPU by upload(renderer, budgetBytes): the atlas pages in bands of rows (a texSubImage2D each,
// into textures allocated empty, as src/render/textures.js createAtlas sends its pages), the strip
// light map whole (a few hundred kilobytes at most).
//
// The building itself is pure and lives in src/art/jobs.js (createCollector() records the specs,
// buildAreaData() paints, packs and makes the arrays), so the paint worker (TECH §11.2) can do it off
// the main thread: areaFromJob(result) makes an area from a worker's `area` job result exactly as
// build() makes one from its own, the same typed arrays into the same meshes, with no painting left
// to do. The worker numbers its parts from a partBase the page keeps for it (reserveParts()).
//
// What else an area holds, as data for the stage:
//   - lamps (lamp()): where pools of light fall when the mood lights their kind (src/render/lights.js);
//   - glow lines (glowLine()): where floor strips and battle strips run, baked into the strip-light map
//     (cells of GLOW_CELL_M, a core of radius r and a ring to 1.5 r, hard-edged, square at the segment's ends,
//     on the side it shines toward), which the materials
//     add to the light of whatever stands there (src/render/materials.js uGlowMap);
//   - extras (add()): meshes that are not batched (cards, things that move), freed with the area;
//   - props (0.0.3): its moving pieces (a door's leaf), each its own small mesh on the area's page in a
//     group at its pivot, which src/render/props.js turns; clocks: its wall clocks' dials (the hands are
//     src/render/clocks.js's).
// Part IDs (outlines) are numbered for the whole page (newPart()), so two areas never share one.
import * as THREE from 'three';
import { PX_PER_M } from './scale.js';
import { batchMaterial } from './materials.js';
import { createCollector, buildAreaData, MESH_ATTRS, GLOW_CELL_M } from '../art/jobs.js';

export { GLOW_CELL_M };
// (part numbers are written into the IDs pass as three bytes; people take PEOPLE_PART's family, 0xa5a5a5 to 0xaba5a5
// (src/render/cards.js), so the areas' numbers wrap below it: two areas far apart in a session may share a number, never
// two on screen)
const PART_WRAP = 0xa00000;
let nextPart = 1;
/** A new part number (outlines are inked where parts meet), unique on the page. */
export const newPart = () => { if (nextPart >= PART_WRAP) nextPart = 1; return nextPart++; };
/** Parts a worker's area job may number for itself (TECH §11.2): a test room uses a few hundred. */
export const PARTS_PER_JOB = 1 << 14;
/** Keep n part numbers for a job: returns the first (its partBase). */
export function reserveParts(n = PARTS_PER_JOB) {
  if (nextPart + n >= PART_WRAP) nextPart = 1;
  const base = nextPart;
  nextPart += n;
  return base;
}

const ITEM = { position: 3, normal: 3, color: 3, aTexel: 2, aRegion: 4, aPart: 1, aGlow: 1 };

// The pages of a built area on the GPU: each made empty at its size and filled from its CPU texels in
// bands of rows (src/render/textures.js createAtlas's way: copyTextureToTexture, a texSubImage2D).
function gpuPages(pages, buffers) {
  const P = pages.map(p => {
    const cpu = new Uint8Array(buffers[p.buf]);
    const gpu = new THREE.DataTexture(null, p.w, p.h);
    gpu.magFilter = gpu.minFilter = THREE.NearestFilter;
    gpu.generateMipmaps = false;
    gpu.colorSpace = THREE.SRGBColorSpace;
    gpu.flipY = false;
    gpu.source.dataReady = false;                                      // (storage made on first use, nothing sent with it)
    gpu.needsUpdate = true;
    const src = new THREE.DataTexture(cpu, p.w, p.h);                // (never drawn: only copied from)
    src.flipY = false;
    return { w: p.w, h: p.h, white: p.white, cpu, gpu, src, sentRows: 0 };
  });
  const box = new THREE.Box2(), at = new THREE.Vector2();
  let sentBytes = 0;
  return {
    pages: P,
    /** Send the rows not yet sent, at most budgetBytes this call (one row at least). True when all are up. */
    upload(renderer, budgetBytes = Infinity) {
      let left = budgetBytes, first = true;
      for (const p of P) {
        while (p.sentRows < p.h) {
          const rowBytes = p.w * 4;
          let rows = Math.min(p.h - p.sentRows, Math.floor(left / rowBytes));
          if (rows < 1) { if (!first) return false; rows = 1; }
          box.min.set(0, p.sentRows); box.max.set(p.w, p.sentRows + rows);
          renderer.copyTextureToTexture(p.src, p.gpu, box, at.set(0, p.sentRows));
          p.sentRows += rows; sentBytes += rows * rowBytes; left -= rows * rowBytes; first = false;
        }
      }
      return true;
    },
    whiteOf: (page) => P[page].white,
    get bytes() { return P.reduce((a, p) => a + p.w * p.h * 4, 0); },
    get sentBytes() { return sentBytes; },
    get bytesLeft() { return P.reduce((a, p) => a + (p.h - p.sentRows) * p.w * 4, 0); },
    get done() { return P.every(p => p.sentRows >= p.h); },
    /** Drop the CPU copies once everything is up (TECH §9.7: the CPU keeps none it can regenerate). */
    release() { for (const p of P) if (p.sentRows >= p.h) { p.src.dispose(); p.src = null; p.cpu = null; } },
    dispose() { for (const p of P) { p.gpu.dispose(); p.src?.dispose(); } },
  };
}

/**
 * Make an area's GPU objects from built data ({ meta, buffers }: buildAreaData()'s, or a worker's
 * `area` job): its meshes in `group` (one per page, the batch material), the pages ready to upload, the
 * strip-light map. Returns { meshes, atlas, glowTex, glowBox }.
 */
function realise({ meta, buffers }, group, { name, see }) {
  const atlas = gpuPages(meta.pages, buffers), meshes = [], props = [];
  // (one material a page, shared by its static mesh and every moving piece on it)
  const mats = atlas.pages.map(P => batchMaterial(P.gpu, P.w, P.h, { see }));
  const geometry = (M) => {
    const g = new THREE.BufferGeometry();
    for (const k of MESH_ATTRS) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(buffers[M.bufs[k]]), ITEM[k]));
    g.setIndex(new THREE.BufferAttribute(M.index32 ? new Uint32Array(buffers[M.bufs.index]) : new Uint16Array(buffers[M.bufs.index]), 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  for (const M of meta.meshes) {
    const m = new THREE.Mesh(geometry(M), mats[M.page]);
    m.castShadow = m.receiveShadow = true;
    m.name = `${name}:batch${M.page}`;
    m.userData.batch = true;
    meshes.push(m); group.add(m);
  }
  // (a moving piece: its meshes in a group at its pivot, which the stage turns: src/render/props.js)
  for (const p of meta.props ?? []) {
    const pg = new THREE.Group();
    pg.name = `${name}:prop:${p.id}`;
    pg.position.set(p.pivot[0], 0, p.pivot[1]);
    pg.rotation.y = p.base ?? 0;
    for (const M of p.meshes) { const m = new THREE.Mesh(geometry(M), mats[M.page]); m.castShadow = m.receiveShadow = true; m.userData.batch = true; pg.add(m); }
    group.add(pg);
    props.push({ ...p, meshes: undefined, group: pg });
  }
  let glowTex = null, glowBox = null;
  if (meta.glow) {
    glowTex = new THREE.DataTexture(new Uint8Array(buffers[meta.glow.buf]), meta.glow.nx, meta.glow.nz);
    glowTex.minFilter = glowTex.magFilter = THREE.NearestFilter;
    glowTex.generateMipmaps = false;
    glowTex.needsUpdate = true;
    glowBox = meta.glow.box;
  }
  return { meshes, atlas, glowTex, glowBox, props, mats };
}

// The area object the stage takes, around its GPU objects (shared by createArea and areaFromJob).
function areaShell({ name, ppm, group, lamps, glowLines, extras, meshes, stats, get, props = [], clocks = [], mats = [], meta = null }) {
  return {
    name, ppm, group, lamps, glowLines, extras, meshes, stats, props, clocks, mats, meta,
    /** A mesh that is not batched (a card, a moving thing): in the area's group, freed with it (by its userData.dispose if it has one). */
    add(obj) { extras.push(obj); group.add(obj); return obj; },
    /** The strip light at (x, z): [strip, battle] 0..1 (for a sprite's tint; the shader reads the same map). */
    glowAt(x, z) {
      const t = get().glowTex, box = get().glowBox;
      if (!t) return [0, 0];
      const i = Math.floor((x - box[0]) / GLOW_CELL_M), j = Math.floor((z - box[1]) / GLOW_CELL_M), nx = t.image.width;
      if (i < 0 || j < 0 || i >= nx || j >= t.image.height) return [0, 0];
      const p = (j * nx + i) * 4, d = t.image.data;
      return [d[p] / 255, d[p + 1] / 255];
    },
    /** Send its textures to the GPU, at most budgetBytes this call; true when all are there. */
    upload(renderer, budgetBytes = Infinity) { const a = get().atlas; return a ? a.upload(renderer, budgetBytes) : true; },
    get atlas() { return get().atlas; }, get glowMap() { return get().glowTex; }, get glowBox() { return get().glowBox; }, get built() { return get().built; },
    /** Free its GPU objects and its extras' (geometries and materials they own). */
    dispose() {
      for (const m of meshes) { m.geometry.dispose(); m.material.dispose(); }
      for (const p of props) for (const m of p.group.children) m.geometry.dispose();
      for (const m of mats) m.dispose();
      get().atlas?.dispose(); get().glowTex?.dispose();
      // (an extra that knows how to free itself says so: userData.dispose, as a card does; the rest: their meshes' geometries, materials and maps)
      for (const e of extras) {
        if (typeof e.userData?.dispose === 'function') { e.userData.dispose(); continue; }
        e.traverse?.(o => { if (o.isMesh && !o.userData.shared) { o.geometry?.dispose(); for (const mm of [o.material].flat()) if (!mm?.userData?.shared) { mm?.map?.dispose?.(); mm?.dispose?.(); } } });
      }
      group.removeFromParent();
      meshes.length = 0;
    },
  };
}

export function createArea({ name = 'area', ppm = PX_PER_M, see = true } = {}) {
  const col = createCollector({ ppm, part: newPart });
  const group = new THREE.Group();
  group.name = name;
  const extras = [], meshes = [], stats = { boxes: 0, quads: 0, triangles: 0, vertices: 0, pages: 0, atlasBytes: 0, paintMs: 0, buildMs: 0, drawCalls: 0, glowMapBytes: 0 };
  const gpu = { atlas: null, glowTex: null, glowBox: null, built: false };

  /** Build it, a step at a time (yields between paintings and stages). Returns stats. */
  function* build() {
    if (gpu.built) return stats;
    const data = yield* buildAreaData(col, { name });
    const r = realise(data, group, { name, see });
    meshes.push(...r.meshes);
    shell.props.push(...r.props); shell.mats.push(...r.mats);
    Object.assign(gpu, { atlas: r.atlas, glowTex: r.glowTex, glowBox: r.glowBox, built: true });
    Object.assign(stats, data.meta.stats, { paintMs: data.meta.ms.paint, buildMs: data.meta.ms.build });
    return stats;
  }

  const shell = areaShell({ name, ppm, group, lamps: col.lamps, glowLines: col.glowLines, extras, meshes, stats, get: () => gpu, props: [], mats: [] });
  return Object.assign(shell, {
    /**
     * A box: { x, z, y = 0, w, d, h } (footprint centre, bottom, sizes: metres) or { x0, x1, y0, y1, z0, z1 };
     * faces (see src/art/jobs.js faceSpecs), part (a new one by default; pass the same to make several boxes one part),
     * glow (a class for all its faces), omit: faces to leave out. Snapped to the pixel grid. Returns its corners and part.
     */
    box(spec) { const b = col.box(spec); stats.boxes = col.stats.boxes; return b; },
    /**
     * A flat piece lying at height y over x0..x1 × z0..z1 (a floor, a threshold, a mark, a strip): its top face
     * only. y snaps to the pixel grid like everything else, so a decal on a floor lies at the floor's height
     * and `lift` (metres, not snapped: a few millimetres) raises it off the floor so the two never fight
     * for the same depth (it moves on screen by lift × ppm, a twentieth of a pixel: nothing).
     */
    ground: col.ground,
    /** A lamp: { x, z, y = LAMP_Y_M, r = 2, color, core = 0.5, ring = 0.2, kind = 'ceiling' }. */
    lamp: col.lamp,
    /**
     * Where a strip's light falls: { kind: 'strip' | 'battle', x0, z0, x1, z1 (a segment on the ground), r, toward: [nx, nz] }.
     * toward: the side it shines on (into the room), so its light stops at the wall it runs along rather than
     * coming out through it onto the wall's outside; none given, both sides.
     */
    glowLine: col.glowLine,
    part: newPart,
    build,
    /** Build it all now. */
    buildNow() { const g = build(); for (;;) { const r = g.next(); if (r.done) return r.value; } },
  });
}

/**
 * An area from an `area` job's result (src/art/jobs.js, run by the paint worker or on the main thread):
 * the same meshes, pages and strip-light map build() makes, nothing left to paint; its textures still to
 * upload (upload(renderer, budget)). opts: name, see.
 */
export function areaFromJob(result, { name = result.meta.name ?? 'area', see = true } = {}) {
  const { meta } = result, group = new THREE.Group();
  group.name = name;
  const extras = [], meshes = [];
  const r = realise(result, group, { name, see });
  meshes.push(...r.meshes);
  const gpu = { atlas: r.atlas, glowTex: r.glowTex, glowBox: r.glowBox, built: true };
  const stats = { ...meta.stats, paintMs: meta.ms?.paint ?? 0, buildMs: meta.ms?.build ?? 0, parts: meta.parts ?? 0 };
  return areaShell({ name, ppm: meta.ppm, group, lamps: meta.lamps, glowLines: meta.glowLines, extras, meshes, stats, get: () => gpu, props: r.props, clocks: meta.clocks ?? [], mats: r.mats, meta });
}

/** Run a generator for at most budgetMs; returns { done, value }. */
export function runFor(gen, budgetMs) {
  const t0 = performance.now();
  for (;;) { const r = gen.next(); if (r.done) return r; if (performance.now() - t0 > budgetMs) return { done: false }; }
}
