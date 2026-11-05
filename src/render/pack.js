// OLYMPUS render: packing paintings into an atlas, shelf by shelf.
//
// An area's static kit (src/render/batch.js) shares one material, so every painted face and tile of
// it goes into one texture, the atlas. The packing is the plain shelf method: tallest first, laid left
// to right along a shelf as tall as its first, a new shelf when the row is full, a new page when the
// page is. It wastes a little (shelves are as tall as their tallest) and is fast, predictable and easy
// to check. A page is as wide as the smallest power of two that holds the widest painting and the
// square root of the total area (so pages come out squarish), its height the shelves' rounded up to a
// multiple of 4. No gutters: the batch shader reads texel centres only (floor + 0.5) and wraps inside
// a region, so a texel never borrows its neighbour's colour.
// Pure.

const pow2 = (v) => 2 ** Math.ceil(Math.log2(Math.max(1, v)));

/**
 * Pack rectangles [{ w, h }] (whole texels): { pages: [{ w, h }], places: [{ page, x, y }] } in the
 * input's order. maxSize caps a page's side; a rectangle bigger than that is an error.
 */
export function pack(rects, { maxSize = 4096, minWidth = 64 } = {}) {
  const places = new Array(rects.length);
  if (!rects.length) return { pages: [], places };
  let area = 0, widest = 0;
  for (const r of rects) {
    if (r.w > maxSize || r.h > maxSize) throw new Error(`a painting of ${r.w} × ${r.h} is bigger than an atlas page (${maxSize})`);
    area += r.w * r.h; widest = Math.max(widest, r.w);
  }
  const W = Math.min(maxSize, Math.max(minWidth, pow2(widest), pow2(Math.sqrt(area * 1.15))));
  const order = rects.map((_, i) => i).sort((a, b) => rects[b].h - rects[a].h || rects[b].w - rects[a].w || a - b);
  const pages = [];
  let page = 0, x = 0, y = 0, shelf = 0;
  for (const i of order) {
    const { w, h } = rects[i];
    if (x + w > W) { y += shelf; x = 0; shelf = 0; }
    if (y + h > maxSize) { pages[page] = { w: W, h: Math.ceil(y / 4) * 4 }; page++; x = 0; y = 0; shelf = 0; }
    places[i] = { page, x, y };
    x += w; shelf = Math.max(shelf, h);
    pages[page] = { w: W, h: Math.ceil((y + shelf) / 4) * 4 };
  }
  return { pages, places };
}

/** How much of the pages' area the rectangles fill, 0..1. */
export function packFill(rects, packed) {
  const used = rects.reduce((a, r) => a + r.w * r.h, 0), total = packed.pages.reduce((a, p) => a + p.w * p.h, 0);
  return total ? used / total : 0;
}
