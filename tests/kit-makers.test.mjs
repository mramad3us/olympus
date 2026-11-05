// OLYMPUS tests: the kit (src/art/kit/). The builder's turns, and every kind in every make at both densities.
//
// The kit builds into an area through box(), ground(), lamp(), glowLine() and part() alone, so these
// run in node against a recording area (no GPU): each piece is placed, each face it asks for is painted
// at its size as the batch would paint it (src/render/batch.js resolve), and what comes out is checked:
// the edges on the pixel grid, the piece inside its footprint (turned with it), its paintings the same
// every time (cosmetic choices by hash), the turn handing each face to the face it becomes and a top's
// painting turned with the piece. Numbers printed: boxes per piece, paintings, painting time.
import { snapBox, faceTexels, FACES } from '../src/render/batch-math.js';
import { paint, unword } from '../src/art/paint.js';
import { hash3 } from '../src/art/tone.js';
import { place, KINDS, FOOTPRINTS } from '../src/art/kit/index.js';
import { builder, rotTexel, rotPainter, turn, tex } from '../src/art/kit/kit.js';
import { assert } from './helpers.mjs';

let partN = 1;
/** An area that records what goes into it (the batch's interface, no GPU). */
export function recordingArea(ppm) {
  const boxes = [], grounds = [], lamps = [], lines = [];
  return {
    ppm, boxes, grounds, lamps, lines, part: () => partN++,
    box(s) { const b = snapBox(s, ppm); boxes.push({ b, s }); return b; },
    ground(g) { grounds.push(g); return g; }, lamp(l) { lamps.push(l); return l; }, glowLine(g) { lines.push(g); },
  };
}
/** Paint every face a recorded area asks for, at its size; returns { paintings, pixels, hash }. */
export function paintAll(area) {
  const ppm = area.ppm, seen = new Map();
  let paintings = 0, pixels = 0, h = 0;
  const one = (f, w, hh) => {
    if (f === undefined || f === null || typeof f === 'number' || f.data) return;
    const fn = typeof f === 'function' ? f : f.paint;
    if (!fn) return;
    let m = seen.get(fn); if (!m) seen.set(fn, m = new Map());
    const k = `${w}x${hh}`;
    if (!m.has(k)) {
      const pm = paint(w, hh, (px, ww, h2) => fn(px, ww, h2, ppm));
      let ph = 7;
      for (let i = 0; i < pm.data.length; i += 3) ph = hash3(ph, pm.data[i]);
      m.set(k, ph); paintings++; pixels += w * hh;
    }
    h = hash3(h, m.get(k));
  };
  for (const { b, s } of area.boxes) for (const f of FACES) { if (s.only && !s.only.includes(f)) continue; if (s.omit?.includes(f)) continue; const [w, hh] = faceTexels(f, b); one(s.faces?.[f], w, hh); }
  for (const g of area.grounds) { if (!g.top || g.top.data) continue; const b = snapBox({ x0: g.x0, x1: g.x1, z0: g.z0, z1: g.z1, y0: -1, y1: 0 }, ppm); one(g.top, b.wPx, b.dPx); }
  return { paintings, pixels, hash: h >>> 0 };
}
const LOOKS = [{}, { made: false, open: true, end: true, occupied: true, door: 'open', curtain: 'half', sleeper: true }, { made: true, open: false, state: 'cycling' }];
// (pieces that stretch or stand out of their footprint on purpose: a door swung open, a curtain rod, the target's track, a duct's run)
const MARGIN_M = { wallLocker: 0.6, rifleRack: 0.1, targetCarrier: 0.9, airlockDoor: 3.2, conduit: 0.05, servingLine: 0.15, gymRack: 0.6, footlocker: 0.05, toiletStall: 0.95, showerStall: 0.05, centrifuge: 0.1, ladderWell: 0.05, sign: 0.6 };

export default [
  { name: 'a turn moves boxes round the piece and hands each face to the one it becomes', fn() {
    // (a box at the piece's front, in front: turned right it is at +x, up at −z, left at −x)
    const want = { down: [0, 1], right: [1, 0], up: [0, -1], left: [-1, 0] };
    for (const [face, [ex, ez]] of Object.entries(want)) {
      const a = recordingArea(16), k = builder(a, { x: 5, z: 5, face });
      k.box({ x: 0, z: 0.75, w: 0.5, d: 0.5, h: 1, faces: { front: 0xff0000, back: 0x00ff00, left: 0x0000ff, right: 0xffff00 } });
      const { b, s } = a.boxes[0], cx = (b.x0 + b.x1) / 2 - 5, cz = (b.z0 + b.z1) / 2 - 5;
      assert(Math.abs(cx - ex * 0.75) < 0.07 && Math.abs(cz - ez * 0.75) < 0.07, `${face}: centre ${cx}, ${cz}`);
      // (the piece's front face goes to the world face its front points at)
      const worldFront = { down: 'front', right: 'right', up: 'back', left: 'left' }[face];
      assert(s.faces[worldFront] === 0xff0000, `${face}: its front painting went to ${Object.keys(s.faces).find(f => s.faces[f] === 0xff0000)}`);
    }
    console.log('      four facings: the box in front of the piece lands at +z, +x, −z, −x, its front painting on the world face it points at');
  } },
  { name: 'a top painting turns with the piece, texel for texel', fn() {
    // (an arrow pointing to the piece's front, painted 6 × 10: turned, the world painting is the same arrow turned)
    const draw = (px, w, h) => { px(0, 0, w, h, 0x101010); px(Math.floor(w / 2), 0, 1, h, 0xffffff); px(0, h - 1, w, 1, 0xff0000); };
    const fn = tex('test-arrow', draw);
    const local = paint(6, 10, (px, w, h) => draw(px, w, h, 16));
    for (const q of [1, 2, 3]) {
      const W = q % 2 ? 10 : 6, H = q % 2 ? 6 : 10, world = paint(W, H, (px, w, h) => rotPainter(fn, q)(px, w, h, 16));
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const [li, lj] = rotTexel(i, j, q, 6, 10);
        assert(world.data[j * W + i] === local.data[lj * 6 + li], `q ${q}: texel ${i},${j} is not local ${li},${lj}`);
      }
      // (the red row, the piece's front edge, is where the front went: +x for q 1, −z (row 0) for q 2, −x for q 3)
      const red = (i, j) => unword(world.data[j * W + i]).hex === 0xff0000;
      const where = q === 1 ? red(W - 1, 2) : q === 2 ? red(2, 0) : red(0, 2);
      assert(where, `q ${q}: the front edge is not where the piece faces`);
      void turn;
    }
    console.log('      tops turned 90°, 180°, 270°: every texel from its rotated source; the front edge lands on the side the piece faces');
  } },
  { name: 'every kind in every make builds at 16 and 24 px/m, on the grid, inside its footprint, the same every time', fn() {
    const lines = [];
    for (const ppm of [16, 24]) {
      const t0 = performance.now();
      let pieces = 0, boxes = 0, paintings = 0, pixels = 0;
      for (const kind of KINDS) for (const make of FOOTPRINTS[kind].makes) for (const face of ['down', 'right', 'up', 'left']) for (const [li, look] of LOOKS.entries()) {
        const a = recordingArea(ppm), fp = FOOTPRINTS[kind];
        place(a, { kind, make, face, look, seed: 3 + li, x: 10, z: 10, y: 0 });
        assert(a.boxes.length + a.grounds.length > 0, `${kind}/${make}: nothing built`);
        const m = (MARGIN_M[kind] ?? 0.02) + 1 / ppm, q = { down: 0, right: 1, up: 2, left: 3 }[face];
        const hw = (q % 2 ? fp.d : fp.w) / 2 + m, hd = (q % 2 ? fp.w : fp.d) / 2 + m;
        for (const { b } of a.boxes) {
          for (const v of [b.x0, b.x1, b.y0, b.y1, b.z0, b.z1]) assert(Math.abs(v * ppm - Math.round(v * ppm)) < 1e-6, `${kind}/${make}: an edge off the grid`);
          assert(b.x0 >= 10 - hw - 1e-6 && b.x1 <= 10 + hw + 1e-6 && b.z0 >= 10 - hd - 1e-6 && b.z1 <= 10 + hd + 1e-6, `${kind}/${make}/${face}: a box outside its footprint: ${JSON.stringify([b.x0 - 10, b.x1 - 10, b.z0 - 10, b.z1 - 10])} vs ±${hw.toFixed(2)}, ±${hd.toFixed(2)}`);
        }
        const p1 = paintAll(a);
        if (face === 'down' && li === 1) {
          const b2 = recordingArea(ppm); place(b2, { kind, make, face, look, seed: 4, x: 10, z: 10 });
          assert(paintAll(b2).hash === p1.hash, `${kind}/${make}: painted differently the second time`);
        }
        pieces++; boxes += a.boxes.length; paintings += p1.paintings; pixels += p1.pixels;
      }
      lines.push(`${ppm} px/m: ${pieces} pieces (${KINDS.length} kinds, ${KINDS.reduce((n, k) => n + FOOTPRINTS[k].makes.length, 0)} makes × 4 facings × 3 looks), ${boxes} boxes (${(boxes / pieces).toFixed(1)} a piece), ${paintings} paintings of ${(pixels / 1e6).toFixed(2)} Mpx, ${(performance.now() - t0).toFixed(0)} ms`);
    }
    for (const l of lines) console.log(`      ${l}`);
  } },
  { name: 'at least two makes of every kind where variety matters, three for the bay\'s', fn() {
    const few = KINDS.filter(k => FOOTPRINTS[k].makes.length < 2);
    assert(few.length === 0, `kinds with one make: ${few.join(', ')}`);
    for (const k of ['rack2', 'wallLocker', 'footlocker', 'rifleRack', 'dutyDesk', 'messTable', 'showerStall', 'toiletStall', 'sinkRow', 'crashCouch', 'suitLocker', 'airlockDoor', 'pressureDoor', 'hatch']) assert(FOOTPRINTS[k].makes.length >= 3, `${k}: ${FOOTPRINTS[k].makes.length} makes`);
    console.log(`      ${KINDS.length} kinds, ${KINDS.reduce((n, k) => n + FOOTPRINTS[k].makes.length, 0)} makes: ${KINDS.map(k => `${k} ${FOOTPRINTS[k].makes.length}`).join(', ')}`);
  } },
  { name: 'a rack is built as it stands: the lower bunk under the upper with the gap the camera sees into', fn() {
    const a = recordingArea(24);
    place(a, { kind: 'rack2', make: 'steel', x: 0, z: 0, seed: 2, look: { made: true, boots: true } });
    const tops = a.boxes.filter(({ s }) => typeof s.faces?.top === 'function' && s.faces.top.key?.startsWith('bedding')).map(({ b }) => b);
    assert(tops.length === 2, `${tops.length} mattresses`);
    const gap = tops[1].y0 - tops[0].y1;
    assert(gap > 0.7 && gap < 0.95, `the gap between the bunks is ${gap.toFixed(2)} m`);
    const bootsN = a.boxes.filter(({ b }) => b.y1 <= 0.21).length;
    console.log(`      lower mattress top at ${tops[0].y1.toFixed(2)} m, upper deck at ${tops[1].y0.toFixed(2)} m: a gap of ${gap.toFixed(2)} m (the camera at 45° sees that far under it); ${a.boxes.length} boxes, ${bootsN} low ones (boots, a drawer)`);
  } },
];
