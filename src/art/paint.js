// OLYMPUS art: the texture painter. Pixels drawn by code into a typed array, uploaded once.
//
// Every texture of the look is painted pixel by pixel at PX_PER_M a metre (src/render/scale.js),
// as tradecraft's paint() did (src/art/pixelart.js): draw(px, w, h) fills rectangles of pixels with
// px(x, y, w, h, colour), y from the top, a negative size running left or up as a canvas's fillRect
// does, what falls off the texture left out. The pixels go into a Uint32Array, one store each (a
// fillRect a pixel with a CSS colour string to parse made a tradecraft street's paint 25–85 ms; the
// typed array made it a few). The result is a Pixmap, plain data: { w, h, data, repeat, key, glows }.
// It holds no GPU object. A texture is made from it in one upload (src/render/textures.js), or it is
// packed with others into an area's atlas (src/render/batch.js), so painting can happen at load or in
// budgeted slices (paintSteps(): a generator draw yields between its layers) and the GPU sees only
// whole, finished images, never a texture re-sent mid-play (the user, 2026-10-29, tradecraft: "each
// time I turn it staggers almost a second", the cost of one big upload).
//
// The alpha byte says two things. Below 128 the texel is a hole (a card's outline, a railing's gaps:
// alpha-tested away). At 248 and above it is opaque, and 255 − alpha is the texel's GLOW class: 0 is
// lit like any surface, the others light up when the mood says (a lamp's lens when lamps are on, a
// window at night, a floor strip in a blackout, a battle strip at battle stations, an emergency lamp,
// a screen). That is how one atlas carries what tradecraft needed an emissive map a texture for, and
// how the mood (src/render/moods.js) turns them on and off without repainting anything. A colour can
// be marked glowing by px()'s sixth argument or for the whole painting by `glows` ({ colour: class }).
//
// Pure: no DOM, no three.js, so the tests run it in node.

/** A texel's glow classes (255 − alpha): which mood lights it (src/render/moods.js glowK). */
export const GLOW = Object.freeze({ NONE: 0, ALWAYS: 1, LAMP: 2, NIGHT: 3, STRIP: 4, BATTLE: 5, EMERGENCY: 6, SCREEN: 7 });
export const GLOW_CLASSES = 8;

/** A colour 0xrrggbb (null: a hole) and a glow class, as the little-endian RGBA word a Uint32Array over RGBA bytes holds. */
export function word(c, glow = 0) {
  if (c === null || c === undefined) return 0;
  return ((((255 - glow) & 255) << 24) | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff)) >>> 0;
}
/** A word's colour (0xrrggbb), alpha and glow class. */
export function unword(v) {
  const a = v >>> 24;
  return { hex: ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff), alpha: a, glow: a >= 248 ? 255 - a : 0, hole: a < 128 };
}

/**
 * A painting w × h pixels: draw(px, w, h) paints it, px(x, y, w = 1, h = 1, colour = ink, glow = 0)
 * filling pixels (colour null clears them to a hole). `repeat`: it tiles (a floor, a wall's paint);
 * `glows`: { colour: class } marks colours that glow; `key`: its name, so a cache can find it again.
 */
export function paint(w, h, draw, opts = {}) {
  const g = paintSteps(w, h, draw, opts);
  for (;;) { const r = g.next(); if (r.done) return r.value; }
}

/** paint(), a step at a time: a draw that is a generator yields here too, so a builder can spread it over frames. */
export function* paintSteps(w, h, draw, { repeat = false, glows = null, key = null, fill = null } = {}) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const data = new Uint32Array(w * h);
  if (fill !== null) data.fill(word(fill));
  const lit = glows ? new Map(Object.entries(glows).map(([c, k]) => [Number(c), k])) : null;
  let lastC = -1, lastG = -1, lastV = 0, any = false;
  const px = (x, y, ww = 1, hh = 1, c = 0x1a1214, glow = 0) => {
    if (ww < 0) { x += ww; ww = -ww; }
    if (hh < 0) { y += hh; hh = -hh; }
    const x0 = Math.max(0, x | 0), x1 = Math.min(w, (x + ww) | 0), y0 = Math.max(0, y | 0), y1 = Math.min(h, (y + hh) | 0);
    if (!(x1 > x0 && y1 > y0)) return;
    if (c !== lastC || glow !== lastG) {
      lastC = c; lastG = glow;
      const k = glow || (lit && c !== null ? lit.get(c) ?? 0 : 0);
      if (k) any = true;
      lastV = word(c, k);
    }
    for (let yy = y0; yy < y1; yy++) data.fill(lastV, yy * w + x0, yy * w + x1);
  };
  const it = draw(px, w, h);
  if (it && typeof it.next === 'function') yield* it;
  return { w, h, data, repeat, key, glows: any };
}

/** The colour, alpha and glow class of pixel (x, y) of a painting. */
export const pixAt = (pm, x, y) => unword(pm.data[y * pm.w + x]);

/** A painting of one colour (a swatch), w × h. */
export const solid = (w, h, c, glow = 0) => paint(w, h, (px) => px(0, 0, w, h, c, glow));
