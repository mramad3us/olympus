// OLYMPUS art: the valley floor, painted a chunk at a time. Regolith, dust lying, tracks and paths.
//
// tradecraft painted a street's ground as one texture per 45 m section, every slab and crack drawn, its
// patterns pinned to world coordinates so sections joined (src/art/pixeltown.js streetSteps, cell()).
// OLYMPUS's outdoor areas are chunks of ground (DESIGN.md, Areas: "outdoor chunks stream around you";
// PLACES §2.4), and each chunk's ground is one painting `chunkM` square at the stage's density, painted
// by the regolith material (src/art/materials/surfaces.js regolith) in world pixels, so two chunks
// painted apart meet without a seam, and laid as a flat piece on the floor of the area (one quad, one
// atlas region: a 12 m chunk is 192² px at 16 px/m, 288² at 24).
//
// On the regolith, in the chunk's own painting (so they cost no quads):
//   - dust lying (PLACES §3.13: dustLevel; VIEWS §2.8: "dust lying ... the snow-cover shader with regolith"):
//     pale dust where the noise passes the cover, thicker in drifts (drifts.js lays the mounded ones);
//   - tracks: a rover's two wheel tracks along a polyline, each a band of tread marks pressed darker into
//     the dust, their edges lifted (tradecraft's wheel tracks in snow, 2026-11-04, the same idea);
//   - boot prints along a path, a pair every 0.75 m, fading with age;
// and as pieces of their own, lifted off the ground: sinter-slab paths (PLACES §4.1: "Paths of sintered
// regolith slabs join every door to a road") and pads.
// Pure.
import { paint } from '../paint.js';
import { tone, hash3, mixHex } from '../tone.js';
import { regolith, concrete, field } from '../materials/surfaces.js';

/** The valley floor's colours (the Mars place set's regolith ochre and dust rose, VIEWS §2.6). */
export const GROUND = Object.freeze({ regolith: 0xa65e4b, dust: 0xc18064, basalt: 0x6e5256, track: 0x8f5a48, slab: 0xa78c77 });

/** Distance from (x, y) to the segment a–b, and where along it (0..1). */
function segDist(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
  return [Math.hypot(x - ax - t * dx, y - ay - t * dy), t, Math.sqrt(L2)];
}

/**
 * A chunk's painting: the ground over x0..x0 + sizeM, z0..z0 + sizeM (metres) at ppm. o: { seed, c,
 * dust (0..1.5 lying cover), tracks: [{ pts: [[x, z], …], gaugeM, widthM }], prints: [{ pts, age }] }.
 */
export function groundChunk(x0, z0, sizeM, o = {}) {
  const ppm = o.ppm ?? 16, n = Math.max(2, Math.round(sizeM * ppm));
  return paint(n, n, (px) => paintGround(px, n, n, x0, z0, o), { key: `ground:${x0}:${z0}:${sizeM}:${ppm}:${o.seed ?? 7}` });
}

/** The ground over w × h pixels from (x0, z0) metres, painted with px() (see groundChunk; the batch can call it as a face's painter). */
export function paintGround(px, w, h, x0, z0, o = {}) {
  const { ppm = 16, seed = 7, c = GROUND.regolith, dust = 0.45, tracks = [], prints = [], ripples = 0.5 } = o;
  const wx = Math.round(x0 * ppm), wy = Math.round(z0 * ppm), nW = w, nH = h, n = Math.max(w, h);
  {
    regolith(px, 0, 0, nW, nH, { c, ppm, seed, wx, wy, dust, ripples, dustC: GROUND.dust, basalt: GROUND.basalt });
    // (tracks: for each wheel, a band of the track's colour with tread marks across it every 0.12 m, its edges lifted)
    for (const t of tracks) {
      const g = (t.gaugeM ?? 1.9) / 2, w = (t.widthM ?? 0.4) / 2;
      for (let s = 0; s + 1 < t.pts.length; s++) {
        const [ax, az] = t.pts[s], [bx, bz] = t.pts[s + 1], L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L, nz = (bx - ax) / L;
        for (const side of [-1, 1]) {
          const cax = ax + nx * g * side, caz = az + nz * g * side, cbx = bx + nx * g * side, cbz = bz + nz * g * side;
          const i0 = Math.floor((Math.min(cax, cbx) - w - 0.1 - x0) * ppm), i1 = Math.ceil((Math.max(cax, cbx) + w + 0.1 - x0) * ppm);
          const j0 = Math.floor((Math.min(caz, cbz) - w - 0.1 - z0) * ppm), j1 = Math.ceil((Math.max(caz, cbz) + w + 0.1 - z0) * ppm);
          for (let j = Math.max(0, j0); j < Math.min(nH, j1); j++) for (let i = Math.max(0, i0); i < Math.min(nW, i1); i++) {
            const X = x0 + (i + 0.5) / ppm, Z = z0 + (j + 0.5) / ppm, [d, tt, len] = segDist(X, Z, cax, caz, cbx, cbz);
            if (d > w + 1 / ppm) continue;
            const along = tt * len, tread = Math.floor(along / 0.12) % 2 === 0, faded = hash3(i + wx, j + wy, seed) % 5 === 0;
            if (d > w) { if (hash3(i, j, seed + 1) % 3) px(i, j, 1, 1, tone(GROUND.dust, 0.02)); continue; }   // (the lifted edge, broken)
            // (the tread pressed into the dust: the ground's own colour a step down, the lugs a step further, worn through in places)
            if (faded || (d > w * 0.75 && hash3(i, j, seed + 2) % 2)) continue;
            px(i, j, 1, 1, tread ? tone(t.c ?? GROUND.track, -0.03) : tone(GROUND.regolith, -0.025));
          }
        }
      }
    }
    // (boot prints: pairs along a path, every 0.75 m, a print 0.28 × 0.11 m, darker heel and toe)
    for (const p of prints) {
      let walked = 0;
      for (let s = 0; s + 1 < p.pts.length; s++) {
        const [ax, az] = p.pts[s], [bx, bz] = p.pts[s + 1], L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L;
        for (let a = (0.75 - walked % 0.75) % 0.75; a < L; a += 0.375) {
          const k = Math.round((walked + a) / 0.375), side = k % 2 ? 1 : -1, X = ax + ux * a - uz * 0.12 * side, Z = az + uz * a + ux * 0.12 * side;
          const ci = Math.round((X - x0) * ppm), cj = Math.round((Z - z0) * ppm), hl = Math.max(2, Math.round(0.14 * ppm)), hw = Math.max(1, Math.round(0.05 * ppm));
          for (let q = -hl; q <= hl; q++) for (let r = -hw; r <= hw; r++) {
            const i = ci + Math.round(ux * q - uz * r), j = cj + Math.round(uz * q + ux * r);
            if (i < 0 || j < 0 || i >= nW || j >= nH) continue;
            if (Math.abs(q) === Math.round(hl * 0.3) && (p.age ?? 0) < 0.5) continue;   // (the arch between heel and toe)
            px(i, j, 1, 1, tone(GROUND.dust, -0.05 - 0.04 * (1 - (p.age ?? 0))));
          }
        }
        walked += L;
      }
    }
  }
  void n;
}

/**
 * Lay the valley floor over x0..x1 × z0..z1 in chunks of chunkM, each a flat piece whose face is a painter
 * of its own ground (world-pinned): the area paints it when it is built, a chunk a step (src/render/batch.js
 * build() yields between paintings), so a chunk streamed in mid-play is painted within the frame budget
 * (runFor) rather than at once (a 12 m chunk is about 11 ms of painting at 24 px/m). Returns the chunks.
 */
export function layGround(area, { x0, z0, x1, z1, chunkM = 12, y = 0, ...o }) {
  const out = [];
  for (let cz = z0; cz < z1 - 1e-6; cz += chunkM) for (let cx = x0; cx < x1 - 1e-6; cx += chunkM) {
    const w = Math.min(chunkM, x1 - cx), d = Math.min(chunkM, z1 - cz);
    const top = (px, pw, ph, ppm) => paintGround(px, pw, ph, cx, cz, { ...o, ppm });
    area.ground({ x0: cx, z0: cz, x1: cx + w, z1: cz + d, y, top });
    out.push({ x0: cx, z0: cz, x1: cx + w, z1: cz + d, top });
  }
  return out;
}

/** A path of sinter slabs (PLACES §4.1) from a to b, `widthM` wide, axis-aligned, lifted off the ground: one painting to size. */
export function slabPath(area, { x0, z0, x1, z1, slabM = 0.6, c = GROUND.slab, seed = 3, dusty = 0.5 }) {
  const ppm = area.ppm, w = Math.round((x1 - x0) * ppm), h = Math.round((z1 - z0) * ppm), wx = Math.round(x0 * ppm), wy = Math.round(z0 * ppm);
  const top = paint(w, h, (px) => {
    concrete(px, 0, 0, w, h, { c, ppm, seed, wx, wy, jointM: slabM, stains: 0.3, cracks: 0.6 });
    const F = field({ ppm });
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const d = F(wx + i, wy + j, 0.5, seed + 4) * 0.7 + F(wx + i, wy + j, 0.15, seed + 5) * 0.3, edge = Math.min(i, j, w - 1 - i, h - 1 - j) / ppm;
      if (d > 1 - 0.45 * dusty - Math.max(0, 0.25 - edge)) px(i, j, 1, 1, d > 1 - 0.35 * dusty ? GROUND.dust : mixHex(c, GROUND.dust, 0.5));
    }
    for (let i = 0; i < w; i++) { px(i, 0, 1, 1, tone(c, 0.05)); px(i, h - 1, 1, 1, tone(c, -0.12)); }
  }, { key: `slabpath:${x0}:${z0}:${x1}:${z1}:${ppm}` });
  area.box({ x0, x1, z0, z1, y0: 0, y1: 0.05, part: 0, faces: { top, front: tone(c, -0.08), sides: tone(c, -0.1) } });
}
