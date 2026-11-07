// OLYMPUS render: blood, on the ground and on the figure. Where each pixel of a spatter, a drip or a wound's mark goes. Pure.
//
// tradecraft's src/render/blood.js (62 lines; the user, tradecraft 2026-10-26: "pixel level blood splatter on the
// ground and lingering blood traces"), ported for the build sheet 0.0.7 §2.4 (d): the body role's bloodLook
// (src/sim/body/blood.js, SIM_FOR_VIEW) gives the decals a site holds ({ x, z, dx, n, seed, atMs }: a spatter
// flung toward dx, or a drip under someone bleeding) and the marks on each casualty ({ part, atMs }); this module
// turns them into pixels, and src/render/decals.js draws them, one instanced draw, flat on the ground.
//   - A DECAL is n pixels by its seed (tradecraft's LCG, the same numbers: so a spatter is the same every frame and
//     after a load): flung the way the blow went, most near and a few far (r^1.6 × (0.25 + 0.04 n)), the near ones
//     big (two pixels) half the time; a drip a pixel or two round its point. Each pixel's shade from fresh to dry
//     over DRY_MS (half an hour), darker reds the palette snaps to its purples.
//   - A MARK is the wound on the figure: MARK_PX pixels of red at the part's place on the drawn chibi (its legs,
//     its torso, an arm, its head) standing, kneeling or lying, toward the camera so it lies over the card;
//     darker as it dries. Sparing at 16 px/m (the sheet: "never gratuitous"): two or three pixels a wound, never a
//     pool on the figure; the pool is the ground's spatter.
// Pure: no three.js, no DOM.
import { PX_PER_M } from './scale.js';

/** The most blood pixels drawn (tradecraft's MAX_PIXELS). */
export const MAX_BLOOD_PIXELS = 2400;
/**
 * Fresh to dry, and how long to dark (ms of game time). Tradecraft's were 0xc95c45, 0x9e3c36 and 0x6e2a2e, on its grey
 * streets; on Melas's regolith (0xa65e4b, a red) its fresh red vanished, so OLYMPUS's run darker, the Corps' maroon to
 * a brown-black (my call: the shades the palette holds that stand off the ground).
 */
export const SHADES = Object.freeze([0x7a2430, 0x6e272f, 0x6e272f, 0x4a1c26, 0x3a1a22]), DRY_MS = 30 * 60 * 1000;
/** A spatter's pixels lie this far over the ground (m: over a mat, a line on it). */
export const BLOOD_Y_M = 0.035;
/** A wound's mark on the figure: pixels, and how far toward the camera from the card (m). */
export const MARK_PX = 3, MARK_LIFT_M = 0.2;

/** A decal's pixels (tradecraft's pixels(d)): [{ x, z, big, shade, cut }] in metres, from its seed. */
export function* decalPixels(d) {
  let s = d.seed >>> 0 || 1;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < d.n; i++) {
    const far = d.dx ? Math.pow(r(), 1.6) * (0.25 + d.n * 0.04) : r() * 0.08;   // (flung: most near, a few far)
    const x = d.x + d.dx * far + (r() - 0.5) * (0.12 + far * 0.5), z = d.z + (r() - 0.5) * (0.1 + far * 0.35);
    const big = !d.dx || far < 0.2 ? r() < 0.5 : r() < 0.15;
    yield { x, z, big, shade: Math.floor(r() * 3), cut: (Math.imul(d.seed ^ (i + 1), 2654435761) >>> 0) / 4294967296 };
  }
}
/** How dry a decal is at ms, 0 fresh to 1 dark. */
export const dryOf = (atMs, ms) => Math.max(0, Math.min(1, (ms - (atMs ?? ms)) / DRY_MS));
/** Every pixel of the decals on the pixel grid at ms: [{ x, y, z, c }], at most max (the newest kept: the list is oldest first). */
export function bloodPixels(decals, ms, ppm = PX_PER_M, max = MAX_BLOOD_PIXELS) {
  const P = 1 / ppm, out = [];
  for (let k = decals.length - 1; k >= 0 && out.length < max; k--) {
    const d = decals[k], dry = dryOf(d.atMs, ms);
    for (const p of decalPixels(d)) {
      if (p.cut < (d.wash ?? 0)) continue;
      const c = SHADES[Math.min(SHADES.length - 1, p.shade + Math.round(dry * 2))];
      for (const [ox, oz] of p.big ? [[0, 0], [P, 0]] : [[0, 0]]) {
        if (out.length >= max) break;
        out.push({ x: (Math.round((p.x + ox) * ppm) + 0.5) * P, y: BLOOD_Y_M, z: (Math.round((p.z + oz) * ppm) + 0.5) * P, c });
      }
    }
  }
  return out;
}

// (where each part is on the drawn chibi, metres: standing (up from the feet; across, + to the figure's right on the
// picture), and lying side on (along the body from its middle, toward its head negative))
const STAND_AT = Object.freeze({ head: [0, 1.55], torso: [0, 0.85], armL: [0.32, 0.8], armR: [-0.32, 0.8], legL: [0.12, 0.3], legR: [-0.12, 0.3] });
const LIE_AT = Object.freeze({ head: [-0.85, 0.3], torso: [-0.25, 0.25], armL: [-0.2, 0.35], armR: [-0.3, 0.15], legL: [0.55, 0.22], legR: [0.7, 0.2] });
/**
 * A casualty's marks on the drawn figure (fig: { x, z, face, lie (lying), kneel }; marks: bloodLook's [{ part, atMs }])
 * at ms: [{ x, y, z, c }] metres, MARK_PX a wound, lifted MARK_LIFT_M toward the camera (as high as south, so the same
 * picture pixel) so they lie over the card.
 */
export function markPixels(fig, marks, ms, ppm = PX_PER_M) {
  const P = 1 / ppm, out = [];
  const side = fig.face === 'left' ? -1 : 1;
  for (const m of marks ?? []) {
    const lie = !!fig.lie, at = (lie ? LIE_AT : STAND_AT)[m.part] ?? (lie ? LIE_AT.torso : STAND_AT.torso);
    const dx = lie ? at[0] * side : at[0] * (fig.face === 'up' ? -1 : 1), up = at[1] * (fig.kneel && !lie ? 0.75 : 1);
    const dry = dryOf(m.atMs, ms), c0 = SHADES[Math.min(4, Math.round(dry * 3))], c1 = SHADES[Math.min(4, 1 + Math.round(dry * 3))];
    const gx = Math.round((fig.x + dx) * ppm), gy = Math.round(up * ppm);
    const cells = [[0, 0, c0], [1, 0, c1], [0, -1, c1]].slice(0, MARK_PX);
    for (const [i, j, c] of cells) out.push({ x: (gx + i + 0.5) * P, y: (gy - j + 0.5) * P + MARK_LIFT_M, z: Math.round(fig.z * ppm) * P + MARK_LIFT_M, c });
  }
  return out;
}
