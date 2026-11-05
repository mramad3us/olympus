// OLYMPUS art: the painted materials of Base Melas, a warship and the ground under them.
//
// A material is a way of painting a rectangle of pixels (src/art/paint.js px(), y down) that looks
// like one stuff: concrete, sintered regolith brick, painted steel, a warship's deck plate, rubber
// matting, regolith, rock, ice, frost and dust. Each painter takes (px, x, y, w, h, o) with o:
//   - ppm: the density it is painted at (features are sized in metres, so a brick is 0.4 m wide at
//     16 and at 24 px/m; src/render/scale.js);
//   - c: its base colour (sRGB hex), seed: its cosmetic choices (hashes, never Math.random);
//   - wx, wy: where the rectangle's first pixel is in the world, in pixels (x · ppm, and z · ppm on
//     the ground or −y · ppm up a wall), so two faces painted apart continue each other's pattern;
//   - period: a tile's size in pixels when it repeats (the noise is then the periodic kind, tnoise,
//     and every feature is placed modulo it: tradecraft PIPELINE 2026-10-26, "a tile drawn with
//     noise() doesn't repeat; use tnoise()").
// tile(kind, opts) paints one as a repeating Pixmap `metres` square and remembers it (one painting,
// one atlas region however many floors use it). The look is tradecraft's finish worked toward
// Stoneshard's (docs/research/tradecraft-art-render.md §2): every block, plate and pebble drawn, small
// tone steps (0.02 to 0.04 OKLCH L) so the pattern carries it, wear where use puts it (wear.js).
//
// The stuff, by PLACES §3.14 (materials) and §4 (Base Melas): sintered regolith block 0.40 × 0.20 m
// for outer walls; sinter concrete for floors and slabs; steel painted in the Corps' olive drab or a
// ship's greys; deck plate an aluminium sandwich with a grip pattern; rubber matting on gym floors,
// range benches and shower drying areas; the valley floor's ochre regolith; basalt and the canyon's
// layered deposits; ice and frost (Europa's walls, the dawn frost veil, VIEWS §2.8); dust lying in
// corners and drifts.
// Pure.
import { paint } from '../paint.js';
import { tone, hash3, noise, tnoise, mixHex } from '../tone.js';
import { P, bevel, crack, stain } from './wear.js';

const frac = (h) => (h >>> 8) / 16777216;
const wrap = (v, n) => (n ? ((v % n) + n) % n : v);

/** A noise sampler for o: (i, j, cellM, seed) → 0..1 at world pixel (i, j), periodic over o.period pixels if set. */
export function field(o) {
  const ppm = o.ppm ?? 16, per = o.period ?? 0;
  return (i, j, cellM, seed) => {
    const s = Math.max(1, cellM * ppm);
    if (per) { const k = Math.max(1, Math.round(per / s)); return tnoise(i * k / per, j * k / per, k, seed); }
    return noise(i / s, j / s, seed);
  };
}

// ---------- built ----------

/**
 * Sinter concrete (floors, slabs, plinths): a soft mottle in two scales, aggregate specks, broad stains,
 * a hairline crack now and then, saw-cut joints every `jointM` metres (0: none).
 */
export function concrete(px, x, y, w, h, o = {}) {
  const { c = 0x999189, ppm = 16, seed = 1, wx = 0, wy = 0, period = 0, jointM = 0, stains = 0.5, cracks = 0.3 } = o;
  // (fine work, not broad mottle: a broad mottle of ±0.02 L flips between two palette steps in patches a
  // metre across and reads as camouflage once snapped; specks and stippled stains read as concrete)
  const F = field(o), lo = tone(c, -0.012), st = tone(c, -0.03), sp = tone(c, -0.055), hi = tone(c, 0.04);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j;
    let col = F(I, J, 0.09, seed) < 0.22 ? lo : c;
    if (stains && F(I, J, 1.4, seed + 2) > 1 - 0.2 * stains && ((I + J) & 1)) col = st;
    const r = hash3(wrap(I, period), wrap(J, period), seed + 3) % 151;
    if (r < 4) col = sp; else if (r < 6) col = hi;
    px(x + i, y + j, 1, 1, col);
  }
  if (jointM > 0) {
    const g = P(jointM, ppm);
    for (let i = 0; i < w; i++) if (wrap(wx + i, g) === 0) { px(x + i, y, 1, h, tone(c, -0.1)); if (i + 1 < w) px(x + i + 1, y, 1, h, tone(c, 0.025)); }
    for (let j = 0; j < h; j++) if (wrap(wy + j, g) === 0) { px(x, y + j, w, 1, tone(c, -0.11)); if (j + 1 < h) px(x, y + j + 1, w, 1, tone(c, 0.03)); }
  }
  if (cracks > 0) {
    const n = Math.round(w * h / (ppm * ppm * 6) * cracks);
    for (let k = 0; k < n; k++) { const r = hash3(k, seed, 41); crack(px, x + (r % w), y + ((r >>> 9) % h), P(0.3 + frac(r) * 0.5, ppm), c, { seed: r, clip: [x, y, w, h], dL: -0.07 }); }
  }
}

/**
 * Vinyl composition tile (barracks floors, buffed on field day: PLACES §3.13): squares of `tileM`, each a
 * hair lighter or darker, chips of darker and lighter vinyl through it a pixel each, the joints a
 * shade down, a glint where the wax catches the light. `border`: every tile in the outermost `borderM`
 * of a room is another colour (a hallway's band), left to the caller (paint two rectangles).
 */
export function vinyl(px, x, y, w, h, o = {}) {
  const { c = 0xc4ac97, ppm = 16, seed = 1, wx = 0, wy = 0, period = 0, tileM = 0.3, chips: chipK = 1 } = o;
  const s = P(tileM, ppm, 4), d1 = tone(c, -0.06), d2 = tone(c, 0.05), joint = tone(c, -0.03);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j, a = wrap(I, s), b = wrap(J, s);
    // (a joint on two sides of a tile only, and broken: laid tight and waxed over, they show as a faint grid)
    if ((a === 0 && hash3(wrap(J, period), seed, 3) % 3 !== 0) || (b === 0 && hash3(wrap(I, period), seed, 4) % 3 !== 0)) { px(x + i, y + j, 1, 1, joint); continue; }
    const t = hash3(wrap(Math.floor(I / s), period ? Math.round(period / s) : 0), wrap(Math.floor(J / s), period ? Math.round(period / s) : 0), seed);
    let col = t % 4 === 0 ? tone(c, -0.012) : c;
    const r = hash3(wrap(I, period), wrap(J, period), seed + 5) % 61;
    if (r < 3 * chipK) col = d1; else if (r < 5 * chipK) col = d2;
    if (a === 1 && b === 1 && t % 3 === 0) col = tone(c, 0.06);
    px(x + i, y + j, 1, 1, col);
  }
}

/**
 * Sintered regolith block (PLACES §3.14 blockWallIns: the outer walls of Base Melas): blocks 0.40 ×
 * 0.20 m laid in half bond with thin dark joints, each block a little lighter or darker and warmer or
 * cooler (the batch's firing), its top edge lit and its foot shaded, a glassy speck where the laser
 * melted a grain, a burnt corner now and then. Painted in world pixels so a wall continues round a
 * corner and across faces.
 */
export function sinteredBrick(px, x, y, w, h, o = {}) {
  const { c = 0x9a5d3e, ppm = 16, seed = 1, wx = 0, wy = 0, period = 0, blockM = [0.4, 0.2], joint = 0x4a2c26 } = o;
  const bw = P(blockM[0], ppm, 4), bh = P(blockM[1], ppm, 3), F = field(o);
  for (let j = 0; j < h; j++) {
    const J = wy + j, row = Math.floor(J / bh), jy = ((J % bh) + bh) % bh;
    for (let i = 0; i < w; i++) {
      const I = wx + i + (row % 2) * Math.floor(bw / 2), col = Math.floor(I / bw), ix = ((I % bw) + bw) % bw;
      if (jy === bh - 1 || ix === bw - 1) { px(x + i, y + j, 1, 1, jy === bh - 1 && ix !== bw - 1 ? mixHex(joint, c, 0.35) : joint); continue; }
      const b = hash3(wrap(col, period ? Math.round(period / bw) : 0), wrap(row, period ? Math.round(period / bh) : 0), seed);
      let d = ((b % 7) - 3) * 0.012;
      const warm = (b >>> 5) % 4 === 0 ? 0.015 : 0;
      if (jy === 0) d += 0.035; else if (jy === bh - 2) d -= 0.03;
      if (ix === 0) d += 0.015; else if (ix === bw - 2) d -= 0.02;
      const n = F(wx + i, J, 0.08, seed + 4);
      if (n < 0.25) d -= 0.018; else if (n > 0.8) d += 0.012;
      let colr = tone(warm ? mixHex(c, 0xb0603a, 0.25) : c, d);
      const sp = hash3(wrap(wx + i, period), wrap(J, period), seed + 9) % 97;
      if (sp === 0) colr = tone(c, 0.12);                           // (a glassy speck)
      else if (sp === 1) colr = tone(c, -0.1);
      if ((b >>> 11) % 9 === 0 && ix + jy < bh * 0.6) colr = tone(colr, -0.05);   // (a burnt corner)
      px(x + i, y + j, 1, 1, colr);
    }
  }
}

/**
 * Painted steel (lockers, cabinets, frames, doors): the paint's colour with a faint orange-peel
 * mottle, a lit top edge and a shaded foot if `bevel`, and wear (wear.js) left to the caller, who
 * knows where hands and boots go.
 */
export function paintedSteel(px, x, y, w, h, o = {}) {
  const { c = 0x737949, ppm = 16, seed = 1, wx = 0, wy = 0, edge = true } = o;
  // (orange peel, a pixel at a time: a broad mottle would snap into blotches; see concrete())
  const lo = tone(c, -0.02), hi = tone(c, 0.018);
  px(x, y, w, h, c);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const r = hash3(wx + i, wy + j, seed + 17) % 97; if (r < 3) px(x + i, y + j, 1, 1, lo); else if (r < 4) px(x + i, y + j, 1, 1, hi); }
  if (edge) bevel(px, x, y, w, h, c, 1.1);
}

/**
 * A warship's deck plate (PLACES §3.14 deckPlate, an aluminium sandwich): panels `plateM` square with
 * dark seams, a bolt in each corner, a grip pattern of raised lozenges in staggered rows (lit on top,
 * shaded below), a recessed tie-down ring on some panels (cargo and couches lash to them), scuffs
 * where boots wear the grip smooth. kind 'grip' | 'smooth' | 'grating'.
 */
export function deckPlate(px, x, y, w, h, o = {}) {
  const { c = 0x657974, ppm = 16, seed = 1, wx = 0, wy = 0, period = 0, plateM = 1.0, kind = 'grip', worn = 0.4 } = o;
  const g = P(plateM, ppm, 8), u = ppm / 16, F = field(o);
  const seam = tone(c, -0.16), lit = tone(c, 0.05), sh = tone(c, -0.06);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j, a = wrap(I, g), b = wrap(J, g);
    if (kind === 'grating') {
      const s = Math.max(3, Math.round(3 * u));
      px(x + i, y + j, 1, 1, a % s === 0 || b % (2 * s) === 0 ? (b % (2 * s) === 0 ? lit : c) : tone(c, -0.32));
      continue;
    }
    // (no broad mottle: in dim light a ±0.015 L field flips between palette steps in patches; wear is a speck at a time)
    let col = c;
    const sp = hash3(wrap(I, period), wrap(J, period), seed + 13) % 131;
    if (sp < 3) col = tone(c, -0.04); else if (sp < 4) col = tone(c, 0.04);
    if (kind === 'grip') {
      const s = Math.max(4, Math.round(5 * u)), row = Math.floor(b / s), off = (row % 2) * Math.floor(s / 2), q = wrap(a + off, s), r = b % s;
      if (q < 2 && r === 1) col = worn && F(I, J, 0.7, seed + 5) > 1 - worn * 0.6 ? tone(c, 0.025) : lit;
      else if (q > 0 && q < 3 && r === 2) col = sh;
    }
    px(x + i, y + j, 1, 1, col);
  }
  for (let i = 0; i < w; i++) { if (wrap(wx + i, g) === 0) px(x + i, y, 1, h, seam); if (wrap(wx + i, g) === 1) px(x + i, y, 1, h, tone(c, 0.03)); }
  for (let j = 0; j < h; j++) { if (wrap(wy + j, g) === 0) px(x, y + j, w, 1, seam); if (wrap(wy + j, g) === 1) px(x, y + j, w, 1, tone(c, 0.035)); }
  // (the bolts at each panel's corners, and a tie-down ring in some panels)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j, a = wrap(I, g), b = wrap(J, g), e = Math.max(2, Math.round(2.5 * u));
    if ((a === e || a === g - e) && (b === e || b === g - e)) { px(x + i, y + j, 1, 1, tone(c, 0.1)); if (j + 1 < h) px(x + i, y + j + 1, 1, 1, tone(c, -0.14)); }
    const pi = Math.floor(I / g), pj = Math.floor(J / g), cell = hash3(wrap(pi, period ? Math.round(period / g) : 0), wrap(pj, period ? Math.round(period / g) : 0), seed + 7);
    if (kind !== 'grating' && cell % 5 === 0) {
      const cx = Math.floor(g / 2), cy = Math.floor(g / 2), rr = Math.max(2, Math.round(2.4 * u)), d = Math.hypot(a - cx, b - cy);
      if (d < rr + 0.5) px(x + i, y + j, 1, 1, d > rr - 0.8 ? (b < cy ? tone(c, -0.18) : tone(c, 0.06)) : tone(c, -0.26));
    }
  }
}

/** Rubber matting: dark, with coin studs ('coin'), ribs ('rib') or a drainage grid ('drain', shower floors), joints every `tileM`. */
export function rubberMat(px, x, y, w, h, o = {}) {
  const { c = 0x31292a, ppm = 16, seed = 1, wx = 0, wy = 0, kind = 'coin', tileM = 1.0 } = o;
  const u = ppm / 16, s = Math.max(3, Math.round(4 * u)), g = P(tileM, ppm, 8), F = field(o);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j, a = wrap(I, s), b = wrap(J, s);
    let col = F(I, J, 0.4, seed) < 0.3 ? tone(c, -0.012) : c;
    if (kind === 'coin') { if (a === 1 && b === 1) col = tone(c, 0.06); else if (a === 2 && b === 2) col = tone(c, -0.04); }
    else if (kind === 'rib') { if (b === 0) col = tone(c, 0.05); else if (b === 1) col = tone(c, -0.03); }
    else if (kind === 'drain') { if (a === 0 || b === 0) col = tone(c, -0.06); else if (a === 1 && b === 1) col = tone(c, 0.05); }
    if (wrap(I, g) === 0 || wrap(J, g) === 0) col = tone(c, -0.08);
    px(x + i, y + j, 1, 1, col);
  }
}

/** Small ceramic tiles in grout (a head's walls and floors), `tileM` square, every tile a hair different. */
export function ceramic(px, x, y, w, h, o = {}) {
  const { c = 0xd6d0c9, ppm = 16, seed = 1, wx = 0, wy = 0, period = 0, tileM = 0.15, grout = null } = o;
  const s = P(tileM, ppm, 3), gc = grout ?? tone(c, -0.13);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j, a = wrap(I, s), b = wrap(J, s);
    if (a === s - 1 || b === s - 1) { px(x + i, y + j, 1, 1, gc); continue; }
    const t = hash3(wrap(Math.floor(I / s), period ? Math.round(period / s) : 0), wrap(Math.floor(J / s), period ? Math.round(period / s) : 0), seed);
    let d = (t % 5 === 0 ? -0.018 : t % 7 === 0 ? 0.012 : 0);
    if (a === 0 && b === 0) d += 0.05;
    px(x + i, y + j, 1, 1, tone(c, d));
  }
}

// ---------- the ground and what lies on it ----------

/**
 * Regolith, the valley floor (the Mars place set's ochre, VIEWS §2.6): two scales of mottle in the dust's
 * own tones, patches of darker basalt sand, grit, pebbles with a lit top and a shadow under them,
 * wind ripples (thin lighter lines across the wind) where `ripples` > 0. Painted in world pixels so
 * neighbouring chunks of ground meet without a seam.
 */
export function regolith(px, x, y, w, h, o = {}) {
  const { c = 0xa65e4b, ppm = 16, seed = 1, wx = 0, wy = 0, period = 0, basalt = 0x6e5256, sand = null, ripples = 0.4, pebbles = 1, dust = 0.35, dustC = 0xc18064 } = o;
  const F = field(o), lo = tone(c, -0.03), lo2 = tone(c, -0.05), hi = tone(c, 0.025), bs = mixHex(c, basalt, 0.45), dc = dustC;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j;
    const n = F(I, J, 0.7, seed) * 0.6 + F(I, J, 0.2, seed + 1) * 0.4;
    let col = n < 0.3 ? lo : n > 0.7 ? hi : c;
    if (n < 0.18) col = lo2;
    const b = F(I, J, 3.2, seed + 2) * 0.7 + F(I, J, 0.9, seed + 3) * 0.3;
    if (b > 0.7) col = b > 0.76 ? tone(bs, n > 0.5 ? 0.02 : -0.01) : mixHex(col, bs, 0.5);
    if (dust > 0) { const d = F(I, J, 2.4, seed + 4) * 0.75 + F(I, J, 0.35, seed + 5) * 0.25; if (d > 1 - 0.3 * dust) col = d > 1 - 0.2 * dust ? dc : mixHex(col, dc, 0.5); }
    if (ripples > 0) {
      // (ripples run across the wind, here east-west: a lit crest every 0.25 m, bent by the noise, where the sand is loose)
      const rp = Math.max(3, Math.round(0.22 * ppm)), bend = Math.round(F(I, J, 1.1, seed + 6) * rp * 2);
      if (F(I, J, 1.8, seed + 7) > 1 - ripples * 0.6 && wrap(J + bend, rp) === 0) col = tone(col, 0.03);
      else if (F(I, J, 1.8, seed + 7) > 1 - ripples * 0.6 && wrap(J + bend, rp) === 1) col = tone(col, -0.02);
    }
    const r = hash3(wrap(I, period), wrap(J, period), seed + 8) % 173;
    if (r < 4) col = tone(col, -0.06); else if (r < 6) col = tone(col, 0.05);
    px(x + i, y + j, 1, 1, col);
  }
  if (pebbles > 0) {
    // (pebbles: a few pixels each, lit on top, a shadow under: placed by a hash of their cell, 0.6 m cells)
    const cell = P(0.6, ppm, 6), u = ppm / 16;
    const ci0 = Math.floor(wx / cell) - 1, cj0 = Math.floor(wy / cell) - 1, ci1 = Math.floor((wx + w) / cell) + 1, cj1 = Math.floor((wy + h) / cell) + 1;
    for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) {
      const r = hash3(wrap(ci, period ? Math.round(period / cell) : 0), wrap(cj, period ? Math.round(period / cell) : 0), seed + 11);
      if (frac(r) > 0.55 * pebbles) continue;
      const sz = Math.max(1, Math.round((1 + (r % 3)) * u * (r % 11 === 0 ? 2 : 1))), pc = (r >>> 4) % 3 === 0 ? tone(bs, -0.02) : tone(c, (r >>> 6) % 2 ? -0.05 : 0.02);
      const X = ci * cell + (r >>> 12) % cell - wx + x, Y = cj * cell + (r >>> 18) % cell - wy + y;
      pebble(px, X, Y, sz, pc, [x, y, w, h]);
    }
  }
}
/** A pebble of size s px at (x, y): its body, a lit top-left, a shadow pixel under its right; clipped to the rectangle. */
function pebble(px, x, y, s, c, clip) {
  const put = (X, Y, col) => { if (X >= clip[0] && Y >= clip[1] && X < clip[0] + clip[2] && Y < clip[1] + clip[3]) px(X, Y, 1, 1, col); };
  for (let j = 0; j < s; j++) for (let i = 0; i < s + (s > 1 ? 1 : 0); i++) {
    if (s > 2 && ((i === 0 && j === 0) || (i === s && j === 0) || (i === 0 && j === s - 1) || (i === s && j === s - 1))) continue;
    put(x + i, y + j, j === 0 ? tone(c, 0.06) : i === s ? tone(c, -0.05) : c);
  }
  for (let i = 1; i <= s; i++) put(x + i, y + s, tone(c, -0.14));
}

/**
 * Rock (boulders' faces and the canyon's walls): kind 'basalt' (dark, fractured in blocks, a few lit
 * planes) or 'layered' (the light-toned layered deposits of the Valles Marineris: beds of differing
 * tone and hardness, the hard ones standing out as lit ledges with a shadow under, the soft ones
 * recessed and streaked). Painted in world pixels (wy measured down from a datum) so a face's
 * strata line up across boxes.
 */
export function rock(px, x, y, w, h, o = {}) {
  const { c = 0x8a6c6a, ppm = 16, seed = 1, wx = 0, wy = 0, kind = 'basalt', bedM = 0.5, fractures = 1 } = o;
  const F = field(o);
  if (kind === 'layered') {
    // (beds of 0.25-1.2 m, each with its own tone and hardness, from a hash of its index)
    const bedAt = (J) => { let k = Math.floor(J / (bedM * ppm)); return k; };
    for (let j = 0; j < h; j++) {
      const J = wy + j, wob = (I) => Math.round((F(I, J, 3, seed + 3) - 0.5) * bedM * ppm * 0.8);
      for (let i = 0; i < w; i++) {
        const I = wx + i, Jw = J + wob(I), k = bedAt(Jw), b = hash3(k, seed, 13), into = ((Jw % Math.round(bedM * ppm)) + Math.round(bedM * ppm)) % Math.round(bedM * ppm);
        const hard = b % 3 === 0, base = tone(mixHex(c, b % 2 ? 0xc4aba1 : 0x8f3f31, 0.15 + 0.1 * ((b >>> 4) % 3)), ((b >>> 7) % 5 - 2) * 0.02);
        let col = base;
        const n = F(I, Jw, 0.4, seed) * 0.6 + F(I, Jw, 0.12, seed + 1) * 0.4;
        if (n < 0.3) col = tone(base, -0.025); else if (n > 0.72) col = tone(base, 0.02);
        if (hard && into === 0) col = tone(base, 0.07);                // (a ledge's lit lip)
        else if (hard && into === Math.round(bedM * ppm) - 1) col = tone(base, -0.09);   // (its shadow on the bed below)
        else if (!hard && F(I, Jw, 0.25, seed + 2) > 0.78) col = tone(base, -0.04);      // (streaks on the soft beds)
        px(x + i, y + j, 1, 1, col);
      }
    }
  } else {
    const lo = tone(c, -0.04), hi = tone(c, 0.04);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const I = wx + i, J = wy + j, n = F(I, J, 0.35, seed) * 0.6 + F(I, J, 0.1, seed + 1) * 0.4;
      const facet = F(I, J, 0.9, seed + 2);
      let col = n < 0.32 ? lo : n > 0.7 ? hi : c;
      if (facet > 0.7) col = tone(col, 0.03); else if (facet < 0.25) col = tone(col, -0.03);
      if (hash3(I, J, seed + 4) % 131 === 0) col = tone(c, 0.1);    // (a glint of olivine)
      px(x + i, y + j, 1, 1, col);
    }
  }
  if (fractures > 0) {
    const n = Math.max(1, Math.round(w * h / (ppm * ppm * 1.5) * fractures));
    for (let k = 0; k < n; k++) { const r = hash3(k, seed, 77); crack(px, x + (r % w), y + ((r >>> 9) % h), P(0.2 + frac(r) * 0.8, ppm), c, { seed: r, clip: [x, y, w, h], dL: -0.12 }); }
  }
}

/** Ice (Europa's walls, a frozen tank): blue-white, bubbles in lines, a lit crack, frost at the foot. */
export function ice(px, x, y, w, h, o = {}) {
  const { c = 0xa6b4b5, ppm = 16, seed = 1, wx = 0, wy = 0 } = o;
  const F = field(o);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const I = wx + i, J = wy + j, n = F(I, J, 0.6, seed) * 0.6 + F(I, J, 0.15, seed + 1) * 0.4;
    let col = n < 0.3 ? tone(c, -0.04) : n > 0.7 ? tone(c, 0.04) : c;
    if (hash3(I, J, seed) % 89 === 0) col = tone(c, 0.12);
    px(x + i, y + j, 1, 1, col);
  }
  const n = Math.max(1, Math.round(w * h / (ppm * ppm * 3)));
  for (let k = 0; k < n; k++) { const r = hash3(k, seed, 91); crack(px, x + (r % w), y + ((r >>> 9) % h), P(0.4, ppm), tone(c, 0.2), { seed: r, clip: [x, y, w, h], dL: 0.06 }); }
}

/**
 * Frost, laid over what is already painted: a veil, not patches (tradecraft lesson 2026-10-27, "a frost
 * drawn as a little snow lying read as litter"): every pixel taken a part of the way toward the frost's
 * pale blue-white by its own noise, and a glint on one cell in 55 (pixelart.js wxRime). `get(x, y)`
 * reads what is there (a Pixmap's colour), so it is used on a painting after it is made: frostOver().
 */
export function frostOver(pm, { ppm = 16, k = 0.5, seed = 1, wx = 0, wy = 0, c = 0xc7d5d0 } = {}) {
  const F = field({ ppm });
  for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) {
    const p = j * pm.w + i, v = pm.data[p], a = v >>> 24;
    if (a < 128) continue;
    const hex = ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
    const n = F(wx + i, wy + j, 0.25, seed);
    let t = k * (0.45 + 0.55 * n);
    if (hash3(Math.floor((wx + i) / Math.max(1, ppm / 8)), Math.floor((wy + j) / Math.max(1, ppm / 8)), seed) % 55 === 0) t = 1;
    const m = mixHex(hex, c, Math.min(1, t));
    pm.data[p] = ((a << 24) | ((m & 0xff) << 16) | (m & 0xff00) | ((m >>> 16) & 0xff)) >>> 0;
  }
  return pm;
}

/**
 * Dust lying (VIEWS §2.8 dustCover, PLACES §3.13 dustLevel): where the noise passes a threshold set by
 * `cover` (0 none … 1.5 deep), the regolith's pale dust, thicker into its own lighter tone, its edge
 * ragged; on a painting already made (dustOver), or as a patch painted on its own.
 */
export function dustOver(pm, { ppm = 16, cover = 0.5, seed = 1, wx = 0, wy = 0, c = 0xc18064, foot = 0 } = {}) {
  const F = field({ ppm });
  for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) {
    const p = j * pm.w + i, v = pm.data[p], a = v >>> 24;
    if (a < 128) continue;
    const n = F(wx + i, wy + j, 0.5, seed) * 0.7 + F(wx + i, wy + j, 0.12, seed + 1) * 0.3 + (foot ? foot * (j / pm.h) : 0);
    if (n < 1 - 0.55 * cover) continue;
    const m = n > 1 - 0.4 * cover ? c : mixHex(((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff), c, 0.5);
    pm.data[p] = ((a << 24) | ((m & 0xff) << 16) | (m & 0xff00) | ((m >>> 16) & 0xff)) >>> 0;
  }
  return pm;
}

// ---------- tiles ----------

const PAINTERS = { concrete, vinyl, sinteredBrick, paintedSteel, deckPlate, rubberMat, ceramic, regolith, rock, ice };
const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcm = (a, b) => a / gcd(a, b) * b;
/**
 * The pattern's repeat in pixels for a material at a density: a tile must be a whole number of them or
 * it breaks its pattern where it meets its next copy (a 1.2 m tile is 19 px at 16 px/m, a 0.3 m square 5).
 */
const UNITS = {
  concrete: (o, ppm) => (o.jointM ? P(o.jointM, ppm) : 1),
  vinyl: (o, ppm) => P(o.tileM ?? 0.3, ppm, 4),
  ceramic: (o, ppm) => P(o.tileM ?? 0.15, ppm, 3),
  deckPlate: (o, ppm) => P(o.plateM ?? 1.0, ppm, 8),
  rubberMat: (o, ppm) => lcm(Math.max(3, Math.round(4 * ppm / 16)), P(o.tileM ?? 1.0, ppm, 8)),
  sinteredBrick: (o, ppm) => lcm(P((o.blockM ?? [0.4, 0.2])[0], ppm, 4), 2 * P((o.blockM ?? [0.4, 0.2])[1], ppm, 3)),
  rock: (o, ppm) => (o.kind === 'layered' ? Math.round((o.bedM ?? 0.5) * ppm) : 1),
};
/** A tile's side in pixels: `metres` at ppm, rounded to whole repeats of its material's pattern. */
export function tileSizePx(kind, opts, ppm) {
  const unit = UNITS[kind]?.(opts, ppm) ?? 1;
  return Math.max(unit, Math.round(opts.metres * ppm / unit) * unit);
}
/** The materials a tile can be painted from. */
export const MATERIAL_KINDS = Object.freeze(Object.keys(PAINTERS));
const tiles = new Map();

/**
 * A repeating tile of a material, about `metres` square (whole repeats of its pattern at ppm:
 * tileSizePx), painted with periodic noise so it repeats without a seam; remembered by its options. opts: { metres, ppm, c, seed, ... } as the
 * painter takes them. Wears `repeat`, so a face that uses it is world-anchored (src/render/batch.js).
 */
export function tile(kind, opts = {}) {
  const ppm = opts.ppm ?? 16, metres = opts.metres ?? 2;
  const key = `mat:${kind}:${JSON.stringify({ ...opts, ppm, metres })}`;
  let t = tiles.get(key);
  if (!t) {
    const draw = PAINTERS[kind];
    if (!draw) throw new Error(`no material '${kind}'`);
    const n = Math.max(2, tileSizePx(kind, { ...opts, metres }, ppm));
    t = paint(n, n, (px) => draw(px, 0, 0, n, n, { ...opts, ppm, period: n }), { repeat: true, key });
    tiles.set(key, t);
  }
  return t;
}
/** Forget the remembered tiles (a scene change that won't want them again). */
export function clearTiles() { tiles.clear(); }
/** A face painter (px, w, h, ppm) for a material, world texel offset given: for one-off faces painted to size. */
export const face = (kind, opts = {}) => (px, w, h, ppm) => PAINTERS[kind](px, 0, 0, w, h, { ...opts, ppm });
export { stain };
