// OLYMPUS art: rocks on the valley floor, and the dust drifted against what stands in the wind.
//
// A boulder is a few boxes of one part (an outline round the whole, not between its lumps): a body, a
// smaller crown set back on it, sometimes a lump at its side, each face painted with the rock material
// (src/art/materials/surfaces.js rock: basalt fractured in blocks, or the canyon's layered deposits) and
// its corners eaten away (holes: alpha-tested off), so the boxes read as a rounded stone from 45° rather
// than a crate; its front darker toward the foot and the right (the light is from the upper left), dust
// lying on its top. Pebbles and gravel are painted into the ground (ground.js); what stands up is a box,
// "flat things are painted, things that stand out are boxes" (tradecraft's rule, src/art/pixeltown.js).
//
// A drift is dust heaped in a building's lee (PLACES §4.1: "dust drifts in the lee of buildings"; the
// night wind comes off the south wall, the day's up the valley from the east, PLACES §3.15): a low mound
// box against the wall whose front is the mound's profile (holes above its curve) and whose top is
// rippled dust, and a skirt of dust on the ground round it, ragged at its edge.
// Pure.
import { paint } from '../paint.js';
import { tone, hash3, mixHex, noise } from '../tone.js';
import { rock, field } from '../materials/surfaces.js';
import { GROUND } from './ground.js';

const ROCKS = { basalt: 0x6e5256, layered: 0xa78b85, rust: 0x8f5a48 };
const frac = (h) => (h >>> 8) / 16777216;

/** A face of a boulder, w × h px: rock, corners eaten round (r a fraction of the short side), shaded toward its foot and right; dust on a top. */
function boulderFace(kind, seed, role) {
  const fn = (px, w, h, ppm) => {
    const c = ROCKS[kind] ?? ROCKS.basalt;
    rock(px, 0, 0, w, h, { c, ppm, seed, kind: kind === 'layered' ? 'layered' : 'basalt', bedM: 0.18, fractures: 0.6 });
    const r = Math.max(1, Math.round(Math.min(w, h) * (role === 'top' ? 0.42 : 0.34)));
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      // (rounded corners, their edge broken by noise; the foot's corners less eaten on a front: it sits on the ground)
      // (the stone's outline from 45°: the top's far corners round, its near edge meeting the front's top square; the front's foot
      // corners a little round where it sits in the dust; so the two faces read as one stone, not a ball on a ball)
      const cx = i < r ? r - i : i >= w - r ? i - (w - 1 - r) : 0;
      const cy = role === 'top' ? (j < r ? r - j : 0) : (j >= h - r ? j - (h - 1 - r) : 0);
      const foot = role === 'front';
      const rr = foot ? r * 0.5 : r, d = Math.hypot(cx * (foot ? 1.6 : 1), cy) + (noise(i / 2, j / 2, seed) - 0.5) * 1.6;
      if ((cx || cy) && d > rr) { px(i, j, 1, 1, null); continue; }
      if (role === 'front') { if (i > w * 0.62 && (hash3(i, j, seed) & 1)) px(i, j, 1, 1, tone(c, -0.05)); if (j > h * 0.7) px(i, j, 1, 1, tone(c, -0.06)); if (j === 0 || (j < 2 && i < w * 0.5)) px(i, j, 1, 1, tone(c, 0.06)); }
      if (role === 'top') { const n = noise(i / (0.2 * ppm), j / (0.2 * ppm), seed + 3); if (n > 0.6) px(i, j, 1, 1, n > 0.7 ? GROUND.dust : mixHex(c, GROUND.dust, 0.5)); if (j === h - 1 && i < w * 0.6) px(i, j, 1, 1, tone(c, 0.06)); }
    }
  };
  fn.key = `boulder:${kind}:${seed}:${role}`;
  return fn;
}
const faceCache = new Map();
const faceOf = (kind, seed, role) => { const k = `${kind}:${seed}:${role}`; if (!faceCache.has(k)) faceCache.set(k, boulderFace(kind, seed, role)); return faceCache.get(k); };

/** A boulder at (x, z): sizeM across, kind 'basalt' | 'layered' | 'rust'; its look from the seed (a few looks per kind, so faces are shared). */
export function boulder(area, { x, z, y = 0, sizeM = 0.8, kind = 'basalt', seed = 1 }) {
  const part = area.part(), look = seed % 5, c = ROCKS[kind] ?? ROCKS.basalt;
  const w = sizeM, d = sizeM * (0.7 + 0.1 * (seed % 3)), h = sizeM * (sizeM < 0.6 ? 0.35 + 0.08 * (seed % 3) : 0.45 + 0.1 * (seed % 4));
  const faces = (s) => ({ front: faceOf(kind, look * 10 + s, 'front'), top: faceOf(kind, look * 10 + s, 'top'), sides: tone(c, -0.08), back: tone(c, -0.1) });
  area.box({ x, z, y, w, d, h, part, faces: faces(1) });
  if (sizeM > 0.85) area.box({ x: x - w * 0.1 + (seed % 2) * w * 0.18, z: z - d * 0.12, y: y + h - 0.04 * sizeM, w: w * 0.7, d: d * 0.6, h: h * 0.32, part, faces: faces(2) });
  if (sizeM > 0.9 && seed % 3 === 0) area.box({ x: x + w * 0.52, z: z + d * 0.1, y, w: w * 0.45, d: d * 0.6, h: h * 0.5, part, faces: faces(3) });
}

/** Rocks scattered over a rectangle (avoid: rectangles to keep clear), sizes from minM to maxM, the bigger fewer. */
export function scatterRocks(area, { x0, z0, x1, z1, n = 12, seed = 1, minM = 0.25, maxM = 1.2, kind = 'basalt', avoid = [] }) {
  let placed = 0;
  for (let k = 0; k < n * 4 && placed < n; k++) {
    const r = hash3(k, seed, 1301), x = x0 + frac(r) * (x1 - x0), z = z0 + frac(hash3(r, 3)) * (z1 - z0);
    const s = minM + (maxM - minM) * frac(hash3(r, 7)) ** 2.2;
    if (avoid.some(a => x > a.x0 - s && x < a.x1 + s && z > a.z0 - s && z < a.z1 + s)) continue;
    boulder(area, { x, z, sizeM: s, kind: typeof kind === 'function' ? kind(x, z) : kind, seed: hash3(r, 11) % 1000 });
    placed++;
  }
  return placed;
}

/**
 * Dust drifted against a wall's foot over x0..x1, its mound `heightM` tall at the wall and `reachM` out
 * from it on the side the wall faces (+z: the camera's side). A mound box and a ragged skirt.
 */
export function drift(area, { x0, x1, z, heightM = 0.3, reachM = 1.2, seed = 1 }) {
  const ppm = area.ppm, w = Math.round((x1 - x0) * ppm), part = area.part(), dc = GROUND.dust;
  const prof = (i) => 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, i / w))) * (0.75 + 0.5 * noise(i / (1.5 * ppm), 0, seed));
  const front = paint(w, Math.max(2, Math.round(heightM * ppm)), (px, W, H) => {
    for (let i = 0; i < W; i++) {
      const top = Math.round(H * (1 - prof(i)));
      for (let j = 0; j < H; j++) px(i, j, 1, 1, j < top ? null : j === top ? tone(dc, 0.05) : (i + j * 3) % 7 === 0 ? tone(dc, -0.03) : dc);
    }
  }, { key: `drift-front:${x0}:${x1}:${seed}:${ppm}` });
  const depth = Math.max(2, Math.round(reachM * 0.45 * ppm));
  const top = paint(w, depth, (px, W, H) => {
    const F = field({ ppm });
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const reach = prof(i) * H;
      if (H - 1 - j > reach) { px(i, j, 1, 1, null); continue; }
      const rip = Math.round(F(i + x0 * ppm, j, 0.6, seed) * 3);
      px(i, j, 1, 1, (j + rip) % Math.max(3, Math.round(0.2 * ppm)) === 0 ? tone(dc, 0.035) : dc);
    }
  }, { key: `drift-top:${x0}:${x1}:${seed}:${ppm}` });
  area.box({ x0, x1, z0: z, z1: z + reachM * 0.45, y0: 0, y1: heightM, part, faces: { front, top, sides: dc, back: dc } });
  // (the skirt: dust lying on the ground beyond the mound, thinning out, its edge ragged)
  const sw = w + Math.round(0.6 * ppm), sd = Math.max(2, Math.round(reachM * ppm));
  const skirt = paint(sw, sd, (px, W, H) => {
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const t = j / H, e = Math.min(i, W - 1 - i) / (0.4 * ppm), n = noise(i / (0.35 * ppm), j / (0.35 * ppm), seed + 9);
      if (n * Math.min(1, e) * (1.1 - t) < 0.32) { px(i, j, 1, 1, null); continue; }
      px(i, j, 1, 1, n * (1.1 - t) > 0.55 ? dc : mixHex(dc, GROUND.regolith, 0.45));
    }
  }, { key: `drift-skirt:${x0}:${x1}:${seed}:${ppm}` });
  area.ground({ x0: x0 - 0.3, z0: z, x1: x1 + 0.3, z1: z + reachM, lift: 0.003, top: skirt });
}
