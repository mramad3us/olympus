// OLYMPUS stage sample: the test room's kit, painted by code. An example of how kit is made.
//
// Each piece is a few boxes on src/render/batch.js's area.box(), its faces painted to their exact size
// by a painter function (px, w, h, ppm): the camera sees tops and fronts (+z), so that is where the
// detail goes (tradecraft's furniture.js rule, "painted rather than modelled"); sides are a flat colour.
// Sizes are metres; painters measure in pixels from the face's own size and the density, so the same
// piece paints itself at 16 and 24 px/m. The materials are this sample's (the real kit is its own
// task): rough-sawn crate wood, olive steel lockers with vents and a stencilled number, olive-drab ammo
// cans, cardboard, cast concrete, a desk with a monitor whose screen glows (glow class SCREEN), steel
// shelving, a pallet. And a placeholder figure for the card: a chibi marine (helmet, uniform, plate
// carrier, boots), shaded by rule (light top edges, shaded right and bottom edges, an ink outline) the
// way tradecraft's sprites are; the real sprites are another task's.
import { GLOW, paint } from '../../src/art/paint.js';
import { tone, hash3 } from '../../src/art/tone.js';
import { bevel, mottle, boards, vents, rivet, pxOf } from '../../src/art/brush.js';
import { text, stencil, textWidth } from '../../src/art/font.js';

const INK = 0x14151c;

// ---------- face painters (px, w, h, ppm) ----------
const crateFront = (px, w, h, ppm) => {
  const c = 0x9a7048;
  boards(px, 0, 0, w, h, c, { board: pxOf(0.12, ppm, 3), seed: 3 });
  const f = pxOf(0.06, ppm, 2);
  for (const [x, y, ww, hh] of [[0, 0, w, f], [0, h - f, w, f], [0, 0, f, h], [w - f, 0, f, h]]) { px(x, y, ww, hh, tone(c, -0.06)); bevel(px, x, y, ww, hh, tone(c, -0.06)); }
  for (let k = 0; k < Math.min(w, h) - 2 * f; k++) px(f + Math.round(k * (w - 2 * f) / (h - 2 * f || 1)), h - f - 1 - k, 2, 1, tone(c, -0.1));   // (the brace)
  if (w > 26) stencil(px, Math.round((w - textWidth('7.62')) / 2), Math.round(h / 2) - 2, '7.62', 0x2b2e3a);
};
const crateTop = (px, w, h, ppm) => { boards(px, 0, 0, w, h, 0xa8805a, { board: pxOf(0.12, ppm, 3), seed: 4 }); bevel(px, 0, 0, w, h, 0xa8805a, 1.4); };
const lockerFront = (n) => (px, w, h, ppm) => {
  const c = 0x5f6a58;
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.4);
  const m = pxOf(0.05, ppm, 2);
  px(m, m, w - 2 * m, h - 2 * m, tone(c, 0.02)); bevel(px, m, m, w - 2 * m, h - 2 * m, tone(c, 0.02));
  vents(px, Math.round(w / 2) - pxOf(0.12, ppm, 3), m + pxOf(0.12, ppm, 2), pxOf(0.24, ppm, 6), pxOf(0.12, ppm, 4), c);
  px(w - m - pxOf(0.08, ppm, 2), Math.round(h * 0.5), 2, pxOf(0.12, ppm, 3), 0xb8bdc8);    // (the handle)
  px(w - m - pxOf(0.08, ppm, 2), Math.round(h * 0.5) + pxOf(0.12, ppm, 3), 2, 1, INK);
  stencil(px, Math.round((w - textWidth(String(n))) / 2), Math.round(h * 0.32), String(n), 0xe2dac6);
  px(0, h - pxOf(0.08, ppm, 2), w, pxOf(0.08, ppm, 2), tone(c, -0.2));                    // (the plinth)
};
const steelTop = (c) => (px, w, h) => { px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.4); };
const ammoFront = (px, w, h, ppm) => {
  const c = 0x4f5a3a;
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.3);
  px(0, pxOf(0.04, ppm, 1), w, 1, tone(c, -0.14));                                        // (the lid's seam)
  px(Math.round(w * 0.2), Math.round(h * 0.55), Math.max(2, Math.round(w * 0.35)), 1, 0xd8b23a);   // (a yellow band of marking)
  px(w - Math.max(2, Math.round(w * 0.2)), pxOf(0.06, ppm, 2), Math.max(1, Math.round(w * 0.1)), Math.max(1, Math.round(h * 0.3)), tone(c, 0.08));   // (the latch)
};
const ammoTop = (px, w, h) => { const c = 0x5d6845; px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.3); px(Math.round(w / 2) - 2, Math.round(h / 2), 4, 1, tone(c, -0.2)); };
const cardFront = (px, w, h, ppm) => {
  const c = 0xb48a5c;
  mottle(px, 0, 0, w, h, c, { cell: 3, step: 0.02, seed: 21 });
  px(0, 0, w, 1, tone(c, 0.05)); px(w - 1, 0, 1, h, tone(c, -0.06));
  px(Math.round(w / 2) - 1, 0, 3, Math.round(h * 0.35), 0xc8b08a);                         // (the tape down its front)
  if (w > 16) { px(3, h - 7, 8, 5, 0xe2dac6); px(4, h - 6, 6, 1, 0x6a7182); px(4, h - 4, 4, 1, 0x6a7182); }   // (a label)
};
const cardTop = (px, w, h) => { const c = 0xc09a6a; px(0, 0, w, h, c); px(0, Math.round(h / 2), w, 1, tone(c, -0.12)); px(Math.round(w / 2) - 1, 0, 3, h, 0xd0b890); bevel(px, 0, 0, w, h, c, 1.1); };
const concrete = (seed) => (px, w, h) => { mottle(px, 0, 0, w, h, 0x9a988e, { cell: 4, step: 0.03, seed }); bevel(px, 0, 0, w, h, 0x9a988e, 1.2); for (let k = 0; k < w * h / 60; k++) { const r = hash3(k, seed); px(r % w, (r >>> 9) % h, 1, 1, tone(0x9a988e, -0.09)); } };
const barrierFront = (px, w, h, ppm) => {
  concrete(5)(px, w, h, ppm);
  const s = pxOf(0.12, ppm, 3);
  for (let x = 0; x < w; x++) px(x, h - s - 1, 1, s, Math.floor(x / s) % 2 ? 0xd8b23a : 0x2b2e3a);   // (a hazard band at its foot)
  const t = ['KEEP CLEAR', 'KEEP OUT', 'NO'].find(s => textWidth(s) <= w - 4) ?? '';             // (the 3 × 5 font is pixels: fewer letters fit at 16 px/m)
  stencil(px, Math.max(2, Math.round((w - textWidth(t)) / 2)), Math.max(2, Math.round(h * 0.18)), t, 0x4c5262);
};
const deskFront = (px, w, h, ppm) => {
  const c = 0x6a7076;
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.3);
  const d = Math.round(w * 0.38), t = pxOf(0.06, ppm, 2);
  px(0, 0, w, t, tone(c, 0.08));
  for (let k = 0; k < 3; k++) { const y = t + 1 + k * Math.round((h - t) / 3); px(1, y, d - 2, Math.round((h - t) / 3) - 1, tone(c, 0.02)); bevel(px, 1, y, d - 2, Math.round((h - t) / 3) - 1, tone(c, 0.02)); px(Math.round(d / 2) - 2, y + 2, 4, 1, 0xb8bdc8); }
  px(d, t, w - d - 1, h - t, tone(c, -0.3));                                                  // (the kneehole, in shadow)
};
const deskTop = (px, w, h, ppm) => { const c = 0x8a8f86; px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.2); px(Math.round(w * 0.6), Math.round(h * 0.3), pxOf(0.2, ppm, 4), pxOf(0.14, ppm, 3), 0xe2dac6); text(px, Math.round(w * 0.1), Math.round(h * 0.55), 'LOG', 0x4c5262); };
const monitorFront = (px, w, h) => {
  px(0, 0, w, h, 0x23252f); bevel(px, 0, 0, w, h, 0x23252f, 1.2);
  px(1, 1, w - 2, h - 3, 0x1b3a3a, GLOW.SCREEN);
  for (let y = 2; y < h - 3; y += 2) px(2, y, Math.max(1, Math.round((w - 4) * (0.4 + 0.5 * ((hash3(y, 1) % 10) / 10)))), 1, 0x5fd0a0, GLOW.SCREEN);
};
const shelfFront = (px, w, h, ppm) => {
  const c = 0x7a8590;
  px(0, 0, w, h, tone(c, -0.42));                                                             // (the dark inside)
  const post = pxOf(0.04, ppm, 2), levels = 4, step = Math.round(h / levels);
  for (let k = 0; k < levels; k++) {
    const y = k * step;
    for (let i = post + 1, j = 0; i < w - post - 4; j++) {                                    // (what is on the shelf: boxes, binders, cans)
      const bw = 3 + (hash3(k, j, 8) % Math.max(2, Math.round(ppm / 3))), bh = Math.max(3, step - 3 - (hash3(j, k, 9) % Math.max(1, Math.round(step / 2))));
      const col = [0xb48a5c, 0x4f5a3a, 0x9e3c36, 0x3b6296, 0xe2dac6][hash3(j, k, 3) % 5];
      px(i, y + step - bh - 1, Math.min(bw, w - post - 1 - i), bh, col); px(i, y + step - bh - 1, Math.min(bw, w - post - 1 - i), 1, tone(col, 0.07));
      i += bw + 1;
    }
    px(0, y + step - 1, w, 2, c); px(0, y + step - 1, w, 1, tone(c, 0.08));
  }
  px(0, 0, post, h, c); px(w - post, 0, post, h, tone(c, -0.08)); px(0, 0, w, 2, c);
};
const palletFront = (px, w, h) => { const c = 0x9a7a52; px(0, 0, w, h, c); for (let x = 0; x < w; x += Math.max(6, Math.round(w / 4))) px(x + 2, Math.round(h / 3), Math.max(2, Math.round(w / 8)), h - Math.round(h / 3), tone(c, -0.35)); bevel(px, 0, 0, w, h, c); };
const palletTop = (px, w, h, ppm) => boards(px, 0, 0, w, h, 0xa8885e, { board: pxOf(0.14, ppm, 3), vertical: true, seed: 6 });

// ---------- pieces (metres; x, z the footprint's centre) ----------

/** The test room's kit into an area. Returns the pieces' boxes by name (for the see-through demo). */
export function furnish(area, { stress = 0 } = {}) {
  const out = {};
  const crate = (x, z, w, d, h, y = 0) => area.box({ x, z, y, w, d, h, faces: { front: crateFront, top: crateTop, sides: 0x7a5838 } });
  crate(1.15, 1.0, 1.0, 0.8, 0.75); crate(1.15, 1.0, 0.7, 0.6, 0.5, 0.75); crate(2.35, 1.0, 0.8, 0.6, 0.6);
  // (three lockers against the north wall)
  for (let k = 0; k < 3; k++) area.box({ x: 10.0 + k * 0.62, z: 0.28, w: 0.6, d: 0.5, h: 1.9, faces: { front: lockerFront(41 + k), top: steelTop(0x6a7563), sides: 0x4f5848 } });
  // (a pallet of ammo cans)
  const pallet = area.part();
  area.box({ x: 4.2, z: 6.6, w: 1.2, d: 0.8, h: 0.14, part: pallet, faces: { front: palletFront, top: palletTop, sides: 0x7a5c3a } });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) for (let l = 0; l < ((i + j) % 2) + 1; l++) area.box({ x: 3.86 + i * 0.32, z: 6.33 + j * 0.17, y: 0.14 + l * 0.2, w: 0.3, d: 0.15, h: 0.19, faces: { front: ammoFront, top: ammoTop, sides: 0x3d4530 } });
  // (cardboard boxes)
  for (const [x, z, w, d, h, y] of [[10.6, 6.7, 0.7, 0.55, 0.5, 0], [11.3, 6.75, 0.5, 0.45, 0.4, 0], [10.65, 6.7, 0.55, 0.45, 0.35, 0.5]]) area.box({ x, z, y, w, d, h, faces: { front: cardFront, top: cardTop, sides: 0x9a7448 } });
  // (a concrete barrier)
  area.box({ x: 8.3, z: 7.1, w: 1.8, d: 0.6, h: 0.8, faces: { front: barrierFront, top: concrete(6), sides: 0x7d7b72 } });
  // (a desk and its monitor: the screen glows)
  const desk = area.part();
  area.box({ x: 2.8, z: 4.6, w: 1.4, d: 0.7, h: 0.75, part: desk, faces: { front: deskFront, top: deskTop, sides: 0x4c5258 } });
  area.box({ x: 2.5, z: 4.42, y: 0.75, w: 0.56, d: 0.08, h: 0.38, faces: { front: monitorFront, top: 0x23252f, sides: 0x23252f } });
  // (steel shelving in the middle of the room, tall: the figure behind it is seen through it)
  out.shelf = area.box({ x: 6.1, z: 6.0, w: 1.3, d: 0.5, h: 2.0, faces: { front: shelfFront, top: steelTop(0x7a8590), sides: 0x5c6670 } });
  // (?stress=N: N more pieces on a grid over the room, for the draw-call count)
  for (let i = 0; i < stress; i++) {
    const gx = i % 18, gz = Math.floor(i / 18) % 12, x = 0.5 + gx * 0.62 + (Math.floor(i / 216) % 2) * 0.31, z = 1.6 + gz * 0.52, k = hash3(i, 17) % 4, y = Math.floor(i / 216) * 0.45;
    if (k === 0) crate(x, z, 0.5, 0.4, 0.4, y);
    else if (k === 1) area.box({ x, z, y, w: 0.3, d: 0.3, h: 0.22, faces: { front: ammoFront, top: ammoTop, sides: 0x3d4530 } });
    else if (k === 2) area.box({ x, z, y, w: 0.45, d: 0.35, h: 0.35, faces: { front: cardFront, top: cardTop, sides: 0x9a7448 } });
    else area.box({ x, z, y, w: 0.4, d: 0.4, h: 0.3, faces: { front: concrete(7), top: concrete(8), sides: 0x7d7b72 } });
  }
  return out;
}

// ---------- the placeholder figure ----------

/**
 * A chibi marine, 1.75 m tall at ppm (28 px at 16, 42 at 24), facing the camera: helmet, face, uniform,
 * plate carrier, belt, trousers, boots; shaded by rule, ink outline. A Pixmap with holes round it.
 */
export function marine(ppm) {
  const H = Math.round(1.75 * ppm), W = Math.round(H * 0.8) | 1, k = H / 28;
  const col = new Int32Array(W * H).fill(-1), prt = new Int16Array(W * H).fill(-1);
  const cx = (W - 1) / 2;
  const rect = (x0, y0, w, h, c, p) => { for (let y = Math.round(y0); y < Math.round(y0 + h); y++) for (let x = Math.round(x0); x < Math.round(x0 + w); x++) if (x >= 0 && y >= 0 && x < W && y < H) { col[y * W + x] = c; prt[y * W + x] = p; } };
  const oval = (ox, oy, rx, ry, c, p, cut = null) => { for (let y = Math.floor(oy - ry); y <= Math.ceil(oy + ry); y++) for (let x = Math.floor(ox - rx); x <= Math.ceil(ox + rx); x++) { const dx = (x + 0.5 - ox - 0.5) / rx, dy = (y + 0.5 - oy - 0.5) / ry; if (dx * dx + dy * dy <= 1 && x >= 0 && y >= 0 && x < W && y < H && (!cut || cut(x, y))) { col[y * W + x] = c; prt[y * W + x] = p; } } };
  const OLIVE = 0x6f7a55, DARK_OLIVE = 0x4f5a3a, CARRIER = 0x3d4530, SKIN = 0xc48a62, BOOT = 0x2b2e3a, HELM = 0x545e40;
  // legs and boots
  rect(cx - 5 * k, 23 * k, 4 * k, 3.5 * k, DARK_OLIVE, 1); rect(cx + 1 * k, 23 * k, 4 * k, 3.5 * k, DARK_OLIVE, 2);
  rect(cx - 5.5 * k, 26 * k, 4.5 * k, 2 * k, BOOT, 3); rect(cx + 1 * k, 26 * k, 4.5 * k, 2 * k, BOOT, 3);
  // arms, body, carrier, belt
  rect(cx - 8 * k, 15 * k, 2.5 * k, 7 * k, OLIVE, 4); rect(cx + 5.5 * k, 15 * k, 2.5 * k, 7 * k, OLIVE, 5);
  rect(cx - 7.5 * k, 21.5 * k, 2 * k, 1.5 * k, SKIN, 6); rect(cx + 5.5 * k, 21.5 * k, 2 * k, 1.5 * k, SKIN, 6);
  rect(cx - 5.5 * k, 14 * k, 11 * k, 9.5 * k, OLIVE, 7);
  rect(cx - 5 * k, 15 * k, 10 * k, 6 * k, CARRIER, 8);
  for (const dx of [-4, -1, 2]) rect(cx + dx * k, 18 * k, 2 * k, 2.5 * k, tone(CARRIER, 0.05), 9);   // (pouches)
  rect(cx - 5.5 * k, 22 * k, 11 * k, 1.2 * k, 0x2b3020, 10);
  // head: face, then the helmet over it
  oval(cx, 9 * k, 6.6 * k, 6 * k, SKIN, 11);
  oval(cx, 7.4 * k, 7.6 * k, 5.6 * k, HELM, 12, (x, y) => y < 8.6 * k);
  rect(cx - 7.6 * k, 7.9 * k, 15.2 * k, 1.3 * k, tone(HELM, -0.06), 12);                       // (the brim)
  for (const ex of [-2.6, 1.6]) rect(cx + ex * k, 11 * k, Math.max(1, k), Math.max(2, 1.6 * k), INK, 13);   // (eyes)
  rect(cx - 0.5 * k, 13.6 * k, 1.5 * k, Math.max(1, 0.6 * k), tone(SKIN, -0.15), 13);          // (the mouth)
  return paint(W, H, (px) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, c = col[i];
      if (c < 0) {
        // (the ink outline: an empty pixel beside the figure)
        if ((x > 0 && col[i - 1] >= 0) || (x < W - 1 && col[i + 1] >= 0) || (y > 0 && col[i - W] >= 0) || (y < H - 1 && col[i + W] >= 0)) px(x, y, 1, 1, INK);
        else px(x, y, 1, 1, null);
        continue;
      }
      const p = prt[i], other = (j, ok) => ok && prt[j] !== p;
      // (light from the upper left: a lit top edge, a shaded right and bottom edge, an inner line where parts overlap)
      let d = 0;
      if (other(i - W, y > 0) || y === 0) d += 0.06;
      if (other(i + 1, x < W - 1) || other(i + W, y < H - 1)) d -= 0.08;
      if (x > cx + 2 * k && p !== 13) d -= 0.03;
      px(x, y, 1, 1, d ? tone(c, d) : c);
    }
  }, { key: `marine:${ppm}` });
}
