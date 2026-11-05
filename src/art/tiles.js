// OLYMPUS art: surfaces that repeat (floors, deck plate, block walls), painted as tiles.
//
// A tile is a painting `metres` square at the stage's density that repeats without a seam: its
// patterns run in whole periods of its size, its noise is the periodic kind (tnoise), its random
// choices are hashes of the cell (tradecraft PIPELINE, 2026-10-26: "a tile drawn with noise() doesn't
// repeat; use tnoise(); make tiles of patches big so they don't beat"). Features are sized in metres
// and rounded to pixels at the density (u = ppm / 16, tradecraft's density as the reference), so a
// tread plate's diamonds, a block's courses and a plank's width are the same size in the world at
// 16 and 24 px/m, with more pixels in each at 24.
//
// The kinds: tradecraft's interior floors (sealed concrete, small white tiles, chequered lino, planks)
// and OLYMPUS's own (cast slabs with saw-cut joints, a ship's tread deck plate in bolted plates, a
// grating, rubber matting, painted concrete block for walls, Mars regolith). Each is cached by kind,
// size, density and base colour, so a tile asked for twice is one painting (and one atlas region).
// Pure.
import { paint } from './paint.js';
import { tone, hash3, tnoise } from './tone.js';
import { mottle, bevel, rivet } from './brush.js';
import { PX_PER_M } from '../render/scale.js';

/** Base colours by kind, sRGB. */
export const TILE_COLOURS = Object.freeze({
  concrete: 0x8f8f8a, slab: 0x9a9890, tiles: 0xdfe2e8, checker: 0xe2dac6, planks: 0x8f6345, deck: 0x6a7076,
  grating: 0x5c6268, rubber: 0x34363c, block: 0xb8b2a4, regolith: 0xa0603c,
});

const cache = new Map();

/** A repeating tile of `kind`, `metres` square, at density ppm, in base colour c (TILE_COLOURS by default). */
export function tile(kind, { metres = 1, ppm = PX_PER_M, c = TILE_COLOURS[kind] ?? 0xff00ff } = {}) {
  const key = `tile:${kind}:${metres}:${ppm}:${c}`;
  let t = cache.get(key);
  if (!t) {
    const n = Math.max(1, Math.round(metres * ppm)), u = ppm / 16, draw = TILES[kind];
    if (!draw) throw new Error(`no tile kind '${kind}'`);
    t = paint(n, n, (px) => draw(px, n, c, u, metres), { repeat: true, key });
    cache.set(key, t);
  }
  return t;
}
export const TILE_KINDS = () => Object.keys(TILES);

const TILES = {
  // Sealed concrete (tradecraft's range): a soft mottle, a speck here and there, no seam.
  concrete(px, n, c) {
    mottle(px, 0, 0, n, n, c, { cell: 6, step: 0.015, period: Math.max(1, Math.round(n / 6)), seed: 31, lo: 0.26, hi: 0.76 });
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const h = hash3(x, y, 5) % 197; if (h < 3) px(x, y, 1, 1, tone(c, -0.035)); }
  },
  // Cast slabs, one a tile, a saw-cut joint along its top and left (dark, a lit lip under it).
  slab(px, n, c) {
    TILES.concrete(px, n, c);
    px(0, 0, n, 1, tone(c, -0.12)); px(0, 0, 1, n, tone(c, -0.1));
    px(1, 1, n - 1, 1, tone(c, 0.03));
  },
  // Small white tiles in grout (a head's, a galley's), 4 px at 16 px/m.
  tiles(px, n, c, u) {
    const s = Math.max(3, Math.round(4 * u));
    px(0, 0, n, n, tone(c, -0.12));
    for (let y = 0; y < n; y += s) for (let x = 0; x < n; x += s) px(x, y, s - 1, s - 1, ((x + y) / s) % 2 ? c : tone(c, -0.02));
  },
  // Chequered lino, 0.5 m squares.
  checker(px, n, c) {
    const s = Math.max(1, Math.round(n / 2));
    for (let y = 0; y < n; y += s) for (let x = 0; x < n; x += s) px(x, y, s, s, ((x + y) / s) % 2 ? tone(c, -0.3) : c);
  },
  // Planks, 0.25 m wide, their ends staggered, a dark seam between.
  planks(px, n, c, u) {
    const w = Math.max(3, Math.round(4 * u)), len = Math.max(8, Math.round(16 * u));
    for (let x = 0, k = 0; x < n; x += w, k++) {
      const off = k % 2 ? Math.floor(len / 2) : 0;
      for (let y = -off; y < n; y += len) { px(x, y, w - 1, len - 1, tone(c, ((hash3(k, y, 3) % 5) - 2) * 0.02)); px(x, y + len - 1, w - 1, 1, tone(c, -0.12)); }
      px(x + w - 1, 0, 1, n, tone(c, -0.14));
    }
  },
  // A ship's deck: tread plate (raised diamonds in rows) in bolted plates a tile across, the seams dark.
  deck(px, n, c, u) {
    px(0, 0, n, n, c);
    const s = Math.max(4, Math.round(5 * u));
    for (let y = 2, r = 0; y < n - 2; y += s, r++) for (let x = 2 + (r % 2) * Math.floor(s / 2); x < n - 3; x += s) {
      px(x, y, 2, 1, tone(c, 0.06)); px(x + 1, y + 1, 2, 1, tone(c, -0.07));
    }
    px(0, n - 1, n, 1, tone(c, -0.16)); px(n - 1, 0, 1, n, tone(c, -0.14)); px(0, 0, n, 1, tone(c, 0.05));
    for (const [x, y] of [[2, 2], [n - 4, 2], [2, n - 4], [n - 4, n - 4]]) rivet(px, x, y, c);
  },
  // A grating: bars and the dark beneath them.
  grating(px, n, c, u) {
    const s = Math.max(3, Math.round(3 * u));
    px(0, 0, n, n, tone(c, -0.3));
    for (let x = 0; x < n; x += s) px(x, 0, 1, n, c);
    for (let y = 0; y < n; y += s * 2) { px(0, y, n, 1, tone(c, 0.04)); px(0, y + 1, n, 1, tone(c, -0.08)); }
  },
  // Rubber matting: dark, studded.
  rubber(px, n, c, u) {
    px(0, 0, n, n, c);
    const s = Math.max(3, Math.round(4 * u));
    for (let y = 1; y < n; y += s) for (let x = 1; x < n; x += s) { px(x, y, 1, 1, tone(c, 0.06)); px(x + 1, y + 1, 1, 1, tone(c, -0.05)); }
  },
  // Painted concrete block (a base building's walls): 0.4 × 0.2 m blocks in half bond, the joints a shade darker.
  block(px, n, c, u) {
    const bw = Math.max(4, Math.round(n / Math.max(1, Math.round(n / (6.4 * u))))), bh = Math.max(2, Math.round(3.2 * u));
    px(0, 0, n, n, tone(c, -0.05));
    for (let y = 0, r = 0; y < n; y += bh, r++) for (let x = (r % 2) * Math.floor(bw / 2) - bw; x < n; x += bw) {
      const d = ((hash3(x, r, 9) % 5) - 2) * 0.008;
      px(x, y, bw - 1, bh - 1, tone(c, d));
      px(x, y, bw - 1, 1, tone(c, d + 0.02));
    }
  },
  // Mars regolith: rust in two scales of mottle, grit and a few stones.
  regolith(px, n, c) {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = tnoise(x / 6, y / 6, Math.max(1, Math.round(n / 6)), 51) * 0.7 + tnoise(x / 2, y / 2, Math.max(1, Math.round(n / 2)), 52) * 0.3;
      px(x, y, 1, 1, v < 0.3 ? tone(c, -0.04) : v > 0.7 ? tone(c, 0.03) : c);
    }
    for (let k = 0; k < n * n / 24; k++) { const h = hash3(k, 61); px(h % n, (h >>> 10) % n, 1, 1, (h >>> 20) % 3 ? tone(c, -0.08) : tone(c, 0.06)); }
    for (let k = 0; k < Math.max(1, n / 12); k++) { const h = hash3(k, 62), x = h % n, y = (h >>> 10) % n; px(x, y, 2, 2, tone(c, -0.1)); px(x, y, 1, 1, tone(c, 0.04)); }
  },
};

/** A bevelled panel tile (a bulkhead's), w × h px: plates with seams and rivets; used by the deck painters. */
export function panelTile(w, h, c, u) {
  return paint(w, h, (px) => {
    px(0, 0, w, h, c);
    bevel(px, 0, 0, w, h, c, 1.4);
    for (let x = 3; x < w - 3; x += Math.max(6, Math.round(8 * u))) { rivet(px, x, 2, c); rivet(px, x, h - 4, c); }
  }, { repeat: true, key: `panel:${w}:${h}:${c}` });
}
