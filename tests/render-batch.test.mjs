// OLYMPUS tests: the batching maths (src/render/batch-math.js), the atlas packer (src/render/pack.js)
// and the cutaway's wall rule (src/render/walls.js). Pure: no GPU.
import { snapBox, faceCorners, faceTexels, faceQuad, worldTexel, buildArrays, FACES, NORMALS, LAYOUT } from '../src/render/batch-math.js';
import { pack, packFill } from '../src/render/pack.js';
import { wallsOf, wallRect, WALL_H_M, CUT_H_M } from '../src/render/walls.js';
import { hash3 } from '../src/art/tone.js';

const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export default [
  { name: 'boxes snap to the pixel grid at 16 and 24 px/m', fn() {
    for (const ppm of [16, 24]) {
      for (let k = 0; k < 500; k++) {
        const h = hash3(k, ppm), s = { x: (h % 9973) / 997, z: ((h >>> 8) % 7919) / 991, y: ((h >>> 16) % 13) / 10, w: 0.1 + (h % 211) / 97, d: 0.1 + ((h >>> 4) % 199) / 89, h: 0.05 + ((h >>> 12) % 97) / 41 };
        const b = snapBox(s, ppm);
        for (const v of [b.x0, b.x1, b.y0, b.y1, b.z0, b.z1]) if (!near(v * ppm, Math.round(v * ppm), 1e-6)) throw new Error(`edge ${v} off the ${ppm} px grid`);
        if (b.wPx < 1 || b.hPx < 1 || b.dPx < 1) throw new Error('a side under a pixel');
        if (Math.abs(b.wPx - s.w * ppm) > 0.5 + 1e-9 || Math.abs((b.x0 + b.x1) / 2 - s.x) > 1 / ppm) throw new Error('snapped too far');
      }
      const c = snapBox({ x0: 1.01, x1: 2.49, y0: 0, y1: 1, z0: -0.3, z1: 0.31 }, ppm);
      if (!near(c.x0, Math.round(1.01 * ppm) / ppm) || c.dPx !== Math.round(0.31 * ppm) - Math.round(-0.3 * ppm)) throw new Error('corner spec');
    }
    console.log('      1,000 boxes: every edge on the grid, sizes rounded to whole pixels, centres within a pixel');
  } },
  { name: 'faces wind counter-clockwise from outside and size as painted', fn() {
    const b = snapBox({ x: 0, z: 0, w: 1.5, d: 0.75, h: 2 }, 24);
    FACES.forEach((f, i) => {
      const [tl, , br, bl] = faceCorners(f, b), n = cross(sub(bl, tl), sub(br, tl));
      const dot = n[0] * NORMALS[i][0] + n[1] * NORMALS[i][1] + n[2] * NORMALS[i][2];
      if (!(dot > 0)) throw new Error(`${f} winds the wrong way`);
    });
    const [fc, fr] = faceTexels('front', b), [tc, tr] = faceTexels('top', b), [sc, sr] = faceTexels('right', b);
    if (fc !== 36 || fr !== 48 || tc !== 36 || tr !== 18 || sc !== 18 || sr !== 48) throw new Error(`texels ${fc}×${fr} ${tc}×${tr} ${sc}×${sr}`);
    console.log(`      6 faces wind outward; a 1.5 × 0.75 × 2 m box at 24 px/m: front ${fc}×${fr}, top ${tc}×${tr}, side ${sc}×${sr} px`);
  } },
  { name: 'world-anchored tiles run on across quads', fn() {
    const ppm = 16, a = snapBox({ x0: 0, x1: 3, y0: -0.0625, y1: 0, z0: 0, z1: 2 }, ppm), b = snapBox({ x0: 3, x1: 5, y0: -0.0625, y1: 0, z0: 0, z1: 2 }, ppm);
    const qa = faceQuad('top', a, { region: [0, 0, 16, 16], anchor: 'world', ppm }), qb = faceQuad('top', b, { region: [0, 0, 16, 16], anchor: 'world', ppm });
    // (a's east edge texel u = b's west edge texel u)
    const ua = qa.origin[0] + qa.cols, ub = qb.origin[0];
    if (ua !== ub) throw new Error(`seam: ${ua} vs ${ub}`);
    const f1 = worldTexel('front', snapBox({ x0: 0, x1: 1, y0: 1, y1: 2, z0: 0, z1: 1 }, ppm), ppm), f2 = worldTexel('front', snapBox({ x0: 0, x1: 1, y0: 0, y1: 1, z0: 0, z1: 1 }, ppm), ppm);
    if (f1[1] + 16 !== f2[1]) throw new Error('fronts stacked do not run on');
    console.log(`      two floors meet at texel ${ua}; two fronts stacked meet at row ${f2[1]}`);
  } },
  { name: 'arrays for quads: layout, indices, counts', fn() {
    const b = snapBox({ x: 1, z: 1, w: 1, d: 1, h: 1 }, 24);
    const quads = FACES.map(f => faceQuad(f, b, { region: [5, 6, 24, 24], color: [0.5, 0.25, 1], part: 77, glow: 3, ppm: 24 }));
    const A = buildArrays(quads);
    if (A.vertices !== 24 || A.triangles !== 12 || A.index.length !== 36) throw new Error('counts');
    for (const [k, n] of Object.entries(LAYOUT)) if (A[k].length !== 24 * n) throw new Error(`${k} length`);
    if (A.aPart.some(v => v !== 77) || A.aGlow.some(v => v !== 3)) throw new Error('part or glow');
    if (!(A.index instanceof Uint16Array)) throw new Error('16-bit indices expected');
    const big = buildArrays(Array.from({ length: 17000 }, () => quads[0]));
    if (!(big.index instanceof Uint32Array)) throw new Error('32-bit indices past 65,535 vertices');
    console.log(`      a box: 24 vertices, 12 triangles, ${Object.values(LAYOUT).reduce((a, n) => a + n, 0)} floats a vertex; 17,000 quads take 32-bit indices`);
  } },
  { name: 'atlas packing: no overlap, inside the page, a fair fill', fn() {
    const rects = Array.from({ length: 320 }, (_, k) => { const h = hash3(k, 5); return { w: 4 + (h % 90), h: 4 + ((h >>> 8) % 70) }; });
    rects.push({ w: 288, h: 67 }, { w: 48, h: 48 }, { w: 1, h: 1 });
    const P = pack(rects);
    const byPage = new Map();
    P.places.forEach((p, i) => {
      const r = rects[i], pg = P.pages[p.page];
      if (p.x < 0 || p.y < 0 || p.x + r.w > pg.w || p.y + r.h > pg.h) throw new Error(`rect ${i} outside its page`);
      (byPage.get(p.page) ?? byPage.set(p.page, []).get(p.page)).push([p.x, p.y, p.x + r.w, p.y + r.h]);
    });
    for (const list of byPage.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const [a, b] = [list[i], list[j]];
      if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]) throw new Error(`overlap ${i} ${j}`);
    }
    const fill = packFill(rects, P);
    if (fill < 0.6) throw new Error(`fill ${fill}`);
    const small = pack(rects, { maxSize: 512 });
    if (small.pages.length < 2) throw new Error('a small page size should spill onto more pages');
    console.log(`      ${rects.length} paintings on ${P.pages.length} page of ${P.pages[0].w} × ${P.pages[0].h}, ${(fill * 100).toFixed(0)}% filled; capped at 512: ${small.pages.length} pages`);
  } },
  { name: 'a busy area batches to a handful of draw calls', fn() {
    // (what src/render/batch.js does with 400 boxes, painted fronts and tops of a few dozen kinds: one atlas page, one call)
    const ppm = 24, kinds = Array.from({ length: 36 }, (_, k) => ({ w: 12 + (hash3(k, 1) % 40), h: 12 + (hash3(k, 2) % 50) }));
    const P = pack([...kinds, ...kinds.map(k => ({ w: k.w, h: Math.round(k.h / 2) }))]);
    const quads = [];
    for (let i = 0; i < 400; i++) {
      const b = snapBox({ x: (i % 20) * 0.6, z: Math.floor(i / 20) * 0.6, w: 0.5, d: 0.4, h: 0.3 + (i % 7) * 0.2 }, ppm);
      for (const f of FACES) quads.push(faceQuad(f, b, { region: [0, 0, 8, 8], part: i + 1, ppm }));
    }
    const A = buildArrays(quads);
    console.log(`      400 boxes: ${quads.length} quads, ${A.triangles} triangles, ${A.vertices} vertices, ${P.pages.length} atlas page → ${P.pages.length} draw call (tradecraft: up to 6 a box, doubled by its ID pass)`);
    if (P.pages.length !== 1) throw new Error('more than one page');
  } },
  { name: 'the cutaway rule: north and side walls full height, the rest cut', fn() {
    const plan = { x0: 0, z0: 0, x1: 12, z1: 8, rooms: [{ x0: 0, z0: 0, x1: 8, z1: 8 }, { x0: 8, z0: 0, x1: 12, z1: 4 }, { x0: 8, z0: 4, x1: 12, z1: 8 }],
      openings: [{ axis: 'z', at: 8, a: 5, b: 6 }, { axis: 'x', at: 4, a: 9.5, b: 10.5 }] };
    const runs = wallsOf(plan), by = (s) => runs.filter(w => w.side === s);
    if (by('n').some(w => w.h !== WALL_H_M) || by('w').some(w => w.h !== WALL_H_M) || by('e').some(w => w.h !== WALL_H_M)) throw new Error('boundary heights');
    if (by('s').some(w => w.h !== CUT_H_M) || runs.filter(w => !w.side).some(w => w.h !== CUT_H_M)) throw new Error('cut heights');
    const inner = runs.filter(w => !w.side);
    if (inner.length !== 4) throw new Error(`inner runs ${inner.length}`);   // (x=8 cut by a door: 2 runs; z=4 cut: 2 runs)
    const n = wallRect(by('n')[0]);
    if (!(n.z1 === 0 && n.z0 < 0)) throw new Error('north wall outside the plan');
    console.log(`      ${runs.length} runs: north, west, east to ${WALL_H_M} m; south and ${inner.length} inner runs (doors cut out) to ${CUT_H_M} m`);
  } },
];
