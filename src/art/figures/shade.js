// OLYMPUS art: shading a figure by rule, as a pixel artist does. tradecraft's shade(), with patterns and glows.
//
// A composed frame (compose.js) is a grid of cells { ch, part, u, v, t }: a role letter, the part it
// belongs to (numbered in draw order), the part's pattern coordinates and an optional fixed tone. The
// rules are tradecraft's (src/art/sprites.js shade(), the look the user scored "a solid 70" and picked on
// 2026-10-26), light from the upper left:
//   - an upper-case role letter is in shade;
//   - a pixel just under a later part (the face under a cover's brim, the chest under the chin) is in
//     that part's shadow;
//   - a pixel on its part's right or bottom edge is in shade, on its top edge lit;
//   - where a part lies over an earlier one, its edge pixel takes its role's darkest tone: a line inside
//     the figure, softer than the outline;
//   - an outline of ink round the whole silhouette (every empty 4-neighbour).
// Each role's tones are its ramp: tone() (src/art/tone.js, the pixel artist's hue shift: shadows toward
// violet, lights toward yellow) steps of 0.085 OKLCH L down and 0.065 up, about a palette family's
// step, so the post pass's snap (src/render/post.js) lands each on its own colour. A role whose colour
// is a pattern (the Valles camouflage: outfits.js) takes the ramp of the pattern's colour at the
// pixel's part coordinates, so the camouflage is lit and shaded as one cloth. The weapons' letters (v
// steel, n gun metal, u black polymer) keep their base tone, as tradecraft's held things
// did, "or it'd vanish into a coat".
// Fixed letters: e and k ink, o an eye's glint, l a lens' glint, b a brow (the hair's darkest), z the
// mouth (the skin's darkest), g and G gold, m a pin's lit edge, q and Q blood; and three glows, which the
// render draws unlit, as bright at night as by day (VIEWS.md 3.1's ¤): ¤ a lamp, ° a green status light,
// ¦ an amber one. A glowing pixel carries GLOW.ALWAYS in its alpha (src/art/paint.js: 255 − class), so
// a figure's sheet is a Pixmap like any painting.
// Pure.
import { tone } from '../tone.js';
import { word, GLOW } from '../paint.js';

export const INK = 0x14151c;
const FIXED = {
  e: INK, k: INK, o: 0xf4efe6, l: 0xb8d8ec, g: 0xe7b84a, G: 0xb9862e, m: 0xb8bdc8, q: 0x9e3c36, Q: 0x6e2a2e,
  '¤': 0xf8e08a, '°': 0x9fe0b0, '¦': 0xffa23a,
};
/** The fixed letters that glow, and their class. */
export const GLOWING = Object.freeze({ '¤': GLOW.ALWAYS, '°': GLOW.ALWAYS, '¦': GLOW.ALWAYS });
const HELD = new Set(['v', 'n', 'u']);
/** A ramp's steps, OKLCH L (see the header). */
export const STEP_DOWN_L = 0.085, STEP_UP_L = 0.065;

const ramps = new Map();
/** A colour's tones: dark, shade, base, light. */
export function rampOf(c) {
  let r = ramps.get(c);
  if (!r) { r = { dark: tone(c, -2 * STEP_DOWN_L), shade: tone(c, -STEP_DOWN_L), base: c, light: tone(c, STEP_UP_L) }; ramps.set(c, r); }
  return r;
}

const INNER = [[1, 0], [-1, 0], [0, 1]];
/**
 * Shade a grid of cells into a Pixmap { w, h, data } (src/art/paint.js words: a hole is 0, a glowing pixel
 * carries its class), `col` a role letter's colour or pattern function (outfits.js coloursOf()). See the header.
 */
export function shade(cells, col, { outline = INK } = {}) {
  const H = cells.length, W = cells[0].length;
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? cells[y][x] : null);
  const roleOf = (c) => { if (!c) return null; const lc = c.ch.toLowerCase(); return col[lc] !== undefined && FIXED[c.ch] === undefined ? lc : null; };
  const roles = cells.map(row => row.map(roleOf));
  const roleAt = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? roles[y][x] : null);
  const same = (c, r, x, y) => { const o = at(x, y); return o && o.part === c.part && roles[y][x] === r; };
  const data = new Uint32Array(W * H);
  const hairDark = typeof col.h === 'number' ? rampOf(col.h).dark : INK, skinDark = typeof col.s === 'number' ? rampOf(col.s).dark : INK;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = cells[y][x];
    if (!c) continue;
    if (FIXED[c.ch] !== undefined) { data[y * W + x] = word(FIXED[c.ch], GLOWING[c.ch] ?? 0); continue; }
    if (c.ch === 'b') { data[y * W + x] = word(hairDark); continue; }
    if (c.ch === 'z') { data[y * W + x] = word(skinDark); continue; }
    const r = roles[y][x];
    if (!r) continue;
    const base = typeof col[r] === 'function' ? col[r](c.u, c.v) : col[r], R = rampOf(base);
    if (HELD.has(r) && c.ch === r) { data[y * W + x] = word(R.base); continue; }
    let t = c.t ?? (c.ch !== r ? 'shade' : 'base');
    if (!c.t && t === 'base') {
      const up = at(x, y - 1);
      if (up && up.part > c.part && roles[y - 1][x]) t = 'shade';                                   // (in the shadow of a part above)
      else if (!same(c, r, x + 1, y) || !same(c, r, x, y + 1)) t = 'shade';                         // (the right and bottom edges)
      else if (!same(c, r, x, y - 1) && same(c, r, x + 1, y)) t = 'light';                          // (the top edge)
    }
    if (!c.t) for (const [dx, dy] of INNER) {                                                       // (an edge over an earlier part: an inner line)
      const o = at(x + dx, y + dy);
      if (o && o.part < c.part && roleAt(x + dx, y + dy)) { t = 'dark'; break; }
    }
    data[y * W + x] = word(R[t] ?? R.base);
  }
  // The outline: ink round the silhouette.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (cells[y][x]) continue;
    if (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1)) data[y * W + x] = word(outline);
  }
  return { w: W, h: H, data, repeat: false, key: null, glows: true };
}
