// OLYMPUS render: the pixel density, one number for the whole stage.
//
// The close-up view is a small picture of fixed density: PX_PER_M pixels to a metre, along the
// ground, up a wall and across (src/render/camera.js makes all three the same). Which density is
// the user's call, by look samples (DESIGN.md, Space and scales: "Pixel density is decided by look
// samples the user scores ... Everything takes PX_PER_M from one constant, so the choice is a
// number"). The two candidates:
//   - 16 px/m at 640 × 360, tradecraft's (the user's pick there, 2026-10-26);
//   - 24 px/m at 960 × 540, Stoneshard's frame (2 × 2 screen pixels a pixel at 1080p), finer.
// Both show the same 40 × 22.5 m of the world on a 16:9 window: only the pixel size changes.
//
// The density comes from the page's query (?ppm=16 or ?ppm=24; 24 by default, my call: the finer
// one is the open question the samples put to the user), read once at load: the stage, the
// painters and the batcher all import PX_PER_M from here and never hold another number for it.
// In node (tests) the query is absent; OLYMPUS_PPM in the environment picks instead.
//
// On a window of another shape the picture widens on its longer side, as tradecraft's did
// (src/ui/ui.js fit()): more of the world, never a stretched pixel, up to MAX_VIEW_M (tradecraft's
// RES_MAX, 768 × 430 at 16 px/m, in metres), and a border beyond that. Its sides are kept even so
// the camera's centre falls on a pixel corner and box edges on the metre grid land on pixel edges.
// It is then shown at any scale, sharp-bilinear (src/render/post.js): every pixel the same size.

/** The two densities the samples compare: px/m and the 16:9 picture. */
export const DENSITIES = Object.freeze({
  16: Object.freeze({ pxPerM: 16, res: Object.freeze([640, 360]) }),
  24: Object.freeze({ pxPerM: 24, res: Object.freeze([960, 540]) }),
});
export const DEFAULT_PPM = 24;
/** The widest the picture grows on an odd-shaped window, metres (tradecraft's 768 × 430 px at 16 px/m). */
export const MAX_VIEW_M = Object.freeze([48, 26.875]);
/** sin 45°: what a metre of ground or wall becomes along the camera's vertical axis. */
export const S45 = Math.SQRT1_2;

/** The density a query string (or an environment value) asks for: 16 or 24, else the default. */
export function densityFrom(search = '', env = null) {
  let v = null;
  try { v = new URLSearchParams(search).get('ppm'); } catch { v = null; }
  if (v === null && env !== null && env !== undefined) v = String(env);
  const n = Number(v);
  return DENSITIES[n] ? n : DEFAULT_PPM;
}

const search = typeof globalThis.location !== 'undefined' ? globalThis.location.search : '';
const env = typeof globalThis.process !== 'undefined' ? globalThis.process.env?.OLYMPUS_PPM ?? null : null;

/** Pixels a metre, on the ground, up a wall and across. */
export const PX_PER_M = densityFrom(search, env);
export const M_PER_PX = 1 / PX_PER_M;
/** The picture on a 16:9 window, pixels. */
export const RES = DENSITIES[PX_PER_M].res;
const even = (v) => 2 * Math.round(v / 2);
/** The widest and tallest the picture grows on a window of another shape, pixels (even). */
export const RES_MAX = Object.freeze([even(MAX_VIEW_M[0] * PX_PER_M), even(MAX_VIEW_M[1] * PX_PER_M)]);

/** A length in metres snapped to the pixel grid (a whole number of pixels at ppm). */
export const snapM = (m, ppm = PX_PER_M) => Math.round(m * ppm) / ppm;

/**
 * The picture for a window of winW × winH CSS pixels at device ratio dpr: { w, h } the picture in
 * pixels (RES, widened to the window's shape up to resMax, both even), the frame it fills on the page
 * (cssW × cssH at left, top: scaled to fit, any scale) and the canvas behind it in device pixels
 * (outW × outH), with scale, the screen pixels a picture pixel spans (what the blit needs).
 */
export function frameFor(winW, winH, dpr = 1, { res = RES, resMax = RES_MAX } = {}) {
  let w = res[0], h = res[1];
  if (winW * h > winH * w) w = Math.min(resMax[0], even(h * winW / winH));
  else h = Math.min(resMax[1], even(w * winH / winW));
  const s = Math.min(winW / w, winH / h), cssW = Math.round(w * s), cssH = Math.round(h * s);
  const outW = Math.max(1, Math.round(cssW * dpr)), outH = Math.max(1, Math.round(cssH * dpr));
  return { w, h, cssW, cssH, left: Math.floor((winW - cssW) / 2), top: Math.floor((winH - cssH) / 2), outW, outH, scale: outW / w };
}
