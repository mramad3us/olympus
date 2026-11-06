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
import { piece, pieceCount, VIGNETTE_PIECES } from '../src/art/kit/vignette.js';
import { place, KINDS, FOOTPRINTS } from '../src/art/kit/index.js';
import { builder, rotTexel, rotPainter, turn, tex } from '../src/art/kit/kit.js';
import { assert } from './helpers.mjs';
import { CATALOGUE } from '../src/sim/places/fixtures.js';
import { DIAL_PX_MIN, dialPx } from '../src/art/kit/structure.js';

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
const MARGIN_M = { wallLocker: 0.6, rifleRack: 0.1, targetCarrier: 0.9, airlockDoor: 3.2, conduit: 0.05, servingLine: 0.15, gymRack: 0.6, footlocker: 0.05, toiletStall: 0.95, showerStall: 0.05, centrifuge: 0.1, ladderWell: 0.05, sign: 0.6,
  // (a leaf is built from its hinge at the origin, along +x: half its width past the centred footprint; a flood's head leans out of its pole)
  doorLeaf: 0.55, lampPost: 0.12,
  // (a clock's dial is drawn bigger than life where it must read: DIAL_PX_MIN px across, 0.56 m at 16 px/m, its 0.30 m footprint's)
  wallClock: (DIAL_PX_MIN / 16 - 0.30) / 2 + 0.02 };
/** The kinds 0.0.3 added, which places' catalogue (src/sim/places/fixtures.js) must size as the kit does. */
const NEW_0_0_3 = ['wallClock', 'stairs', 'stairsWell', 'lampPost'];

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
  { name: 'the kit sizes every kind places\' catalogue has as the catalogue does (what is drawn is what blocks), the 0.0.3 kinds included', fn() {
    const both = Object.keys(CATALOGUE).filter(k => FOOTPRINTS[k]), off = [], missing = NEW_0_0_3.filter(k => !CATALOGUE[k]);
    for (const k of both) for (const d of ['w', 'd', 'h']) if (Math.abs(CATALOGUE[k][d] - FOOTPRINTS[k][d]) > 1e-9) off.push(`${k}.${d}: catalogue ${CATALOGUE[k][d]}, kit ${FOOTPRINTS[k][d]}`);
    console.log(`      ${both.length} kinds in both, ${off.length} sizes apart${off.length ? `: ${off.join('; ')}` : ''}; the 0.0.3 kinds ${NEW_0_0_3.map(k => `${k} ${FOOTPRINTS[k].w} × ${FOOTPRINTS[k].d} × ${FOOTPRINTS[k].h} m`).join(', ')}${missing.length ? `; not yet in the catalogue: ${missing.join(', ')}` : ''}`);
    assert(!off.length, off.join('\n'));
    assert(!missing.length, `places' catalogue lacks ${missing.join(', ')} (the build sheet's §2.1)`);
  } },
  { name: 'the new kinds paint within their footprints: a clock reports its dials, a flight its treads, a well its rail, a lamp post its glowing lens', fn() {
    const lines = [];
    for (const ppm of [16, 24]) {
      const a = recordingArea(ppm), r = place(a, { kind: 'wallClock', make: 'school', x: 5, z: 0.32, y: 2.15, face: 'down', faces: ['melas'] });
      assert(r.dials?.length === 1 && r.dials[0].which === 'front', `a wall clock reports ${JSON.stringify(r.dials)}`);
      const d = r.dials[0].box;
      // (DIAL_PX_MIN pixels across at least, odd, square, its middle within a pixel of the life-size dial's, 2.30 m)
      assert(d.wPx >= DIAL_PX_MIN && d.wPx === dialPx(ppm) && d.wPx % 2 === 1 && d.wPx === d.hPx && Math.abs((d.y0 + d.y1) / 2 - 2.3) <= 1 / ppm, `the dial ${JSON.stringify(d)}`);
      lines.push(`the wall clock's dial at ${ppm} px/m: ${d.wPx} × ${d.hPx} px (${(d.wPx / ppm).toFixed(3)} m across, its middle at ${((d.y0 + d.y1) / 2).toFixed(3)} m)`);
      const two = place(recordingArea(ppm), { kind: 'wallClock', make: 'station', x: 5, z: 5, y: 1.12, face: 'down', faces: ['melas', 'utc'] });
      assert(two.dials?.map(x => x.which).join() === 'front,back', 'a two-faced clock has a front and a back dial');
      const st = recordingArea(ppm); place(st, { kind: 'stairs', make: 'concrete', x: 82, z: 12, face: 'up', dir: 'up' });
      assert(st.grounds.length === 2 && st.boxes.length >= 6, `a flight: ${st.grounds.length} grounds (its treads and its mark), ${st.boxes.length} boxes`);
      const w = recordingArea(ppm); place(w, { kind: 'stairsWell', make: 'rail', x: 82, z: 12, face: 'up', dir: 'down' });
      const lp = recordingArea(ppm); place(lp, { kind: 'lampPost', make: 'sodium', x: 530, z: 220 });
      const tall = Math.max(...lp.boxes.map(({ b }) => b.y1));
      assert(tall > 3.8 && tall <= 4.05, `the lamp post stands ${tall} m`);
      lines.push(`${ppm} px/m: the dial ${d.wPx} × ${d.hPx} px at ${d.y0.toFixed(3)} to ${d.y1.toFixed(3)} m; the flight ${st.boxes.length} boxes of rail; the well ${w.boxes.length} boxes; the lamp post ${lp.boxes.length} boxes, ${tall.toFixed(2)} m`);
    }
    for (const l of lines) console.log(`      ${l}`);
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
  { name: 'the splash\'s vignette pieces (the build sheet 0.0.4 §2.3 (b), src/art/kit/vignette.js) paint within their size at both densities, every frame of an animation different, mist and lamps as marked', fn() {
    const rows = [];
    for (const ppm of [16, 24]) for (const [name, def] of Object.entries(VIGNETTE_PIECES)) {
      const frames = Array.from({ length: def.frames }, (_, f) => piece(name, { frame: f, on: f % 2 ? 0 : 1, density: 1, seed: 3 }, ppm));
      for (const pm of frames) {
        assert(pm.w === Math.max(1, Math.round(def.wM * ppm)) && pm.h === Math.max(1, Math.round(def.hM * ppm)), `${name}@${ppm}: ${pm.w} × ${pm.h}`);
        let n = 0; for (const v of pm.data) if ((v >>> 24) >= 128) n++;
        assert(n > 0, `${name}@${ppm} drew nothing`);
        assert(pm.mist === def.mist, `${name}: mist`);
      }
      const sigs = new Set(frames.map(pm => pm.data.join()));
      if (def.frames > 1) assert(sigs.size === def.frames, `${name}@${ppm}: ${sigs.size} of ${def.frames} frames differ`);
      if (ppm === 16) rows.push(`${name} ${frames[0].w}×${frames[0].h}${def.frames > 1 ? ` ×${def.frames}` : ''}`);
    }
    const lit = piece('timer', { on: 1 }, 16), glow = [...lit.data].filter(v => (v >>> 24) >= 248 && (v >>> 24) < 255).length;
    const steam = [0, 1, 2].map(d => { const pm = piece('steam', { frame: 0, density: d, seed: 3 }, 16); let n = 0; for (const v of pm.data) if ((v >>> 24) >= 128) n++; return n; });
    console.log(`      at 16 px/m: ${rows.join(', ')}; the timer lit has ${glow} glowing pixels; the steam's pixels by density (rising, running, thinning): ${steam.join(', ')}; ${pieceCount()} paintings kept`);
    assert(glow > 0, 'the timer glows');
    assert(steam[1] > steam[0] && steam[0] > steam[2], 'the steam thickest while the water runs');
  } },
  { name: 'the KD range\'s pieces (0.0.5, src/art/kit/range.js) stand as the sheet builds them: the tower\'s deck at 6.0 m and its top at 9 m with the flag\'s pole to 11.5, the frame\'s backer 1.0 × 1.2 m, the berm in four steps to 3 m, the fence 2.4 m and the rope at 0.85 m, the line\'s flag pole 3.6 m', fn() {
    const lines = [];
    for (const ppm of [16, 24]) {
      const top = (kind, make, extra = {}) => { const a = recordingArea(ppm); place(a, { kind, make, x: 1000, z: 300, face: extra.face ?? 'down', seed: 3, look: extra.look ?? {}, ...(extra.w ? { w: extra.w } : {}), ...(extra.d ? { d: extra.d } : {}) }); return { boxes: a.boxes.map(({ b }) => b), grounds: a.grounds.length }; };
      const tower = top('kdTower', 'open', { look: { flag: [1.5, -1.5] } }), cab = top('kdTower', 'cab');
      const deck = tower.boxes.find(b => Math.abs(b.y1 - 6.0) < 1 / ppm && b.x1 - b.x0 > 3.9), towerTop = Math.max(...tower.boxes.filter(b => b.x1 - b.x0 > 0.2).map(b => b.y1)), pole = Math.max(...tower.boxes.map(b => b.y1));
      const frame = top('kdFrame', 'card25'), backer = frame.boxes.find(b => Math.abs(b.x1 - b.x0 - 1.0) < 1 / ppm);
      const berm = top('berm', 'earth', { face: 'left', w: 19.5, d: 6 }), steps = berm.boxes.map(b => b.y1).sort((a, b) => a - b);
      const fence = top('rangeFence', 'mesh', { w: 50 }), rope = top('rangeFence', 'rope', { w: 41 }), flag = top('rangeSign', 'flagpole'), mat = top('kdMat', 'canvas', { face: 'right' });
      lines.push(`${ppm} px/m: the tower ${tower.boxes.length} boxes, its deck at ${deck ? deck.y1 : '?'} m, its top ${towerTop} m, its flag's pole to ${pole} m (the cab make ${cab.boxes.length} boxes); the backer ${backer ? `${backer.x1 - backer.x0} × ${backer.y1 - backer.y0}` : '?'} m; the berm's steps ${steps.join(', ')} m; the fence ${Math.max(...fence.boxes.map(b => b.y1))} m, ${fence.boxes.length} boxes; the rope ${Math.max(...rope.boxes.map(b => b.y1))} m; the line's pole ${Math.max(...flag.boxes.map(b => b.y1))} m; a mat ${mat.grounds} flat piece`);
      assert(deck && Math.abs(towerTop - 9.0) < 1 / ppm && Math.abs(pole - 11.5) < 1 / ppm, `${ppm}: the tower`);
      assert(backer && Math.abs(backer.y1 - 1.2) < 1 / ppm && backer.y0 === 0, `${ppm}: the backer`);
      assert(steps.length === 4 && steps.every((y, i) => Math.abs(y - 0.75 * (i + 1)) < 1 / ppm), `${ppm}: the berm's steps ${steps}`);
      assert(Math.abs(Math.max(...fence.boxes.map(b => b.y1)) - 2.5) < 0.11 && Math.abs(Math.max(...rope.boxes.map(b => b.y1)) - 0.95) < 0.11 && Math.abs(Math.max(...flag.boxes.map(b => b.y1)) - 3.6) < 1 / ppm && mat.grounds === 1, `${ppm}: the fence, the rope, the pole, the mat`);
    }
    for (const l of lines) console.log(`      ${l}`);
  } },
];
