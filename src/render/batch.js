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
// to the GPU by upload(renderer, budgetBytes): the atlas in bands (src/render/textures.js), the strip
// light map whole (a few hundred kilobytes at most).
//
// What else an area holds, as data for the stage:
//   - lamps (lamp()): where pools of light fall when the mood lights their kind (src/render/lights.js);
//   - glow lines (glowLine()): where floor strips and battle strips run, baked into the strip-light map
//     (cells of GLOW_CELL_M, a core of radius r and a ring to 1.5 r, hard-edged, square at the segment's ends,
//     on the side it shines toward), which the materials
//     add to the light of whatever stands there (src/render/materials.js uGlowMap);
//   - extras (add()): meshes that are not batched (cards, things that move), freed with the area.
// Part IDs (outlines) are numbered for the whole page (newPart()), so two areas never share one.
import * as THREE from 'three';
import { PX_PER_M } from './scale.js';
import { snapBox, faceQuad, buildArrays, FACES } from './batch-math.js';
import { createAtlas } from './textures.js';
import { batchMaterial } from './materials.js';
import { LAMP_Y_M } from './lights.js';
import { paint } from '../art/paint.js';
import { linear } from '../art/tone.js';

let nextPart = 1;
/** A new part number (outlines are inked where parts meet), unique on the page. */
export const newPart = () => nextPart++;
/** The strip-light map's cell, metres. */
export const GLOW_CELL_M = 0.125;
const GLOW_KINDS = { strip: 0, battle: 1 };

const isPixmap = (v) => v && typeof v === 'object' && v.data instanceof Uint32Array;
// Faces given as { sides, top, bottom, front, back, left, right } (tradecraft's box()): each a colour,
// a painting, a painter function (px, w, h, ppm) painted to the face's exact size, or { color | pixmap
// | paint, glow, anchor, tint }. Unset faces take `sides`; bottom takes top.
function faceSpecs(spec) {
  const f = spec.faces ?? {}, sides = f.sides ?? spec.color ?? 0x8f96a6;
  const top = f.top ?? sides;
  return { right: f.right ?? sides, left: f.left ?? sides, top, bottom: f.bottom ?? top, front: f.front ?? sides, back: f.back ?? sides };
}

export function createArea({ name = 'area', ppm = PX_PER_M, see = true } = {}) {
  const items = [], lamps = [], glowLines = [], extras = [];
  const group = new THREE.Group();
  group.name = name;
  const painted = new Map();                                         // painter → `w×h` → painting (so like faces share one)
  const meshes = [], stats = { boxes: 0, quads: 0, triangles: 0, vertices: 0, pages: 0, atlasBytes: 0, paintMs: 0, buildMs: 0, drawCalls: 0, glowMapBytes: 0 };
  let atlas = null, glowTex = null, glowBox = null, built = false;

  /**
   * A box: { x, z, y = 0, w, d, h } (footprint centre, bottom, sizes: metres) or { x0, x1, y0, y1, z0, z1 };
   * faces (see faceSpecs), part (a new one by default; pass the same to make several boxes one part),
   * glow (a class for all its faces), omit: faces to leave out. Snapped to the pixel grid. Returns its corners and part.
   */
  function box(spec) {
    const b = snapBox(spec, ppm), part = spec.part ?? newPart();
    items.push({ b, faces: faceSpecs(spec), part, glow: spec.glow ?? 0, only: spec.only ?? null, omit: new Set(spec.omit ?? []) });
    stats.boxes++;
    return { ...b, part };
  }
  /**
   * A flat piece lying at height y over x0..x1 × z0..z1 (a floor, a threshold, a mark, a strip): its top face
   * only. y snaps to the pixel grid like everything else, so a decal on a floor lies at the floor's height
   * and `lift` (metres, not snapped: a few millimetres) raises it off the floor so the two never fight
   * for the same depth (it moves on screen by lift × ppm, a twentieth of a pixel: nothing).
   */
  function ground({ x0, z0, x1, z1, y = 0, lift = 0, top, color, part = 0, glow = 0 }) {
    const b = snapBox({ x0, x1, z0, z1, y0: y - 1 / ppm, y1: y }, ppm);
    if (lift) { b.y0 += lift; b.y1 += lift; }
    items.push({ b, faces: { top: top ?? color ?? 0x8f96a6 }, part, glow, only: ['top'], omit: new Set() });
    return b;
  }
  /** A lamp: { x, z, y = LAMP_Y_M, r = 2, color, core = 0.5, ring = 0.2, kind = 'ceiling' }. */
  function lamp(l) { const o = { y: LAMP_Y_M, r: 2, core: 0.5, ring: 0.2, kind: 'ceiling', color: 0xffe9c0, ...l }; lamps.push(o); return o; }
  /**
   * Where a strip's light falls: { kind: 'strip' | 'battle', x0, z0, x1, z1 (a segment on the ground), r, toward: [nx, nz] }.
   * toward: the side it shines on (into the room), so its light stops at the wall it runs along rather than
   * coming out through it onto the wall's outside; none given, both sides.
   */
  function glowLine(g) { glowLines.push({ r: g.kind === 'battle' ? 0.6 : 0.3, ...g }); }
  /** A mesh that is not batched (a card, a moving thing): in the area's group, freed with it (by its userData.dispose if it has one). */
  function add(obj) { extras.push(obj); group.add(obj); return obj; }

  // A face spec as { pixmap | null, color (linear), glow, anchor }; painter functions painted to size, once per size.
  function* resolve(spec, cols, rows, glow) {
    let s = spec;
    if (typeof s === 'number') return { pixmap: null, color: linear(s), glow, anchor: 'local' };
    if (isPixmap(s) || typeof s === 'function') s = { [typeof s === 'function' ? 'paint' : 'pixmap']: s };
    let pm = s.pixmap ?? null;
    if (s.paint) {
      let bySize = painted.get(s.paint);
      if (!bySize) painted.set(s.paint, bySize = new Map());
      const k = `${cols}x${rows}`;
      pm = bySize.get(k);
      if (!pm) {
        const t0 = performance.now();
        pm = paint(cols, rows, (px, w, h) => s.paint(px, w, h, ppm));
        stats.paintMs += performance.now() - t0;
        bySize.set(k, pm);
        yield;
      }
    }
    return { pixmap: pm, color: s.color !== undefined ? linear(s.color) : s.tint ? linear(s.tint) : [1, 1, 1], glow: s.glow ?? glow, anchor: s.anchor ?? (pm?.repeat ? 'world' : 'local') };
  }

  /** Build it, a step at a time (yields between paintings and stages). Returns stats. */
  function* build() {
    if (built) return stats;
    const t0 = performance.now();
    const faces = [];
    for (const it of items) {
      for (const face of it.only ?? FACES) {
        if (it.omit.has(face)) continue;
        const cols = face === 'front' || face === 'back' || face === 'top' || face === 'bottom' ? it.b.wPx : it.b.dPx;
        const rows = face === 'top' || face === 'bottom' ? it.b.dPx : it.b.hPx;
        const r = yield* resolve(it.faces[face], cols, rows, it.glow);
        faces.push({ it, face, r });
      }
    }
    atlas = createAtlas(faces.map(f => f.r.pixmap));
    yield;
    // Quads by atlas page (flat faces on the first page, its white texel).
    const byPage = atlas.pages.map(() => []);
    for (const { it, face, r } of faces) {
      const at = r.pixmap ? atlas.regionOf(r.pixmap) : { page: 0, region: atlas.whiteOf(0) };
      byPage[at.page].push(faceQuad(face, it.b, { region: at.region, color: r.color, part: it.part, glow: r.glow, anchor: r.anchor, ppm }));
    }
    byPage.forEach((quads, page) => {
      if (!quads.length) return;
      const A = buildArrays(quads), g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(A.position, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(A.normal, 3));
      g.setAttribute('color', new THREE.BufferAttribute(A.color, 3));
      g.setAttribute('aTexel', new THREE.BufferAttribute(A.aTexel, 2));
      g.setAttribute('aRegion', new THREE.BufferAttribute(A.aRegion, 4));
      g.setAttribute('aPart', new THREE.BufferAttribute(A.aPart, 1));
      g.setAttribute('aGlow', new THREE.BufferAttribute(A.aGlow, 1));
      g.setIndex(new THREE.BufferAttribute(A.index, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const P = atlas.pages[page], m = new THREE.Mesh(g, batchMaterial(P.gpu, P.w, P.h, { see }));
      m.castShadow = m.receiveShadow = true;
      m.name = `${name}:batch${page}`;
      m.userData.batch = true;
      meshes.push(m); group.add(m);
      stats.quads += quads.length; stats.triangles += A.triangles; stats.vertices += A.vertices;
    });
    yield;
    bakeGlow();
    stats.pages = atlas.pages.length; stats.atlasBytes = atlas.bytes; stats.drawCalls = meshes.length;
    stats.buildMs = performance.now() - t0;
    built = true;
    return stats;
  }

  // The strip-light map over where the glow lines reach (and a cell's margin), each cell the most any segment gives it.
  function bakeGlow() {
    if (!glowLines.length) return;
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const g of glowLines) { const R = g.r * 1.5 + GLOW_CELL_M; x0 = Math.min(x0, g.x0 - R, g.x1 - R); x1 = Math.max(x1, g.x0 + R, g.x1 + R); z0 = Math.min(z0, g.z0 - R, g.z1 - R); z1 = Math.max(z1, g.z0 + R, g.z1 + R); }
    const nx = Math.ceil((x1 - x0) / GLOW_CELL_M), nz = Math.ceil((z1 - z0) / GLOW_CELL_M), d = new Uint8Array(nx * nz * 4);
    for (const g of glowLines) {
      const R = g.r * 1.5, ch = GLOW_KINDS[g.kind] ?? 0, dx = g.x1 - g.x0, dz = g.z1 - g.z0, L2 = dx * dx + dz * dz || 1e-9;
      const i0 = Math.max(0, Math.floor((Math.min(g.x0, g.x1) - R - x0) / GLOW_CELL_M)), i1 = Math.min(nx - 1, Math.floor((Math.max(g.x0, g.x1) + R - x0) / GLOW_CELL_M));
      const j0 = Math.max(0, Math.floor((Math.min(g.z0, g.z1) - R - z0) / GLOW_CELL_M)), j1 = Math.min(nz - 1, Math.floor((Math.max(g.z0, g.z1) + R - z0) / GLOW_CELL_M));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = x0 + (i + 0.5) * GLOW_CELL_M, pz = z0 + (j + 0.5) * GLOW_CELL_M;
        if (g.toward && (px - g.x0) * g.toward[0] + (pz - g.z0) * g.toward[1] < -0.05) continue;   // (behind the wall it runs along)
        // (a band along the segment, square at its ends: no light round the corner of the wall it runs along)
        const t = ((px - g.x0) * dx + (pz - g.z0) * dz) / L2;
        if (t < 0 || t > 1) continue;
        const dd = Math.hypot(px - g.x0 - t * dx, pz - g.z0 - t * dz);
        const v = dd < g.r ? 255 : dd < R ? 128 : 0, p = (j * nx + i) * 4 + ch;
        if (v > d[p]) d[p] = v;
      }
    }
    for (let p = 3; p < d.length; p += 4) d[p] = 255;
    glowTex = new THREE.DataTexture(d, nx, nz);
    glowTex.minFilter = glowTex.magFilter = THREE.NearestFilter;
    glowTex.generateMipmaps = false;
    glowTex.needsUpdate = true;
    glowBox = [x0, z0, nx * GLOW_CELL_M, nz * GLOW_CELL_M];
    stats.glowMapBytes = d.length;
  }

  /** The strip light at (x, z): [strip, battle] 0..1 (for a sprite's tint; the shader reads the same map). */
  function glowAt(x, z) {
    if (!glowTex) return [0, 0];
    const i = Math.floor((x - glowBox[0]) / GLOW_CELL_M), j = Math.floor((z - glowBox[1]) / GLOW_CELL_M), nx = glowTex.image.width;
    if (i < 0 || j < 0 || i >= nx || j >= glowTex.image.height) return [0, 0];
    const p = (j * nx + i) * 4, d = glowTex.image.data;
    return [d[p] / 255, d[p + 1] / 255];
  }

  return {
    name, ppm, group, lamps, glowLines, extras, meshes, stats,
    box, ground, lamp, glowLine, add, part: newPart, build, glowAt,
    /** Build it all now. */
    buildNow() { const g = build(); for (;;) { const r = g.next(); if (r.done) return r.value; } },
    /** Send its textures to the GPU, at most budgetBytes this call; true when all are there. */
    upload(renderer, budgetBytes = Infinity) { return atlas ? atlas.upload(renderer, budgetBytes) : true; },
    get atlas() { return atlas; }, get glowMap() { return glowTex; }, get glowBox() { return glowBox; }, get built() { return built; },
    /** Free its GPU objects and its extras' (geometries and materials they own). */
    dispose() {
      for (const m of meshes) { m.geometry.dispose(); m.material.dispose(); }
      atlas?.dispose(); glowTex?.dispose();
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

/** Run a generator for at most budgetMs; returns { done, value }. */
export function runFor(gen, budgetMs) {
  const t0 = performance.now();
  for (;;) { const r = gen.next(); if (r.done) return r; if (performance.now() - t0 > budgetMs) return { done: false }; }
}
