// OLYMPUS tests: the terrain (src/art/terrain/). Ground chunks, the scarp and its talus, rocks and drifts. Pure.
//
// The valley floor is laid in chunks that must cover the area exactly (no gap, no overlap: a gap shows the
// dark under the ground); a scarp's columns must close its face from end to end, its talus rise toward the
// face; rocks keep out of what they are told to avoid (a path, a building's door); everything snaps to the
// pixel grid at both densities. Numbers printed: chunks and their paintings, boxes, painting time.
import { layGround, groundChunk, scarp, scatterRocks, boulder, drift, slabPath } from '../src/art/terrain/index.js';
import { recordingArea, paintAll } from './kit-makers.test.mjs';
import { paint } from '../src/art/paint.js';
import { assert } from './helpers.mjs';

export default [
  { name: 'the valley floor is laid in chunks that cover it exactly, each painted in world pixels', fn() {
    const out = [];
    for (const ppm of [16, 24]) {
      const a = recordingArea(ppm), t0 = performance.now();
      const chunks = layGround(a, { x0: -24, z0: -12, x1: 24, z1: 15, chunkM: 12, seed: 7, tracks: [{ pts: [[-5, 7], [4, 12], [26, 14]] }], prints: [{ pts: [[-13.8, 9], [-12.5, 13.5]], age: 0.2 }] });
      const ms = performance.now() - t0;
      let area = 0;
      for (const c of chunks) area += (c.x1 - c.x0) * (c.z1 - c.z0);
      assert(Math.abs(area - 48 * 27) < 1e-6, `chunks cover ${area} m² of ${48 * 27}`);
      for (let i = 0; i < chunks.length; i++) for (let j = i + 1; j < chunks.length; j++) {
        const p = chunks[i], q = chunks[j], ox = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), oz = Math.min(p.z1, q.z1) - Math.max(p.z0, q.z0);
        assert(!(ox > 1e-6 && oz > 1e-6), 'two chunks overlap');
      }
      // (the chunks are painters the area runs when it builds: painted here as the batch would, a chunk at a time)
      const t1 = performance.now(), p = paintAll(a), paintMs = performance.now() - t1;
      const again = groundChunk(-24, -12, 12, { ppm, seed: 7 }), first = paint(again.w, again.h, (px, w, h) => chunks[0].top(px, w, h, ppm));
      let same = 0; for (let k = 0; k < again.data.length; k++) if (again.data[k] === first.data[k]) same++;
      assert(same === again.data.length, `a chunk painted as a face differs from groundChunk in ${again.data.length - same} pixels`);
      out.push(`${ppm} px/m: ${chunks.length} chunks laid in ${ms.toFixed(1)} ms, painted by the build in ${paintMs.toFixed(0)} ms (${p.paintings} paintings, ${(p.pixels / 1e6).toFixed(2)} Mpx: ${(paintMs / p.paintings).toFixed(1)} ms a chunk)`);
    }
    for (const l of out) console.log(`      ${l}`);
  } },
  { name: 'a scarp closes its face from end to end, its talus rising toward it, on the grid', fn() {
    for (const ppm of [16, 24]) {
      const a = recordingArea(ppm);
      scarp(a, { x0: -24, x1: 24, z: -5.2, heightM: 26, talusM: 4.2, talusH: 1.5, seed: 3, boulders: 12 });
      const face = a.boxes.filter(({ b }) => b.y1 > 20).map(({ b }) => b).sort((p, q) => p.x0 - q.x0);
      assert(Math.abs(face[0].x0 + 24) < 1 / ppm + 1e-9 && Math.abs(face[face.length - 1].x1 - 24) < 1 / ppm + 1e-9, 'the face spans x0..x1');
      for (let i = 1; i < face.length; i++) assert(Math.abs(face[i].x0 - face[i - 1].x1) < 1e-6, `a gap in the face at x ${face[i].x0}`);
      const talus = a.boxes.filter(({ b }) => b.y1 < 3 && b.y0 === 0 && b.z1 > -5.2 && b.z0 > -6).map(({ b }) => b);
      const nearH = talus.filter(b => b.z0 < -3.2).reduce((s, b) => s + b.y1, 0) / Math.max(1, talus.filter(b => b.z0 < -3.2).length);
      const farH = talus.filter(b => b.z0 > -2.2).reduce((s, b) => s + b.y1, 0) / Math.max(1, talus.filter(b => b.z0 > -2.2).length);
      assert(nearH > farH, `the talus is ${nearH.toFixed(2)} m at the face and ${farH.toFixed(2)} m out`);
      if (ppm === 24) console.log(`      ${face.length} columns close 48 m of face; the talus averages ${nearH.toFixed(2)} m tall near the face, ${farH.toFixed(2)} m out; ${a.boxes.length} boxes; ${paintAll(a).paintings} paintings`);
    }
  } },
  { name: 'rocks keep clear of what they avoid, and a drift and a path lie where they are put', fn() {
    const a = recordingArea(24), avoid = [{ x0: -20, x1: 0, z0: 0, z1: 9.5 }];
    const n = scatterRocks(a, { x0: -24, z0: -0.5, x1: 24, z1: 14.5, n: 26, seed: 11, avoid });
    for (const { b } of a.boxes) assert(!(b.x1 > avoid[0].x0 + 0.05 && b.x0 < avoid[0].x1 - 0.05 && b.z1 > avoid[0].z0 + 0.05 && b.z0 < avoid[0].z1 - 0.05), `a rock inside the kept-clear rectangle at ${b.x0.toFixed(2)}, ${b.z0.toFixed(2)}`);
    const before = a.boxes.length;
    boulder(a, { x: 3, z: 3, sizeM: 1.9, kind: 'layered', seed: 41 });
    assert(a.boxes.length - before >= 2, 'a big boulder has a crown');
    drift(a, { x0: -19, x1: -15.4, z: 6.6, heightM: 0.28, reachM: 1.3, seed: 2 });
    slabPath(a, { x0: -14.5, x1: -13.3, z0: 8.6, z1: 15, seed: 5 });
    const p = paintAll(a);
    console.log(`      ${n} rocks placed clear of the station; ${a.boxes.length} boxes with a boulder, a drift and a path; ${p.paintings} paintings, ${(p.pixels / 1000).toFixed(0)} kpx`);
  } },
];
