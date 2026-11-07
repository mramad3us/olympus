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
//   - the KD's moving things: a flag's sleeve blows the way flagOf says (its tail along the wind's way on the picture,
//     drooping as the wind drops: at 1, 4 and 8 m/s through the range role's FLAG_FULL_MS 8), the score disk rises on
//     its pole and goes down again over DISK_RISE_MS (never a pop), the spotter sits in its hole, the miss's flag waves.
import { assert, fmt } from './helpers.mjs';
import { FAR_R_PX, FAR_DISSOLVE_S, FAR_FOG_N, FAR_FOG_CELL_M, FAR_LOAD_M, farFieldPx, farFogBox, farFogCells, farReachM, dissolveStep, farPixelOf, pictOfCss, farChunks, CHUNK_M } from '../src/render/far.js';
import { kdFaceAt, kdHolePixel, FACE_UP_Y, FACE_DOWN_Y, sleevePixels, diskPixels, spotterPixels, missFlagPixels, poleUp, DISK_RISE_MS, SLEEVE_M } from '../src/render/range-items.js';
import { FACE_K, facePx } from '../src/art/kit/range.js';
import { KD_RANGE, RANGE_PIECES, RANGE_KINDS } from '../src/data/places/range.js';

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
    name: 'a flag\'s sleeve blows the way the wind does and stands out with its strength (1, 4 and 8 m/s); the score disk rises and goes down over DISK_RISE_MS; the spotter sits in its hole; a miss\'s flag waves',
    fn() {
      const pole = { x: 1300, z: 299 }, rows = [], FULL = 8;
      for (const [ms, deg] of [[1, 0], [4, 0], [8, 0], [8, 90], [8, 180], [8, -90], [4, 45]]) {
        const t = deg * Math.PI / 180, lift = Math.min(1, ms / FULL), px = sleevePixels({ ...pole, towardRad: t, liftK: lift }, 0);
        // (the tail: the pixel farthest from the pole's top on the picture; its direction against the wind's on the picture)
        const top = [pole.x * 16, (pole.z - SLEEVE_M.poleTop) * 16];
        let far = null, d = -1;
        for (const p of px) { const q = [p.x * 16 - top[0], (p.z - p.y) * 16 - top[1]], e = Math.hypot(...q); if (e > d) { d = e; far = q; } }
        const droop = (1 - lift) * 80 * Math.PI / 180, want = [Math.cos(t) * Math.cos(droop), Math.sin(t) * Math.cos(droop) + Math.sin(droop)];
        const cos = (far[0] * want[0] + far[1] * want[1]) / (Math.hypot(...far) * Math.hypot(...want) || 1);
        rows.push({ ms, deg, n: px.length, len: d, cos });
      }
      console.log(`      ${rows.map(r => `${r.ms} m/s toward ${r.deg}°: ${r.n} px, its tail ${fmt(r.len, 1)} px out, along the wind ${fmt(r.cos, 3)}`).join('; ')}`);
      for (const r of rows) assert(r.cos > 0.9, JSON.stringify(r));
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
