// OLYMPUS art: a pixel font, 3 × 5, for what is written in the picture (stencils, signs, plaques).
//
// tradecraft's glyphs (src/art/pixelart.js), the Latin letters, digits and marks; written with a
// painter's px() so it lands in a texture's pixels and is snapped like the rest. M, N and W are
// wider (4 and 5 columns), as a 3-wide one reads as a smudge. A stencil (military markings: "MCRN",
// "DECK 4", "2ND SQUAD", a locker's number) is the same font painted whole: stencil(). 0.0.1 cut the
// bridges out of every glyph's middle row, as a stencil plate has them, and at 3 × 5 that took the
// middle stroke of 2, S, A and N, so the look round's "2ND SQUAD" read "EUND" (2026-11-06); a letter
// five pixels tall has no pixel to spare, so nothing is cut (src/art/kit/type.js says the same of the
// 5 × 7 alphabet; kit-stencil reads every area's stencils back, glyph by glyph).
// Pure.

const GLYPHS = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
  K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'], M: ['10001', '11011', '10101', '10001', '10001'],
  N: ['1001', '1101', '1011', '1001', '1001'], O: ['010', '101', '101', '101', '010'], P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'], S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'], W: ['10001', '10001', '10101', '11011', '10001'],
  Y: ['101', '101', '010', '010', '010'], X: ['101', '101', '010', '101', '101'], Z: ['111', '001', '010', '100', '111'],
  J: ['001', '001', '001', '101', '010'], Q: ['010', '101', '101', '110', '011'], "'": ['1', '1', '0', '0', '0'],
  ' ': ['00', '00', '00', '00', '00'],
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['110', '001', '010', '100', '111'], 3: ['110', '001', '010', '001', '110'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '110', '001', '110'], 6: ['011', '100', '110', '101', '010'], 7: ['111', '001', '010', '010', '010'],
  8: ['010', '101', '010', '101', '010'], 9: ['010', '101', '011', '001', '110'],
  '&': ['0100', '1010', '0100', '1011', '0110'], '.': ['0', '0', '0', '0', '1'], ',': ['0', '0', '0', '1', '1'], '-': ['00', '00', '11', '00', '00'],
  '/': ['001', '001', '010', '100', '100'], '!': ['1', '1', '1', '0', '1'], '%': ['101', '001', '010', '100', '101'], ':': ['0', '1', '0', '1', '0'],
  '#': ['01010', '11111', '01010', '11111', '01010'],
};
export const GLYPH_H = 5;

/** Width in pixels of `str` in the pixel font. */
export const textWidth = (str) => [...String(str).toUpperCase()].reduce((a, ch) => a + (GLYPHS[ch] ?? GLYPHS[' '])[0].length + 1, -1);

/** Write `str` at (x, y) (its top-left) with px(), in colour c (a glow class too, if given). */
export function text(px, x, y, str, c, glow = 0) {
  for (const ch of String(str).toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(x + i, y + j, 1, 1, c, glow); }));
    x += g[0].length + 1;
  }
}

/** A stencil: the letters painted whole in colour c (no bridges cut: see the header). */
export function stencil(px, x, y, str, c) { text(px, x, y, str, c); }

/** A character's glyph in the 3 × 5 alphabet: rows of '0' and '1' (an unknown character is a space). */
export const glyphOf = (ch) => GLYPHS[String(ch).toUpperCase()] ?? GLYPHS[' '];
/** The characters the 3 × 5 alphabet draws. */
export const GLYPH_CHARS = Object.freeze(Object.keys(GLYPHS));
