// OLYMPUS art: brushes, the small painting moves every surface is made of.
//
// As a pixel artist works (tradecraft's painters: src/art/furniture.js, src/art/pixeltown.js):
// a frame is bevelled (lit along the top and left, in shade along the bottom and right), a big flat
// thing is mottled in a few tones about 0.03 OKLCH L apart (tradecraft PIPELINE, 2026-10-26: "keep
// noise steps about 0.03 OKLCH L on big flat things", louder and night turns it to static), a plate
// carries its seams and rivets, a danger edge its hazard stripes. Every brush takes the painter's
// px() and pixel coordinates, y down; sizes in pixels, because a painting's caller knows its density
// (src/render/scale.js PX_PER_M) and passes sizes scaled from it (pxOf()).
// Pure: tone() and noise() from src/art/tone.js, nothing else.
import { tone, noise, tnoise, hash3 } from './tone.js';

/** A size in metres as whole pixels at ppm (at least `min`). */
export const pxOf = (m, ppm, min = 1) => Math.max(min, Math.round(m * ppm));

/** A frame's bevel over (x, y, w, h): lit along the top and left, in shade along the bottom and right, k the strength. */
export function bevel(px, x, y, w, h, c, k = 1) {
  px(x, y, w, 1, tone(c, 0.07 * k)); px(x, y, 1, h, tone(c, 0.04 * k));
  px(x, y + h - 1, w, 1, tone(c, -0.09 * k)); px(x + w - 1, y, 1, h, tone(c, -0.07 * k));
}

/**
 * A soft mottle over (x, y, w, h) in tones of c: value noise in cells of `cell` pixels, three bands
 * (darker, base, lighter) `step` OKLCH L apart. `period`: the tile's size in cells, so it repeats
 * without a seam (tnoise); ox, oy: where this patch sits in the noise (adjacent patches continue).
 */
export function mottle(px, x, y, w, h, c, { cell = 4, step = 0.025, seed = 1, period = 0, ox = 0, oy = 0, lo = 0.3, hi = 0.72 } = {}) {
  const d0 = tone(c, -step), d1 = tone(c, step);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + ox) / cell, v = (j + oy) / cell;
    const n = period ? tnoise(u, v, period, seed) * 0.7 + tnoise(u * 2, v * 2, period * 2, seed + 1) * 0.3 : noise(u, v, seed) * 0.7 + noise(u * 2, v * 2, seed + 1) * 0.3;
    px(x + i, y + j, 1, 1, n < lo ? d0 : n > hi ? d1 : c);
  }
}

/** Specks over (x, y, w, h): about `per` of its pixels set to one of `cols`, placed by hash (seed). */
export function speckle(px, x, y, w, h, cols, per, seed = 1) {
  const n = Math.round(w * h * per);
  for (let k = 0; k < n; k++) {
    const hh = hash3(k, seed, 77);
    px(x + (hh % w), y + ((hh >>> 12) % h), 1, 1, cols[(hh >>> 24) % cols.length]);
  }
}

/** A rivet (a lit pixel over a dark one) at (x, y). */
export function rivet(px, x, y, c) { px(x, y, 1, 1, tone(c, 0.1)); px(x, y + 1, 1, 1, tone(c, -0.14)); }

/** A plate (x, y, w, h): its face, a seam round it (dark at the bottom and right, lit at the top and left), rivets every `every` px if given. */
export function plate(px, x, y, w, h, c, { every = 0, inset = 2 } = {}) {
  px(x, y, w, h, c);
  bevel(px, x, y, w, h, c, 1.2);
  if (every > 0) {
    for (let i = x + inset; i < x + w - inset; i += every) { rivet(px, i, y + inset - 1, c); rivet(px, i, y + h - inset - 1, c); }
  }
}

/** Hazard stripes over (x, y, w, h): diagonal bands `band` px wide, a and b (yellow and black by default). */
export function hazard(px, x, y, w, h, { band = 3, a = 0xd8b23a, b = 0x23252f } = {}) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, 1, 1, Math.floor((i + j) / band) % 2 ? b : a);
}

/** Wood grain over (x, y, w, h) in tones of c: boards `board` px across (vertical: boards run up), seams dark, a few grain streaks. */
export function boards(px, x, y, w, h, c, { board = 4, vertical = false, seed = 1 } = {}) {
  const along = vertical ? h : w, across = vertical ? w : h;
  for (let k = 0, b = 0; k < across; k += board, b++) {
    const d = ((hash3(b, seed) % 7) - 3) * 0.015, t = Math.min(board, across - k);
    const R = (a, s, l, n, col) => (vertical ? px(x + s, y + a, n, l, col) : px(x + a, y + s, l, n, col));
    R(0, k, along, t, tone(c, d));
    R(0, k, along, 1, tone(c, d + 0.05));
    if (t === board) R(0, k + board - 1, along, 1, tone(c, -0.13));
    for (let g = 0; g < 2; g++) { const hh = hash3(b, g, seed); R(hh % Math.max(1, along - 6), k + 1 + ((hh >>> 8) % Math.max(1, t - 2)), 3 + ((hh >>> 16) % 5), 1, tone(c, d - 0.05)); }
  }
}

/** Vent slots in a w × h box at (x, y): dark slits with a lit lower lip, every `gap` rows. */
export function vents(px, x, y, w, h, c, gap = 2) {
  for (let j = 0; j < h; j += gap) { px(x, y + j, w, 1, tone(c, -0.2)); if (j + 1 < h) px(x, y + j + 1, w, 1, tone(c, 0.05)); }
}
