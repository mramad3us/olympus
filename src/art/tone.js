// OLYMPUS art: colour as a pixel artist turns it, and the noise and hashes painters draw with.
//
// Ported from tradecraft (src/art/pixelart.js, the look the user picked 2026-10-26), unchanged in
// its numbers so a colour painted here comes out as it did there:
//   - colours are 0xrrggbb sRGB numbers, plain data;
//   - OKLCH (perceptual lightness L 0..1, chroma, hue in degrees) is where tones are made: a ramp
//     is a family's hue and chroma at a run of lightness steps (src/art/palette.js);
//   - the pixel artist's hue shift: darker tones turn toward violet (285°) by 1.4 × the drop in L,
//     lighter ones toward yellow (85°) by 1.6 × the rise, so shadows are cool and lights warm;
//   - tone(hex, dL): any colour a little lighter or darker, hue-shifted, with a little less chroma
//     the further it goes (× 1 − min(0.5, |dL|)). Memoised: painters call it per pixel;
//   - smooth value noise and its periodic twin (for tiles that repeat without a seam), and an
//     integer hash and a seeded LCG for cosmetic choices (no Math.random anywhere: a texture is
//     drawn the same every time from its seed).
// Nothing here touches the DOM or three.js: it runs in node for the tests.

export const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** [r, g, b] 0..1 of an sRGB hex colour (gamma-encoded, as stored). */
export const rgbOf = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
/** The hex of [r, g, b] 0..1 (gamma-encoded), clipped and rounded. */
export const hexOf = (r, g, b) => {
  const q = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  return (q(r) << 16) | (q(g) << 8) | q(b);
};
const linCache = new Map();
/** A hex colour in linear RGB [r, g, b] (what three.js lights in). */
export function linear(hex) {
  let v = linCache.get(hex);
  if (!v) { v = rgbOf(hex).map(toLin); linCache.set(hex, v); }
  return v;
}
/** Two hex colours mixed channel by channel in sRGB, k 0..1 toward b. */
export function mixHex(a, b, k) {
  const A = rgbOf(a), B = rgbOf(b);
  return hexOf(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k);
}
export const hexStr = (h) => '#' + h.toString(16).padStart(6, '0');

/** A colour's [L 0..1, chroma, hue in degrees]. */
export function oklch(hex) {
  const r = toLin(((hex >> 16) & 255) / 255), g = toLin(((hex >> 8) & 255) / 255), b = toLin((hex & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * q;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * q;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * q;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
}
/** The sRGB colour (0xrrggbb) of an OKLCH one, clipped to the gamut. */
export function fromOklch(L, C, h) {
  const A = C * Math.cos(h * Math.PI / 180), B = C * Math.sin(h * Math.PI / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const q = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  const to8 = (v) => Math.round(Math.min(1, Math.max(0, toSrgb(Math.max(0, v)))) * 255);
  return (to8(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * q) << 16)
    | (to8(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * q) << 8)
    | to8(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * q);
}

// The pixel artist's hue shift (toward violet in shadow, yellow in light).
export const HUE_DARK_DEG = 285, HUE_LIGHT_DEG = 85, SHIFT_DARK_K = 1.4, SHIFT_LIGHT_K = 1.6;
const toward = (h, target, k) => h + (((target - h + 540) % 360) - 180) * Math.min(1, k);
/** A hue moved as a tone dL lighter (dL > 0) or darker is: toward yellow, or toward violet. */
export const shiftHue = (h, dL) => (dL < 0 ? toward(h, HUE_DARK_DEG, -dL * SHIFT_DARK_K) : toward(h, HUE_LIGHT_DEG, dL * SHIFT_LIGHT_K));

const tones = new Map();
/** `hex` lighter (dL > 0) or darker by dL of OKLCH lightness, hue-shifted, a little less chroma the further. */
export function tone(hex, dL) {
  const key = hex * 1000 + Math.round(dL * 500);
  let v = tones.get(key);
  if (v === undefined) {
    const [L, C, h] = oklch(hex);
    v = fromOklch(Math.min(0.97, Math.max(0.08, L + dL)), C * (1 - Math.min(0.5, Math.abs(dL))), shiftHue(h, dL));
    tones.set(key, v);
  }
  return v;
}

// ---------- noise and hashes ----------

/** A 32-bit integer hash of up to three integers (cosmetic choices: which crate, which stain). */
export function hash3(i, j = 0, k = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
/** A string's 32-bit hash (FNV-1a): a key to a seed. */
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Smooth value noise, 0..1, at (x, y) in cells of one unit (scale the coordinates), from a seed. */
export function noise(x, y, seed = 1) {
  const hash = (i, j) => { let h = (i * 374761393 + j * 668265263 + seed * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** noise(), repeating every `period` cells in x and y: for tiles (x / k over a tile of period · k pixels). */
export function tnoise(x, y, period, seed = 1) {
  const hash = (i, j) => { i = ((i % period) + period) % period; j = ((j % period) + period) % period; let h = (i * 374761393 + j * 668265263 + seed * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** A seeded random 0..1 (tradecraft's LCG), so every texture is drawn the same each time. Cosmetic only. */
export function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
