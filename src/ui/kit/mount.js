// OLYMPUS kit: the pixel pieces onto the page, at a whole number of CSS pixels a pixel (the build sheet 0.0.6 §2.3).
//
// A kit Pixmap (pixels.js: { w, h, data }, ImageData's byte order) is put on a canvas as it is and shown
// with image-rendering: pixelated at scale CSS pixels a pixel, a whole number so every column of a 3 × 5
// capital keeps its width (the runtime review of v0.0.5: the weapon card at 1.244 CSS px a pixel ran its
// letters uneven). A card's kit pixel is round(3 × --ui) CSS pixels (kitScale: 3 at --ui 1, 5 at 1.5, the
// least 2; my call: the strip's glyphs on the watch are 3 a pixel at --ui 1, and a card's letters stand 15 px
// tall); R's plate on the instinct's line is round(2 × --ui) (plateScale: the line's type is 12.5 px, and a
// 3 × 5 capital at two a pixel stands 10 px tall beside it, where at three the sleep's price ran to 570 px of
// the line's 720). pointOf(canvas, event, pm) turns a pointer's client position into the Pixmap's pixels,
// for list.js's point(); hitOf is list.js's, the piece under a pixel. The only module of the kit that
// touches the DOM.
export { hitOf } from './list.js';

/** A card's CSS pixels a kit pixel at an --ui (my call: round(3 × --ui), at least 2). */
export const kitScale = (ui = 1) => Math.max(2, Math.round(3 * ui));
/** R's plate's CSS pixels a kit pixel on the instinct's line at an --ui (my call: round(2 × --ui), at least 2). */
export const plateScale = (ui = 1) => Math.max(2, Math.round(2 * ui));

/** Put a Pixmap on a canvas, shown at scale CSS pixels a pixel. Returns the canvas. */
export function mountPixels(canvas, pm, { scale = 3 } = {}) {
  if (!canvas || !pm?.w || !pm?.h) return canvas;
  if (canvas.width !== pm.w) canvas.width = pm.w;
  if (canvas.height !== pm.h) canvas.height = pm.h;
  const g = canvas.getContext?.('2d');
  if (g) g.putImageData(new ImageData(new Uint8ClampedArray(pm.data.buffer, pm.data.byteOffset, pm.data.byteLength).slice(), pm.w, pm.h), 0, 0);
  const W = `${pm.w * scale}px`, H = `${pm.h * scale}px`;
  if (canvas.style.width !== W) canvas.style.width = W;
  if (canvas.style.height !== H) canvas.style.height = H;
  canvas.style.imageRendering = 'pixelated';
  return canvas;
}

/** A pointer's client position over a canvas as the Pixmap's pixels: { x, y } (whole pixels, floored). */
export function pointOf(canvas, e, pm = null) {
  const r = canvas.getBoundingClientRect(), w = pm?.w ?? canvas.width, h = pm?.h ?? canvas.height;
  return { x: Math.floor(((e.clientX - r.left) / Math.max(1, r.width)) * w), y: Math.floor(((e.clientY - r.top) / Math.max(1, r.height)) * h) };
}
