// OLYMPUS stage sample: the stage's checks, in the browser (what node cannot test: the GPU).
//
//   - the GPU-baked palette lookup against its CPU twin (src/art/palette.js bakeLut), texel by texel;
//   - the light's calibration: a front face lit by the day mood shows exactly its painted colour
//     (tradecraft PIPELINE 2026-10-25, "what is painted is what shows"): one box per palette colour,
//     painted (atlas) and flat (vertex colour), the centre pixel of each front read back, under the
//     post pass's two encodings (tradecraft's pow(1/2.2) and the exact sRGB curve);
//   - the part IDs written in the same pass (WebGL2 MRT): read back from the second attachment at
//     each box's front, against the part the batch gave it;
//   - uploads in steady frames: texImage2D / texSubImage2D bytes over 60 frames after the first
//     (tradecraft's Windows lesson: count what goes to the GPU), expected 0;
//   - a bench: 200 frames forced to finish, the snap by the lookup, by tradecraft's loop, and none.
// Query: ?ppm=16|24, palette=. Results in window.__report; window.__ready when done.
import { createStage } from '../../src/render/stage.js';
import { createArea } from '../../src/render/batch.js';
import { PALETTES, bakeLut, LUT_CANDIDATES } from '../../src/art/palette.js';
import { paint } from '../../src/art/paint.js';
import { oklch } from '../../src/art/tone.js';
import { PX_PER_M, RES } from '../../src/render/scale.js';

const q = new URLSearchParams(location.search), palName = q.get('palette') ?? 'tradecraft', pal = PALETTES[palName];
const report = { ppm: PX_PER_M, palette: palName, colours: pal.length };
window.__report = report;

// (uploads counted from here on, by wrapping the context's calls)
const counts = { texImage2D: 0, texSubImage2D: 0, bytes: 0, counting: false };
const proto = WebGL2RenderingContext.prototype;
for (const f of ['texImage2D', 'texSubImage2D', 'texStorage2D']) {
  const orig = proto[f];
  proto[f] = function (...a) {
    // (texImage2D(target, level, internalformat, width, height, …), texSubImage2D(target, level, x, y, width, height, …): RGBA8 bytes)
    if (counts.counting) { counts[f] = (counts[f] ?? 0) + 1; counts.bytes += f === 'texImage2D' ? a[3] * a[4] * 4 || 0 : f === 'texSubImage2D' ? a[4] * a[5] * 4 || 0 : 0; }
    return orig.apply(this, a);
  };
}

const stage = createStage({ palette: pal, mood: 'day', autoFit: false });
stage.size(RES[0], RES[1]);
document.body.style.background = '#000';

// One box per palette colour: odd ones painted (their front a painting in the atlas), even ones flat.
const area = createArea({ name: 'calibration' });
const cols = 16, boxes = [];
pal.forEach((c, i) => {
  const x = (i % cols) * 1.1 - cols * 0.55, z = Math.floor(i / cols) * 1.0 - 3;
  const front = i % 2 ? paint(Math.round(0.8 * PX_PER_M), Math.round(0.6 * PX_PER_M), (px, w, h) => px(0, 0, w, h, c)) : c;
  boxes.push({ c, painted: i % 2 === 1, b: area.box({ x, z, w: 0.8, d: 0.3, h: 0.6, faces: { front, top: 0x6e7582, sides: 0x3e424d } }) });
});
area.ground({ x0: -12, z0: -6, x1: 12, z1: 8, y: -0.1, color: 0x282b34 });
area.buildNow();
area.upload(stage.renderer);
stage.setArea(area);
stage.look(0, 0.4);
stage.render();

const picture = () => { stage.render(); return stage.readPicture(); };
const pixelOf = (buf, x, y) => { const p = ((stage.H - 1 - y) * stage.W + x) * 4; return (buf[p] << 16) | (buf[p + 1] << 8) | buf[p + 2]; };
const hx = (v) => '#' + v.toString(16).padStart(6, '0');

// Calibration: both encodings, with tradecraft's warm grade (grade 1, the fine look) and without (grade 0):
// exact (the same palette colour) and in lightness (the colour it became within 0.05 OKLCH L of the painted).
for (const grade of [1, 0]) for (const g of ['2.2', 'srgb']) {
  stage.setGamma(g); stage.post.U.grade.value = grade;
  const buf = picture();
  let same = 0, sameP = 0, sameF = 0, sameL = 0; const off = [];
  for (const { c, b, painted } of boxes) {
    const [px, py] = stage.cam.project((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.z1);
    const got = pixelOf(buf, Math.floor(px), Math.floor(py));
    if (Math.abs(oklch(got)[0] - oklch(c)[0]) <= 0.05) sameL++;
    if (got === c) { same++; if (painted) sameP++; else sameF++; } else if (off.length < 8) off.push(`${hx(c)}→${hx(got)}`);
  }
  report[`calibration_grade${grade}_${g}`] = { exact: same, of: boxes.length, painted: sameP, flat: sameF, lightnessWithin005: sameL, firstMisses: off };
}
stage.setGamma('2.2'); stage.post.U.grade.value = 1;

// The lookup: GPU against CPU.
{
  const { w, h } = { w: stage.post.rtLut.width, h: stage.post.rtLut.height }, gpu = new Uint8Array(w * h * 4);
  stage.renderer.readRenderTargetPixels(stage.post.rtLut, 0, 0, w, h, gpu);
  const t0 = performance.now(), cpu = bakeLut(pal), ms = performance.now() - t0;
  let first = 0, all = 0, cells = w * h;
  for (let i = 0; i < cells; i++) {
    if (gpu[i * 4] === cpu.data[i * 4]) first++;
    let ok = true; for (let j = 0; j < LUT_CANDIDATES; j++) if (gpu[i * 4 + j] !== cpu.data[i * 4 + j]) ok = false;
    if (ok) all++;
  }
  report.lut = { cells, sameNearest: first, sameAllFour: all, cpuBakeMs: +ms.toFixed(0) };
}

// The part IDs: the second attachment at each box's front.
{
  stage.post.U.outline.value = 1; stage.render();
  let ok = 0; const one = new Uint8Array(4), miss = [];
  for (const { b } of boxes) {
    const [px, py] = stage.cam.project((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.z1);
    stage.renderer.readRenderTargetPixels(stage.post.rt, Math.floor(px), stage.H - 1 - Math.floor(py), 1, 1, one, undefined, 1);
    const id = one[0] | (one[1] << 8) | (one[2] << 16);
    if (id === b.part && one[3] === 255) ok++; else if (miss.length < 5) miss.push(`${b.part}≠${id}/${one[3]}`);
  }
  report.partIds = { exact: ok, of: boxes.length, misses: miss };
}

// The budgeted upload: the same area built again and sent in 16 KB bands, a call a frame; the picture must come out the same.
{
  const before = picture();
  const again = createArea({ name: 'calibration-again' });
  pal.forEach((c, i) => {
    const x = (i % cols) * 1.1 - cols * 0.55, z = Math.floor(i / cols) * 1.0 - 3;
    const front = i % 2 ? paint(Math.round(0.8 * PX_PER_M), Math.round(0.6 * PX_PER_M), (px, w, h) => px(0, 0, w, h, c)) : c;
    again.box({ x, z, w: 0.8, d: 0.3, h: 0.6, part: boxes[i].b.part, faces: { front, top: 0x6e7582, sides: 0x3e424d } });
  });
  again.ground({ x0: -12, z0: -6, x1: 12, z1: 8, y: -0.1, color: 0x282b34 });
  again.buildNow();
  let calls = 0;
  counts.counting = true; counts.bytes = 0; counts.texSubImage2D = 0;
  while (!again.upload(stage.renderer, 16 * 1024)) calls++;
  calls++;
  counts.counting = false;
  stage.setArea(again);
  const after = picture();
  let diff = 0; for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) diff++;
  report.budgetedUpload = { calls, atlasBytes: again.stats.atlasBytes, subImageCalls: counts.texSubImage2D, bytesSent: counts.bytes, maxBytesPerCall: 16 * 1024, pictureBytesDiffering: diff };
  stage.setArea(area); again.dispose();
}

// Uploads in steady frames.
for (let i = 0; i < 5; i++) stage.render();
Object.assign(counts, { texImage2D: 0, texSubImage2D: 0, texStorage2D: 0, bytes: 0, counting: true });
for (let i = 0; i < 60; i++) stage.render();
counts.counting = false;
report.steadyUploads = { calls: (counts.texImage2D ?? 0) + (counts.texSubImage2D ?? 0), bytes: counts.bytes };

// The bench.
{
  const gl = stage.renderer.getContext(), px = new Uint8Array(4), out = {};
  for (const s of ['lut', 'loop', 'off']) {
    stage.setSnap(s); stage.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const t0 = performance.now();
    for (let i = 0; i < 200; i++) stage.render();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out[s] = +((performance.now() - t0) / 200).toFixed(3);
  }
  stage.setSnap('lut');
  report.benchMsPerFrame = out;
  report.drawCalls = { ...stage.stats.calls }; report.programs = stage.stats.programs; report.gpu = stage.stats.gpu;
}
stage.render();
window.__ready = true;
