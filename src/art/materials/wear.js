// OLYMPUS art: wear, the marks that make a painted surface look used. Brushes for the kit and the terrain.
//
// tradecraft's finish (the user picked it on 2026-10-26: "I like the smaller figures, but the new
// environment", sample 007, "after Stoneshard") is in the wear: plaster grimy at the foot, damp
// stains run down from the joints, cracks with a lit lip, paint chipped back to the metal at the
// edges people touch (src/art/pixeltown.js painter(): weathered, concrete, streaks). These brushes
// are those moves, sized in metres and turned into pixels at the density they are painted at
// (u = ppm / 16, tradecraft's density as the reference), so a scuff is the same size in the world
// at 16 and at 24 px/m and only has more pixels at 24.
//
// Every brush takes the painter's px() and a rectangle in pixels (y down), a base colour and a
// seed; its random choices are hashes of the seed and the pixel (tone.js hash3), never Math.random,
// so a surface paints the same every time. The steps are small (0.02 to 0.06 OKLCH L), as tradecraft
// learned on big flat things ("keep noise steps about 0.03 OKLCH L", 2026-10-26): wear is read in
// the pattern, not the contrast, and night light turns loud noise into static.
// Pure.
import { tone, hash3, noise } from '../tone.js';

/** A size in metres as whole pixels at ppm (at least `min`). */
export const P = (m, ppm, min = 1) => Math.max(min, Math.round(m * ppm));
const frac = (h) => (h >>> 8) / 16777216;

/** Grime rising from the foot of a wall or a cabinet: darker toward the bottom `upM` metres, ragged at its top edge. */
export function grimeFoot(px, x, y, w, h, c, { ppm = 16, upM = 0.35, k = 1, seed = 1 } = {}) {
  const up = P(upM, ppm, 2);
  for (let i = 0; i < w; i++) for (let j = 0; j < Math.min(up, h); j++) {
    const yy = y + h - 1 - j, t = 1 - j / up;
    if (noise((x + i) / (2.2 * ppm / 16), yy / (1.6 * ppm / 16), seed + 71) < t * 0.9) px(x + i, yy, 1, 1, tone(c, -0.035 * k - (t > 0.75 ? 0.015 * k : 0)));
  }
}

/** Paint chipped back to bare metal (or the primer) along the edges of (x, y, w, h): a few pixels, more near the corners and the foot. */
export function chips(px, x, y, w, h, c, { bare = 0x8f959c, ppm = 16, per = 0.05, seed = 1 } = {}) {
  const n = Math.max(1, Math.round((w + h) * 2 * per));
  for (let k = 0; k < n; k++) {
    const r = hash3(k, seed, 311), side = r % 4, t = frac(r);
    const along = side < 2 ? Math.floor(t * w) : Math.floor(t * h);
    const [cx, cy] = side === 0 ? [x + along, y] : side === 1 ? [x + along, y + h - 1] : side === 2 ? [x, y + along] : [x + w - 1, y + along];
    const len = 1 + ((r >>> 4) % Math.max(1, Math.round(ppm / 12)));
    px(cx, cy, side < 2 ? len : 1, side < 2 ? 1 : len, (r >>> 20) % 3 ? bare : tone(c, -0.12));
  }
}

/** Scuffs: short dark strokes, mostly horizontal, low on a face (boots, trolleys, chairs pushed in). */
export function scuffs(px, x, y, w, h, c, { ppm = 16, n = null, lowM = 0.5, seed = 1, k = 1 } = {}) {
  const count = n ?? Math.max(1, Math.round(w * h / (900 * (ppm / 16) ** 2)));
  const band = Math.min(h, P(lowM, ppm, 2));
  for (let i = 0; i < count; i++) {
    const r = hash3(i, seed, 509), len = 2 + (r % Math.max(2, Math.round(ppm / 5)));
    const sx = x + Math.floor(frac(r) * Math.max(1, w - len)), sy = y + h - 1 - Math.floor(frac(hash3(r, 7)) * band);
    px(sx, sy, len, 1, tone(c, -0.05 * k));
    if ((r >>> 3) % 3 === 0) px(sx + 1, sy - 1, Math.max(1, len - 2), 1, tone(c, -0.03 * k));
  }
}

/** Streaks run down from a line at y over (x, w): damp, rust or dust, `len` metres at most, a pixel or two wide. */
export function streaks(px, x, y, w, maxY, c, { ppm = 16, lenM = 0.6, per = 0.25, dL = -0.04, seed = 1, colour = null } = {}) {
  for (let i = 0; i < w; i++) {
    const r = hash3(i + x, seed, 613);
    if (frac(r) > per) continue;
    const len = Math.round((0.15 + 0.85 * frac(hash3(r, 3))) * lenM * ppm);
    for (let j = 0; j < len && y + j < maxY; j++) {
      const fade = j / len;
      if (fade > 0.6 && hash3(i, j, seed) % 3 === 0) continue;
      px(x + i, y + j, 1, 1, colour ?? tone(c, dL * (1 - fade * 0.5)));
    }
  }
}

/** A stain: a soft blotch at (cx, cy), radius r px, darker by dL, its edge broken by noise. */
export function stain(px, cx, cy, r, c, { dL = -0.03, seed = 1, colour = null, clip = null } = {}) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = Math.hypot(i, j) / r + (noise((cx + i) / 3, (cy + j) / 3, seed) - 0.5) * 0.6;
    if (d > 1) continue;
    const X = cx + i, Y = cy + j;
    if (clip && (X < clip[0] || Y < clip[1] || X >= clip[0] + clip[2] || Y >= clip[1] + clip[3])) continue;
    px(X, Y, 1, 1, colour ?? tone(c, dL * (d < 0.6 ? 1 : 0.6)));
  }
}

/** A crack wandering from (x, y) downward and sideways, n pixels long, its lip catching the light. */
export function crack(px, x, y, n, c, { seed = 1, clip = null, dL = -0.14 } = {}) {
  let cx = x, cy = y;
  for (let k = 0; k < n; k++) {
    const r = hash3(k, seed, 709);
    if (!clip || (cx >= clip[0] && cy >= clip[1] && cx < clip[0] + clip[2] && cy < clip[1] + clip[3])) {
      px(cx, cy, 1, 1, tone(c, dL));
      if (!clip || cx + 1 < clip[0] + clip[2]) px(cx + 1, cy, 1, 1, tone(c, 0.03));
    }
    if (r % 5 < 3) cy++;
    cx += r % 7 === 0 ? -1 : r % 7 === 1 ? 1 : 0;
    if (r % 5 >= 3) cx += (r >>> 4) % 2 ? 1 : -1;
  }
}

/** Dust settled in a corner or along a foot: a pale ragged band `upM` metres deep at the bottom of (x, y, w, h). */
export function dustFoot(px, x, y, w, h, c, { ppm = 16, upM = 0.12, dust = 0xb28a59, seed = 1, k = 1 } = {}) {
  const up = P(upM, ppm, 1);
  for (let i = 0; i < w; i++) {
    const t = up * (0.4 + 0.8 * noise((x + i) / (3 * ppm / 16), 0, seed + 5)) * k;
    for (let j = 0; j < Math.min(h, Math.round(t)); j++) px(x + i, y + h - 1 - j, 1, 1, j === Math.round(t) - 1 ? tone(dust, -0.04) : dust);
  }
}

/** A raised panel's frame: lit along its top and left, shaded along its bottom and right (tradecraft's bevel). */
export function bevel(px, x, y, w, h, c, k = 1) {
  px(x, y, w, 1, tone(c, 0.07 * k)); px(x, y, 1, h, tone(c, 0.04 * k));
  px(x, y + h - 1, w, 1, tone(c, -0.09 * k)); px(x + w - 1, y, 1, h, tone(c, -0.07 * k));
}
/** A sunk panel: shaded along its top and left, lit along its bottom and right (furniture.js sunk()). */
export function sunk(px, x, y, w, h, c, k = 1) {
  px(x, y, w, h, c);
  px(x, y, w, 1, tone(c, -0.1 * k)); px(x, y, 1, h, tone(c, -0.08 * k));
  px(x, y + h - 1, w, 1, tone(c, 0.05 * k)); px(x + w - 1, y + 1, 1, h - 1, tone(c, 0.04 * k));
}
/** A soft mottle in three tones `step` apart over (x, y, w, h), cells of cellM metres; world texel offset (wx, wy). */
export function mottleM(px, x, y, w, h, c, { ppm = 16, cellM = 0.3, step = 0.02, seed = 1, wx = 0, wy = 0, lo = 0.3, hi = 0.7 } = {}) {
  const s = cellM * ppm, d0 = tone(c, -step), d1 = tone(c, step);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + wx) / s, v = (j + wy) / s, n = noise(u, v, seed) * 0.7 + noise(u * 2.3, v * 2.3, seed + 1) * 0.3;
    px(x + i, y + j, 1, 1, n < lo ? d0 : n > hi ? d1 : c);
  }
}
