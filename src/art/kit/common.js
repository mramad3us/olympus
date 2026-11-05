// OLYMPUS art: what the kit's makers share. Its colours, and the small painting moves furniture is made of.
//
// tradecraft's furniture.js painted every piece from a handful of moves (bevel, sunk, grain, cloth,
// oval, cabinet, a shelf of goods); these are those moves, measured in metres and turned to pixels at
// the density a face is painted at (u = ppm / 16), plus the military ones: louvres in a locker's door,
// a padlock on its hasp, a name card in its holder, a made blanket with hospital corners and an unmade
// one thrown back, glass and a mirror (opaque: the batch has one material, so glass is painted as
// glass looks from 45°, a tint and a glint), a screen that glows (glow class SCREEN, src/art/paint.js),
// a steel tube's highlight.
//
// The colours are the Corps' and a ship's, picked from the Mars and ship place sets' families
// (src/art/palette.js) so a face shows what was painted: olive drab steel, grey enamel, stainless,
// gunmetal, the wool blanket's olive and grey, sheets, the MCRN red, hazard yellow, a crash couch's
// padding blue, console teal.
// Pure.
import { tone, hash3, noise, mixHex } from '../tone.js';
import { bevel, sunk, P } from '../materials/wear.js';

export const C = Object.freeze({
  ink: 0x1a1214, paper: 0xf4efe6, sheet: 0xe1ccc0, linen: 0xd6d0c9, card: 0xe8cbae,
  steel: 0xb7b0a8, stainless: 0xc7d5d0, chrome: 0xd6d0c9, steelD: 0x7c736b, steelDD: 0x49403e, gunmetal: 0x31292a, black: 0x282b34,
  olive: 0x4c633d, oliveL: 0x737949, oliveD: 0x264c35, drab: 0x695745, khaki: 0x9c917a, tan: 0xb1896d, coyote: 0x96694f,
  greyEnamel: 0x87959d, greyD: 0x565b67, beige: 0xc4ac97, cream: 0xd9d1b7, white: 0xdad0bc,
  wood: 0x8c6d59, woodL: 0xa78c77, woodD: 0x573a37, ply: 0xb28a59,
  red: 0xb45150, mcrn: 0x8f3f31, mcrnD: 0x6e272f, hazard: 0xd0ac5e, hazardD: 0x302a2a, amber: 0xe7b84a, glow: 0xf8e08a,
  padBlue: 0x4d5a7b, padBlueL: 0x617598, teal: 0x3c8183, tealL: 0x669f93, screen: 0x1d2b46, screenLit: 0x86bdbc, green: 0x538252, greenLit: 0x9fe0b0,
  water: 0x5d9db1, skin: 0xc57e5f, food: 0xb08b54,
});

/** u: pixels a tradecraft pixel is at this density (16 px/m is 1). */
export const U = (ppm) => ppm / 16;
export { bevel, sunk, P };

/** A filled ellipse centred at (cx, cy) (a pixel's centre is +0.5), radii rx, ry (furniture.js oval). */
export function oval(px, cx, cy, rx, ry, c, glow = 0) {
  for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
    const a = (i + 0.5 - cx) / rx, b = (j + 0.5 - cy) / ry;
    if (a * a + b * b <= 1.0) px(i, j, 1, 1, c, glow);
  }
}
/** Cloth: a soft mottle in the cloth's own tones, cells of ~3 px at 16 px/m (furniture.js cloth). */
export function cloth(px, x, y, w, h, c, { seed = 1, u = 1, k = 1 } = {}) {
  const s = 3 * u;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = noise((x + i) / s, (y + j) / s, seed);
    px(x + i, y + j, 1, 1, v < 0.26 ? tone(c, -0.035 * k) : v > 0.78 ? tone(c, 0.02 * k) : c);
  }
}
/** Folds in cloth: soft diagonal or vertical creases, a shaded line with a lit one beside it. */
export function folds(px, x, y, w, h, c, { n = 3, seed = 1, vertical = false, k = 1 } = {}) {
  for (let f = 0; f < n; f++) {
    const r = hash3(f, seed, 23), along = vertical ? h : w, at = Math.floor(((r % 1000) / 1000) * (vertical ? w : h));
    const len = Math.max(3, Math.floor(along * (0.3 + ((r >>> 10) % 50) / 100))), st = Math.floor(((r >>> 16) % 100) / 100 * (along - len));
    const slope = ((r >>> 24) % 3) - 1;
    for (let t = 0; t < len; t++) {
      const off = Math.round(t * slope * 0.25);
      if (vertical) { px(x + at + off, y + st + t, 1, 1, tone(c, -0.06 * k)); px(x + at + off + 1, y + st + t, 1, 1, tone(c, 0.03 * k)); }
      else { px(x + st + t, y + at + off, 1, 1, tone(c, -0.06 * k)); px(x + st + t, y + at + off - 1, 1, 1, tone(c, 0.03 * k)); }
    }
  }
}
/** Louvres (a locker's vents): slits `gap` px apart, dark with a lit lower lip. */
export function louvres(px, x, y, w, h, c, gap = 2) {
  for (let j = 0; j + 1 < h; j += gap) { px(x, y + j, w, 1, tone(c, -0.22)); px(x, y + j + 1, w, 1, tone(c, 0.06)); }
}
/** A vertical handle at (x, y), len px, its lit side and shadow (steel). */
export function handleV(px, x, y, len, c = C.steel) { px(x, y, 1, len, tone(c, 0.05)); px(x + 1, y, 1, len, tone(c, -0.15)); px(x, y + len, 2, 1, tone(c, -0.3)); }
/** A horizontal pull at (x, y), len px. */
export function handleH(px, x, y, len, c = C.steel) { px(x, y, len, 1, tone(c, 0.06)); px(x, y + 1, len, 1, tone(c, -0.25)); }
/** A hasp and padlock at (x, y) (its top-left), sized by u. */
export function padlock(px, x, y, u = 1) {
  const s = Math.max(2, Math.round(2 * u));
  px(x, y, 1, s, C.steel); px(x + s, y, 1, s, C.steel); px(x, y, s + 1, 1, tone(C.steel, 0.06));
  px(x - 1, y + s, s + 3, s + 1, 0xb08b54); px(x - 1, y + s, s + 3, 1, tone(0xb08b54, 0.08)); px(x + Math.floor(s / 2), y + s + 1, 1, 1, C.ink);
}
/** A name card in a holder at (x, y), w × h px: a frame, the card, a scribble of a name. */
export function nameCard(px, x, y, w, h, seed = 1) {
  px(x, y, w, h, C.steelD); px(x + 1, y + 1, w - 2, h - 2, C.card);
  for (let j = y + 2; j < y + h - 1; j += 2) px(x + 2, j, Math.max(1, w - 4 - (hash3(seed, j) % 3)), 1, 0x565b67);
}
/** Glass seen from 45°: a tint, a glint stroke across its upper corner, darker toward its foot. */
export function glass(px, x, y, w, h, tint = 0x87959d, { dark = false } = {}) {
  const t = dark ? tone(tint, -0.25) : tint;
  px(x, y, w, h, t);
  px(x, y + h - Math.max(1, Math.floor(h / 4)), w, Math.max(1, Math.floor(h / 4)), tone(t, -0.05));
  for (let i = 0; i < Math.min(w, h) - 2; i++) { px(x + 1 + i, y + h - 3 - i - Math.floor(h / 3), 1, 1, tone(t, 0.14)); if (i < Math.min(w, h) - 4) px(x + 3 + i, y + h - 3 - i - Math.floor(h / 3), 1, 1, tone(t, 0.07)); }
}
/** A mirror: what it shows (the room behind you: a lighter band, a darker floor), a glint, a steel frame. */
export function mirror(px, x, y, w, h, frame = C.steel) {
  px(x, y, w, h, frame); bevel(px, x, y, w, h, frame);
  for (let j = 1; j < h - 1; j++) px(x + 1, y + j, w - 2, 1, j > h * 0.58 ? 0x6e7582 : j > h * 0.45 ? 0x87959d : 0xa5b5b6);
  for (let i = 0; i < Math.min(w, h) - 3; i++) { px(x + 2 + i, y + h - 3 - i - 1, 1, 1, 0xc7d5d0); if (i < Math.min(w, h) - 5) px(x + 4 + i, y + h - 3 - i - 1, 1, 1, 0xb7c4c4); }
}
/** A screen at (x, y): a bezel, the lit face (glow class SCREEN, 7), lines of text or a graph. */
export function screenFace(px, x, y, w, h, { kind = 'text', c = C.screen, lit = C.screenLit, seed = 1 } = {}) {
  px(x, y, w, h, C.black);
  if (w < 3 || h < 3) return;
  px(x + 1, y + 1, w - 2, h - 2, c, 7);
  if (kind === 'graph') {
    for (let i = x + 2; i < x + w - 2; i++) { const v = Math.round((Math.sin(i * 0.9 + seed) * 0.35 + 0.5) * (h - 5)); px(i, y + 2 + v, 1, 1, lit, 7); }
  } else if (kind === 'status') {
    px(x + 2, y + 2, Math.max(1, w - 4), 1, lit, 7); px(x + 2, y + 4, Math.max(1, Math.floor((w - 4) / 2)), 1, 0xe7b84a, 7);
  } else {
    for (let j = y + 2; j < y + h - 2; j += 2) px(x + 2, j, Math.max(1, Math.round((w - 4) * (0.35 + 0.6 * ((hash3(seed, j) % 10) / 10)))), 1, lit, 7);
  }
}
/** A status lamp at (x, y), s px: its lens in colour c, glowing (class `glow`), a bezel round it. */
export function statusLamp(px, x, y, s, c, glow = 1) {
  px(x - 1, y - 1, s + 2, s + 2, C.black);
  px(x, y, s, s, c, glow);
  if (s > 1) px(x, y, 1, 1, tone(c, 0.12), glow);
}
/** A cabinet front (furniture.js cabinet, scaled): rows of drawers, doors, open shelves, a plinth, in colour c. */
export function cabinet(px, w, h, c, rows, { handle = C.steelD, plinth = 1, gap = 1, frame = 1 } = {}) {
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c);
  if (plinth) px(0, h - plinth, w, plinth, tone(c, -0.25));
  let y = frame;
  for (const row of rows) {
    const cw = (w - 2 * frame - (row.n - 1) * gap) / row.n;
    for (let i = 0; i < row.n; i++) {
      const x0 = Math.round(frame + i * (cw + gap)), x1 = Math.round(frame + i * (cw + gap) + cw), ww = x1 - x0, hh = row.h;
      if (row.kind === 'open') { px(x0, y, ww, hh, tone(c, -0.32)); px(x0, y, ww, 1, tone(c, -0.42)); continue; }
      bevel(px, x0, y, ww, hh, c);
      if (row.kind === 'door') {
        if (ww >= 5 && hh >= 6) sunk(px, x0 + 1, y + 1, ww - 2, hh - 2, tone(c, -0.02));
        const hx = row.n === 1 ? x1 - 2 : i % 2 === 0 ? x1 - 2 : x0 + 1;
        px(hx, y + Math.min(2, hh - 2), 1, Math.max(1, Math.min(3, hh - 3)), handle);
      } else {
        const hw = ww >= 6 ? 2 : 1;
        px(x0 + Math.floor((ww - hw) / 2), y + Math.floor((hh - 1) / 2), hw, 1, handle);
      }
    }
    y += row.h + gap;
  }
}
/** A colour's tone, re-exported for makers that only need this module. */
export { tone, hash3, noise, mixHex };
