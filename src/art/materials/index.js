// OLYMPUS art: the painted materials, in one place. What a surface is made of, as a way of painting it.
//
// surfaces.js holds the stuff (concrete, sintered regolith brick, painted steel, deck plate, rubber
// matting, ceramic, regolith, rock, ice, and frost and dust laid over a painting), each a painter
// (px, x, y, w, h, o) sized in metres at the density o.ppm, and tile(kind, opts) for a repeating
// one. wear.js holds the marks of use (grime at a foot, chipped paint, scuffs, streaks, stains,
// cracks, dust in corners) and the panel bevels. The kit (src/art/kit/) and the terrain
// (src/art/terrain/) paint with these, so a locker's olive and a footlocker's are one paint, worn
// the same way. The colours here are the places' own, picked near the Mars and ship place sets'
// families (src/art/palette.js) so a face shows what it was painted, snapped to itself.
// Pure.
export * from './surfaces.js';
export * from './wear.js';

/** Base colours by stuff (sRGB), near the Mars and ship palettes' families. */
export const STUFF = Object.freeze({
  concrete: 0x999189, slab: 0x9c917a, sinter: 0x9a5d3e, sinterPale: 0xb28a59,
  olive: 0x5b6a44, oliveDark: 0x4c5a3a, drab: 0x737949, steelGrey: 0x7c7f86, gunmetal: 0x3e424d,
  bulkhead: 0x6d757f, bulkheadPale: 0xa7b4b4, deck: 0x657974, deckDark: 0x4c5f5e,
  rubber: 0x31292a, ceramic: 0xd6d0c9, regolith: 0xa65e4b, dust: 0xc18064, basalt: 0x6e5256, layered: 0xc4aba1,
  ice: 0xa6b4b5, frost: 0xc7d5d0,
  hazard: 0xd0ac5e, hazardDark: 0x302a2a, safetyRed: 0xb84e48, mcrnRed: 0x8f3f31,
});
