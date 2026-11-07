// OLYMPUS tests: the far window's numbers in node (the build sheet 0.0.7 §5.4; VIEWS §2.4, TECH §9.9).
//
// src/render/far.js's pure parts and the KD faces' geometry (src/render/range-items.js), no GPU:
//   - the window's size (FAR_R_PX 79 px at 16 px/m, 4.9 m of ground either way), its camera centred on a face at 300 m
//     (the face as drawn, standing up: its centre at the picture's middle), its 24 × 24 fog cells of 0.5 m round it;
//   - the fog's law at 300 m: open by day at 1×, by perception's own visibility within its reach, dark by night at 1× and
//     at 4× (a 4× sight lifts the reach four times, which is not 300 m in the dark), and the optic's field (6.5° at 4×) never
//     narrower than the window at 300 m, narrower at 50 m;
//   - the dissolve's alpha by time (0.2 s each way) and none before the window's ground is up (ready: nothing drawn);
//   - a hole at (x, y) cm on an A face at FACE_K 2 to its pixel in the window (0.32 px a cm at 16 px/m: the V at the centre,
//     the black's edge 4.8 px out, a hole 30 cm low right);
//   - a face's carrier moving continuously from up to down (each step under a pixel at 60 fps over CARRIER_S 2.0 s), down
//     wholly under the ground, up over the parapet;
//   - the chunks a window at a 300 m face needs (its own and the parapet's and the pits', whose middles are elsewhere);
//   - the hud's disc from CSS pixels to the picture's;
//   - 0.0.8, the user's report of 2026-11-07 ("when at 300m, with the scope at 1x, the view still shows the target
//     zoomed in, just without the haircross"): the window's scale by the lever (16 px/m at 4×, 4 at 1×: a 300 m face 32 px
//     across at 4×, 8 at 1×; 4.9 m of ground either way at 4×, 19.75 at 1×), the lever's ease over OPTIC_S 0.5 s (no
//     frame's step of the scale over a sixth of the way at 60 fps, the ends exact), the mean's blocks tiling the wider
//     pass exactly at every scale on the way, the fog's box at the window's scale, and the 1× ground of the KD's line
//     (12 chunks, within FAR_CHUNKS_MAX); the verifier's review: the fog's lift, the reticle and the far brackets
//     following the scale while it eases (at night the fog went black, or lit, in one frame), the brackets 12 px
//     round the 8 px face at 1×;
//   - the KD's moving things: a flag's sleeve blows the way flagOf says (its body and its shadow on the ground downwind of
//     its pole from every quarter at 1, 3 and 6 m/s, the shadow longer as the bands fill, its open mouth seen only when it
//     blows away from the camera: the user's report of v0.0.7, 2026-11-07), the score disk rises on
//     its pole and goes down again over DISK_RISE_MS (never a pop), the spotter sits in its hole, the miss's flag waves.
import { assert, fmt } from './helpers.mjs';
import { FAR_R_PX, FAR_DISSOLVE_S, FAR_FOG_N, FAR_FOG_CELL_M, FAR_LOAD_M, FAR_CHUNKS_MAX, farFieldPx, farFogBox, farFogCells, farReachM, dissolveStep, farPixelOf, pictOfCss, farChunks, CHUNK_M,
  farPpm, farSpanPx, farRadiusM, opticEase, magOfEase, farBlockOf, farLensK, farReticleK, farBracketPx, FAR_LENS_STEPS } from '../src/render/far.js';
import { OPTIC_S } from '../src/sim/arms/firearms.js';
import { kdFaceAt, kdHolePixel, FACE_UP_Y, FACE_DOWN_Y, sleevePixels, diskPixels, spotterPixels, missFlagPixels, poleUp, DISK_RISE_MS, SLEEVE_M } from '../src/render/range-items.js';
import { FACE_K, facePx } from '../src/art/kit/range.js';
import { KD_RANGE, RANGE_PIECES, RANGE_KINDS } from '../src/data/places/range.js';
import { FLAG_FULL_MS } from '../src/sim/arms/wind.js';

const PPM = 16;
// (a lane's face at 300 m: the range role's data where it has it, else the sheet's numbers)
const LANE = KD_RANGE.kd?.lanes?.[9] ?? { lane: 10, z: 347.5, face: { x: 1600, z: 347.5, upY: 1.9, downY: -0.6, paper: 'kdA' } };
const FACE = { lane: LANE.lane, x: LANE.face.x, z: LANE.face.z ?? LANE.z, paper: LANE.face.paper ?? 'kdA', upY: LANE.face.upY, downY: LANE.face.downY };

export default [
  {
    name: 'the far window is 79 px of picture at 16 px/m, its camera centred on a 300 m face as drawn standing up, its fog 24 cells of 0.5 m round it (VIEWS §2.4)',
    fn() {
      const fa = kdFaceAt({ ...FACE, up: 1 }, PPM), c = { x: fa.x0 + fa.n / PPM / 2, y: fa.cy, z: fa.z };
      const box = farFogBox(c.x, c.z - c.y), mid = farPixelOf(c, c.x, c.y, c.z, PPM), top = farPixelOf(c, c.x, fa.yTop, c.z, PPM);
      console.log(`      FAR_R_PX ${FAR_R_PX} px (${fmt(FAR_R_PX / PPM, 2)} m either way); lane ${FACE.lane}'s face at (${FACE.x}, ${FACE.z}), drawn ${fa.n} px (${FACE_K}× life), its top ${fa.yTop} m, its centre ${fmt(c.y, 3)} m up: the window's centre on it ${JSON.stringify(mid)}, its top edge ${fmt(top[1], 1)} px up`);
      console.log(`      the fog's box: ${box.nx} × ${box.nz} cells of ${box.cellM} m from (${box.x0}, ${box.z0}): ${box.nx * box.cellM} m square round the point on the ground (${fmt(c.x, 2)}, ${fmt(c.z - c.y, 2)})`);
      assert(FAR_R_PX === 79 && fa.n === 32 && facePx('kdA', 24) === 48, `${FAR_R_PX} px, a face ${fa.n} px`);
      assert(mid[0] === 0 && mid[1] === 0 && Math.abs(top[1] + 16) < 1e-9, `the centre ${mid}, the top ${top}`);
      assert(box.nx === FAR_FOG_N && box.cellM === FAR_FOG_CELL_M && box.x0 <= c.x - 5.5 && box.x0 + 12 >= c.x + 5.5 && box.z0 <= c.z - c.y - 5.5, JSON.stringify(box));
    },
  },
  {
    name: 'the window\'s fog at 300 m: open by day, dark at night at 1× and at 4×; perception\'s own visibility within its reach; the SO-4\'s field narrower than the window at 50 m, never at 300 m',
    fn() {
      const fa = kdFaceAt({ ...FACE, up: 1 }, PPM), box = farFogBox(fa.x0 + 1, fa.z - fa.cy), eye = { x: 1300, z: FACE.z, lightK: 1 };
      const run = (L, optic) => { const v = farFogCells(box, eye, { vis: () => 0.37, light: () => L, optic }); let s = 0; for (const x of v) s += x; return s / v.length; };
      const rows = [[1, 1], [1, 4], [0.02, 1], [0.02, 4], [0.3, 1]].map(([L, o]) => ({ L, o, mean: run(L, o), reach: farReachM(L, 1, o) }));
      const near = farFogCells(farFogBox(1310, FACE.z), eye, { vis: () => 0.37, light: () => 1, optic: 1 });
      for (const r of rows) console.log(`      light ${r.L}, ${r.o}×: reach ${fmt(r.reach, 0)} m, the window's cells at 300 m seen ${fmt(r.mean, 3)}`);
      const f300 = farFieldPx(300, 4, PPM), f50 = farFieldPx(50, 4, PPM), f1 = farFieldPx(300, 1, PPM);
      console.log(`      within 54 m: perception's 0.37 kept (${fmt(near[0], 2)}); the SO-4's field at 300 m ${fmt(f300, 0)} px, at 50 m ${fmt(f50, 1)} px (the window ${FAR_R_PX}); at 1× ${f1}`);
      assert(rows[0].mean === 1 && rows[2].mean === 0 && rows[3].mean === 0 && rows[0].reach === FAR_LOAD_M, JSON.stringify(rows));
      assert(Math.abs(near[0] - 0.37) < 1e-6, 'perception\'s own within its reach');
      assert(f300 > FAR_R_PX && f50 < FAR_R_PX && f1 === Infinity, `${f300}, ${f50}`);
    },
  },
  {
    name: 'the dissolve opens over 0.2 s only once the ground is up, and closes over 0.2 s: nothing drawn before ready, never a pop',
    fn() {
      const steps = [];
      let a = 0;
      for (let i = 0; i < 6; i++) { a = dissolveStep(a, 1 / 60, true, false); }
      steps.push(`not ready, 0.1 s: ${a}`);
      const notReady = a;
      const opened = [];
      for (let i = 0; i < 14; i++) { a = dissolveStep(a, 1 / 60, true, true); opened.push(fmt(a, 3)); }
      const closed = [];
      for (let i = 0; i < 14; i++) { a = dissolveStep(a, 1 / 60, false, true); closed.push(fmt(a, 3)); }
      console.log(`      ${steps[0]}; opening at 60 fps: ${opened.join(', ')}; closing: ${closed.join(', ')} (FAR_DISSOLVE_S ${FAR_DISSOLVE_S} s)`);
      assert(notReady === 0, 'nothing before the ground is up');
      assert(Number(opened[11]) === 1 && Number(opened[10]) < 1 && Number(opened[0]) > 0 && Number(opened[0]) <= 0.1, `opens over 12 frames: ${opened}`);
      assert(Number(closed[11]) === 0 && Number(closed[10]) > 0, `closes over 12 frames: ${closed}`);
    },
  },
  {
    name: 'a hole at (x, y) cm on an A face at FACE_K 2 lands on its pixel in the window: 0.32 px a cm at 16 px/m, the V at the centre, the black\'s edge 4.8 px out',
    fn() {
      const fa = kdFaceAt({ ...FACE, up: 1 }, PPM), c = { x: fa.x0 + fa.n / PPM / 2, y: fa.cy, z: fa.z };
      const rows = [];
      for (const [x, y] of [[0, 0], [15, 0], [0, -15], [-30, 30], [49, 49], [60, 0]]) {
        const h = kdHolePixel(fa, { xCm: x, yCm: y }, PPM);
        const at = h ? farPixelOf(c, h.x, h.y - 0.12, h.z - 0.12, PPM) : null;
        rows.push({ x, y, at: at ? at.map(v => +fmt(v, 2)) : null, black: h?.black ?? null, want: [x * 0.32, y * 0.32] });
      }
      console.log(`      ${rows.map(r => `(${r.x}, ${r.y}) cm → ${r.at ? `(${r.at.join(', ')}) px${r.black ? ' in the black' : ''}` : 'off the paper'}`).join('; ')}`);
      for (const r of rows.slice(0, 5)) assert(r.at && Math.abs(r.at[0] - r.want[0]) <= 0.51 && Math.abs(r.at[1] - r.want[1]) <= 0.51, JSON.stringify(r));
      assert(rows[0].black && rows[1].black && !rows[3].black && rows[5].at === null, 'the black, the white, off the paper');
    },
  },
  {
    name: 'a face moves continuously down into the pits and up again: each 60 fps step under a pixel over CARRIER_S 2.0 s, wholly under the ground down, over the parapet up',
    fn() {
      const N = 120, ys = [];
      for (let i = 0; i <= N; i++) ys.push(kdFaceAt({ ...FACE, up: 1 - i / N }, PPM).yTop);
      let worst = 0;
      for (let i = 1; i < ys.length; i++) worst = Math.max(worst, Math.abs(ys[i] - ys[i - 1]) * PPM);
      const up = kdFaceAt({ ...FACE, up: 1 }, PPM), down = kdFaceAt({ ...FACE, up: 0 }, PPM);
      console.log(`      up: ${up.yBot} to ${up.yTop} m (the sim's centre ${FACE.upY ?? FACE_UP_Y}); down: ${down.yBot} to ${down.yTop} m (${FACE.downY ?? FACE_DOWN_Y}); the largest step over ${N} frames ${fmt(worst, 2)} px`);
      assert(worst <= 1.0, `a step of ${worst} px`);
      assert(down.yTop < 0 && up.yBot > 0.3, 'down under the ground, up over the parapet');
    },
  },
  {
    name: 'a window on a 300 m face asks for its own chunks and those holding the parapet and the pits (a piece is drawn by the chunk its middle is in); the hud\'s disc in the picture\'s pixels',
    fn() {
      const fa = kdFaceAt({ ...FACE, up: 1 }, PPM), sizes = { ...RANGE_KINDS };
      const list = farChunks(fa.x0 + 1, fa.z - fa.cy, FAR_R_PX / PPM, { pieces: RANGE_PIECES, sizes });
      const pits = RANGE_PIECES.filter(p => /parapet|pits|kdBerm/i.test(p.kind)).map(p => `${p.kind} (${p.x}, ${p.z}) → ${Math.floor(p.x / CHUNK_M)},${Math.floor(p.z / CHUNK_M)}`);
      console.log(`      lane ${FACE.lane}: ${list.length} chunks ${list.map(c => c.join(',')).join(' ')}; the long pieces: ${pits.join('; ') || 'none yet (the range role\'s)'}`);
      const d = pictOfCss({ cx: 900, cy: 200, rCss: 158 }, { left: 0, top: 0, width: 1280, height: 720 }, 640, 360);
      console.log(`      the disc at (900, 200) CSS px, r 158, on a 1280 × 720 canvas of 640 × 360: (${d.cx}, ${d.cy}) r ${d.r} in the picture`);
      assert(list.length >= 1 && list.length <= 8, `${list.length} chunks`);
      for (const p of RANGE_PIECES.filter(q => q.kind === 'kdParapet' || q.kind === 'kdPits')) {
        const k = sizes[p.kind], side = p.face === 'left' || p.face === 'right', hd = ((side ? p.w ?? k.w : p.d ?? k.d) / 2);
        if (Math.abs(p.z - (fa.z - fa.cy)) > hd + 6 || Math.abs(p.x - fa.x0) > 12) continue;
        assert(list.some(([cx, cz]) => cx === Math.floor(p.x / CHUNK_M) && cz === Math.floor(p.z / CHUNK_M)), `the chunk of ${p.id}`);
      }
      assert(d.cx === 450 && d.cy === 100 && d.r === 79, JSON.stringify(d));
    },
  },
  {
    name: 'the lever is a real magnification in the far window (the user\'s report, 2026-11-07: "when at 300m, with the scope at 1x, the view still shows the target zoomed in, just without the haircross"): 16 px/m at 4×, 4 at 1×, a 300 m face 32 px across at 4× and 8 at 1×, four times the ground across',
    fn() {
      const rows = [1, 2, 4].map(m => ({ m, ppm: farPpm(m, PPM), span: farSpanPx(m), rM: farRadiusM(m, PPM), face: kdFaceAt({ ...FACE, up: 1 }, PPM).n / PPM * farPpm(m, PPM) }));
      for (const r of rows) console.log(`      ${r.m}×: ${fmt(r.ppm, 3)} px/m, the pass ${r.span} px square at 16 px/m, ${fmt(r.rM, 2)} m either way; the 300 m face ${fmt(r.face, 1)} px across`);
      const [one, , four] = rows;
      // (a 1× pixel is a quarter metre of ground: the face drawn FACE_K life size, 9 cm at 300 m (an arcminute) is 0.72 px, not resolved)
      const arcminPx = 300 * Math.PI / 180 / 60 * FACE_K * one.ppm;
      console.log(`      the face ${fmt(four.face / one.face, 2)} times larger at 4×; an arcminute at 300 m (the eye's) ${fmt(arcminPx, 2)} px at 1× (a hole a ${fmt(1 / 16, 3)} of a pixel's ground, a sixteenth of its light)`);
      assert(four.ppm === 16 && one.ppm === 4 && four.span === 2 * FAR_R_PX && one.span === 8 * FAR_R_PX, JSON.stringify(rows));
      assert(four.face === 32 && one.face === 8 && Math.abs(one.rM / four.rM - 4) < 1e-9, JSON.stringify(rows));
      assert(arcminPx < 1, `${arcminPx}`);
    },
  },
  {
    name: 'the lever eases the window\'s scale over OPTIC_S (0.5 s) both ways, never a pop: each 60 fps frame a small step, the ends exact; the 4 × 4 mean\'s blocks tile the wider pass exactly at every scale on the way',
    fn() {
      const up = [], dn = [];
      let t = 0;
      for (let i = 0; i < 40 && t < 1; i++) { t = opticEase(t, 4, 1 / 60, OPTIC_S); up.push(magOfEase(t)); }
      const nUp = up.length;
      for (let i = 0; i < 40 && t > 0; i++) { t = opticEase(t, 1, 1 / 60, OPTIC_S); dn.push(magOfEase(t)); }
      const steps = (a, s) => a.map((m, i) => Math.abs(Math.log(m) - Math.log(i ? a[i - 1] : s)) / Math.log(4));
      const worstUp = Math.max(...steps(up, 1)), worstDn = Math.max(...steps(dn, 4));
      console.log(`      1× to 4× in ${nUp} frames (${fmt(nUp / 60, 3)} s, OPTIC_S ${OPTIC_S} s, the last a float's remainder): ${up.filter((_, i) => i % 5 === 4 || i === up.length - 1).map(m => fmt(m, 2)).join(', ')}; back in ${dn.length}; the largest frame's step ${fmt(worstUp * 100, 1)}% of the way (log scale)`);
      assert(Math.abs(nUp - OPTIC_S * 60) <= 1 && up[up.length - 1] === 4 && dn[dn.length - 1] === 1 && dn.length === nUp, `${nUp}, ${dn.length}`);
      assert(worstUp <= 0.06 && worstDn <= 0.06, `${worstUp}, ${worstDn}`);
      // (every texel of the pass summed by exactly one window pixel, at most 4 a side, at the scales the ease passes)
      const bad = [];
      for (const m of [1, ...up]) {
        const N = farSpanPx(m), b = N / (2 * FAR_R_PX);
        let next = 0, most = 0;
        for (let q = 0; q < 2 * FAR_R_PX; q++) { const [i0, i1] = farBlockOf(q, b); if (i0 !== next || i1 - i0 < 1) bad.push({ m, q, i0, i1, next }); most = Math.max(most, i1 - i0); next = i1; }
        if (next !== N || most > 4) bad.push({ m, N, next, most });
      }
      assert(!bad.length, JSON.stringify(bad.slice(0, 4)));
    },
  },
  {
    name: 'the window\'s fog and ground at its scale: 24 cells of 0.5 m at 4×, of 2 m at 1× (8 px a cell either way); the KD line\'s 1× ground 12 chunks, within FAR_CHUNKS_MAX',
    fn() {
      const fa = kdFaceAt({ ...FACE, up: 1 }, PPM), gx = fa.x0 + 1, gz = fa.z - fa.cy, b4 = farFogBox(gx, gz, 4), b1 = farFogBox(gx, gz, 1);
      const per = (b, m) => b.cellM * farPpm(m, PPM);
      const lanes = KD_RANGE.kd?.lanes ?? [], sizes = { ...RANGE_KINDS }, n1 = new Set(), n4 = new Set(), each = [];
      for (const L of lanes) {
        const f = kdFaceAt({ x: L.face.x, z: L.face.z, upY: L.face.upY, downY: L.face.downY, paper: 'kdA', up: 1 }, PPM);
        const one = farChunks(f.x0 + 1, f.z - f.cy, farRadiusM(1, PPM), { pieces: RANGE_PIECES, sizes }), four = farChunks(f.x0 + 1, f.z - f.cy, farRadiusM(4, PPM), { pieces: RANGE_PIECES, sizes });
        one.forEach(c => n1.add(c.join())); four.forEach(c => n4.add(c.join())); each.push(one.length);
        assert(four.every(c => one.some(d => d.join() === c.join())), `lane ${L.lane}: the 4× ground within the 1×`);
      }
      console.log(`      the fog's box at 4×: ${b4.nx} cells of ${b4.cellM} m (${b4.nx * b4.cellM} m, ${per(b4, 4)} px a cell); at 1×: of ${b1.cellM} m (${b1.nx * b1.cellM} m, ${per(b1, 1)} px a cell); the window ${fmt(2 * farRadiusM(4, PPM), 1)} and ${fmt(2 * farRadiusM(1, PPM), 1)} m across`);
      console.log(`      the KD's ${lanes.length} faces: their 1× ground ${Math.min(...each)} to ${Math.max(...each)} chunks a face, ${n1.size} for the line (${n4.size} at 4×); FAR_CHUNKS_MAX ${FAR_CHUNKS_MAX}`);
      assert(b4.cellM === FAR_FOG_CELL_M && b1.cellM === 4 * FAR_FOG_CELL_M && per(b4, 4) === per(b1, 1), JSON.stringify({ b4, b1 }));
      assert(b1.nx * b1.cellM >= 2 * farRadiusM(1, PPM) + 2 * b1.cellM && b4.nx * b4.cellM >= 2 * farRadiusM(4, PPM) + 2 * b4.cellM, 'the box covers the window');
      assert(lanes.length === 0 || (n1.size <= FAR_CHUNKS_MAX - 4 && Math.max(...each) <= FAR_CHUNKS_MAX), `${n1.size} chunks`);
    },
  },
  {
    name: 'the window\'s fog, its reticle and the far brackets move with the scale while the lever eases, never a pop (the verifier\'s review of 0.0.8: at night the fog went black, or lit, in one frame); at rest each is the lever\'s own',
    fn() {
      // (light 0.2 at 300 m: the eye's reach 120 m leaves the face dark, the scope's 480 m lights it; the view's fog by
      // far.lens in FAR_LENS_STEPS steps, frame by frame at 60 fps, 4× to 1× and back)
      const fa = kdFaceAt({ ...FACE, up: 1 }, PPM), gx = fa.x0 + 1, gz = fa.z - fa.cy, eye = { x: 1300, z: FACE.z, lightK: 1 }, L = 0.2;
      const mean = (o) => { const v = farFogCells(farFogBox(gx, gz, 1), eye, { vis: () => 0, light: () => L, ...o }); let s = 0; for (const x of v) s += x; return s / v.length; };
      const at1 = mean({ optic: 1 }), at4 = mean({ optic: 4 });
      const run = (t, optic) => {
        const rows = [];
        for (let i = 0; i < 40; i++) {
          t = opticEase(t, optic, 1 / 60, OPTIC_S);
          const m = magOfEase(t), lens = Math.round(farLensK(m) * FAR_LENS_STEPS) / FAR_LENS_STEPS;
          rows.push({ m, fog: mean({ optic, lens }), ret: farReticleK(m), br: farBracketPx(m, FACE_K, PPM), face: FACE_K * farPpm(m, PPM) });
          if (t === (optic >= 4 ? 1 : 0)) break;
        }
        return rows;
      };
      const down = run(1, 1), up = run(0, 4);
      const worst = (rows, start, k) => Math.max(...rows.map((r, i) => Math.abs(r[k] - (i ? rows[i - 1][k] : start[k]))));
      const s4 = { fog: at4, ret: 1, br: 32 }, s1 = { fog: at1, ret: 0, br: 12 };
      const w = { fog: Math.max(worst(down, s4, 'fog'), worst(up, s1, 'fog')), ret: Math.max(worst(down, s4, 'ret'), worst(up, s1, 'ret')), br: Math.max(worst(down, s4, 'br'), worst(up, s1, 'br')) };
      const pick = (rows, k, d) => rows.filter((_, i) => i % 5 === 4 || i === rows.length - 1).map(r => fmt(r[k], d)).join(', ');
      console.log(`      light ${L} at 300 m: the window's cells seen ${fmt(at4, 3)} at 4×, ${fmt(at1, 3)} at 1× (v0.0.7: one frame between them); the lever to 1, every 5th frame: ${pick(down, 'fog', 3)}; back to 4: ${pick(up, 'fog', 3)}`);
      console.log(`      the reticle's weight to 1: ${pick(down, 'ret', 2)}; to 4: ${pick(up, 'ret', 2)} (none under 2×); the brackets to 1: ${pick(down, 'br', 0)} px; to 4: ${pick(up, 'br', 0)} px`);
      console.log(`      the largest frame's step: the fog ${fmt(w.fog, 3)} of the way, the reticle ${fmt(w.ret, 3)}, the brackets ${w.br} px; brackets at rest 32 px at 4× (the kdB 38), 12 at 1× round the 8 px face`);
      assert(at4 === 1 && at1 === 0, `the night's case: ${at4}, ${at1}`);
      assert(down.at(-1).fog === at1 && up.at(-1).fog === at4 && down.at(-1).ret === 0 && up.at(-1).ret === 1, 'the ends the lever\'s own');
      assert(mean({ optic: 4, lens: 1 }) === at4 && mean({ optic: 1, lens: 0 }) === at1, 'at rest the lens changes nothing');
      assert(w.fog <= 0.1 && w.ret <= 0.12 && w.br <= 2, JSON.stringify(w));
      assert(farBracketPx(4, FACE_K, PPM) === 32 && farBracketPx(4, 1.2 * FACE_K, PPM) === 38 && farBracketPx(1, FACE_K, PPM) === 12, 'the brackets at rest');
      assert([...down, ...up].every(r => r.br >= r.face && (r.m >= 2 || r.ret === 0)), 'the brackets never inside the face; no reticle under 2×');
    },
  },
  {
    name: 'a flag\'s sleeve blows the way the wind does and fills a band a 1.5 m/s (1, 3 and 6 m/s from the four quarters and the diagonals): its body and its shadow downwind of the pole, its open mouth toward the camera in a wind from the south; the score disk rises and goes down over DISK_RISE_MS; the spotter sits in its hole; a miss\'s flag waves',
    fn() {
      const pole = { x: 1300, z: 299 }, rows = [];
      for (const v of [1, 3, 6]) for (const deg of [0, 45, 90, 135, 180, -135, -90, -45]) {
        const t = deg * Math.PI / 180, px = sleevePixels({ ...pole, towardRad: t, liftK: Math.min(1, v / FLAG_FULL_MS) }, 0), body = px.filter(p => !p.shadow), shade = px.filter(p => p.shadow);
        const along = (a) => a.reduce((s, p) => s + (p.x - pole.x) * Math.cos(t) + (p.z - pole.z) * Math.sin(t), 0) / a.length;
        // (the open mouth: the hoop's dark inside, seen when the sleeve blows away from the camera)
        const mouth = body.filter(p => p.c === 0x241010).length;
        rows.push({ v, deg, n: px.length, shade: shade.length, body: along(body), ground: along(shade), mouth, flat: shade.every(p => p.flat && p.y < 0.05) });
      }
      for (const v of [1, 3, 6]) console.log(`      ${v} m/s: ${rows.filter(r => r.v === v).map(r => `toward ${r.deg}° ${r.n} px (${r.shade} shadow), body ${fmt(r.body, 2)} m and shadow ${fmt(r.ground, 2)} m downwind${r.mouth ? `, its mouth ${r.mouth} px` : ''}`).join('; ')}`);
      for (const r of rows) {
        assert(r.body > 0.1 && r.ground > 0.05 && r.flat, `downwind: ${JSON.stringify(r)}`);
        assert((r.deg < -30 && r.deg > -150) === (r.mouth > 10), `the mouth seen only blowing away from the camera: ${JSON.stringify(r)}`);
      }
      for (const deg of [0, -90, 90, 180]) {
        const [a, b, c] = [1, 3, 6].map(v => rows.find(r => r.v === v && r.deg === deg).ground);
        assert(a < b && b < c, `the shadow longer with the wind toward ${deg}°: ${a}, ${b}, ${c}`);
      }
      // (the user's case, 2026-11-07: 3 m/s from the right of a shooter facing east, blowing north. In v0.0.7 its sleeve was
      // drawn from the pole's top straight down the picture; now its two full bands stand over the hoop, up the picture)
      const topRow = Math.floor((pole.z - 4.5) * PPM), north = [1, 3, 6].map(v => {
        const rs = sleevePixels({ ...pole, towardRad: -Math.PI / 2, liftK: v / FLAG_FULL_MS }, 0).filter(p => !p.shadow).map(p => Math.floor((p.z - p.y) * PPM) - topRow);
        return { v, over: rs.filter(r => r < -5).length, top: Math.min(...rs), foot: Math.max(...rs) };
      });
      console.log(`      from the right (blowing north): ${north.map(n => `${n.v} m/s ${n.over} px more than 5 px over the pole's top, rows ${n.top} to ${n.foot}`).join('; ')}`);
      assert(north[1].over >= 40 && north[1].top <= -12 && north[1].foot <= 4 && north[2].top < north[1].top && north[0].over < 10, JSON.stringify(north));
      const fa = kdFaceAt({ ...FACE, up: 1 }, PPM), ks = [0, 100, 200, 300, 4100, 4200, 4300].map(t => poleUp(0, t, 4000)), counts = ks.map(k => diskPixels(fa, 4, k, PPM).length);
      const sp = spotterPixels(fa, [-4.1, -7.9], PPM), hole = kdHolePixel(fa, { xCm: -4.1, yCm: -7.9 }, PPM), miss = missFlagPixels(fa, 1, 350, PPM).length;
      console.log(`      the disk up at 0, 100, 200, 300 ms and down at 100, 200, 300 ms after its end: ${ks.map(k => fmt(k, 2)).join(', ')} (${counts.join(', ')} px); the spotter ${sp.length} px round (${fmt(hole.x, 4)}, ${fmt(hole.y, 4)}); a miss's flag ${miss} px`);
      assert(ks[0] === 0 && ks[3] === 1 && ks[1] > 0 && ks[1] < 1 && ks[4] < 1 && ks[6] === 0 && DISK_RISE_MS === 300, `${ks}`);
      // (the spotter 5 × 5 less its corners, a dark rim and the dark hole round an orange ring (the runtime review's of v0.0.7: 5 px read as a dot))
      const centre = sp.find(q => q.x === hole.x && q.y === hole.y), orange = sp.filter(q => q.c !== centre?.c).length;
      assert(sp.length === 21 && centre && orange === 8 && miss > 100, `the spotter and the flag: ${sp.length} px, ${orange} orange`);
    },
  },
];
