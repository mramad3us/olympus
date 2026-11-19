// OLYMPUS samples: the stage's figure for the look sets (pure): a frame composed and shaded by the game's own figure code.
//
// The sets that show the stage's figure (samples/float-look, mag-boots, pistol-stances) draw it as samples/held-devices does:
// src/art/figures compose.js composeFrame (a pose solved, projected for a facing, drawn as parts in role letters) and shade.js
// shade (lit from the upper left, inked round), at the stage's density, the picture's pixels snapped to the Mars palette as the
// stage's post pass snaps them. frameOf returns the frame's opaque pixels with their role letters, so a set can redraw a part
// (a boot's letter 'f', the rifle's letters) without touching the game's code; drawFrame puts a frame on a Pic, k times larger.
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { PALETTES, nearest } from '../../src/art/palette.js';

const SNAPPED = new Map();
/** A colour snapped to the Mars palette (the stage's post pass), memoised. */
export const snap = (c) => { if (!SNAPPED.has(c)) SNAPPED.set(c, nearest(c, PALETTES.mars)); return SNAPPED.get(c); };
/** The shoot house's marine (the black combat EVA suit, the carrier, the R-7) in a carry, or a look given. */
export const marine = (over = {}) => wear({ outfit: 'combatSuit', carrier: true, weapon: 'rifle', carry: 'low', seed: 3, model: 'r7', ...over });

/** A frame: { px: [[x, y, colour, ch]], ax, ay, w, h, cells, fr } (its anchor ax, ay: the feet's point on the floor). */
export function frameOf(look, dir, frame = 'idle0', { ppm = 16, pose = null } = {}) {
  const fr = composeFrame(look, dir, frame, { ppm, ...(pose ? { pose } : {}) }), pm = shade(fr.cells, coloursOf(look, ppm)), px = [];
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
    const v = pm.data[y * pm.w + x];
    if ((v >>> 24) >= 128) px.push([x, y, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff), fr.cells[y]?.[x]?.ch ?? null]);
  }
  return { px, ax: fr.ax, ay: fr.ay, w: pm.w, h: pm.h, cells: fr.cells, fr };
}
/** A frame on a Pic with its anchor at (x, y), k times larger, snapped (snapOn), clipped to a box [x, y, w, h] when given. */
export function drawFrame(P, f, x, y, { k = 1, clip = null, snapOn = true, recolour = null } = {}) {
  for (const [a, b, c0, ch] of f.px) {
    const c = recolour ? recolour(c0, ch, a, b) : c0;
    if (c === null) continue;
    const X = x + (a - f.ax) * k, Y = y + (b - f.ay) * k;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
      const px = X + i, py = Y + j;
      if (clip && (px < clip[0] || py < clip[1] || px >= clip[0] + clip[2] || py >= clip[1] + clip[3])) continue;
      P.put(px, py, snapOn ? snap(c) : c);
    }
  }
}
