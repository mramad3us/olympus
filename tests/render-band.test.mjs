// OLYMPUS tests: what the fog mask, the known cells and the pixel layers send to the GPU a frame (F73's node half; v0.0.28 build sheet
// item 25, §3.5, §6 E). Quick, in node with three.js and no GPU: a fake renderer applies each copyTextureToTexture to a copy of the
// texture as the GPU would hold it, and three's update ranges are applied to a copy of each buffer, so every case checks both the
// bytes sent and that the GPU ends holding what the layer holds.
//   - the fog mask: a scripted minute of a walk (the window moved by one cell and diagonally, east then back west; sight a moving
//     disc; eased at 60 frames a second) beside v0.0.27's mask (its place() and ease(), kept here as the reference): every frame the
//     texture drawn holds every cell of the window as the reference does, the post pass's box the window's own, each move done on
//     the GPU; and a frame sends from the CPU at most the changed cells' box and the cells new to the window, 2 bytes a cell, where
//     the reference sent its 48 KB whole on every frame a byte moved;
//   - the known cells: a row turned known sends that row, not the mask;
//   - a pixel layer: redrawn the same it sends nothing, grown by k pixels it sends k, one colour changed sends that pixel's colour, a
//     smoke step (every place and colour new) sends 16 bytes a pixel, not 92; the quads' corners those of v0.0.27's instance matrices;
//   - the GL counters: an upload is counted under its sender's tag, an untagged one by its call and size; the frame's senders
//     largest first, in words.
// Each fails on v0.0.27's code (the whole mask, the whole layer, no senders).
import { registerHooks } from 'node:module';
import { assert, fmt } from './helpers.mjs';
import * as THREE from '../vendor/three/build/three.module.js';

const THREE_URL = new URL('../vendor/three/build/three.module.js', import.meta.url).href;
registerHooks({ resolve: (spec, ctx, next) => (spec === 'three' ? { url: THREE_URL, shortCircuit: true } : next(spec, ctx)) });
const { createFogMask, createKnownSender, FOG_IN_S, FOG_OUT_S } = await import('../src/render/fog.js');
const { createPixels, PIXEL_BYTES } = await import('../src/render/decals.js');
const { instrumentGL, tag, sendersOf } = await import('../src/render/stats.js');
const { UPLOAD_MID_KB } = await import('../src/data/bench.js');

/**
 * A renderer that only copies, as three's copyTextureToTexture does: the GPU's copy of each texture made on its first use (three's
 * upload of image.data, or empty storage for a texture with no data), then a region copied in from the CPU (a source three has never
 * held: its image.data, counted as bytes sent) or from another texture on the GPU (one three holds: a copyTexSubImage2D, no bytes).
 */
function fakeRenderer() {
  const gpu = new Map(), log = [], CH = { [THREE.RGFormat]: 2, [THREE.RedFormat]: 1, [THREE.RGBAFormat]: 4 };
  const ofTex = (t) => {
    let g = gpu.get(t);
    if (!g || g.version !== t.version) {
      const n = t.image.width * t.image.height * (CH[t.format] ?? 4);
      g = { version: t.version, data: t.image.data && t.source.dataReady !== false ? Uint8Array.from(t.image.data) : (g?.data ?? new Uint8Array(n)) };
      gpu.set(t, g); log.push({ whole: t.image.data && t.source.dataReady !== false ? n : 0 });
    }
    return g;
  };
  return {
    gpu: ofTex, log, held: (t) => gpu.has(t),
    copyTextureToTexture(src, dst, box, at) {
      const fromGpu = gpu.has(src), from = fromGpu ? gpu.get(src).data : src.image.data, g = ofTex(dst), w = src.image.width, c = CH[dst.format] ?? 4;
      const x0 = box.min.x, y0 = box.min.y, x1 = box.max.x, y1 = box.max.y, out = new Uint8Array((x1 - x0) * (y1 - y0) * c);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) for (let k = 0; k < c; k++) out[((y - y0) * (x1 - x0) + x - x0) * c + k] = from[(y * w + x) * c + k];
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) for (let k = 0; k < c; k++) g.data[((at.y + y - y0) * w + at.x + x - x0) * c + k] = out[((y - y0) * (x1 - x0) + x - x0) * c + k];
      log.push(fromGpu ? { gpu: (x1 - x0) * (y1 - y0) * c } : { bytes: (x1 - x0) * (y1 - y0) * c });
    },
  };
}

/** v0.0.27's fog mask (src/render/fog.js as it shipped): the window's cells in window order, shifted by copyWithin on a move. */
function refMask(nx, nz, cellM) {
  const data = new Uint8Array(nx * nz * 2), val = new Float32Array(nx * nz * 2), aim = new Float32Array(nx * nz * 2);
  let x0 = 0, z0 = 0;
  return {
    data,
    place(x, z) {
      const nx0 = Math.floor(x / cellM) * cellM, nz0 = Math.floor(z / cellM) * cellM;
      const di = Math.round((nx0 - x0) / cellM), dj = Math.round((nz0 - z0) / cellM);
      x0 = nx0; z0 = nz0;
      if (!di && !dj) return;
      if (Math.abs(di) >= nx || Math.abs(dj) >= nz) { val.fill(0); aim.fill(0); data.fill(0); return; }
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
    setSeen(vis) { for (let c = 0; c < nx * nz; c++) { aim[c * 2] = vis[c]; aim[c * 2 + 1] = 0; } },
    ease(dtS) {
      const kin = 1 - Math.exp(-dtS / FOG_IN_S), kout = 1 - Math.exp(-dtS / FOG_OUT_S);
      let moved = false;
      for (let k = 0; k < val.length; k++) {
        const a = aim[k], v = val[k], n = v + (a - v) * (a > v ? kin : kout);
        if (n !== v) { val[k] = n; const b = Math.round(n * 255); if (data[k] !== b) { data[k] = b; moved = true; } }
      }
      return moved;
    },
  };
}

export default [
  {
    name: '(F73) the fog mask sends only the cells that changed and the strips a move brings in, and the GPU holds every window cell as v0.0.27\'s mask did, the post pass\'s box the window\'s own (a minute\'s walk at 60 frames a second; a move done on the GPU)',
    fn() {
      const nx = 48, nz = 32, cellM = 0.25, R = fakeRenderer(), m = createFogMask({ nx, nz, cellM }), ref = refMask(nx, nz, cellM);
      // (the walk: the eye in metres, east at 0.9 m/s then back west, weaving north and south at 0.45 m/s; the camera's corner on it;
      // sight a disc of 2.5 m round the eye, recomputed every sixth frame and on each move of the window, as the view's recompute)
      const tri = (t) => { const p = t % 20; return p < 10 ? p : 20 - p; };
      const path = (f) => { const t = f / 60; return { x: 100 + (t < 30 ? 0.9 * t : 27 - 0.9 * (t - 30)), z: 40 + 0.45 * tri(t) }; };
      let frames = 0, sentFrames = 0, bytes = 0, worst = 0, refBytes = 0, refWorst = 0, over = 0, bad = null, strips = 0, overBound = null, gpuMoves = 0;
      let prev = null;                                                   // (the reference's bytes a frame ago, by world cell)
      for (let f = 0; f < 3600 && !bad; f++) {
        const eye = path(f), cx = eye.x - nx * cellM / 2, cz = eye.z - nz * cellM / 2;
        const before = m.box;
        m.place(cx, cz); ref.place(cx, cz);
        const [x0, z0] = m.box, moved = x0 !== before[0] || z0 !== before[1];
        if (moved) strips++;
        if (f % 6 === 0 || moved) {
          const vis = new Float32Array(nx * nz);
          for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) vis[j * nx + i] = Math.hypot(x0 + (i + 0.5) * cellM - eye.x, z0 + (j + 0.5) * cellM - eye.z) < 2.5 ? 1 : 0;
          m.setSeen(vis); ref.setSeen(vis);
        }
        const dt = f === 0 ? Infinity : 1 / 60;
        m.ease(dt);
        const refMoved = ref.ease(dt);
        const [tex, ox, oz, W, H] = m.upload(R);
        const g = R.gpu(tex), sent = m.sent.bytes;
        // (the bound: 2 bytes a cell of the box of the world cells whose byte changed, and of the cells new to the window)
        const I0 = Math.round(x0 / cellM), J0 = Math.round(z0 / cellM), now = new Map();
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity, entering = 0;
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
          const key = (J0 + j) * 100000 + I0 + i, r = (j * nx + i) * 2, v = ref.data[r] * 256 + ref.data[r + 1];
          now.set(key, v);
          if (!prev) continue;
          const was = prev.get(key);
          if (was === undefined) entering++;
          else if (was !== v) { a0 = Math.min(a0, i); a1 = Math.max(a1, i); b0 = Math.min(b0, j); b1 = Math.max(b1, j); }
        }
        const bound = 2 * ((a1 >= a0 ? (a1 - a0 + 1) * (b1 - b0 + 1) : 0) + entering);
        if (prev && sent > bound && !overBound) overBound = { f, sent, bound, entering };
        prev = now;
        frames++;
        if (f > 0) { bytes += sent; worst = Math.max(worst, sent); if (sent) sentFrames++; if (refMoved || moved) { refBytes += nx * nz * 2; refWorst = nx * nz * 2; } }
        // (the post pass's box is the window's own, as v0.0.27's; the texture drawn holds every window cell's bytes as the reference)
        if (ox !== x0 || oz !== z0 || W !== nx * cellM || H !== nz * cellM) bad = { f, box: [ox, oz, W, H], window: [x0, z0] };
        for (let c = 0; c < nx * nz * 2 && !bad; c++) if (g.data[c] !== ref.data[c]) bad = { f, i: (c >> 1) % nx, j: Math.floor((c >> 1) / nx), gpu: g.data[c], ref: ref.data[c] };
        if (m.sent.moved) gpuMoves++;
        if (sent > UPLOAD_MID_KB * 1024) over++;
      }
      const whole = nx * nz * 2;
      console.log(`      ${frames} frames on a ${nx} × ${nz} mask (${whole} bytes whole), the window moved on ${strips} (on the GPU ${gpuMoves}): sent on ${sentFrames}, ${fmt(bytes / 1024, 1)} KB in all, ${worst} bytes at most in a frame (${fmt(100 * worst / whole, 1)}% of the mask), ${overBound ? `OVER the changed cells' box on frame ${JSON.stringify(overBound)}` : 'never more than the changed cells\' box and the new strips'}; v0.0.27's mask ${fmt(refBytes / 1024, 1)} KB, ${refWorst} bytes a frame; the GPU's cells against the reference: ${bad ? `DIFFER ${JSON.stringify(bad)}` : 'every cell equal on every frame'}`);
      assert(!bad, JSON.stringify(bad));
      assert(strips > 50 && gpuMoves === strips - 1 && !overBound && worst < whole && bytes < refBytes / 2 && !over, JSON.stringify({ strips, gpuMoves, overBound, worst, whole, bytes, refBytes, over }));
    },
  },
  {
    name: '(F73) the game\'s mask (192 × 128 cells, 48 KB whole): a step east of one cell sends one column, an ease in a room\'s box sends that box, a jump of the whole window sends it whole',
    fn() {
      const R = fakeRenderer(), m = createFogMask({ nx: 192, nz: 128 }), nx = 192, nz = 128, out = [];
      const vis = (fn) => { const [x0, z0] = m.box, v = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = fn(x0 + (i + 0.5) * 0.25, z0 + (j + 0.5) * 0.25); return v; };
      const room = (x, z) => (x > 30 && x < 34 && z > 20 && z < 23 ? 1 : 0);
      m.place(10, 4); m.setSeen(vis(room)); m.ease(Infinity); m.upload(R); R.gpu(m.texture);
      m.place(10.25, 4); m.ease(1 / 60); out.push(['a cell east', m.upload(R) && m.sent.bytes]);
      m.setSeen(vis((x, z) => room(x - 1, z))); m.ease(1 / 60); out.push(['the room\'s sight moved 1 m (eased)', m.upload(R) && m.sent.bytes]);
      m.ease(1 / 60); out.push(['eased on', m.upload(R) && m.sent.bytes]);
      m.place(200, 4); m.ease(1 / 60); out.push(['a jump of 190 m', m.upload(R) && m.sent.bytes]);
      console.log(`      ${out.map(([k, b]) => `${k}: ${b} bytes`).join('; ')} (UPLOAD_MID_KB ${UPLOAD_MID_KB} KB = ${UPLOAD_MID_KB * 1024})`);
      const [col, moved, on, jump] = out.map(o => o[1]);
      // (the moved sight: the box of the cells that changed, 5 m × 3 m and the metre it moved, 2 bytes a cell)
      assert(col === nz * 2 && moved > 0 && moved <= 6 * 4 * 3 * 4 * 2 && on > 0 && on <= moved && jump === nx * nz * 2, JSON.stringify(out));
    },
  },
  {
    name: '(F73) the known cells send the rows that turned known, not the mask (createKnownSender), and the GPU holds the mask',
    fn() {
      const w = 20, h = 112, mask = { data: new Uint8Array(w * h), w, h }, K = createKnownSender(mask), R = fakeRenderer();
      R.gpu(K.texture);
      for (const j of [40, 41, 43]) mask.data[j * w + 3] |= 0b100;
      const a = K.send(R), b = K.send(R);
      mask.data[100 * w + 19] |= 1;
      const c = K.send(R), same = R.gpu(K.texture).data.every((v, i) => v === mask.data[i]);
      console.log(`      a ${w} × ${h} byte mask (${w * h} bytes whole): rows 40, 41 and 43 turned known send ${a} bytes; again with nothing new ${b}; row 100 ${c}; the GPU ${same ? 'holds the mask' : 'DIFFERS'}`);
      assert(a === 4 * w && b === 0 && c === w && same, JSON.stringify({ a, b, c, same }));
    },
  },
  {
    name: '(F73) a pixel layer sends only what changed: the same picture nothing, k pixels appended k, a colour its 4 bytes, a smoke step (every place and colour new) 16 bytes a pixel against v0.0.27\'s 92; the GPU holds the layer and the corners are v0.0.27\'s instance matrices\'',
    fn() {
      const L = createPixels(THREE, 3000, { ppm: 16, name: 'test' }), A = ['aPos', 'aColor', 'aTint', 'aPart'].map(k => L.mesh.geometry.getAttribute(k));
      // (the GPU's copy of each buffer: three makes it from the array on first use, then applies the update ranges)
      const gpu = A.map(a => a.array.slice());
      const render = () => { let n = 0; A.forEach((a, k) => { for (const r of a.updateRanges) { gpu[k].set(a.array.subarray(r.start, r.start + r.count), r.start); n += r.count * a.array.BYTES_PER_ELEMENT; } a.clearUpdateRanges(); }); return n; };
      const held = (n) => A.every((a, k) => { const s = a.itemSize; for (let i = 0; i < n * s; i++) if (gpu[k][i] !== a.array[i]) return false; return true; });
      const pix = (i, dx = 0, c = 0x808080) => ({ x: 20 + (i % 50) / 16 + dx, y: 0.012 + (i % 7) / 16, z: 30 + Math.floor(i / 50) / 16, flat: i % 3 === 0, color: c, tint: [0.8, 0.75, 0.7], noLine: true });
      const draw = (n, f = pix) => { for (let i = 0; i < n; i++) L.set(i, f(i)); L.count(n); return render(); };
      const rows = [];
      rows.push(['2,330 drawn', draw(2330)]);
      rows.push(['the same again', draw(2330)]);
      rows.push(['20 appended', draw(2350)]);
      rows.push(['shrunk to 1,500, grown back the same', (draw(1500), draw(2350))]);
      rows.push(['pixel 700\'s colour', draw(2350, (i) => pix(i, 0, i === 700 ? 0xff0000 : 0x808080))]);
      rows.push(['and back', draw(2350)]);
      rows.push(['a smoke step: 2,350 places and colours', draw(2350, (i) => pix(i, 1 / 16, 0x909090))]);
      const ok = held(2350);
      // (the corners: v0.0.27's instance matrix (place, a quarter turn about x when flat) on the plane's four vertices against aPos + the turned vertex)
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), m4 = new THREE.Matrix4(), v = new THREE.Vector3(), P = L.mesh.geometry.getAttribute('position');
      let worstM = 0;
      for (const i of [0, 1, 3, 1499, 2349]) {
        const p = pix(i, 1 / 16), f32 = (x) => Math.fround(x);
        m4.compose(new THREE.Vector3(p.x, p.y, p.z), p.flat ? q : new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
        for (let k = 0; k < 4; k++) {
          v.fromBufferAttribute(P, k).applyMatrix4(m4);
          const px = P.getX(k), py = P.getY(k), now = p.flat ? [f32(p.x) + px, f32(p.y), f32(p.z) - py] : [f32(p.x) + px, f32(p.y) + py, f32(p.z)];
          worstM = Math.max(worstM, Math.abs(now[0] - v.x), Math.abs(now[1] - v.y), Math.abs(now[2] - v.z));
        }
      }
      const per = Object.values(PIXEL_BYTES).reduce((a, b) => a + b, 0);
      console.log(`      bytes sent: ${rows.map(([k, b]) => `${k} ${b}`).join('; ')}; a pixel ${per} bytes on the GPU (${JSON.stringify(PIXEL_BYTES)}), v0.0.27's 92; the GPU ${ok ? 'holds' : 'DOES NOT hold'} the layer; the corners within ${worstM.toExponential(1)} m of v0.0.27's`);
      const B = Object.fromEntries(rows);
      assert(B['2,330 drawn'] === 2330 * per && B['the same again'] === 0 && B['20 appended'] === 20 * per && B['shrunk to 1,500, grown back the same'] === 0, JSON.stringify(rows));
      assert(B['pixel 700\'s colour'] === PIXEL_BYTES.aColor && B['and back'] === PIXEL_BYTES.aColor && B['a smoke step: 2,350 places and colours'] === 2350 * (PIXEL_BYTES.aPos + PIXEL_BYTES.aColor), JSON.stringify(rows));
      assert(ok && worstM < 1e-6 && per === 32, JSON.stringify({ ok, worstM, per }));
    },
  },
  {
    name: '(F73) the GL counters name each upload by its sender (render/stats.js tag): a tagged texture\'s rows and a tagged buffer\'s range under their names, an untagged one by its call and size, largest first',
    fn() {
      const calls = [], gl = Object.fromEntries(['texImage2D', 'texSubImage2D', 'bufferData', 'bufferSubData', 'compileShader', 'linkProgram'].map(k => [k, (...a) => calls.push(k)]));
      const G = instrumentGL(gl), fogData = new Uint8Array(192 * 128 * 2), pos = new Float32Array(300), other = new Uint8Array(64);
      tag('fog', fogData); tag('decals:test', pos);
      gl.texSubImage2D(0x0de1, 0, 0, 5, 192, 10, 0x8227, 0x1401, fogData);                  // (ten rows of the RG mask: 3,840 bytes)
      gl.bufferSubData(0x8892, 40, pos, 10, 30);                                              // (30 floats: 120 bytes)
      gl.texSubImage2D(0x0de1, 0, 0, 0, 4, 4, 0x1908, 0x1401, other);                         // (an untagged 4 × 4 RGBA: 64 bytes)
      const f = G.frame();
      const words = sendersOf({ a: 1, b: 2048, c: 3, d: 4096 }).top;
      console.log(`      the frame: ${f.bytes} bytes, senders ${JSON.stringify(f.senders)}, in words "${f.top}"; four senders in words "${words}"`);
      assert(f.bytes === 3840 + 120 + 64 && f.senders.map(s => s[0]).join() === 'fog,decals:test,texSubImage2D 4×4' && f.top === 'fog 3.8 KB, decals:test 0.1 KB, texSubImage2D 4×4 0.1 KB', JSON.stringify(f));
      assert(words === 'd 4.0 KB, b 2.0 KB, c 0.0 KB, 1 more' && G.frame().senders.length === 0 && calls.length === 3, JSON.stringify({ words, calls }));
    },
  },
];
