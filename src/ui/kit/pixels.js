// OLYMPUS kit: the interface's pixel pieces, drawn in the picture's own alphabet (VIEWS §8.1, §9.1; the build sheet 0.0.6 §2.3).
//
// The user, 2026-11-06, of the basin's bundled R: "implement pixel art menu drop downs or checkboxes for
// multiselections", and DESIGN.md's rule from it: menus are the game's own drop-downs and checkboxes,
// drawn in its look, never the browser's controls. So the pieces a menu is made of are pixels, as the
// plaques over the picture are (src/ui/plaque.js): the 3 × 5 capitals of src/art/font.js with the
// plaques' marks (· × ( ) = ? +), a few marks of the kit's own (▾ the drop-down's arrow, … more, ↑ ↓ ←
// → for the keys line, ☐ never: the box is drawn), and the 5 × 7 capitals of src/art/kit/type.js for a
// card's title. Every piece is a Pixmap, { w, h, data }, the data a Uint32Array in ImageData's byte order
// (as plaquePixels'), so node tests read it glyph by glyph and mount.js copies it onto a canvas at a
// whole number of CSS pixels a pixel.
//
// The tones are the plaque's 'way' plate (its dark face, lit top and shaded foot, light letters) and the
// step panel's (src/ui/hud/steps.js: the brass of the cursor and the tower's command, the faint of what is
// struck, the muted of what is quieter), in KIT; LATE is the amber a plan that would make you late is
// said in (my call: warmer than the brass, so a late total never reads as the cursor). The pieces:
//   textPixels       a string, in either alphabet, in one colour, on clear;
//   platePixels      the enamel plate of the plaques, any size: ink outline, its face lit along its top
//                    and shaded along its foot, its corners nicked (a title, DO IT, R's plate);
//   checkboxPixels   7 × 7: a grey frame round a lit face (the plaque 'seen' paper), a 5-pixel tick in
//                    ink when checked; a struck row's box a dark well with a grey cross, never a tick;
//                    its frame brass where the cursor is;
//   dropPixels       a drop-down: a well with its words and its ▾; open, its items listed below it,
//                    the picked one lit, the one under the cursor framed;
//   rowPixels        a menu's row: its digit, its box, its words, its drop-down where it has a choice,
//                    its time right-aligned; struck, the words through and the reason after; the
//                    cursor's row lit, with a brass bar at its left;
//   keyPlatePixels   a keycap and its words on a plate (R's plate on the instinct's line, VIEWS §7.1:
//                    "R WASH HANDS · 30 S"), "HOLD ▸" in brass at its right when R held has more, a
//                    struck note before the keycap ("USE THE HEAD: NOTHING TO GIVE"), its words cut with
//                    "…" to a width.
// blit(into, pm, x, y) lays one piece on another (clear pixels let through). Pure: no DOM.
import { glyphOf } from '../../art/font.js';
import { GLYPHS57 } from '../../art/kit/type.js';
import { MARKS, STYLES } from '../plaque.js';

/** The kit's tones (0xRRGGBB): the plaque's 'way' plate and the step panel's (see the header). */
export const KIT = Object.freeze({
  face: 0x23252f, hi: 0x353947, lo: 0x14151c, ink: 0x0d0e13, text: 0xf6f4ee, dim: 0x8f96a6, strike: 0x6a7182,
  cursor: 0xe7b84a, late: 0xf09a3e, well: 0x1b1c24, paper: 0xe2dac6, paperLo: 0xc4bba9, grey: 0x4c5262, lit: 0x2e3140,
});
/** The kit's marks the font and the plaques lack (3 × 5 or 5 wide, 1 is ink; my calls). */
export const KIT_MARKS = Object.freeze({
  '▾': ['00000', '11111', '01110', '00100', '00000'], '…': ['00000', '00000', '00000', '00000', '10101'],
  '↑': ['010', '111', '010', '010', '010'], '↓': ['010', '010', '010', '111', '010'],
  '←': ['00000', '01000', '11111', '01000', '00000'], '→': ['00000', '00010', '11111', '00010', '00000'],
  '[': ['11', '10', '10', '10', '11'], ']': ['11', '01', '01', '01', '11'],
  '▸': ['100', '110', '111', '110', '100'],
});
/** R's plate's mark where R held has more: words, not dots (the fixer's, 0.0.6: three brass pixels read as decoration). */
export const MORE_WORDS = 'HOLD ▸';
/** A row's height, the checkbox's side and the drop-down's arrow's width, kit pixels. */
export const ROW_H = 11, BOX = 7, DROP_ARROW_W = 5;
/** The 3 × 5 alphabet's height, and the 5 × 7's. */
export const TEXT_H = 5, TITLE_H = 7;

const glyph35 = (ch) => KIT_MARKS[ch] ?? MARKS[ch] ?? glyphOf(ch);
const glyph57 = (ch) => GLYPHS57[ch] ?? KIT_MARKS[ch] ?? GLYPHS57[' '];
const glyphFor = (font) => (font === '57' ? glyph57 : glyph35);

/** The width in kit pixels of a string in an alphabet ('35' the 3 × 5, '57' the 5 × 7): a pixel between letters. */
export function textWidth(str, font = '35') {
  const g = glyphFor(font);
  let w = -1;
  for (const ch of String(str ?? '').toUpperCase()) w += g(ch)[0].length + 1;
  return Math.max(0, w);
}

// ---- the buffer: ImageData's byte order read as 32-bit words (0xAABBGGRR on the little-endian machines browsers run on) ----
const pack = (c, a = 255) => (((a & 255) << 24) | ((c & 255) << 16) | (((c >> 8) & 255) << 8) | ((c >> 16) & 255)) >>> 0;
/** A clear Pixmap of w × h and its painter: { w, h, data, px(x, y, w, h, colour 0xRRGGBB), clear(x, y) }. */
export function pixmap(w, h) {
  const W = Math.max(0, Math.round(w)), H = Math.max(0, Math.round(h)), data = new Uint32Array(W * H);
  const px = (x, y, ww = 1, hh = 1, c = KIT.ink) => {
    const v = pack(c);
    for (let j = Math.max(0, y); j < Math.min(H, y + hh); j++) for (let i = Math.max(0, x); i < Math.min(W, x + ww); i++) data[j * W + i] = v;
  };
  return { w: W, h: H, data, px, clear: (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) data[y * W + x] = 0; } };
}
/** The colour 0xRRGGBB at (x, y) of a Pixmap, or null where it is clear. */
export function colourAt(pm, x, y) {
  if (x < 0 || y < 0 || x >= pm.w || y >= pm.h) return null;
  const v = pm.data[y * pm.w + x];
  if (!(v >>> 24)) return null;
  return ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255);
}
/** Lay pm onto into at (x, y), its clear pixels letting what is under them show. Returns into. */
export function blit(into, pm, x, y) {
  if (!pm) return into;
  const X = Math.round(x), Y = Math.round(y);
  for (let j = 0; j < pm.h; j++) {
    const ty = Y + j;
    if (ty < 0 || ty >= into.h) continue;
    for (let i = 0; i < pm.w; i++) {
      const tx = X + i, v = pm.data[j * pm.w + i];
      if (tx < 0 || tx >= into.w || !(v >>> 24)) continue;
      into.data[ty * into.w + tx] = v;
    }
  }
  return into;
}
/** Write a string with a painter px(x, y, w, h, c) from its top-left; returns the x after it. */
export function writeText(px, x, y, str, c, font = '35') {
  const g = glyphFor(font);
  for (const ch of String(str ?? '').toUpperCase()) {
    const rows = g(ch);
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '1') px(x + i, y + j, 1, 1, c); });
    x += rows[0].length + 1;
  }
  return x;
}
/** The longest start of str (cut on a letter, with '…' after it) that fits w kit pixels; str itself when it fits. */
export function fitWords(str, w, font = '35') {
  const s = String(str ?? '');
  if (textWidth(s, font) <= w) return s;
  for (let n = s.length - 1; n > 0; n--) { const t = `${s.slice(0, n).trimEnd()}…`; if (textWidth(t, font) <= w) return t; }
  return '…';
}

/** A string's pixels: { w, h, data, words } in colour, the 3 × 5 alphabet (font '35') or the 5 × 7 (font '57', a title). */
export function textPixels(text, { colour = KIT.text, font = '35' } = {}) {
  const T = String(text ?? '').toUpperCase(), pm = pixmap(Math.max(1, textWidth(T, font)), font === '57' ? TITLE_H : TEXT_H);
  writeText(pm.px, 0, 0, T, colour, font);
  return { w: pm.w, h: pm.h, data: pm.data, words: T };
}

/**
 * The plaques' enamel plate, w × h: an ink outline, its face (the kind's, STYLES of src/ui/plaque.js: 'way' the
 * kit's dark one) lit along its top and shaded along its foot, its four corners nicked. { w, h, data }.
 */
export function platePixels({ w, h, kind = 'way' }) {
  const S = STYLES[kind] ?? STYLES.way, pm = pixmap(w, h), { px } = pm;
  px(0, 0, pm.w, pm.h, KIT.ink);
  px(1, 1, pm.w - 2, pm.h - 2, S.face);
  px(1, 1, pm.w - 2, 1, S.hi);
  px(1, pm.h - 2, pm.w - 2, 1, S.lo === S.face ? KIT.lo : S.lo);
  for (const [x, y] of [[0, 0], [pm.w - 1, 0], [0, pm.h - 1], [pm.w - 1, pm.h - 1]]) pm.clear(x, y);
  return { w: pm.w, h: pm.h, data: pm.data, kind };
}
/** A plate with words centred on it (the title in the 5 × 7, DO IT in the 3 × 5): { w, h, data, words }. */
export function labelPlatePixels(text, { kind = 'way', font = '35', colour = null, padX = 4, padY = 3, w = null } = {}) {
  const S = STYLES[kind] ?? STYLES.way, th = font === '57' ? TITLE_H : TEXT_H, tw = textWidth(text, font);
  const W = Math.max(w ?? 0, tw + 2 * padX + 2), H = th + 2 * padY + 2, pm = platePixels({ w: W, h: H, kind });
  const out = pixmap(W, H);
  blit(out, pm, 0, 0);
  writeText(out.px, Math.floor((W - tw) / 2), padY + 1, text, colour ?? S.ink, font);
  return { w: out.w, h: out.h, data: out.data, words: String(text).toUpperCase() };
}

// (the tick inside a 7 × 7 box, from its top-left: down one, then up three, a ✓ in five pixels)
const TICK = Object.freeze([[1, 3], [2, 4], [3, 3], [4, 2], [5, 1]]);
const CROSS = Object.freeze([[2, 2], [3, 3], [4, 4], [4, 2], [2, 4]]);
/**
 * The checkbox, 7 × 7: a frame round a lit face (the plaque 'seen' paper), a 5-pixel tick in ink when checked; struck
 * (off), a dark well with a grey cross, never a tick; focus, a brass frame. The frame is the kit's grey, not ink: on
 * the dark glass an ink frame vanished and the tick's ends ran into it (the first shot, 2026-11-07).
 */
export function checkboxPixels({ checked = false, off = false, focus = false, ghost = false } = {}) {
  const pm = pixmap(BOX, BOX), { px } = pm;
  px(0, 0, BOX, BOX, focus ? KIT.cursor : KIT.grey);
  px(1, 1, BOX - 2, BOX - 2, off ? KIT.well : KIT.paper);
  if (!off) px(1, BOX - 2, BOX - 2, 1, KIT.paperLo);               // (the face's foot shaded, as the plates')
  if (off) for (const [x, y] of CROSS) px(x, y, 1, 1, KIT.strike);
  else if (checked) for (const [x, y] of TICK) px(x, y, 1, 1, KIT.ink);
  // (ghost: nothing checked, the cursor's row is what Enter does, so the foot's total matches a tick you can see; the fixer's, 0.0.6)
  else if (ghost) for (const [x, y] of TICK) px(x, y, 1, 1, KIT.paperLo);
  return { w: pm.w, h: pm.h, data: pm.data, checked: !!checked && !off, off: !!off };
}

/** A drop-down's closed box for words: its width w (at least what the words and the ▾ need), height ROW_H − 2. */
export const dropBoxW = (words) => 2 + 2 + textWidth(words) + 3 + DROP_ARROW_W + 2;
/**
 * A drop-down: { w, h, data, box: { x, y, w, h }, items: [{ x, y, w, h }] }. The closed box (a well framed in ink,
 * brass with focus, its words and its ▾); open, its items listed below the box, each a line, the picked lit,
 * the one at itemFocus framed in brass. w: the box's width (default dropBoxW of the widest words).
 */
export function dropPixels({ words, open = false, focus = false, w = null, items = [], pick = 0, itemFocus = null }) {
  const widest = Math.max(dropBoxW(words), ...items.map(it => dropBoxW(it.words ?? it)));
  const W = Math.max(w ?? 0, widest), BH = ROW_H - 2, IH = TEXT_H + 4, H = BH + (open ? items.length * IH + 2 : 0);
  const pm = pixmap(W, H), { px } = pm;
  px(0, 0, W, BH, focus || open ? KIT.cursor : KIT.grey);           // (grey, as the checkbox's: an ink frame vanishes on the glass)
  px(1, 1, W - 2, BH - 2, KIT.well);
  writeText(px, 3, Math.floor((BH - TEXT_H) / 2), words, KIT.text);
  writeText(px, W - 2 - DROP_ARROW_W, Math.floor((BH - TEXT_H) / 2), '▾', KIT.cursor);
  const rects = [];
  if (open) {
    const y0 = BH;
    px(0, y0, W, items.length * IH + 2, KIT.cursor);
    px(1, y0 + 1, W - 2, items.length * IH, KIT.face);
    items.forEach((it, i) => {
      const y = y0 + 1 + i * IH, off = !!it.off, lit = i === pick;
      if (lit) px(1, y, W - 2, IH, KIT.hi);
      if (i === itemFocus) { px(1, y, W - 2, 1, KIT.cursor); px(1, y + IH - 1, W - 2, 1, KIT.cursor); px(1, y, 1, IH, KIT.cursor); px(W - 2, y, 1, IH, KIT.cursor); }
      const tx = 3, ty = y + 2;
      const end = writeText(px, tx, ty, it.words ?? it, off ? KIT.strike : lit ? KIT.cursor : KIT.text);
      if (off) px(tx - 1, ty + 2, end - tx + 1, 1, KIT.strike);
      rects.push({ x: 0, y, w: W, h: IH });
    });
  }
  return { w: pm.w, h: pm.h, data: pm.data, box: { x: 0, y: 0, w: W, h: BH }, items: rects };
}

/**
 * A menu's row, w wide and ROW_H tall: { w, h, data, parts: { digit, box, words, drop, time } (x spans) }.
 * n the digit shown ('1' to '0'); words the action's; drop: { words, w } where the row has a choice; timeText
 * right-aligned; off the reason it is struck (the words struck through, "(BUZZED TODAY)" after them); late,
 * the time in the late's amber; focus the cursor's row (lit, a brass bar at its left); refused, the reason
 * lit (a struck row just chosen).
 */
export function rowPixels({ n, checked = false, ghost = false, words, timeText = '', off = null, late = false, focus = false, drop = null, w = null, refused = false, dropX = null }) {
  const lay = rowLayout({ words, timeText, off, drop, dropX });
  const W = Math.max(w ?? 0, lay.w), pm = pixmap(W, ROW_H), { px } = pm;
  if (focus) { px(0, 0, W, ROW_H, KIT.lit); px(0, 0, 2, ROW_H, KIT.cursor); }
  const ty = Math.floor((ROW_H - TEXT_H) / 2);
  writeText(px, lay.digit, ty, String(n ?? ''), focus ? KIT.cursor : KIT.dim);
  blit(pm, checkboxPixels({ checked, off: !!off, focus, ghost }), lay.box, Math.floor((ROW_H - BOX) / 2));
  const wordEnd = writeText(px, lay.words, ty, words, off ? KIT.strike : KIT.text);
  if (off) px(lay.words - 1, ty + 2, wordEnd - lay.words + 1, 1, KIT.strike);
  if (drop) {
    const d = dropPixels({ words: drop.words, w: drop.w ?? null, focus: focus && !off });
    blit(pm, d, lay.drop, 1);
  }
  if (off) writeText(px, lay.reason, ty, `(${off})`, refused ? KIT.late : KIT.dim);
  if (timeText && !off) { const tw = textWidth(timeText); writeText(px, W - 3 - tw, ty, timeText, late ? KIT.late : focus ? KIT.text : KIT.dim); }
  return { w: pm.w, h: pm.h, data: pm.data, parts: { digit: lay.digit, box: lay.box, words: lay.words, drop: drop ? { x: lay.drop, w: lay.dropW } : null, time: timeText && !off ? W - 3 - textWidth(timeText) : null } };
}
/** Where a row's pieces sit, kit pixels from its left, and the width it needs: { digit, box, words, drop, dropW, reason, w }. dropX: where every row's drop-down starts (aligned in a list). */
export function rowLayout({ words, timeText = '', off = null, drop = null, dropX = null }) {
  const digit = 4, box = digit + 3 + 3, wx = box + BOX + 4, wEnd = wx + textWidth(words);
  const dropW = drop ? Math.max(drop.w ?? 0, dropBoxW(drop.words)) : 0;
  const dx = drop ? Math.max(wEnd + 4, dropX ?? 0) : wEnd;
  const after = drop ? dx + dropW : wEnd;
  const reason = after + 4, tail = off ? textWidth(`(${off})`) : timeText ? textWidth(timeText) + 6 : 0;
  return { digit, box, words: wx, drop: dx, dropW, reason, w: (off ? reason : after + 2) + tail + 3 };
}

/**
 * R's plate (VIEWS §7.1, the build sheet 0.0.6 §2.3): a keycap with its key's name, then the words, on the 'way'
 * plate; more, MORE_WORDS in brass at its right after a brass rule ("HOLD ▸": R held opens the menu; the
 * fixer's, 0.0.6, in place of v0.0.6's three brass dots); late, the words in the late's amber; note, why the
 * spot's own action is not R's ("USE THE HEAD: NOTHING TO GIVE"), in the struck rows' grey before the keycap, cut
 * first and dropped where the room is short; maxW, the words cut with "…" so the plate fits. { w, h, data,
 * words, key, note, cut }.
 */
export function keyPlatePixels({ keyText = 'R', words = '', more = false, late = false, maxW = Infinity, note = null }) {
  const K = String(keyText).toUpperCase(), kw = Math.max(BOX, textWidth(K) + 4), H = TEXT_H + 6;
  const moreW = more ? 1 + 3 + textWidth(MORE_WORDS) + 1 : 0;
  const fixed = 1 + 3 + kw + 4 + 3 + 1 + moreW, lim = Number.isFinite(maxW) ? maxW : Infinity;
  const W0 = String(words).toUpperCase();
  // (the words first; the note takes what is left, never under 16 pixels of it)
  const room = Math.max(8, lim - fixed), shown = fitWords(W0, room);
  const N0 = note ? String(note).toUpperCase() : '', noteRoom = lim - fixed - textWidth(shown) - 4;
  const noteShown = N0 && noteRoom >= 16 ? fitWords(N0, noteRoom) : '';
  const nw = noteShown ? textWidth(noteShown) + 4 : 0;
  const W = 1 + 3 + nw + kw + 4 + textWidth(shown) + 3 + moreW + 1;
  const pm = pixmap(W, H), { px } = pm;
  blit(pm, platePixels({ w: W, h: H, kind: 'way' }), 0, 0);
  const ty = Math.floor((H - TEXT_H) / 2);
  if (noteShown) writeText(px, 4, ty, noteShown, KIT.strike);
  // (the keycap: a lighter key with an ink rim, its letter in the plate's words' colour, its foot a step darker)
  const kx = 4 + nw, ky = 2, kh = H - 4;
  px(kx, ky, kw, kh, KIT.ink);
  px(kx + 1, ky, kw - 2, kh - 1, KIT.grey);
  px(kx + 1, ky + kh - 2, kw - 2, 1, KIT.hi);
  writeText(px, kx + Math.floor((kw - textWidth(K)) / 2), ky + Math.floor((kh - 1 - TEXT_H) / 2), K, KIT.text);
  writeText(px, kx + kw + 4, ty, shown, late ? KIT.late : KIT.text);
  if (more) {
    const mx = kx + kw + 4 + textWidth(shown) + 3;
    px(mx, 2, 1, H - 4, KIT.cursor);
    writeText(px, mx + 4, ty, MORE_WORDS, KIT.cursor);
  }
  return { w: pm.w, h: pm.h, data: pm.data, words: `${K} ${shown}`, key: K, note: noteShown, cut: shown !== W0 };
}

/** A Pixmap as rows of characters, one a pixel ('.' clear, else the first letter of its tone's name in KIT, '?' another colour): for the tests' eyes. */
export function asText(pm, { tones = KIT } = {}) {
  const byColour = new Map(Object.entries(tones).map(([k, v]) => [v, k]));
  const sym = { ink: '#', face: 'f', hi: 'h', lo: 'l', text: 'T', dim: 'd', strike: 's', cursor: 'c', late: 'L', well: 'w', paper: 'p', paperLo: 'q', grey: 'g', lit: 'i' };
  const out = [];
  for (let y = 0; y < pm.h; y++) {
    let line = '';
    for (let x = 0; x < pm.w; x++) { const c = colourAt(pm, x, y); line += c === null ? '.' : sym[byColour.get(c)] ?? '?'; }
    out.push(line);
  }
  return out;
}
