// OLYMPUS art: the palettes every pixel is snapped to, and the lookup that makes the snap cheap.
//
// Pixel art holds together because every pixel on screen is one of a few hand-chosen colours
// (tradecraft PIPELINE, 2026-10-25). The post pass (src/render/post.js) snaps each pixel of the
// lit, outlined picture to the nearest colour of the active palette. A palette is generated, not
// hand-listed: families of colour, each a hue and a chroma in OKLCH, taken at a run of lightness
// steps, chroma easing off toward the ends (× 1 − 0.9 · |L − 0.55|) and the hue shifted as a pixel
// artist shifts it (src/art/tone.js: darker toward violet, lighter toward yellow), plus a few fixed
// colours (ink, paper, the two lamp glows).
//
// TRADECRAFT is tradecraft's FINE_PALETTE exactly (sample 007, "after Stoneshard": 14 families × 8
// steps + 4 fixed = 116 colours), the look the user picked on 2026-10-26 ("I like the smaller
// figures, but the new environment"). The per-place palettes keep its method and its core families
// (neutral and cool greys, skin, wood, olive drab, the red, the glows) and trade the rest for the
// place's own colour (all my call, to be scored by the user in look samples):
//   - MARS: iron-oxide ochres, rust, butterscotch dust, basalt rose-grey, khaki; blues kept for the
//     young northern sea and the blue sunset;
//   - SHIP: greys in four temperatures (bulkhead, deck, steel, khaki), hazard yellow, safety red,
//     console teal, status green, emergency amber;
//   - EUROPA: ice blues and cyans with a lighter top step (0.93) for snow and frost, deep water blue,
//     violet shadow, Europa's chaos-terrain brown, the lamps' amber.
// Every palette built here carries the FIXED colours, so ink lines, paper and lamp glow read the
// same everywhere; SHIP_GLOWS (the floor strips' amber, the battle strip's red) go in the place
// palettes that have ship and base lighting moods.
//
// The snap's metric is tradecraft's ("luma counts most"):
//   e = 0.30 dr² + 0.59 dg² + 0.11 db² + 0.25 (dr² + dg² + db²), on gamma-encoded 0..1 channels.
// tradecraft ran it as a loop over the palette in the post shader for every pixel; at 960 × 540
// that is 60 M distances a frame. Here the work is baked once per palette into a lookup: the colour
// cube cut into LUT_LEVELS levels a channel (64: a level is 4/255), each cell holding the indices of
// the LUT_CANDIDATES (4, one a byte of an RGBA texel) palette colours nearest its centre, nearest
// first; blue's 64 planes are laid out LUT_TILES × LUT_TILES (8 × 8) in one 512 × 512 texture. The post
// pass reads a pixel's cell with one texelFetch and measures the pixel against those four only, so
// its answer is the exact loop's unless the true nearest colour is not among the cell centre's four
// (measured 2026-11-05 on 30,000 random colours: 99.98–99.997% exact for the four palettes, the misses
// within 4e-4 of a tie; a single nearest a cell was 96% exact, misses up to 3.7e-3). The post pass
// bakes the lookup on the GPU with this same metric (src/render/post.js); bakeLut() here is the CPU
// twin the tests check against. Palettes hold at most 256 colours (an index is a byte).
import { fromOklch, shiftHue, rgbOf } from './tone.js';

/** The lightness steps of a family (tradecraft's eight). */
export const STEPS_L = Object.freeze([0.2, 0.29, 0.38, 0.47, 0.56, 0.66, 0.76, 0.86]);
/** The lightness where chroma is full and the hue unshifted; and how fast chroma eases off from it. */
export const CENTRE_L = 0.55, CHROMA_EASE = 0.9;
export const INK = 0x1a1214, PAPER = 0xf4efe6;
/** Lit windows and lamps: these glow at night (tradecraft's GLOWS). */
export const GLOWS = Object.freeze([0xe7b84a, 0xf8e08a]);
export const FIXED = Object.freeze([INK, PAPER, ...GLOWS]);
/** A ship's emergency floor strips (amber) and battle-stations strip (red), as longhaul's room cameras show them. */
export const SHIP_GLOWS = Object.freeze([0xffa23a, 0xff4a3a]);

/** One family's ramp: hue° and chroma at each lightness step, chroma easing off, hue shifted. */
export function ramp(hue, chroma, steps = STEPS_L, { centre = CENTRE_L, ease = CHROMA_EASE } = {}) {
  return steps.map(L => fromOklch(L, chroma * (1 - ease * Math.abs(L - centre)), shiftHue(hue, L - centre)));
}

/**
 * A palette from parameters: { families: [[hue°, chroma, steps?], ...], steps, fixed, centre, ease }.
 * Each family's ramp in order, then the fixed colours; a colour already in is not added twice.
 */
export function buildPalette({ families, steps = STEPS_L, fixed = FIXED, centre = CENTRE_L, ease = CHROMA_EASE }) {
  const out = [], seen = new Set();
  const put = (c) => { if (!seen.has(c)) { seen.add(c); out.push(c); } };
  for (const [h, c, st] of families) for (const x of ramp(h, c, st ?? steps, { centre, ease })) put(x);
  for (const x of fixed) put(x);
  return out;
}

const ICE_STEPS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88, 0.94];

/** The places' parameters (see the header): families as [hue°, chroma, steps?]. */
export const PLACES = Object.freeze({
  tradecraft: {
    families: [[60, 0.016], [265, 0.022], [55, 0.05], [75, 0.095], [35, 0.11], [22, 0.13], [50, 0.07],
      [115, 0.07], [145, 0.09], [195, 0.06], [250, 0.08], [275, 0.06], [325, 0.07], [85, 0.04]],
    fixed: FIXED,
  },
  mars: {
    families: [
      [60, 0.016], [265, 0.022],                 // concrete and steel greys
      [55, 0.05], [50, 0.07],                    // skin and beige; wood and leather
      [45, 0.12], [35, 0.1], [68, 0.09],         // regolith rust, red dust, butterscotch dust
      [22, 0.13], [20, 0.04],                    // MCRN red and brick; basalt with its oxide
      [115, 0.07], [100, 0.05], [85, 0.04],      // olive drab, khaki, sand grey
      [145, 0.07], [195, 0.05], [250, 0.07],     // lichen and crops, screens, the sea and the blue sunset
    ],
    fixed: [...FIXED, ...SHIP_GLOWS],
  },
  ship: {
    families: [
      [60, 0.012], [255, 0.018], [230, 0.03], [180, 0.025], [90, 0.02],   // neutral, cool, bulkhead blue-grey, deck green-grey, khaki grey
      [85, 0.13], [25, 0.14], [70, 0.11],                                  // hazard yellow, safety red, emergency amber
      [55, 0.05], [40, 0.08], [115, 0.07],                                 // skin, brown skin and wood, olive drab
      [200, 0.07], [150, 0.09], [265, 0.06],                               // console teal, status green, violet shadow
    ],
    fixed: [...FIXED, ...SHIP_GLOWS],
  },
  europa: {
    families: [
      [60, 0.012], [255, 0.02],                                           // greys
      [220, 0.05, ICE_STEPS], [200, 0.06, ICE_STEPS], [190, 0.03, ICE_STEPS],   // ice blue, cyan ice, glacier white
      [240, 0.08], [270, 0.05],                                           // deep water blue, violet shadow
      [55, 0.05], [40, 0.08], [115, 0.07],                                // skin, chaos brown and wood, olive drab
      [85, 0.13], [25, 0.14], [70, 0.11], [145, 0.07],                    // hazard yellow, red, lamp amber, green
    ],
    fixed: [...FIXED, ...SHIP_GLOWS],
  },
});

/** The built palettes, by place name (arrays of 0xrrggbb). */
export const PALETTES = Object.freeze(Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, Object.freeze(buildPalette(p))])));
/** tradecraft's FINE_PALETTE (116 colours), the default. */
export const TRADECRAFT = PALETTES.tradecraft;

// ---------- the snap ----------

/** The snap's distance between two colours given as gamma-encoded 0..1 channels (luma counts most). */
export function paletteDistance(r, g, b, pr, pg, pb) {
  const dr = r - pr, dg = g - pg, db = b - pb;
  return 0.30 * dr * dr + 0.59 * dg * dg + 0.11 * db * db + 0.25 * (dr * dr + dg * dg + db * db);
}
/** A palette as a Float32Array of r, g, b triples 0..1, for the loops below. */
export function paletteRgb(palette) {
  const out = new Float32Array(palette.length * 3);
  palette.forEach((c, i) => out.set(rgbOf(c), i * 3));
  return out;
}
/** The index of the palette colour nearest (r, g, b) 0..1; first wins a tie, as the shader's loop. */
export function nearestIndex(r, g, b, rgb) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < rgb.length; i += 3) {
    const e = paletteDistance(r, g, b, rgb[i], rgb[i + 1], rgb[i + 2]);
    if (e < bd) { bd = e; best = i / 3; }
  }
  return best;
}
/** The palette colour nearest `hex`, measured as the post pass measures it. */
export function nearest(hex, palette) {
  const [r, g, b] = rgbOf(hex);
  return palette[nearestIndex(r, g, b, paletteRgb(palette))];
}

/** Levels a channel in the lookup, how blue's planes are tiled in its texture, candidates a cell. */
export const LUT_LEVELS = 64, LUT_TILES = 8, LUT_CANDIDATES = 4;
/** The lookup's level for a channel 0..1 (rounded to the nearest, as the shader rounds). */
export const lutLevel = (v, n = LUT_LEVELS) => Math.min(n - 1, Math.max(0, Math.floor(v * (n - 1) + 0.5)));
/** The lookup texture's size in texels. */
export const lutSize = (n = LUT_LEVELS, tiles = LUT_TILES) => [n * tiles, n * Math.ceil(n / tiles)];
/** The texel [x, y] holding the answer for levels (ri, gi, bi). */
export function lutTexelOf(ri, gi, bi, n = LUT_LEVELS, tiles = LUT_TILES) {
  return [ri + n * (bi % tiles), gi + n * Math.floor(bi / tiles)];
}
/** The texel [x, y] for a colour (r, g, b) 0..1. */
export const lutTexel = (r, g, b, n = LUT_LEVELS, tiles = LUT_TILES) => lutTexelOf(lutLevel(r, n), lutLevel(g, n), lutLevel(b, n), n, tiles);

/** The indices of the k palette colours nearest (r, g, b), nearest first (a tie: the lower index first, as the loop). */
export function nearestK(r, g, b, rgb, k = LUT_CANDIDATES) {
  const d = new Array(k).fill(Infinity), ix = new Array(k).fill(0);
  for (let i = 0; i < rgb.length / 3; i++) {
    const e = paletteDistance(r, g, b, rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
    if (!(e < d[k - 1])) continue;
    let j = k - 1;
    while (j > 0 && e < d[j - 1]) { d[j] = d[j - 1]; ix[j] = ix[j - 1]; j--; }
    d[j] = e; ix[j] = i;
  }
  return ix;
}

/**
 * The lookup baked on the CPU: { w, h, data } RGBA bytes, each texel the indices of the four palette
 * colours nearest its cell's centre (level / (n − 1) a channel). The GPU bakes the same (post.js).
 */
export function bakeLut(palette, n = LUT_LEVELS, tiles = LUT_TILES) {
  if (palette.length > 256) throw new Error(`a palette of ${palette.length} colours: the lookup holds 256`);
  const [w, h] = lutSize(n, tiles), data = new Uint8Array(w * h * 4), rgb = paletteRgb(palette);
  for (let bi = 0; bi < n; bi++) for (let gi = 0; gi < n; gi++) for (let ri = 0; ri < n; ri++) {
    const ix = nearestK(ri / (n - 1), gi / (n - 1), bi / (n - 1), rgb);
    const [x, y] = lutTexelOf(ri, gi, bi, n, tiles);
    data.set(ix, (y * w + x) * 4);
  }
  return { w, h, data };
}
/** What the lookup answers for a hex colour: the nearest of its cell's four candidates, as the post pass picks. */
export function lutSnap(lut, hex, palette, n = LUT_LEVELS, tiles = LUT_TILES) {
  const [r, g, b] = rgbOf(hex), [x, y] = lutTexel(r, g, b, n, tiles), p = (y * lut.w + x) * 4;
  let best = -1, bd = Infinity;
  for (let j = 0; j < LUT_CANDIDATES; j++) {
    const c = palette[lut.data[p + j]], [pr, pg, pb] = rgbOf(c), e = paletteDistance(r, g, b, pr, pg, pb);
    if (e < bd) { bd = e; best = c; }
  }
  return best;
}
