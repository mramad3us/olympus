// OLYMPUS art: a pixel font, 3 × 5, for what is written in the picture (stencils, signs, plaques).
//
// tradecraft's glyphs (src/art/pixelart.js), the Latin letters, digits and marks; written with a
// painter's px() so it lands in a texture's pixels and is snapped like the rest. M, N and W are
// wider (4 and 5 columns), as a 3-wide one reads as a smudge. A stencil (military markings: "MCRN",
// "DECK 4", a locker's number) is the same font with its bridges cut: stencil().
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

/** A stencil: text() with its middle row's bridges cut (every glyph's row 2 drawn only at its ends). */
export function stencil(px, x, y, str, c) {
  for (const ch of String(str).toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1' && !(j === 2 && i > 0 && i < row.length - 1 && row.length > 2)) px(x + i, y + j, 1, 1, c); }));
    x += g[0].length + 1;
  }
}
