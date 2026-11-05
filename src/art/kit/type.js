// OLYMPUS art: what is written in the picture. Two pixel alphabets, plaques, stencils and safety signs.
//
// tradecraft's plaque alphabet is its 3 × 5 font (src/art/pixelart.js text(), ported as src/art/font.js),
// the one its shop signs and its plaques were drawn in (src/ui/plaque.js: the user, 2026-10-27, of the
// old labels, "infocards need to be revamped, they feel low quality, low tech too sharp and practical",
// so they became enamelled plaques in the picture's own pixels). At 16 px/m a 3 × 5 capital is 0.31 m
// tall, a stencil's size; at 24 px/m it shrinks to 0.21 m and reads as a smudge beside the finer kit,
// so VIEWS §3.8 names a 5 × 7 alphabet for the finer density: "3×5 (A) or 5×7 (B) pixel font". GLYPHS57
// is that alphabet (the classic dot-matrix capitals, my drawing), and fontFor(ppm) picks: 3 × 5 under
// 20 px/m, 5 × 7 from it (my call), so lettering is about the same size in the world at both densities.
//
// plaque() is tradecraft's plaque painted into a face (an ink outline, its face in the style's colour
// with a lit top edge and a shaded foot, a 5 × 5 icon, the words, a seam and a quieter second part),
// for the signs on Base Melas's walls and a warship's bulkheads: deck plaques, room plates, safety
// signs (green), warnings (yellow on black), danger (red), the Corps' red. Stencils (a locker's number,
// "DECK 5") are the letters sprayed and worn at their top and foot, in either alphabet.
// Pure.
import { text as text35, textWidth as width35, GLYPH_H } from '../font.js';
import { tone } from '../tone.js';

/** 5 × 7 capitals, digits and marks (rows of '0'/'1'; narrow marks narrower). */
export const GLYPHS57 = Object.freeze({
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'], D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'], J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], N: ['10001', '10001', '11001', '10101', '10011', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'], X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '10001', '01010', '00100', '00100', '00100'], Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], 1: ['010', '110', '010', '010', '010', '010', '111'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], 3: ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], 5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], 7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], 9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '-': ['000', '000', '000', '111', '000', '000', '000'], '.': ['0', '0', '0', '0', '0', '0', '1'], ',': ['00', '00', '00', '00', '00', '01', '10'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'], ':': ['0', '0', '1', '0', '0', '1', '0'], '!': ['1', '1', '1', '1', '1', '0', '1'],
  "'": ['1', '1', '0', '0', '0', '0', '0'], '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'], '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'], ' ': ['000', '000', '000', '000', '000', '000', '000'],
});
const glyph57 = (ch) => GLYPHS57[ch] ?? GLYPHS57[' '];

/** Width in pixels of `str` in the 5 × 7 alphabet (a pixel between letters). */
export const width57 = (str) => [...String(str).toUpperCase()].reduce((a, ch) => a + glyph57(ch)[0].length + 1, -1);
/** Write `str` at (x, y), its top-left, in the 5 × 7 alphabet, colour c (glow class too). */
export function text57(px, x, y, str, c, glow = 0) {
  for (const ch of String(str).toUpperCase()) {
    const g = glyph57(ch);
    g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(x + i, y + j, 1, 1, c, glow); }));
    x += g[0].length + 1;
  }
}
/**
 * Stencilled paint: the letters sprayed through a stencil and worn, a pixel in four missing along their
 * top and foot rows (by hash).
 * Not the bridges cut out of the middle row (src/art/font.js stencil()): at these sizes that takes E's
 * and H's middle arms and they read as C and I ("VEHICLE" came out "VCHICLC", 2026-11-05).
 */
function worn(text, glyph) {
  return (px, x, y, str, c) => {
    let k = 0;
    for (const ch of String(str).toUpperCase()) {
      const g = glyph(ch);
      // (paint is lost at a letter's top and foot, where the stencil's edge lifts: never in its middle rows, where the letter is told apart)
      g.forEach((row, j) => [...row].forEach((b, i) => { const edge = j === 0 || j === g.length - 1; if (b === '1' && !(edge && (k++ * 7 + i * 5) % 4 === 1)) px(x + i, y + j, 1, 1, c); }));
      x += g[0].length + 1;
    }
  };
}
export const stencil57 = worn(text57, glyph57);
const glyph35 = (ch) => { const rows = []; text35((x, y) => { (rows[y] ??= []).push(x); }, 0, 0, ch, 0); const w = Math.max(1, width35(ch)); return Array.from({ length: GLYPH_H }, (_, j) => Array.from({ length: w }, (_, i) => (rows[j]?.includes(i) ? '1' : '0')).join('')); };
const glyph35Cache = new Map();
/** The 3 × 5 alphabet stencilled the same way (worn, not cut). */
export const stencilWorn35 = worn(text35, (ch) => { if (!glyph35Cache.has(ch)) glyph35Cache.set(ch, glyph35(ch)); return glyph35Cache.get(ch); });

/** The density at which lettering goes from 3 × 5 to 5 × 7 (px/m). */
export const FINE_FONT_PPM = 20;
/** The alphabet for a density: { h, width(str), text(px, x, y, str, c, glow), stencil(px, x, y, str, c) }. */
export function fontFor(ppm) {
  return ppm >= FINE_FONT_PPM
    ? { name: '5x7', h: 7, width: width57, text: text57, stencil: stencil57 }
    : { name: '3x5', h: GLYPH_H, width: width35, text: text35, stencil: stencilWorn35 };
}
/** The longest of `options` that fits `w` pixels in the density's alphabet ('' if none does). */
export const fitText = (options, w, ppm) => [options].flat().find(s => fontFor(ppm).width(s) <= w) ?? '';

// ---------- plaques and signs ----------

/** 5 × 5 icons (tradecraft's plaque glyphs, and the Corps' and a ship's). */
export const ICONS = Object.freeze({
  star: ['00100', '01110', '11111', '01110', '01010'], house: ['00100', '01110', '11111', '01010', '01110'],
  up: ['00100', '01110', '11111', '00100', '00100'], down: ['00100', '00100', '11111', '01110', '00100'],
  left: ['00100', '01100', '11111', '01100', '00100'], right: ['00100', '00110', '11111', '00110', '00100'],
  cross: ['00000', '00100', '01110', '00100', '00000'], aim: ['00100', '00100', '11011', '00100', '00100'],
  bolt: ['00010', '00100', '01110', '00100', '01000'], drop: ['00100', '01110', '11111', '11111', '01110'],
  helmet: ['01110', '11111', '11111', '10001', '10001'], fire: ['00100', '01010', '01110', '11111', '01110'],
  warn: ['00100', '01010', '01010', '10001', '11111'], man: ['00100', '01110', '00100', '01010', '01010'],
  shower: ['11100', '00100', '01110', '10101', '10101'], ring: ['01110', '10001', '10101', '10001', '01110'],
});

/** Sign styles: face, its lit edge, its shade, the letters, the icon's colour (tradecraft's STYLES, the Corps' and a ship's). */
export const SIGN_STYLES = Object.freeze({
  deck: { face: 0x282b34, hi: 0x3e424d, lo: 0x14161d, ink: 0xf4efe6, glyph: 0xe7b84a },
  safety: { face: 0x27694b, hi: 0x538252, lo: 0x003536, ink: 0xf4efe6, glyph: 0xf4efe6 },
  warning: { face: 0xd0ac5e, hi: 0xedcd89, lo: 0x976d00, ink: 0x1a1214, glyph: 0x1a1214 },
  danger: { face: 0xb84e48, hi: 0xd3745b, lo: 0x711f3e, ink: 0xf4efe6, glyph: 0xf4efe6 },
  info: { face: 0x3c5d84, hi: 0x4d79a1, lo: 0x1b2a4a, ink: 0xf4efe6, glyph: 0xf8e08a },
  corps: { face: 0x8f3f31, hi: 0xac5b33, lo: 0x4d1128, ink: 0xf4efe6, glyph: 0xe7b84a },
  plate: { face: 0xd6d0c9, hi: 0xf4efe6, lo: 0x999189, ink: 0x1a1214, glyph: 0x3c5d84 },
  brass: { face: 0xb08b54, hi: 0xccac79, lo: 0x7f4d23, ink: 0x1a1214, glyph: 0x1a1214 },
});
const INK = 0x1a1214;

/** A plaque's size in pixels for its words at a density: [w, h]. */
export function plaqueSize({ text = '', sub = null, icon = null, ppm = 16, pad = 2 } = {}) {
  const f = fontFor(ppm), T = String(text).toUpperCase(), U = sub && String(sub).toUpperCase();
  const iw = icon ? 5 + 2 : 0, tw = T ? f.width(T) : -1, uw = U ? 3 + f.width(U) : 0;
  return [1 + pad + iw + tw + uw + pad + 1, 1 + pad + Math.max(f.h, icon ? 5 : 0) + pad + 1];
}

/**
 * A plaque painted at (x, y): the ink outline, the style's face lit along its top and shaded along its
 * foot, the icon, the words in the density's alphabet, a seam and the second part a little quieter.
 * glow: a glow class for the face's letters and icon (an exit sign's phosphor). Returns [w, h].
 */
export function plaque(px, x, y, { text = '', sub = null, style = 'deck', icon = null, ppm = 16, pad = 2, glow = 0, w = null } = {}) {
  const S = typeof style === 'string' ? SIGN_STYLES[style] ?? SIGN_STYLES.deck : style;
  const f = fontFor(ppm), [w0, h] = plaqueSize({ text, sub, icon, ppm, pad }), W = Math.max(w0, w ?? 0);
  px(x, y, W, h, INK);
  px(x + 1, y + 1, W - 2, h - 2, S.face, glow ? 0 : 0);
  px(x + 1, y + 1, W - 2, 1, S.hi); px(x + 1, y + h - 2, W - 2, 1, S.lo);
  let cx = x + 1 + pad + Math.floor((W - w0) / 2);
  const cy = y + 1 + pad, th = Math.max(f.h, icon ? 5 : 0);
  if (icon && ICONS[icon]) { ICONS[icon].forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(cx + i, cy + Math.floor((th - 5) / 2) + j, 1, 1, S.glyph, glow); })); cx += 7; }
  if (text) { f.text(px, cx, cy + Math.floor((th - f.h) / 2), text, S.ink, glow); cx += f.width(String(text).toUpperCase()); }
  if (sub) {
    px(cx + 1, y + 2, 1, h - 4, S.lo);
    f.text(px, cx + 3, cy + Math.floor((th - f.h) / 2), sub, tone(S.ink, S.ink === INK ? 0.25 : -0.2), glow);
  }
  return [W, h];
}
