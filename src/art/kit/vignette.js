// OLYMPUS art: the splash's vignettes, the props and effects of an activity painted by code at the stage's density.
//
// VIEWS §5.2: "the vignette is part of the stage (props and effects at stage density, seen at zoom 3)".
// The fixtures themselves are the area's static kit (src/art/kit/head.js, quarters.js); what an activity
// adds while it runs is a handful of small paintings the render stands as cards over the fixture
// (src/render/vignettes.js), each a Pixmap painted once and kept by its key (VIGNETTE_PIECES):
//   - steam: the shower's mist, a cloud of dithered white-blue pixels in four frames that rise, at three
//     densities (rising as the water starts, thick while it runs, thinning while you dress), the wisps
//     that rise over the partitions; steamCover: the steam the bather stands in, its core opaque, between
//     the camera and the body from the shins to the shoulders, so the body is never drawn (VIEWS §3.4:
//     "the stall's curtain covers shoulders to shins; above it wet hair, below it bare feet"): in Head A
//     the stalls face north, their curtains on the far side, and the steam is what covers;
//   - water: the shower's fall, thin streaks from the head to the floor in four frames (VIEWS §5.2: "the
//     rain fall in a local rect");
//   - timer: the hot-water timer's lamp on the stall's panel, lit (a glow, drawn unlit) while the water runs;
//   - towelHung: the towel thrown over the stall's partition while you shower;
//   - mirrorFog: the mirror misting over the basin in four steps, its frames (hot water for a shave or a
//     wash; only where the mirror faces the camera: the Echo heads' mirrors hang on side walls);
//   - tap: the tap running into the basin, four frames;
//   - slide: a toilet stall's OCCUPIED slide, red; boots: a pair of boots seen from the side, under a
//     stall's partition (VIEWS §3.4: "boots visible under the gap");
//   - lockerOpen, lockerDoor: a wall locker with its door open (the kit's own open front: quarters.js
//     lockerFront) and the door swung out beside it, for dressing;
//   - beacon: the alert horn's red beacon in hall-2 (the build sheet §8, item 23), lit or dark.
// Variety comes from the activity's hash (the vignette's seed), never the sim's dice (VIEWS §5.2). Each
// piece also says how it stands: its size in metres and whether it is mist (drawn without an outline or
// a depth of its own, so a cloud has no ink round it) or solid. Pure: Pixmaps, no GPU objects.
import { paint, GLOW } from '../paint.js';
import { tone, hash3, noise } from '../tone.js';
import { lockerFront } from './quarters.js';
import { TOWEL } from '../figures/outfits.js';

/** The pieces a vignette can stand, by name: { wM, hM (their size, metres), mist (no outline, no depth), frames (how many) }. */
export const VIGNETTE_PIECES = Object.freeze({
  steam: Object.freeze({ wM: 0.85, hM: 1.3, mist: true, frames: 4 }),
  steamCover: Object.freeze({ wM: 0.875, hM: 0.8125, mist: true, frames: 4 }),
  water: Object.freeze({ wM: 0.42, hM: 1.85, mist: true, frames: 4 }),
  timer: Object.freeze({ wM: 0.125, hM: 0.125, mist: false, frames: 2 }),
  towelHung: Object.freeze({ wM: 0.25, hM: 0.55, mist: false, frames: 1 }),
  mirrorFog: Object.freeze({ wM: 0.56, hM: 0.7, mist: true, frames: 4 }),
  tap: Object.freeze({ wM: 0.0625, hM: 0.25, mist: true, frames: 4 }),
  slide: Object.freeze({ wM: 0.125, hM: 0.0625, mist: false, frames: 1 }),
  boots: Object.freeze({ wM: 0.375, hM: 0.1875, mist: false, frames: 1 }),
  lockerOpen: Object.freeze({ wM: 0.6, hM: 1.9, mist: false, frames: 1 }),
  lockerDoor: Object.freeze({ wM: 0.125, hM: 1.8, mist: false, frames: 1 }),
  beacon: Object.freeze({ wM: 0.25, hM: 0.25, mist: false, frames: 2 }),
});
/** The steam's three densities: rising as the water starts, thick while it runs, thinning after. */
export const STEAM_DENSITY = Object.freeze([0.55, 1.0, 0.32]);
const STEAM = 0xeef3f4, STEAM_SHADE = 0xc9d6dc, WATER = 0xa9c7d8, WATER_LIT = 0xdcecf4, BOOT = 0x47302a, RED = 0xb43a32;
/** A 4 × 4 Bayer threshold (the stage's dither everywhere), 0..1. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => (BAYER[(x & 3) + 4 * (y & 3)] + 0.5) / 16;

const cache = new Map();
/** The name a piece's painting is kept by. */
export const pieceKey = (name, { frame = 0, density = 0, seed = 0, on = 1, colour = 0, cover = 0 } = {}, ppm = 16) => `vig:${name}:${frame}:${density}:${seed % 4}:${on}:${colour}:${cover}:${ppm}`;

/**
 * A piece painted (see the header), from the cache when it has been: a Pixmap with .wM, .hM, .mist, .key.
 * opts: frame (an animation's; the mirror's mist, 0..3), density (steam: STEAM_DENSITY's index), cover
 * (steam a bather stands in: its core opaque), seed (the vignette's hash), on (a lamp lit: 1), colour (a
 * locker's), ppm.
 */
export function piece(name, opts = {}, ppm = 16) {
  const def = VIGNETTE_PIECES[name];
  if (!def) throw new Error(`vignette: no piece '${name}'`);
  const key = pieceKey(name, opts, ppm);
  let pm = cache.get(key);
  if (pm) return pm;
  const w = Math.max(1, Math.round(def.wM * ppm)), h = Math.max(1, Math.round(def.hM * ppm));
  pm = paint(w, h, (px) => PAINTERS[name](px, w, h, { ppm, frame: 0, density: 0, seed: 0, on: 1, colour: 0, cover: 0, ...opts, seed: (opts.seed ?? 0) % 4 }), { key });
  pm.wM = w / ppm; pm.hM = h / ppm; pm.mist = def.mist; pm.name = name;
  cache.set(key, pm);
  return pm;
}
/** How many pieces are painted (the tests' leak check). */
export const pieceCount = () => cache.size;

const PAINTERS = {
  // (a cloud: two octaves of noise scrolled up a quarter of its cell a frame, fuller in the middle and
  // the stall's upper half, cut against the Bayer threshold: a pixel-art mist, two tones. cover 1: the
  // steam a bather stands in, its core opaque from side to side and top to bottom so the body is never
  // drawn (VIEWS §3.4), only its edges dithered; cover 0: wisps rising over the partitions)
  steamCover(px, w, h, o) { PAINTERS.steam(px, w, h, { ...o, cover: 1 }); },
  steam(px, w, h, { ppm, frame, density, seed, cover }) {
    const d = STEAM_DENSITY[density] ?? STEAM_DENSITY[1], k = ppm / 16, rise = frame * 2 * k;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w - 0.5, v = (y + 0.5) / h;
      const n = noise(x / (4 * k), (y + rise) / (3.5 * k), seed + 11) * 0.65 + noise(x / (2 * k), (y + rise * 1.6) / (2 * k), seed + 23) * 0.35;
      const t = bayer(x, y);
      if (cover) {
        // (the core: opaque, its two tones by the noise; the rim: dithered away over a few pixels)
        const rim = Math.min(Math.min(x + 0.5, w - x - 0.5) / (2.2 * k), Math.min(y + 0.5, h - y - 0.5) / (2.6 * k), 1);
        const a = rim * (0.75 + 0.5 * n) + (rim >= 1 ? 1 : 0);
        if (a <= t) continue;
        px(x, y, 1, 1, n > 0.62 ? STEAM_SHADE : n > 0.3 || (x + y + frame) % 7 ? STEAM : STEAM_SHADE);
        continue;
      }
      const body = (1 - Math.min(1, (u * 2) ** 4)) * (0.7 + 0.3 * (1 - v));             // (fullest across the middle, and higher up where the hot air goes)
      const a = d * (0.55 + 0.9 * n) * body;
      if (a > t + 0.28) px(x, y, 1, 1, STEAM);
      else if (a > t) px(x, y, 1, 1, STEAM_SHADE);
    }
  },
  // (streaks a pixel wide falling from the head, in columns that spread toward the floor, each with a
  // lit head and a darker tail; four frames, each a quarter of a streak's cycle further down)
  water(px, w, h, { ppm, frame, seed }) {
    const k = ppm / 16, cols = Math.max(3, Math.round(w / (2 * k))), len = Math.max(3, Math.round(5 * k)), cyc = Math.max(8, Math.round(12 * k));
    for (let c = 0; c < cols; c++) {
      const spread = (c + 0.5) / cols - 0.5;
      for (let y = 0; y < h; y++) {
        const x = Math.round(w / 2 + spread * (w * 0.3 + (w * 0.7) * (y / h)));
        const ph = (y - frame * cyc / 4 + hash3(c, seed, 5) % cyc) % cyc;
        if (ph < 0 || ph >= len) continue;
        px(x, y, 1, 1, ph === 0 ? WATER_LIT : ph < len - 1 ? WATER : tone(WATER, -0.08));
      }
    }
    // (the splash at the floor: a few bright pixels round the drain)
    for (let i = 0; i < w; i += 2) if (hash3(i, frame, seed) % 3 === 0) px(i, h - 1 - (hash3(i, seed) % 2), 1, 1, WATER_LIT);
  },
  // (the hot-water timer: a small housing with its lamp, green while it runs, dark when off)
  timer(px, w, h, { on }) {
    px(0, 0, w, h, 0x7c736b); px(0, 0, w, 1, tone(0x7c736b, 0.08));
    const s = Math.max(1, Math.floor(w / 2));
    px(Math.floor((w - s) / 2), Math.floor((h - s) / 2), s, s, on ? 0x9fe0b0 : 0x31292a, on ? GLOW.ALWAYS : 0);
  },
  // (the towel over the partition: a fold over its top, hanging down the near side, its hem darker)
  towelHung(px, w, h, { ppm }) {
    const k = ppm / 16;
    px(0, 0, w, h, TOWEL);
    px(0, 0, w, Math.max(1, Math.round(k)), tone(TOWEL, 0.08));
    for (let x = 1; x < w; x += Math.max(2, Math.round(3 * k))) px(x, 1, 1, h - 2, tone(TOWEL, -0.05));
    px(0, h - 1, w, 1, tone(TOWEL, -0.12)); px(w - 1, 0, 1, h, tone(TOWEL, -0.1));
  },
  // (the mirror misting: a pale bloom from the basin up, step 0 a breath of it, 3 the whole glass but a
  // wiped streak; dithered, so the mirror's own pixels show through)
  mirrorFog(px, w, h, { frame, seed }) {
    const step = frame, k = (step + 1) / 4;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = 1 - y / h, u = Math.abs((x + 0.5) / w - 0.5) * 2;
      const a = k * 1.25 * (0.4 + 0.6 * v) * (1 - 0.5 * u * u) + (noise(x / 3, y / 3, seed + 3) - 0.5) * 0.3;
      if (step >= 3 && Math.abs(x - w * 0.45 - (y - h / 2) * 0.3) < 1.5) continue;     // (the wiped streak: someone wanted to see their face)
      if (a > bayer(x, y) + 0.1) px(x, y, 1, 1, (x + y) % 3 ? 0xd8e0e2 : 0xc7d5d0);
    }
  },
  // (the tap running: a thin stream with a bright fleck moving down it)
  tap(px, w, h, { frame }) {
    for (let y = 0; y < h; y++) px(Math.floor(w / 2), y, 1, 1, (y + frame) % 4 === 0 ? WATER_LIT : WATER);
  },
  // (the OCCUPIED slide: red, its frame steel)
  slide(px, w, h) { px(0, 0, w, h, 0x7c736b); px(Math.min(1, w - 1), 0, Math.max(1, w - 2), h, RED); },
  // (a pair of boots side on under the partition: two soles, the near boot over the far)
  boots(px, w, h, { ppm }) {
    const k = ppm / 16, bw = Math.max(3, Math.round(4 * k)), bh = h;
    for (const [x0, c] of [[0, tone(BOOT, -0.1)], [Math.round(w - bw - 1 * k), BOOT]]) {
      px(x0, 0, Math.max(2, Math.round(2 * k)), bh, c);
      px(x0, bh - Math.max(1, Math.round(k)), bw, Math.max(1, Math.round(k)), c);
      px(x0, bh - 1, bw, 1, 0x282b34);
    }
  },
  // (the locker open: the kit's own front, its door open, the uniforms inside)
  lockerOpen(px, w, h, { ppm, colour, seed }) { lockerFront('single', colour || 0x4c633d, 200 + (seed % 60), true, seed)(px, w, h, ppm); },
  // (the door swung out, nearly edge on: its frame and the inside of its leaf)
  lockerDoor(px, w, h, { colour }) {
    const c = colour || 0x4c633d;
    px(0, 0, w, h, tone(c, -0.1)); px(0, 0, 1, h, tone(c, 0.06)); px(w - 1, 0, 1, h, tone(c, -0.2));
    for (let y = Math.floor(h * 0.1); y < h * 0.9; y += 3) px(1, y, Math.max(1, w - 2), 1, tone(c, -0.16));
  },
  // (the horn's beacon: a red lens in a steel cage, lit (it glows, unlit by the scene) or dark)
  beacon(px, w, h, { on }) {
    px(0, 0, w, h, 0x565b67); px(0, 0, w, 1, tone(0x565b67, 0.1));
    const r = Math.max(1, Math.floor(w / 2) - 1), cx = Math.floor(w / 2), cy = Math.floor(h / 2);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.5) px(cx + x - (w % 2 ? 0 : 1) + 1, cy + y, 1, 1, on ? (y < 0 ? 0xff8a70 : 0xff4a3a) : 0x6e2a2e, on ? GLOW.ALWAYS : 0);
    px(0, cy, w, 1, 0x49403e);                                       // (the cage's band)
  },
};
